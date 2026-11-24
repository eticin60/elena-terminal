"""Елена Хьюз · Crypto Signals — Telegram sinyal botu (v3).

Kaynak: Binance genel API (anahtar gerekmez). Bilgilendirme amaçlıdır; yatırım tavsiyesi değildir.
"""
import asyncio
import io
import json
import logging
import math
import os
import sqlite3
import sys
import tempfile
import time
from logging.handlers import RotatingFileHandler

import httpx
from telegram import (BotCommand, InlineKeyboardButton as B, InlineKeyboardMarkup as M, WebAppInfo,
                      MenuButtonWebApp, LinkPreviewOptions, ReplyParameters, Update)
from telegram.constants import ParseMode
from telegram.error import BadRequest, Conflict, Forbidden, NetworkError, RetryAfter, TelegramError
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes

import charts
import core
from render import render_event, render_explain, render_signal, render_signal_caption
from texts import BRAND, HEAD, LANGS, T, TF_LIST, fmt_price, local_time, tx

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(message)s", level=logging.INFO,
    handlers=[logging.StreamHandler(),
              RotatingFileHandler("bot.log", maxBytes=1_000_000, backupCount=2, encoding="utf-8")])
log = logging.getLogger("elena-bot")
logging.getLogger("httpx").setLevel(logging.WARNING)


# ---------------------------------------------------------------- ayarlar
def load_env(path=".env"):
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env()
TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_ID = int(os.getenv("ADMIN_ID", "6527896022") or 6527896022)
DEFAULT_MINIAPP_URL = "https://eticin60.github.io/elena-terminal"
MINIAPP_URL = DEFAULT_MINIAPP_URL
TUNNEL_SYNC_TOPIC = "elena_hughes_terminal_sync_8f93b1"


async def publish_live_tunnel(tunnel_url: str):
    """Canlı Cloudflare tünel adresini GitHub Pages ile otomatik el sıkışması için anında ntfy kanalına yayınlar."""
    if not tunnel_url or not str(tunnel_url).startswith("https://"):
        return
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(f"https://ntfy.sh/{TUNNEL_SYNC_TOPIC}", content=str(tunnel_url).strip().encode("utf-8"))
            log.info("Canlı tünel GitHub Pages eşleşmesi için yayınlandı: %s", tunnel_url)
    except Exception as e:
        log.debug("publish_live_tunnel hatası: %s", e)


def get_live_api_tunnel():
    """Canlı Cloudflare tünel adresini döner (örn: https://xxxx.trycloudflare.com)."""
    # 1. Önce .tunnel.log dosyasını oku (cloudflared'in en son açtığı aktif tünel)
    if os.path.exists(".tunnel.log"):
        try:
            import re
            content = open(".tunnel.log", encoding="utf-8", errors="ignore").read()
            matches = re.findall(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", content)
            if matches:
                live = matches[-1].rstrip("/")
                try:
                    with open(".miniapp_url", "w", encoding="utf-8") as mf:
                        mf.write(live)
                except Exception:
                    pass
                return live
        except Exception:
            pass
    # 2. .miniapp_url önbelleği
    if os.path.exists(".miniapp_url"):
        try:
            cached = open(".miniapp_url", encoding="utf-8").read().strip().rstrip("/")
            if cached.startswith("https://") and "trycloudflare.com" in cached:
                return cached
        except Exception:
            pass
    env_url = os.getenv("MINIAPP_URL", "").rstrip("/")
    if env_url.startswith("https://") and "trycloudflare.com" in env_url:
        return env_url
    return ""


def build_miniapp_web_url(page="index.html"):
    """
    Doğrudan Termux üzerindeki canlı Cloudflare tünel adresini kullanır.
    Böylece araya harici domain girmeden doğrudan yerel sunucu ve veritabanı açılır.
    """
    page_name = page.lstrip("/")
    tunnel = get_live_api_tunnel()
    if tunnel and str(tunnel).startswith("https://"):
        return f"{tunnel.rstrip('/')}/{page_name}"
    base = DEFAULT_MINIAPP_URL.rstrip("/")
    return f"{base}/{page_name}"


def get_miniapp_url():
    """Kalıcı web adresini döner."""
    return build_miniapp_web_url("index.html")


async def ensure_menu_button(app, chat_id=None, lang="ru"):
    """Telegram sol alttaki menü butonunu (ChatMenuButton) kesintisiz GitHub Pages Mini App olarak bağlar."""
    full_url = build_miniapp_web_url("index.html")
    btn_labels = {
        "ru": "🚀 Открыть", "uk": "🚀 Відкрити",
        "en": "🚀 Open App", "de": "🚀 Öffnen",
        "es": "🚀 Abrir", "fr": "🚀 Ouvrir",
        "ar": "🚀 فتح",  "tr": "🚀 Uygulamayı Aç",
    }
    label = btn_labels.get(lang, "🚀 Open App")
    try:
        mb = MenuButtonWebApp(text=label, web_app=WebAppInfo(url=full_url))
        if chat_id:
            await app.bot.set_chat_menu_button(chat_id=chat_id, menu_button=mb)
        else:
            await app.bot.set_chat_menu_button(menu_button=mb)
    except Exception as e:
        log.debug("ensure_menu_button hatası: %s", e)
WC_PROJECT_ID = os.getenv("WC_PROJECT_ID", "3e0464160493e3617b11034bfe2169fe") or "3e0464160493e3617b11034bfe2169fe"  # WalletConnect (Reown) projectId
MORALIS_API_KEY = os.getenv("MORALIS_API_KEY", "")  # opsiyonel: cüzdan token listesi/logoları için
DONATE_URL = os.getenv("DONATE_URL", "https://pay.oxapay.com/13773930")
DB_PATH = os.getenv("DB_PATH", "bot.db")
MAX_COINS = 250
MAX_ALERTS = 20
FAPI = "https://fapi.binance.com"
SAPI = "https://api.binance.com"
TF_SEC = core.TF_SEC
LPO = LinkPreviewOptions(is_disabled=True)
STABLES = {"USDC", "FDUSD", "TUSD", "USDP", "BUSD", "DAI", "EUR", "TRY", "USDE", "AEUR"}
FALLBACK = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "AVAX", "TRX", "LINK", "DOT", "LTC",
            "SHIB", "BCH", "NEAR", "UNI", "ATOM", "APT", "ARB", "OP", "SUI", "INJ", "FIL", "ETC",
            "XLM", "HBAR", "TON", "PEPE", "WIF", "POL"]
TOP = {"futures": [s + "USDT" for s in FALLBACK], "spot": [s + "USDT" for s in FALLBACK]}
ALL = {"futures": set(), "spot": set()}
MOVERS = {"ts": 0.0, "rows": None}
PRICES = {}  # (market, symbol) -> son bilinen fiyat (takipçi doldurur)
BG = set()  # arka plan görevleri çöp toplayıcıya gitmesin
BROADCAST_QUEUE = []  # mini app admin panelinden gelen yayın kuyruğu
CMD_ORDER = ["menu", "coins", "tfs", "price", "top", "calc", "history", "stats", "open", "alerts",
             "backtest", "lang", "donate", "terms", "help", "delete", "corr", "explain", "markets",
             "glossary", "matrix", "mtf"]
HELP_CMDS = ("\n\n<code>/menu /coins /add /remove /tfs /price /top /calc /history /stats /open /alert "
             "/alerts /backtest /corr /explain /markets /glossary /matrix /mtf /test /lang /donate /terms /delete</code>")
ICON = {"open": "⏳", "expired": "⌛", "info": "ℹ️", "tp3": "🏆", "sl": "🛑", "be": "🔶", "flip": "🔄"}


def status_icon(r):
    if r["status"] == "closed":
        return ICON.get(r["reason"] or "", "✅")
    if r["status"] == "open" and (r["tp_hit"] or 0) > 0:
        return "🎯"
    return ICON.get(r["status"], "•")


# ---------------------------------------------------------------- veritabanı
db = sqlite3.connect(DB_PATH, check_same_thread=False)
db.row_factory = sqlite3.Row
FIELDS = {"lang", "market", "max_lev", "strong_only", "accepted", "accepted_at", "active", "tz", "quiet",
          "notify_track", "chart", "compact", "banned", "username", "first_name"}
BTC_CACHE = {}  # (market, tf) -> (ts, rows): korelasyon için BTC mumları
SIG_COLS = {"tp2": "REAL", "tp3": "REAL", "score": "INTEGER", "grade": "TEXT", "lev": "INTEGER",
            "sl_pct": "REAL", "status": "TEXT", "tp_hit": "INTEGER DEFAULT 0", "sl_cur": "REAL",
            "last_check": "INTEGER", "closed_ts": "INTEGER", "exit_price": "REAL", "r_result": "REAL",
            "reason": "TEXT"}


def init_db():
    db.executescript("""
    CREATE TABLE IF NOT EXISTS users(
        chat_id INTEGER PRIMARY KEY, lang TEXT DEFAULT 'ru', market TEXT DEFAULT 'both',
        max_lev INTEGER DEFAULT 10, strong_only INTEGER DEFAULT 0, accepted INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1, created INTEGER);
    CREATE TABLE IF NOT EXISTS coins(chat_id INTEGER, symbol TEXT, PRIMARY KEY(chat_id, symbol));
    CREATE TABLE IF NOT EXISTS tfs(chat_id INTEGER, tf TEXT, PRIMARY KEY(chat_id, tf));
    CREATE TABLE IF NOT EXISTS signals(
        id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, ctime INTEGER, market TEXT, symbol TEXT,
        tf TEXT, side TEXT, entry REAL, sl REAL, tp1 REAL);
    CREATE TABLE IF NOT EXISTS deliveries(
        signal_id INTEGER, chat_id INTEGER, msg_id INTEGER, PRIMARY KEY(signal_id, chat_id));
    CREATE TABLE IF NOT EXISTS alerts(
        id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER, symbol TEXT, direction TEXT,
        price REAL, created INTEGER);
    CREATE TABLE IF NOT EXISTS wallets(
        chat_id INTEGER PRIMARY KEY, address TEXT, chain TEXT, connected_ts INTEGER);
    CREATE TABLE IF NOT EXISTS auto_settings(
        chat_id INTEGER PRIMARY KEY, json TEXT, updated_ts INTEGER);
    CREATE TABLE IF NOT EXISTS bans(
        chat_id INTEGER PRIMARY KEY, reason TEXT, banned_at INTEGER, banned_until INTEGER);
    CREATE TABLE IF NOT EXISTS exchange_api(
        chat_id INTEGER PRIMARY KEY, exchange TEXT, api_key TEXT, api_secret TEXT,
        passphrase TEXT, mode TEXT, memo TEXT, updated_at INTEGER);
    CREATE TABLE IF NOT EXISTS web3_rpc_api(
        chat_id INTEGER PRIMARY KEY, rpc_url TEXT, provider TEXT, network TEXT,
        custom_tokens TEXT, updated_at INTEGER);
    CREATE TABLE IF NOT EXISTS wallet_credentials(
        chat_id INTEGER PRIMARY KEY, password_hash TEXT, hint TEXT, updated_at INTEGER);
    """)
    ucols = {r[1] for r in db.execute("PRAGMA table_info(users)")}
    for name, ddl in (("tz", "INTEGER DEFAULT 3"), ("quiet", "INTEGER DEFAULT 0"),
                      ("accepted_at", "INTEGER DEFAULT 0"), ("notify_track", "INTEGER DEFAULT 1"),
                      ("chart", "INTEGER DEFAULT 1"), ("compact", "INTEGER DEFAULT 0"),
                      ("banned", "INTEGER DEFAULT 0"), ("username", "TEXT DEFAULT ''"),
                      ("first_name", "TEXT DEFAULT ''")):
        if name not in ucols:
            db.execute(f"ALTER TABLE users ADD COLUMN {name} {ddl}")
    scols = {r[1] for r in db.execute("PRAGMA table_info(signals)")}
    for name, ddl in SIG_COLS.items():
        if name not in scols:
            db.execute(f"ALTER TABLE signals ADD COLUMN {name} {ddl}")
    # v3 taslağındaki durumları yeni sözlüğe taşı (idempotent); status NULL olan v2 sinyalleri takip edilmez
    db.executescript("""
    UPDATE signals SET status='open' WHERE status IN ('tp1','tp2');
    UPDATE signals SET reason=status, status='closed' WHERE status IN ('tp3','sl','be','flip');
    UPDATE signals SET reason='be', status='closed' WHERE status='tp2stop';
    """)
    db.executescript("""
    CREATE INDEX IF NOT EXISTS idx_sig ON signals(market, symbol, tf, ctime);
    CREATE INDEX IF NOT EXISTS idx_sig_status ON signals(status);
    CREATE INDEX IF NOT EXISTS idx_alert_chat ON alerts(chat_id);
    """)
    db.commit()


def get_user(cid):
    return db.execute("SELECT * FROM users WHERE chat_id=?", (cid,)).fetchone()


def ensure_user(cid, lang="ru"):
    if get_user(cid):
        return
    db.execute("INSERT INTO users(chat_id, lang, created) VALUES(?,?,?)", (cid, lang, int(time.time())))
    for s in ("BTCUSDT", "ETHUSDT"):
        db.execute("INSERT OR IGNORE INTO coins VALUES(?,?)", (cid, s))
    for tf in ("15m", "1h", "4h"):
        db.execute("INSERT OR IGNORE INTO tfs VALUES(?,?)", (cid, tf))
    db.commit()


def set_field(cid, field, value):
    assert field in FIELDS
    db.execute(f"UPDATE users SET {field}=? WHERE chat_id=?", (value, cid))
    db.commit()


def toggle(table, col, cid, val):
    assert (table, col) in {("coins", "symbol"), ("tfs", "tf")}
    r = db.execute(f"SELECT 1 FROM {table} WHERE chat_id=? AND {col}=?", (cid, val)).fetchone()
    if r:
        db.execute(f"DELETE FROM {table} WHERE chat_id=? AND {col}=?", (cid, val))
    else:
        db.execute(f"INSERT INTO {table} VALUES(?,?)", (cid, val))
    db.commit()
    return not r


def user_set(table, col, cid):
    assert (table, col) in {("coins", "symbol"), ("tfs", "tf")}
    return [r[0] for r in db.execute(f"SELECT {col} FROM {table} WHERE chat_id=?", (cid,))]


def delete_user(cid):
    for t in ("users", "coins", "tfs", "deliveries", "alerts", "wallets", "auto_settings"):
        db.execute(f"DELETE FROM {t} WHERE chat_id=?", (cid,))
    db.commit()


# ---------------------------------------------------------------- mini app: cüzdan (salt okunur) + oto-bot ayarları
AUTO_DEFAULTS = {
    "mode": "futures", "margin_mode": "cross", "position_mode": "one_way", "leverage": 10,
    "amount": 0, "max_open": 3, "max_risk_pct": 2.0, "slippage_pct": 0.5,
    "tp": [25.0, 25.0, 25.0, 25.0], "sl_pct": 10.0, "daily_stop_pct": 20.0,
    "night_mode": True, "scale_in": False, "min_liquidity_m": 0, "enabled": False,
    "coins": [],
    "strategy_tf": "1h", "max_account_risk_pct": 100.0, "corr_min_trades": 3, "corr_win_rate": 60.0,
}


def get_wallet(cid):
    return db.execute("SELECT * FROM wallets WHERE chat_id=?", (cid,)).fetchone()


def set_wallet(cid, address, chain):
    """Yalnızca GENEL cüzdan adresi kaydedilir (WalletConnect ile elde edilir). Private key/mnemonic asla alınmaz/saklanmaz."""
    db.execute("INSERT INTO wallets(chat_id, address, chain, connected_ts) VALUES(?,?,?,?) "
               "ON CONFLICT(chat_id) DO UPDATE SET address=excluded.address, chain=excluded.chain, "
               "connected_ts=excluded.connected_ts", (cid, address, chain, int(time.time())))
    db.commit()


def clear_wallet(cid):
    db.execute("DELETE FROM wallets WHERE chat_id=?", (cid,))
    db.commit()


def get_auto_settings(cid):
    row = db.execute("SELECT json FROM auto_settings WHERE chat_id=?", (cid,)).fetchone()
    if not row:
        return dict(AUTO_DEFAULTS)
    try:
        d = dict(AUTO_DEFAULTS)
        d.update(json.loads(row["json"]))
        return d
    except (ValueError, TypeError):
        return dict(AUTO_DEFAULTS)


def set_auto_settings(cid, patch):
    cur = get_auto_settings(cid)
    cur.update({k: v for k, v in patch.items() if k in AUTO_DEFAULTS})
    db.execute("INSERT INTO auto_settings(chat_id, json, updated_ts) VALUES(?,?,?) "
               "ON CONFLICT(chat_id) DO UPDATE SET json=excluded.json, updated_ts=excluded.updated_ts",
               (cid, json.dumps(cur), int(time.time())))
    db.commit()
    return cur


# ---------------------------------------------------------------- Binance verisi
async def load_universe(client):
    for m, url in (("futures", FAPI + "/fapi/v1/ticker/24hr"), ("spot", SAPI + "/api/v3/ticker/24hr")):
        try:
            r = await client.get(url)
            r.raise_for_status()
            rows = [d for d in r.json()
                    if d["symbol"].endswith("USDT") and d["symbol"][:-4] not in STABLES]
            rows.sort(key=lambda d: float(d.get("quoteVolume", 0)), reverse=True)
            ALL[m] = {d["symbol"] for d in rows}
            TOP[m] = [d["symbol"] for d in rows[:60]]
            log.info("%s: %d parite yüklendi", m, len(rows))
        except Exception as e:
            log.warning("%s listesi alınamadı: %s", m, e)


async def fetch_klines(client, market, symbol, tf, limit=500):
    url = FAPI + "/fapi/v1/klines" if market == "futures" else SAPI + "/api/v3/klines"
    r = await client.get(url, params={"symbol": symbol, "interval": tf, "limit": limit})
    r.raise_for_status()
    now_ms = int(time.time() * 1000)
    return [x for x in r.json() if int(x[6]) < now_ms]  # sadece kapanmış mumlar


async def fetch_ticker(client, symbol):
    """Önce futures, olmazsa spot tek coin 24s verisi. Bulunamazsa None."""
    for url in (FAPI + "/fapi/v1/ticker/24hr", SAPI + "/api/v3/ticker/24hr"):
        try:
            r = await client.get(url, params={"symbol": symbol})
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            log.warning("ticker hatası %s: %s", symbol, e)
    return None


async def fetch_futures_extra(client, symbol):
    """Funding, açık pozisyon ve long/short oranı. Hepsi alınamazsa None."""
    async def get(url, params):
        try:
            r = await client.get(url, params=params)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.warning("futures verisi alınamadı %s: %s", url.rsplit("/", 1)[-1], e)
            return None

    pi, oi, ls = await asyncio.gather(
        get(FAPI + "/fapi/v1/premiumIndex", {"symbol": symbol}),
        get(FAPI + "/fapi/v1/openInterest", {"symbol": symbol}),
        get(FAPI + "/futures/data/globalLongShortAccountRatio",
            {"symbol": symbol, "period": "15m", "limit": 1}))
    out = {"funding": None, "oi": None, "ls": None}
    try:
        out["funding"] = float(pi["lastFundingRate"]) * 100
    except (TypeError, KeyError, ValueError):
        pass
    try:
        out["oi"] = float(oi["openInterest"])
    except (TypeError, KeyError, ValueError):
        pass
    try:
        out["ls"] = float(ls[0]["longShortRatio"])
    except (TypeError, KeyError, ValueError, IndexError):
        pass
    return out if any(v is not None for v in out.values()) else None


async def btc_rows(client, market, tf):
    k = (market, tf)
    if k in BTC_CACHE and time.time() - BTC_CACHE[k][0] < 90:
        return BTC_CACHE[k][1]
    rows = await fetch_klines(client, market, "BTCUSDT", tf, 120)
    BTC_CACHE[k] = (time.time(), rows)
    return rows


async def enrich(client, market, symbol, tf, sig, data=None):
    """Üst zaman dilimi trendi, BTC korelasyonu ve futures verisini çekip puanı yeniden hesaplar."""
    sig["corr"] = None
    if data and symbol != "BTCUSDT":
        try:
            sig["corr"] = core.corr_rows(data, await btc_rows(client, market, tf))
        except Exception as e:
            log.warning("korelasyon hesaplanamadı %s: %s", symbol, e)
    htf = None
    htf_tf = core.HTF_MAP.get(tf)
    if htf_tf:
        try:
            trend = core.htf_trend(await fetch_klines(client, market, symbol, htf_tf, 150))
            htf = {"tf": htf_tf, "trend": trend} if trend in (1, -1) else None
        except Exception as e:
            log.warning("üst TF alınamadı %s %s: %s", symbol, htf_tf, e)
    sig["fut"] = await fetch_futures_extra(client, symbol) if market == "futures" else None
    core.finalize(sig, htf)


async def get_movers(client):
    if time.time() - MOVERS["ts"] < 60 and MOVERS["rows"]:
        return MOVERS["rows"]
    r = await client.get(FAPI + "/fapi/v1/ticker/24hr")
    r.raise_for_status()
    rows = [d for d in r.json() if d["symbol"].endswith("USDT") and d["symbol"][:-4] not in STABLES
            and float(d["quoteVolume"]) >= 20_000_000]
    MOVERS.update(ts=time.time(), rows=rows)
    return rows


async def top_text(client, t):
    try:
        rows = sorted(await get_movers(client), key=lambda d: float(d["priceChangePercent"]), reverse=True)
    except Exception as e:
        log.warning("movers hatası: %s", e)
        return t["err"]
    if not rows:
        return t["err"]

    def line(i, d):
        return (f"{i}. <code>{d['symbol']}</code>  {float(d['priceChangePercent']):+.2f}%"
                f" · {fmt_price(float(d['lastPrice']))}")

    up = [line(i, d) for i, d in enumerate(rows[:5], 1)]
    down = [line(i, d) for i, d in enumerate(reversed(rows[-5:]), 1)]
    return "\n".join([t["top_head"], "", t["top_up"], *up, "", t["top_down"], *down, "", t["top_hint"]])


async def markets_text(client, t):
    try:
        rows = sorted(await get_movers(client), key=lambda d: float(d["quoteVolume"]), reverse=True)[:10]
    except Exception as e:
        log.warning("markets hatası: %s", e)
        return t["err"]
    if not rows:
        return t["err"]
    L = [t["mk_head"], ""]
    for i, d in enumerate(rows, 1):
        ch = float(d["priceChangePercent"])
        L.append(f"{i}. <code>{d['symbol']}</code> · {fmt_price(float(d['lastPrice']))} · "
                 f"{'🟢' if ch >= 0 else '🔴'} {ch:+.2f}% · {core.fmt_big(d['quoteVolume'])}")
    return "\n".join(L + ["", t["disc"]])


# ---------------------------------------------------------------- gönderim
async def send(app, cid, text, silent=False, reply_to=None, retries=3):
    """Mesaj gönderir; başarılıysa message_id döner (TP/SL bildirimlerinde yanıt vermek için).
    Ağ kopukluğu/zaman aşımı (TimedOut, NetworkError) geçicidir: birkaç kez tekrar dener, vazgeçmez."""
    try:
        kw = {}
        if reply_to:
            kw["reply_parameters"] = ReplyParameters(message_id=reply_to, allow_sending_without_reply=True)
        m = await app.bot.send_message(cid, text, parse_mode=ParseMode.HTML, link_preview_options=LPO,
                                       disable_notification=silent, **kw)
        await asyncio.sleep(0.04)
        return m.message_id
    except RetryAfter as e:
        if retries:
            await asyncio.sleep(e.retry_after + 1)
            return await send(app, cid, text, silent, reply_to, retries - 1)
    except Forbidden:
        set_field(cid, "active", 0)  # kullanıcı botu engelledi
    except NetworkError as e:
        if retries:
            log.warning("gönderim zaman aşımı %s, tekrar denenecek (%d kaldı): %s", cid, retries, e)
            await asyncio.sleep(2.0)
            return await send(app, cid, text, silent, reply_to, retries - 1)
        log.warning("gönderilemedi (ağ, tekrar tükendi) %s: %s", cid, e)
    except TelegramError as e:
        log.warning("gönderilemedi %s: %s", cid, e)
    await asyncio.sleep(0.04)
    return None


async def send_photo(app, cid, photo, caption=None, silent=False, retries=2):
    """Grafik gönderir (caption verilirse metinle birleşik tek mesaj olarak); (message_id, file_id) döner."""
    try:
        if hasattr(photo, "seek"):
            try:
                photo.seek(0)
            except Exception:
                pass
        kw = {"disable_notification": silent}
        if caption:
            kw["caption"] = caption
            kw["parse_mode"] = ParseMode.HTML
        m = await app.bot.send_photo(cid, photo, **kw)
        await asyncio.sleep(0.04)
        fid = m.photo[-1].file_id if getattr(m, "photo", None) else None
        return m.message_id, fid
    except RetryAfter as e:
        await asyncio.sleep(e.retry_after + 1)
    except Forbidden:
        set_field(cid, "active", 0)
    except NetworkError as e:
        if retries:
            await asyncio.sleep(2.0)
            return await send_photo(app, cid, photo, caption=caption, silent=silent, retries=retries - 1)
        log.warning("grafik gönderilemedi (ağ, tekrar tükendi) %s: %s", cid, e)
    except TelegramError as e:
        log.warning("grafik gönderilemedi %s: %s", cid, e)
    return None, None


# ---------------------------------------------------------------- sinyal yaşam döngüsü
async def notify(app, s, kind, price, r):
    """Sinyali alan (ve TP/SL bildirimi açık) herkese, orijinal sinyale yanıt olarak olay mesajı yollar."""
    rows = db.execute(
        """SELECT d.chat_id, d.msg_id, u.lang, u.tz, u.quiet FROM deliveries d
           JOIN users u ON u.chat_id=d.chat_id
           WHERE d.signal_id=? AND u.accepted=1 AND u.active=1 AND u.notify_track=1""", (s["id"],)).fetchall()
    for d in rows:
        await send(app, d["chat_id"], render_event(d["lang"], kind, s, price, r),
                   silent=core.in_quiet(d["quiet"], d["tz"]), reply_to=d["msg_id"])


async def finish(app, s, reason, price, hit, r=None):
    """Sinyali kapatır (reason: sl|be|tp3|flip|expired), toplam R'yi hesaplar ve bildirir."""
    if r is None:
        r = core.close_r(s["side"], s["entry"], abs(s["entry"] - s["sl"]), hit, price)
    status = "expired" if reason == "expired" else "closed"
    db.execute("UPDATE signals SET status=?, reason=?, closed_ts=?, exit_price=?, r_result=?, tp_hit=? WHERE id=?",
               (status, reason, int(time.time()), price, r, hit, s["id"]))
    db.commit()
    await notify(app, dict(s, tp_hit=hit), reason, price, r)


async def close_flipped(app, market, symbol, tf, price):
    """Aynı coin/TF'de yeni sinyal geldiyse (trend döndü) önceki açık sinyali güncel fiyattan kapatır."""
    rows = db.execute("SELECT * FROM signals WHERE market=? AND symbol=? AND tf=? AND status=?",
                      (market, symbol, tf, core.OPEN_STATUS)).fetchall()
    for s in rows:
        await finish(app, s, "flip", price, s["tp_hit"] or 0)


async def process_signal(app, s, cs, ims):
    """Bir sinyalin kapanmış yeni mumlarını işler. cs: [(open_ms, high, low, close)] artan sırada."""
    state = {"side": s["side"], "entry": s["entry"], "tps": [s["tp1"], s["tp2"], s["tp3"]],
             "hit": s["tp_hit"] or 0, "stop": s["sl_cur"] if s["sl_cur"] is not None else s["sl"],
             "cursor": s["last_check"] or s["ctime"]}
    new, events, closed = core.track_step(state, [(o, h, lo) for o, h, lo, _c in cs]) if cs else (state, [], None)
    new_check = (cs[-1][0] + ims) if cs else state["cursor"]
    db.execute("UPDATE signals SET tp_hit=?, sl_cur=?, last_check=? WHERE id=?",
               (new["hit"], new["stop"], new_check, s["id"]))
    db.commit()
    snap = dict(s, tp_hit=new["hit"])
    for kind, val in events:
        if kind != "tp" or (closed == "tp3" and val == 3):
            continue  # stop/TP3 kapanışını finish() bildirir
        await notify(app, snap, f"tp{val}", state["tps"][val - 1], core.r_model(val, "be"))
    if closed:
        reason = closed  # sl | be | tp3
        price = state["tps"][2] if reason == "tp3" else new["stop"]
        await finish(app, s, reason, price, new["hit"], core.r_model(new["hit"], reason))
    elif time.time() - s["ts"] > core.expire_secs(s["tf"]):
        price = cs[-1][3] if cs else PRICES.get((s["market"], s["symbol"]))
        if price:
            await finish(app, s, "expired", price, new["hit"])


async def track_once(app, client):
    rows = db.execute("SELECT * FROM signals WHERE status=?", (core.OPEN_STATUS,)).fetchall()
    if not rows:
        return
    groups = {}
    for r in rows:
        groups.setdefault((r["market"], r["symbol"]), []).append(r)
    sem = asyncio.Semaphore(5)

    async def work(key, sigs):
        market, symbol = key
        start = min((s["last_check"] or s["ctime"]) for s in sigs)
        now_ms = int(time.time() * 1000)
        gap_min = (now_ms - start) / 60000
        # bot uzun süre kapalı kaldıysa daha kaba mumlarla yakala
        itv, ims = ("1m", 60_000) if gap_min <= 900 else (
            ("15m", 900_000) if gap_min <= 13500 else ("1h", 3_600_000))
        url = FAPI + "/fapi/v1/klines" if market == "futures" else SAPI + "/api/v3/klines"
        async with sem:
            try:
                r = await client.get(url, params={"symbol": symbol, "interval": itv,
                                                  "startTime": int(start), "limit": 1000})
                r.raise_for_status()
                data = r.json()
            except Exception as e:
                log.warning("takip verisi alınamadı %s %s: %s", market, symbol, e)
                return
        if data:
            PRICES[key] = float(data[-1][4])
        closed = [(int(x[0]), float(x[2]), float(x[3]), float(x[4])) for x in data if int(x[6]) < now_ms]
        for s in sigs:
            try:
                lc = s["last_check"] or s["ctime"]
                await process_signal(app, s, [c for c in closed if c[0] >= lc], ims)
            except Exception:
                log.exception("sinyal takip hatası id=%s", s["id"])

    await asyncio.gather(*(work(k, v) for k, v in groups.items()))


async def tracker(app):
    client = app.bot_data["client"]
    while True:
        try:
            await track_once(app, client)
        except Exception:
            log.exception("takipçi hatası")
        await asyncio.sleep(60)


# ---------------------------------------------------------------- fiyat alarmları
async def check_alerts(app, client):
    rows = db.execute("SELECT * FROM alerts").fetchall()
    if not rows:
        return
    prices = {}
    for url in (SAPI + "/api/v3/ticker/price", FAPI + "/fapi/v1/ticker/price"):
        try:
            r = await client.get(url)
            r.raise_for_status()
            for d in r.json():
                prices.setdefault(d["symbol"], float(d["price"]))
        except Exception as e:
            log.warning("fiyat listesi alınamadı: %s", e)
    for a in rows:
        p = prices.get(a["symbol"])
        if p is None:
            continue
        if (p >= a["price"]) if a["direction"] == "above" else (p <= a["price"]):
            db.execute("DELETE FROM alerts WHERE id=?", (a["id"],))  # tek seferlik; önce sil
            db.commit()
            u = get_user(a["chat_id"])
            if u and u["accepted"]:
                await send(app, u["chat_id"],
                           tx(u["lang"])["al_hit"].format(s=a["symbol"], p=fmt_price(p),
                                                          t=fmt_price(a["price"])),
                           silent=core.in_quiet(u["quiet"], u["tz"]))


async def alert_loop(app):
    client = app.bot_data["client"]
    while True:
        try:
            await check_alerts(app, client)
        except Exception:
            log.exception("alarm döngüsü hatası")
        await asyncio.sleep(20)


# ---------------------------------------------------------------- tarayıcı
async def scan_tf(app, client, tf):
    rows = db.execute(
        """SELECT u.chat_id,u.lang,u.market,u.max_lev,u.strong_only,u.tz,u.quiet,u.chart,u.compact,c.symbol FROM users u
           JOIN coins c ON c.chat_id=u.chat_id JOIN tfs t ON t.chat_id=u.chat_id
           WHERE t.tf=? AND u.accepted=1 AND u.active=1""", (tf,)).fetchall()
    targets = {}
    for r in rows:
        markets = ["futures", "spot"] if r["market"] == "both" else [r["market"]]
        for m in markets:
            if ALL[m] and r["symbol"] not in ALL[m]:
                continue
            targets.setdefault((m, r["symbol"]), []).append(r)
    if not targets:
        return
    sem = asyncio.Semaphore(6)
    max_age = (min(TF_SEC[tf], 21600) + 300) * 1000  # eski mumun sinyalini gönderme

    async def work(key, users):
        market, symbol = key
        async with sem:
            try:
                data = await fetch_klines(client, market, symbol, tf)
            except Exception as e:
                log.warning("veri alınamadı %s %s %s: %s", market, symbol, tf, e)
                return
        try:
            sig = core.analyze(data, market)
        except Exception:
            log.exception("analiz hatası %s %s %s", market, symbol, tf)
            return
        if not sig or int(time.time() * 1000) - sig["close_ms"] > max_age:
            return
        if db.execute("SELECT 1 FROM signals WHERE market=? AND symbol=? AND tf=? AND ctime=?",
                      (market, symbol, tf, sig["time"])).fetchone():
            return  # bu mum için zaten gönderildi
        sig.update(symbol=symbol, tf=tf)
        track = sig["side"] != "EXIT"
        if track:
            try:
                await enrich(client, market, symbol, tf, sig, data)
            except Exception:
                log.exception("zenginleştirme hatası %s %s %s", market, symbol, tf)
        await close_flipped(app, market, symbol, tf, sig["entry"])
        cur = db.execute(
            """INSERT INTO signals(ts,ctime,market,symbol,tf,side,entry,sl,tp1,tp2,tp3,score,grade,lev,
               sl_pct,status,tp_hit,sl_cur,last_check) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (int(time.time()), sig["time"], market, symbol, tf, sig["side"], sig["entry"], sig["sl"],
             sig["tps"][0], sig["tps"][1], sig["tps"][2], sig["score"], core.grade_key(sig["score"]).upper(), sig["lev"],
             sig["sl_pct"], core.OPEN_STATUS if track else core.INFO_STATUS, 0, sig["sl"], sig["close_ms"] + 1))
        db.commit()
        sid = cur.lastrowid
        log.info("SİNYAL %s %s %s %s skor=%s", sig["side"], symbol, market, tf, sig["score"])
        png, file_id = None, None
        if track and any(u["chart"] for u in users):
            try:
                png = charts.render_chart(data, sig)
            except Exception:
                log.exception("grafik üretilemedi %s %s %s", market, symbol, tf)
        for u in users:
            if track and u["strong_only"] and (sig["score"] or 0) < core.STRONG_MIN:
                continue
            lev = min(sig["lev"], u["max_lev"])
            silent = core.in_quiet(u["quiet"], u["tz"])
            text = render_signal(u["lang"], sig, lev, u["tz"], compact=bool(u["compact"]))
            mid = None
            if png and u["chart"]:
                caption_text = render_signal_caption(u["lang"], sig, lev, u["tz"], compact=bool(u["compact"]))
                mid, fid = await send_photo(app, u["chat_id"], file_id or io.BytesIO(png), caption=caption_text, silent=silent)
                if mid:
                    file_id = file_id or fid
            if not mid:
                mid = await send(app, u["chat_id"], text, silent=silent)
            if mid and track:
                db.execute("INSERT OR REPLACE INTO deliveries VALUES(?,?,?)", (sid, u["chat_id"], mid))
                db.commit()

    await asyncio.gather(*(work(k, v) for k, v in targets.items()))


async def safe_scan(app, client, tf):
    try:
        await scan_tf(app, client, tf)
    except Exception:
        log.exception("tarama hatası (%s)", tf)


async def scanner(app):
    client = app.bot_data["client"]
    next_run = {}
    last_universe = time.time()
    while True:
        try:
            now = time.time()
            if now - last_universe > 1800:
                last_universe = now
                await load_universe(client)
            for tf, sec in TF_SEC.items():
                period = 3600 if sec >= 604800 else sec
                due = next_run.get(tf)
                if due is None:
                    next_run[tf] = (now // period + 1) * period + 3
                elif now >= due:
                    next_run[tf] = (now // period + 1) * period + 3
                    task = asyncio.create_task(safe_scan(app, client, tf))
                    BG.add(task)
                    task.add_done_callback(BG.discard)
        except Exception:
            log.exception("tarayıcı hatası")
        await asyncio.sleep(1)


# ---------------------------------------------------------------- metin üreticileri
def perf_text(u, days, scope="all"):
    """Otomatik takip istatistikleri (core.compute_stats). scope: all | mine."""
    t = tx(u["lang"])
    since = int(time.time()) - days * 86400 if days else 0
    join, args = "", [since]
    if scope == "mine":
        join, args = "JOIN deliveries d ON d.signal_id=s.id AND d.chat_id=?", [u["chat_id"], since]
    rows = [dict(r) for r in db.execute(
        "SELECT s.side, s.tf, s.score, s.status, s.tp_hit AS hit, s.r_result AS r, s.reason FROM signals s "
        f"{join} WHERE s.status IN ('open','closed','expired') AND s.ts>=?", args).fetchall()]
    st = core.compute_stats(rows)
    period = t["p7"] if days == 7 else t["p30"] if days == 30 else t["pall"]
    out = [t["st_title"].format(period=period, scope=t["sc_mine"] if scope == "mine" else t["sc_all"]), "",
           t["st_signals"].format(n=st["total"], c=st["resolved"], o=st["open"], x=st["noresult"])]
    n = st["resolved"]
    if n == 0:
        return "\n".join(out + ["", t["st_none"], "", t["st_model"]])
    pc = lambda x: f"{x / n * 100:.0f}"  # noqa: E731
    out += [t["st_rates"].format(a=pc(st["tp"][0]), b=pc(st["tp"][1]), c=pc(st["tp"][2]), d=pc(st["sl"])),
            t["st_win"].format(w=pc(st["wins"]), n=n),
            t["st_net"].format(net=f"{st['net']:+.2f}", avg=f"{st['net'] / n:+.2f}")]

    def block(title, key, order):
        data = st[key]
        keys = [k for k in order if k in data]
        if keys:
            out.append("")
            out.append(title)
            for k in keys:
                cnt, w = data[k]
                out.append(f"• {k}: {cnt} · {w / cnt * 100:.0f}%")

    block(t["st_side"], "by_side", ["LONG", "SHORT", "BUY"])
    block(t["st_tf"], "by_tf", TF_LIST)
    block(t["st_grade"], "by_grade", ["A", "B", "C"])
    if n < 30:
        out += ["", t["st_small"]]
    out += ["", t["st_model"]]
    return "\n".join(out)


def perf_kb(u, days, scope="all"):
    t = tx(u["lang"])
    per = [B(("✅ " if days == d else "") + lbl, callback_data=f"R:{d}:{scope}")
           for d, lbl in ((7, t["p7"]), (30, t["p30"]), (0, t["pall"]))]
    sc = [B(("✅ " if scope == k else "") + t["sc_" + k], callback_data=f"R:{days}:{k}")
          for k in ("all", "mine")]
    return M([per, sc, [B(t["b_back"], callback_data="M:menu")]])


def open_text(u):
    t = tx(u["lang"])
    rows = db.execute(
        "SELECT s.* FROM signals s JOIN deliveries d ON d.signal_id=s.id WHERE d.chat_id=? "
        "AND s.status=? ORDER BY s.ts DESC LIMIT 15", (u["chat_id"], core.OPEN_STATUS)).fetchall()
    if not rows:
        return t["open_empty"]
    lines = [t["open_head"], ""]
    for s in rows:
        long_ = s["side"] in ("LONG", "BUY")
        risk = abs(s["entry"] - s["sl"])
        price = PRICES.get((s["market"], s["symbol"]))
        r_now = core.close_r(s["side"], s["entry"], risk, s["tp_hit"] or 0, price) if price and risk > 0 else None
        st = f"TP{s['tp_hit']} ✅" if s["tp_hit"] else t["st_wait"]
        lines.append(f"{'🟢' if long_ else '🔴'} <code>{s['symbol']}</code> · {s['tf']} · {s['side']} · {st}"
                     + (f" · {r_now:+.2f}R" if r_now is not None else ""))
    return "\n".join(lines)


def history_text(u):
    t = tx(u["lang"])
    rows = db.execute(
        "SELECT * FROM signals WHERE symbol IN (SELECT symbol FROM coins WHERE chat_id=?) "
        "ORDER BY ts DESC LIMIT 10", (u["chat_id"],)).fetchall()
    if not rows:
        return t["hist_empty"]
    lines = [t["hist_head"], ""]
    for r in rows:
        res = f" · {r['r_result']:+.2f}R" if r["r_result"] is not None else ""
        lines.append(f"{status_icon(r)} <code>{r['symbol']}</code> · {r['tf']} · {r['side']} · "
                     f"{fmt_price(r['entry'])} · {local_time(r['ts'], u['tz'])}{res}")
    return "\n".join(lines)


def alerts_view(u):
    t = tx(u["lang"])
    rows = db.execute("SELECT * FROM alerts WHERE chat_id=? ORDER BY id", (u["chat_id"],)).fetchall()
    if not rows:
        return t["al_empty"], back_kb(u["lang"])
    btns = [[B(f"✕ {a['symbol']} {'≥' if a['direction'] == 'above' else '≤'} {fmt_price(a['price'])}",
               callback_data=f"X:{a['id']}")] for a in rows]
    return t["al_list"], M(btns + [[B(t["b_back"], callback_data="M:menu")]])


# ---------------------------------------------------------------- arayüz yardımcıları
def private(update):
    return bool(update.effective_chat and update.effective_chat.type == "private")


async def show(update, text, kb=None):
    q = update.callback_query
    try:
        if q:
            await q.edit_message_text(text, parse_mode=ParseMode.HTML, reply_markup=kb,
                                      link_preview_options=LPO)
        else:
            await update.effective_message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=kb,
                                                      link_preview_options=LPO)
    except BadRequest as e:
        if "not modified" not in str(e).lower():
            raise


def throttled(ctx, key, sec=2.0):
    now = time.time()
    if now - ctx.user_data.get(key, 0) < sec:
        return True
    ctx.user_data[key] = now
    return False


def lang_kb():
    btns = [B(T[c]["name"], callback_data=f"L:{c}") for c in LANGS]
    return M([btns[i:i + 2] for i in range(0, len(btns), 2)])


def terms_kb(lang):
    t = tx(lang)
    url = get_miniapp_url()
    rows = []
    if url:
        rows.append([
            B("📜 Privacy Policy (Web)", web_app=WebAppInfo(url=build_miniapp_web_url("privacy.html"))),
            B("⚖️ Terms of Service (Web)", web_app=WebAppInfo(url=build_miniapp_web_url("terms.html")))
        ])
    rows.append([B("🌐 " + t.get("b_lang", "Language / Сменить язык"), callback_data="L:pick")])
    rows.append([B(t["accept"], callback_data="A:yes"), B(t["decline"], callback_data="A:no")])
    return M(rows)


def back_kb(lang):
    return M([[B(tx(lang)["b_back"], callback_data="M:menu")]])


def quiet_label(u, t):
    if u["quiet"] not in core.QUIET:
        return t["off"]
    s, e = core.QUIET[u["quiet"]]
    return f"{s:02d}:00–{e:02d}:00 (UTC{u['tz']:+d})"


def help_text(t):
    return t["help"] + "\n\n" + t["help2"] + HELP_CMDS


def menu_text(u):
    t = tx(u["lang"])
    tfs = [x for x in TF_LIST if x in user_set("tfs", "tf", u["chat_id"])]
    return t["menu"].format(
        status=t["st_on"] if u["active"] else t["st_off"],
        n=len(user_set("coins", "symbol", u["chat_id"])), tfs=", ".join(tfs) or "—",
        market=t["mkt_" + u["market"]], lev=u["max_lev"],
        strong=t["on"] if u["strong_only"] else t["off"], quiet=quiet_label(u, t))


def menu_kb(u):
    t = tx(u["lang"])
    onoff = lambda x: t["on"] if x else t["off"]  # noqa: E731
    murl = get_miniapp_url()
    
    # Modern Ekosistem: Ana Mini App Terminali En Üstte Vurgulu
    btn_terminal_text = {
        "ru": "🚀 Открыть Терминал Елена (Mini App)",
        "uk": "🚀 Відкрити Термінал Олена (Mini App)",
        "en": "🚀 Launch Elena Terminal (Mini App)",
        "tr": "🚀 Elena Terminalini Aç (Mini App)",
        "de": "🚀 Elena Terminal Öffnen (Mini App)",
        "es": "🚀 Abrir Terminal Elena (Mini App)",
        "fr": "🚀 Ouvrir le Terminal Elena (Mini App)",
        "ar": "🚀 فتح منصة إيلينا (Mini App)"
    }.get(u["lang"], "🚀 Launch Elena Terminal (Mini App)")

    main_rows = []
    if murl:
        main_rows.append([B(btn_terminal_text, web_app=WebAppInfo(url=build_miniapp_web_url("index.html")))])

    # Alt satırlar: Telegram içi hızlı butonlar (tamamı korunuyor)
    sub_rows = [
        [B(t["b_coins"], callback_data="C:p:0"), B(t["b_tfs"], callback_data="M:tfs")],
        [B(t["b_market"], callback_data="M:market"), B(t["b_lev"], callback_data="M:lev")],
        [B(t["b_strong"].format(v=onoff(u["strong_only"])), callback_data="S:t"),
         B(t["b_quiet"], callback_data="M:quiet")],
        [B(t["b_perf"], callback_data="M:perf"), B(t["b_open"], callback_data="M:open")],
        [B(t["b_data"], callback_data="M:data"), B(t["b_hist"], callback_data="M:hist")],
        [B(t["b_alerts"], callback_data="M:alerts"), B(t["b_calc"], callback_data="M:calc")],
        [B(t["b_track"].format(v=onoff(u["notify_track"])), callback_data="N:t")],
        [B(t["b_disp"], callback_data="M:disp"), B(t["b_mkts"], callback_data="M:mkts")],
        [B(t["b_pause"] if u["active"] else t["b_resume"], callback_data="P:t")],
        [B(t["b_lang"], callback_data="M:lang"), B(t["b_help"], callback_data="M:help")],
        [B(t["b_terms"], callback_data="M:terms"), B(t["b_donate"], callback_data="M:donate")],
        [B(t["b_delete"], callback_data="M:delete")],
    ]
    return M(main_rows + sub_rows)


def disp_view(u):
    t = tx(u["lang"])
    onoff = lambda x: t["on"] if x else t["off"]  # noqa: E731
    return t["disp_head"], M([
        [B(t["b_chart"].format(v=onoff(u["chart"])), callback_data="G:c")],
        [B(t["b_compact"].format(v=onoff(u["compact"])), callback_data="G:k")],
        [B(t["b_back"], callback_data="M:menu")]])


async def show_menu(update, cid):
    u = get_user(cid)
    user_lang = u["lang"] if (u and "lang" in u.keys()) else "ru"
    t = tx(user_lang)
    url = get_miniapp_url()
    
    # Telegram sol altındaki Menü Butonunu Mini App olarak senkronize et
    if update.get_bot:
        try:
            bot_obj = update.get_bot()
            if url:
                btn_labels = {
                    "ru": "🚀 Открыть", "uk": "🚀 Відкрити",
                    "en": "🚀 Open App", "de": "🚀 Öffnen",
                    "es": "🚀 Abrir", "fr": "🚀 Ouvrir",
                    "ar": "🚀 فتح",  "tr": "🚀 Uygulamayı Aç",
                }
                label = btn_labels.get(user_lang, "🚀 Open App")
                mb = MenuButtonWebApp(text=label, web_app=WebAppInfo(url=build_miniapp_web_url("index.html")))
                await bot_obj.set_chat_menu_button(chat_id=cid, menu_button=mb)
        except Exception:
            pass

    # Kullanıcıya sadece lüks tek butonlu Mini App davet kartı göster
    btn_text = {
        "ru": "🚀 Открыть Elena Terminal (Mini App)",
        "uk": "🚀 Відкрити Elena Terminal (Mini App)",
        "en": "🚀 Open Elena Terminal (Mini App)",
        "tr": "🚀 Elena Terminalini Aç (Mini App)",
        "de": "🚀 Elena Terminal Öffnen (Mini App)",
        "es": "🚀 Abrir Terminal Elena (Mini App)",
        "fr": "🚀 Ouvrir le Terminal Elena (Mini App)",
        "ar": "🚀 فتح منصة إيلينا (Mini App)"
    }.get(user_lang, "🚀 Open Elena Terminal (Mini App)")

    info_text = {
        "ru": (
            f"👑 <b>Добро пожаловать в {BRAND}!</b>\n\n"
            "Все настройки, живой рынок, выбор монет, таймфреймов, кредитное плечо, "
            "калькулятор и управление авто-ботом теперь доступны в <b>полноэкранном терминале</b>.\n\n"
            "📡 <i>В этом чате будут приходить только сигналы, графики и важные уведомления.</i>"
        ),
        "tr": (
            f"👑 <b>{BRAND}'a Hoş Geldiniz!</b>\n\n"
            "Tüm ayarlar, canlı piyasa, coin ve periyot seçimleri, kaldıraç, "
            "hesaplayıcı ve oto-bot yönetimi <b>tam ekran modern terminalde</b> toplanmıştır.\n\n"
            "📡 <i>Bu sohbete yalnızca canlı alım/satım sinyalleri, grafikler ve bildirimler yansıyacaktır.</i>"
        ),
        "en": (
            f"👑 <b>Welcome to {BRAND}!</b>\n\n"
            "All settings, live market, coin and timeframe selection, leverage, "
            "risk calculator and auto-bot controls are integrated into the <b>fullscreen terminal</b>.\n\n"
            "📡 <i>This chat will only receive live trading signals, candlestick charts, and announcements.</i>"
        )
    }.get(user_lang, (
        f"👑 <b>Welcome to {BRAND}!</b>\n\n"
        "Launch the fullscreen terminal below to manage all your crypto trading preferences."
    ))

    kb = M([[B(btn_text, web_app=WebAppInfo(url=build_miniapp_web_url("index.html")))]]) if url else None
    await show(update, HEAD + "\n\n" + info_text, kb)


def coins_view(u, page):
    cid, t = u["chat_id"], tx(u["lang"])
    pool = TOP["futures"] if u["market"] != "spot" else TOP["spot"]
    sel = set(user_set("coins", "symbol", cid))
    per = 18
    pages = max(1, (len(pool) + per - 1) // per)
    page = max(0, min(page, pages - 1))
    chunk = pool[page * per:(page + 1) * per]
    btns = [B(("✅ " if s in sel else "") + s[:-4], callback_data=f"C:t:{s}:{page}") for s in chunk]
    rows = [btns[i:i + 3] for i in range(0, len(btns), 3)]
    nav = []
    if page > 0:
        nav.append(B("◀️", callback_data=f"C:p:{page - 1}"))
    nav.append(B(f"{page + 1}/{pages}", callback_data=f"C:p:{page}"))
    if page < pages - 1:
        nav.append(B("▶️", callback_data=f"C:p:{page + 1}"))
    rows += [nav, [B(t["b_back"], callback_data="M:menu")]]
    names = sorted(s[:-4] for s in sel)
    lst = (", ".join(names[:15]) + (" …" if len(names) > 15 else "")) if names else "—"
    return t["coins_head"].format(n=len(sel), lst=lst), M(rows)


def tfs_view(u):
    t = tx(u["lang"])
    sel = set(user_set("tfs", "tf", u["chat_id"]))
    btns = [B(("✅ " if x in sel else "") + x, callback_data=f"T:{x}") for x in TF_LIST]
    rows = [btns[i:i + 4] for i in range(0, len(btns), 4)] + [[B(t["b_back"], callback_data="M:menu")]]
    return t["tfs_head"], M(rows)


def quiet_view(u):
    t = tx(u["lang"])
    opts = [(0, t["quiet_off"])] + [(i, f"{s:02d}:00–{e:02d}:00") for i, (s, e) in core.QUIET.items()]
    rows = [[B(("✅ " if u["quiet"] == i else "") + lbl, callback_data=f"Q:{i}")] for i, lbl in opts]
    rows.append([B("➖", callback_data="Z:-"), B(f"UTC{u['tz']:+d}", callback_data="Z:0"),
                 B("➕", callback_data="Z:+")])
    rows.append([B(t["b_back"], callback_data="M:menu")])
    return t["quiet_head"].format(tz=f"{u['tz']:+d}"), M(rows)


async def terms_flow(update, u):
    lang = u["lang"] if u else "en"
    t = tx(lang)
    text = (
        f"🏛 <b>{BRAND} · Compliance & Risk Disclosure</b>\n\n"
        f"{t['terms']}\n\n"
        f"<i>By clicking '{t['accept']}', you certify that you are at least 18 years of age and agree to all terms and disclaimers.</i>"
    )
    await show(update, text, terms_kb(lang))


def donate_kb(t):
    return M([[B(t["b_donate_open"], url=DONATE_URL)], [B(t["b_back"], callback_data="M:menu")]])


def update_user_info(cid, update):
    """Kullanıcının telegram kullanıcı adı ve görünen adını günceller."""
    user = getattr(update, "effective_user", None)
    if not user:
        return
    username = (user.username or "")[:64]
    first_name = (user.first_name or "")[:64]
    try:
        db.execute("UPDATE users SET username=?, first_name=? WHERE chat_id=?", (username, first_name, cid))
        db.commit()
    except Exception:
        pass


# ---------------------------------------------------------------- komutlar
async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not private(update):
        return
    cid = update.effective_chat.id
    user = getattr(update, "effective_user", None)
    raw_lang = (getattr(user, "language_code", "") or "ru")[:2].lower()
    detected_lang = raw_lang if raw_lang in LANGS else "ru"

    u = get_user(cid)
    if not u:
        ensure_user(cid, lang=detected_lang)
        update_user_info(cid, update)
        u = get_user(cid)
    else:
        update_user_info(cid, update)

    # Eğer şartlar henüz kabul edilmemişse: Kurumsal Karşılama ve Dil Seçim Ekranı sunulur
    if not u["accepted"]:
        welcome_intro = (
            f"🏛 <b>{BRAND} · Institutional Quantitative Signals</b>\n\n"
            "🌐 <b>Пожалуйста, выберите язык / Please select your language / Lütfen dilinizi seçiniz:</b>\n\n"
            "<i>Select your preferred language to review regulatory disclosures and start the terminal:</i>"
        )
        return await show(update, welcome_intro, lang_kb())

    if not u["active"]:
        set_field(cid, "active", 1)

    await show_menu(update, cid)


async def gated(update):
    """Kayıtlı ve şartları kabul etmiş kullanıcıyı döner; değilse /start'a yönlendirir."""
    if not private(update):
        return None
    cid = update.effective_chat.id
    u = get_user(cid)
    if not u or not u["accepted"]:
        await update.effective_message.reply_text(tx(u["lang"] if u else "en")["need_terms"])
        return None
    # Ban kontrolü
    if u["banned"]:
        ban_row = db.execute("SELECT * FROM bans WHERE chat_id=?", (cid,)).fetchone()
        now = int(time.time())
        if ban_row and ban_row["banned_until"] and now > ban_row["banned_until"]:
            db.execute("UPDATE users SET banned=0 WHERE chat_id=?", (cid,))
            db.execute("DELETE FROM bans WHERE chat_id=?", (cid,))
            db.commit()
            u = get_user(cid)
        else:
            t = tx(u["lang"])
            reason = ban_row["reason"] if ban_row and ban_row["reason"] else "-"
            until_str = t.get("ban_perm", "permanent")
            if ban_row and ban_row["banned_until"]:
                import datetime
                until_str = datetime.datetime.fromtimestamp(ban_row["banned_until"]).strftime("%d.%m.%Y %H:%M")
            await update.effective_message.reply_text(
                t.get("ban_msg", "⛔ Account suspended.\nReason: {reason}\nUntil: {until}").format(
                    reason=reason, until=until_str), parse_mode=ParseMode.HTML)
            return None
    return u


async def cmd_menu(update, ctx):
    u = await gated(update)
    if u:
        await show_menu(update, u["chat_id"])


async def cmd_help(update, ctx):
    u = await gated(update)
    if u:
        await show(update, help_text(tx(u["lang"])), back_kb(u["lang"]))


async def cmd_coins(update, ctx):
    u = await gated(update)
    if u:
        text, kb = coins_view(u, 0)
        await show(update, text, kb)


async def cmd_tfs(update, ctx):
    u = await gated(update)
    if u:
        text, kb = tfs_view(u)
        await show(update, text, kb)


async def cmd_lang(update, ctx):
    if private(update):
        cid = update.effective_chat.id
        ensure_user(cid)
        u = get_user(cid)
        cur = u["lang"] if u else "en"
        text = (
            f"🌐 <b>Current Language / Текущий язык:</b> {T.get(cur, {}).get('name', cur)}\n\n"
            "<i>Select a language to update bot alerts and menu button / Выберите язык:</i>"
        )
        await show(update, text, lang_kb())


async def cmd_donate(update, ctx):
    u = await gated(update)
    if u:
        t = tx(u["lang"])
        await show(update, t["donate"], donate_kb(t))


async def cmd_terms(update, ctx):
    if private(update):
        cid = update.effective_chat.id
        u = get_user(cid)
        await terms_flow(update, u or {"lang": "en", "accepted": 1})


async def cmd_privacy(update, ctx):
    if private(update):
        cid = update.effective_chat.id
        u = get_user(cid)
        url = get_miniapp_url()
        btns = []
        if url:
            btns.append([
                B("📜 Privacy Policy (Web)", web_app=WebAppInfo(url=build_miniapp_web_url("privacy.html"))),
                B("⚖️ Terms of Service (Web)", web_app=WebAppInfo(url=build_miniapp_web_url("terms.html")))
            ])
        btns.append([B("⬅️ Back / Назад", callback_data="M:menu")])
        text = (
            f"🛡️ <b>{BRAND} · Institutional Privacy & Data Security</b>\n\n"
            "• <b>100% Non-Custodial:</b> We never hold, request, or manage private keys or user funds.\n"
            "• <b>Zero Third-Party Sharing:</b> Personal identifiers and telemetry are strictly private.\n"
            "• <b>GDPR Compliance & Erasure:</b> You retain full rights to delete your telemetry at any time via /delete.\n\n"
            "<i>For our complete legal policy and regulatory disclaimers, click below:</i>"
        )
        await show(update, text, M(btns))


async def cmd_delete(update, ctx):
    u = await gated(update)
    if u:
        t = tx(u["lang"])
        await show(update, t["delete_ask"], M([[B(t["delete_yes"], callback_data="D:yes"),
                                                B(t["delete_no"], callback_data="M:menu")]]))


def norm_symbol(arg):
    s = arg.upper().replace("/", "").replace("-", "").strip()
    if not s.isalnum() or len(s) > 20:
        return None
    return s if s.endswith("USDT") else s + "USDT"


async def cmd_add(update, ctx):
    u = await gated(update)
    if not u:
        return
    t, cid = tx(u["lang"]), u["chat_id"]
    if not ctx.args:
        await update.effective_message.reply_text(t["usage_add"])
        return
    out = []
    known = ALL["futures"] | ALL["spot"]
    for a in ctx.args[:10]:
        s = norm_symbol(a)
        if not s or (known and s not in known):
            out.append(t["notfound"].format(s=a[:20]))
        elif len(user_set("coins", "symbol", cid)) >= MAX_COINS:
            out.append(t["limit"].format(n=MAX_COINS))
            break
        else:
            db.execute("INSERT OR IGNORE INTO coins VALUES(?,?)", (cid, s))
            db.commit()
            out.append(t["added"].format(s=s))
    await update.effective_message.reply_text("\n".join(out))


async def cmd_remove(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    if not ctx.args:
        await update.effective_message.reply_text(t["usage_add"])
        return
    out = []
    for a in ctx.args[:10]:
        s = norm_symbol(a)
        if s:
            db.execute("DELETE FROM coins WHERE chat_id=? AND symbol=?", (u["chat_id"], s))
            db.commit()
            out.append(t["removed"].format(s=s))
    await update.effective_message.reply_text("\n".join(out) or t["usage_add"])


async def cmd_price(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    if not ctx.args:
        return await update.effective_message.reply_text(t["price_usage"])
    if throttled(ctx, "price", 1.5):
        return await update.effective_message.reply_text(t["wait"])
    s = norm_symbol(ctx.args[0])
    d = await fetch_ticker(ctx.application.bot_data["client"], s) if s else None
    if not d:
        return await update.effective_message.reply_text(t["notfound"].format(s=ctx.args[0][:20]))
    ch = float(d["priceChangePercent"])
    await update.effective_message.reply_text(
        t["price_fmt"].format(
            s=s, p=fmt_price(float(d["lastPrice"])), ch=("🟢 " if ch >= 0 else "🔴 ") + f"{ch:+.2f}%",
            hi=fmt_price(float(d["highPrice"])), lo=fmt_price(float(d["lowPrice"])),
            vol=core.fmt_big(d["quoteVolume"])), parse_mode=ParseMode.HTML)


async def cmd_top(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    if throttled(ctx, "top", 3.0):
        return await update.effective_message.reply_text(t["wait"])
    text = await top_text(ctx.application.bot_data["client"], t)
    await update.effective_message.reply_text(text, parse_mode=ParseMode.HTML)


def pick_market(symbol):
    return "futures" if (not ALL["futures"] or symbol in ALL["futures"]) else "spot"


def parse_sym_tf(ctx, default_tf):
    if not ctx.args:
        return None, None
    sym = norm_symbol(ctx.args[0])
    tf = ctx.args[1].lower() if len(ctx.args) > 1 else default_tf
    if tf not in TF_LIST:
        tf = default_tf
    return sym, tf


async def cmd_markets(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    if throttled(ctx, "mkts", 3.0):
        return await update.effective_message.reply_text(t["wait"])
    await update.effective_message.reply_text(await markets_text(ctx.application.bot_data["client"], t),
                                              parse_mode=ParseMode.HTML)


async def cmd_corr(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    sym, tf = parse_sym_tf(ctx, "1h")
    if not sym:
        return await update.effective_message.reply_text(t["corr_usage"], parse_mode=ParseMode.HTML)
    if throttled(ctx, "corr", 3.0):
        return await update.effective_message.reply_text(t["wait"])
    client, m = ctx.application.bot_data["client"], pick_market(sym)
    try:
        a = await fetch_klines(client, m, sym, tf, 120)
        btc = core.corr_rows(a, await fetch_klines(client, m, "BTCUSDT", tf, 120))
        eth = core.corr_rows(a, await fetch_klines(client, m, "ETHUSDT", tf, 120))
    except Exception as e:
        log.warning("corr hatası %s: %s", sym, e)
        return await update.effective_message.reply_text(t["notfound"].format(s=ctx.args[0][:20]))
    if btc is None or eth is None:
        return await update.effective_message.reply_text(t["corr_none"])
    await update.effective_message.reply_text(
        t["corr_res"].format(s=sym, tf=tf, btc=f"{btc:+.2f}", bl=t["corr_" + core.corr_label(btc)],
                             eth=f"{eth:+.2f}", el=t["corr_" + core.corr_label(eth)], n=50) + "\n\n" + t["disc"],
        parse_mode=ParseMode.HTML)


async def cmd_explain(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    sym, tf = parse_sym_tf(ctx, "1h")
    if not sym:
        return await update.effective_message.reply_text(t["ex_usage"], parse_mode=ParseMode.HTML)
    if throttled(ctx, "explain", 3.0):
        return await update.effective_message.reply_text(t["wait"])
    client, m = ctx.application.bot_data["client"], pick_market(sym)
    try:
        data = await fetch_klines(client, m, sym, tf)
        sig = core.analyze(data, m, force=True)
        if not sig:
            raise ValueError("analiz yok")
        sig.update(symbol=sym, tf=tf)
        sig["corr"] = None
        if sym != "BTCUSDT":
            try:
                sig["corr"] = core.corr_rows(data, await btc_rows(client, m, tf))
            except Exception:
                pass
    except Exception as e:
        log.warning("explain hatası %s: %s", sym, e)
        return await update.effective_message.reply_text(t["notfound"].format(s=ctx.args[0][:20]))
    exp_text = render_explain(u["lang"], sig)
    if u["chart"]:
        try:
            png = charts.render_chart(data, sig)
            if len(exp_text) <= 1024:
                return await update.effective_message.reply_photo(io.BytesIO(png), caption=exp_text, parse_mode=ParseMode.HTML)
            else:
                await update.effective_message.reply_photo(io.BytesIO(png))
        except Exception:
            log.exception("explain grafiği")
    await update.effective_message.reply_text(exp_text, parse_mode=ParseMode.HTML)


async def cmd_backup(update, ctx):
    if not ADMIN_ID or update.effective_user.id != ADMIN_ID:
        return
    path = os.path.join(tempfile.gettempdir(), f"elena-backup-{int(time.time())}.db")
    try:
        dst = sqlite3.connect(path)
        db.backup(dst)
        dst.close()
        with open(path, "rb") as f:
            await update.effective_message.reply_document(f, filename="bot-backup.db")
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


async def cmd_calc(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    if len(ctx.args) != 4:
        return await update.effective_message.reply_text(t["calc_usage"], parse_mode=ParseMode.HTML)
    try:
        bal, pct, entry, stop = (float(a.replace(",", ".")) for a in ctx.args)
    except ValueError:
        return await update.effective_message.reply_text(t["calc_bad"])
    r = core.calc_position(bal, pct, entry, stop)
    if not r:
        return await update.effective_message.reply_text(t["calc_bad"])
    await update.effective_message.reply_text(
        t["calc_result"].format(risk=f"{r['risk']:.2f}", pct=f"{pct:g}", dist=f"{r['dist']:.2f}",
                                size=f"{r['size']:,.2f}".replace(",", " "), qty=f"{r['qty']:.6g}",
                                lev=f"{r['lev']:.1f}"), parse_mode=ParseMode.HTML)


async def cmd_test(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    sig = core.sample_signal()
    await update.effective_message.reply_text(t["test_sent"])
    await update.effective_message.reply_text(
        render_signal(u["lang"], sig, min(sig["lev"], u["max_lev"]), u["tz"]), parse_mode=ParseMode.HTML)


async def cmd_history(update, ctx):
    u = await gated(update)
    if u:
        await show(update, history_text(u), back_kb(u["lang"]))


async def cmd_stats(update, ctx):
    u = await gated(update)
    if u:
        await show(update, perf_text(u, 30), perf_kb(u, 30))


async def cmd_open(update, ctx):
    u = await gated(update)
    if u:
        await show(update, open_text(u), back_kb(u["lang"]))


async def cmd_alert(update, ctx):
    u = await gated(update)
    if not u:
        return
    t, cid = tx(u["lang"]), u["chat_id"]
    reply = update.effective_message.reply_text
    if len(ctx.args) != 2:
        return await reply(t["al_usage"], parse_mode=ParseMode.HTML)
    sym = norm_symbol(ctx.args[0])
    try:
        target = float(ctx.args[1].replace(",", "."))
    except ValueError:
        target = float("nan")
    known = ALL["futures"] | ALL["spot"]
    if not sym or not math.isfinite(target) or target <= 0 or (known and sym not in known):
        return await reply(t["al_bad"])
    if db.execute("SELECT COUNT(*) FROM alerts WHERE chat_id=?", (cid,)).fetchone()[0] >= MAX_ALERTS:
        return await reply(t["al_limit"].format(n=MAX_ALERTS))
    d = await fetch_ticker(ctx.application.bot_data["client"], sym)
    if not d:
        return await reply(t["al_bad"])
    price = float(d["lastPrice"])
    if target == price:
        return await reply(t["al_now"])
    direction = "above" if target > price else "below"
    db.execute("INSERT INTO alerts(chat_id,symbol,direction,price,created) VALUES(?,?,?,?,?)",
               (cid, sym, direction, target, int(time.time())))
    db.commit()
    await reply(t["al_set"].format(s=sym, d="≥" if direction == "above" else "≤", p=fmt_price(target)),
                parse_mode=ParseMode.HTML)


async def cmd_alerts(update, ctx):
    u = await gated(update)
    if u:
        text, kb = alerts_view(u)
        await show(update, text, kb)


async def cmd_backtest(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    reply = update.effective_message.reply_text
    if not ctx.args or len(ctx.args) > 2:
        return await reply(t["bt_usage"], parse_mode=ParseMode.HTML)
    tf = ctx.args[1] if len(ctx.args) == 2 else "1h"
    sym = norm_symbol(ctx.args[0])
    if not sym or tf not in TF_SEC:
        return await reply(t["bt_usage"], parse_mode=ParseMode.HTML)
    if throttled(ctx, "bt", 8.0):
        return await reply(t["wait"])
    market = "futures" if (not ALL["futures"] or sym in ALL["futures"]) else ("spot" if sym in ALL["spot"] else None)
    if not market:
        return await reply(t["notfound"].format(s=ctx.args[0][:20]))
    try:
        rows = await fetch_klines(ctx.application.bot_data["client"], market, sym, tf, 1000)
    except Exception as e:
        log.warning("backtest verisi alınamadı: %s", e)
        return await reply(t["err"])
    bt = core.backtest(rows, market)
    if not bt["rs"]:
        return await reply(t["bt_none"])
    res = core.summarize(bt["rs"])
    text = (t["bt_head"].format(s=sym, tf=tf, c=len(rows)) + "\n\n" +
            t["bt_sum"].format(n=res["n"], win=f"{res['win']:.0f}", w=res["w"], l=res["l"],
                               avg=f"{res['avg']:+.2f}", tot=f"{res['tot']:+.2f}", pf=core.pf_str(res),
                               dd=f"{bt['dd']:.2f}") + "\n\n" + t["bt_note"])
    await reply(text, parse_mode=ParseMode.HTML)


async def cmd_admin(update, ctx):
    if not ADMIN_ID or update.effective_user.id != ADMIN_ID:
        return
    total = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    act = db.execute("SELECT COUNT(*) FROM users WHERE accepted=1 AND active=1").fetchone()[0]
    sig = db.execute("SELECT COUNT(*) FROM signals WHERE ts>?", (int(time.time()) - 86400,)).fetchone()[0]
    op = db.execute("SELECT COUNT(*) FROM signals WHERE status=?", (core.OPEN_STATUS,)).fetchone()[0]
    al = db.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
    url = get_miniapp_url() or DEFAULT_MINIAPP_URL
    admin_url = build_miniapp_web_url("admin.html")
    kb = M([[B("👑 Yönetim Terminalini Aç", web_app=WebAppInfo(url=admin_url))]])
    await update.effective_message.reply_text(
        f"👑 <b>{BRAND} · Yönetici Konsolu</b>\n\n"
        f"👥 Toplam Üye: <b>{total}</b>\n"
        f"✅ Aktif Üye: <b>{act}</b>\n"
        f"📨 Son 24s Sinyal: <b>{sig}</b>\n"
        f"⏳ Açık Pozisyon: <b>{op}</b>\n"
        f"🔔 Kurulu Alarmlar: <b>{al}</b>\n\n"
        f"🌐 <b>Web Admin Paneli:</b>\n<code>{admin_url}</code>",
        parse_mode="HTML",
        reply_markup=kb)


async def cmd_broadcast(update, ctx):
    if not ADMIN_ID or update.effective_user.id != ADMIN_ID or not ctx.args:
        return
    text = HEAD + "\n\n" + " ".join(ctx.args)
    ids = [r[0] for r in db.execute("SELECT chat_id FROM users WHERE accepted=1 AND active=1")]
    for cid in ids:
        await send(ctx.application, cid, text)
    await update.effective_message.reply_text(f"✅ {len(ids)} kişiye gönderildi")


async def cmd_glossary(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    terms = t.get("glossary_terms", {})
    if ctx.args:
        key = ctx.args[0].lower().strip()
        if key in terms:
            await update.effective_message.reply_text(terms[key], parse_mode=ParseMode.HTML)
        else:
            await update.effective_message.reply_text(
                t.get("glossary_notfound", "Term not found: {term}").format(term=ctx.args[0][:30]),
                parse_mode=ParseMode.HTML)
        return
    head = t.get("glossary_head", "📖 Glossary\n\n")
    cats = ["long", "short", "sl", "tp", "leverage", "r", "supertrend", "mavilimw", "ema",
            "rsi", "macd", "adx", "bollinger", "atr", "vwap", "stochrsi", "funding", "openinterest"]
    lines = [head]
    for k in cats:
        if k in terms:
            lines.append(terms[k])
            lines.append("")
    text = "\n".join(lines).strip()
    if len(text) > 4000:
        text = text[:3950] + "\n..."
    await update.effective_message.reply_text(text, parse_mode=ParseMode.HTML, link_preview_options=LPO)


async def cmd_matrix(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    if throttled(ctx, "matrix", 3.0):
        return await update.effective_message.reply_text(t["wait"])
    coins = user_set("coins", "symbol", u["chat_id"])
    tfs = user_set("tfs", "tf", u["chat_id"])
    if not coins or not tfs:
        return await update.effective_message.reply_text(t.get("matrix_empty", "No data."))
    c_list = list(coins)
    t_list = list(tfs)
    rows = db.execute(
        "SELECT symbol, tf, side, status FROM signals "
        "WHERE symbol IN ({}) AND tf IN ({}) ORDER BY ts DESC".format(
            ",".join("?" * len(c_list)), ",".join("?" * len(t_list))),
        c_list + t_list).fetchall()
    last_sig = {}
    for r in rows:
        key = (r["symbol"], r["tf"])
        if key not in last_sig:
            last_sig[key] = r
    market = u["market"] if u["market"] != "both" else "futures"
    head = t.get("matrix_head", "🔲 Signal Matrix · {market}\n🕒 Updated: {ts}\n\n").format(
        market=market.upper(), ts=local_time(int(time.time()), u["tz"]))
    lines = [head]
    tfs_sorted = [x for x in TF_LIST if x in tfs]
    tf_header = "       " + " ".join(f"{x:>4}" for x in tfs_sorted)
    lines.append(f"<code>{tf_header}</code>")
    for sym in sorted(coins)[:15]:
        cells = []
        for tf in tfs_sorted:
            sig = last_sig.get((sym, tf))
            if not sig:
                cells.append(" ⬜")
            elif sig["status"] == core.OPEN_STATUS:
                cells.append(" ⏳")
            elif sig["side"] in ("LONG", "BUY"):
                cells.append(" 🟢")
            else:
                cells.append(" 🔴")
        sym_short = sym.replace("USDT", "")[:6]
        lines.append(f"<code>{sym_short:<6}{''.join(cells)}</code>")
    lines.append(t.get("matrix_legend", ""))
    await update.effective_message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML, link_preview_options=LPO)


async def cmd_mtf(update, ctx):
    u = await gated(update)
    if not u:
        return
    t = tx(u["lang"])
    sym, _ = parse_sym_tf(ctx, "1h")
    if not sym:
        return await update.effective_message.reply_text(t.get("mtf_usage", "Usage: /mtf BTC"), parse_mode=ParseMode.HTML)
    if throttled(ctx, "mtf", 3.0):
        return await update.effective_message.reply_text(t["wait"])
    market = "futures" if (not ALL["futures"] or sym in ALL["futures"]) else "spot"
    head = t.get("mtf_head", "📊 Multi-TF: {sym} · {market}\n\n").format(sym=sym, market=market.upper())
    rows = db.execute(
        "SELECT tf, side, status, score, entry FROM signals WHERE symbol=? ORDER BY ts DESC LIMIT 50",
        (sym,)).fetchall()
    last_per_tf = {}
    for r in rows:
        if r["tf"] not in last_per_tf:
            last_per_tf[r["tf"]] = r
    if not last_per_tf:
        return await update.effective_message.reply_text(
            t.get("mtf_empty", "No signal history found for {sym}.").format(sym=sym), parse_mode=ParseMode.HTML)
    lines = [head]
    for tf in TF_LIST:
        sig = last_per_tf.get(tf)
        if not sig:
            continue
        icon = "🟢" if sig["side"] in ("LONG", "BUY") else "🔴"
        status = "⏳" if sig["status"] == core.OPEN_STATUS else "✅"
        score_stars = "⭐" * min(5, max(1, (sig["score"] or 0) // 2))
        lines.append(f"{icon} <b>{tf}</b> · {sig['side']} · {status} {score_stars}")
    await update.effective_message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML, link_preview_options=LPO)


async def cmd_ban(update, ctx):
    if not private(update) or not ADMIN_ID or update.effective_user.id != ADMIN_ID:
        return
    if not ctx.args:
        return await update.effective_message.reply_text(
            "Kullanım: /ban <chat_id> [gün] [sebep]\nÖrn: /ban 123456789 7 spam\n0 gün = kalıcı ban")
    try:
        target = int(ctx.args[0])
    except ValueError:
        return await update.effective_message.reply_text("Geçersiz chat_id")
    days = int(ctx.args[1]) if len(ctx.args) > 1 and ctx.args[1].isdigit() else 0
    reason = " ".join(ctx.args[2:]) if len(ctx.args) > 2 else ""
    until = int(time.time()) + days * 86400 if days > 0 else None
    db.execute("UPDATE users SET banned=1 WHERE chat_id=?", (target,))
    db.execute("INSERT INTO bans(chat_id, reason, banned_at, banned_until) VALUES(?,?,?,?) "
               "ON CONFLICT(chat_id) DO UPDATE SET reason=excluded.reason, banned_at=excluded.banned_at, banned_until=excluded.banned_until",
               (target, reason, int(time.time()), until))
    db.commit()
    u_target = get_user(target)
    if u_target:
        t = tx(u_target["lang"])
        import datetime
        until_str = datetime.datetime.fromtimestamp(until).strftime("%d.%m.%Y") if until else t.get("ban_perm", "kalıcı")
        try:
            await ctx.bot.send_message(target, t.get("ban_msg", "⛔ Hesabınız askıya alındı.").format(reason=reason, until=until_str), parse_mode=ParseMode.HTML)
        except Exception:
            pass
    await update.effective_message.reply_text(f"✅ Kullanıcı {target} yasaklandı (gün={days}, sebep={reason or '-'})")


async def cmd_unban(update, ctx):
    if not private(update) or not ADMIN_ID or update.effective_user.id != ADMIN_ID:
        return
    if not ctx.args:
        return await update.effective_message.reply_text("Kullanım: /unban <chat_id>")
    try:
        target = int(ctx.args[0])
    except ValueError:
        return await update.effective_message.reply_text("Geçersiz chat_id")
    db.execute("UPDATE users SET banned=0 WHERE chat_id=?", (target,))
    db.execute("DELETE FROM bans WHERE chat_id=?", (target,))
    db.commit()
    await update.effective_message.reply_text(f"✅ Kullanıcı {target}'ın yasağı kaldırıldı")


# ---------------------------------------------------------------- butonlar
async def on_button(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    if not q.message:
        return
    cid = q.message.chat.id
    p = q.data.split(":")
    u = get_user(cid)
    if p[0] == "L":
        code = p[1]
        if code == "pick":
            return await show(update, HEAD + "\n\n🌐 <b>Choose your language / Выберите язык / Dil seçiniz:</b>", lang_kb())
        if code not in T:
            return
        ensure_user(cid, lang=code)
        set_field(cid, "lang", code)
        u = get_user(cid)
        try:
            bot_obj = update.get_bot() if hasattr(update, "get_bot") else ctx.bot
            if bot_obj:
                await ensure_menu_button(bot_obj, chat_id=cid, lang=code)
        except Exception:
            pass
        return await (show_menu(update, cid) if u["accepted"] else terms_flow(update, u))
    if not u:
        return await show(update, HEAD + "\n\n" + T["en"]["pick_lang"], lang_kb())
    lang = u["lang"]
    t = tx(lang)
    if p[0] == "A":
        if p[1] == "yes":
            set_field(cid, "accepted", 1)
            set_field(cid, "accepted_at", int(time.time()))
            set_field(cid, "active", 1)
            try:
                bot_obj = update.get_bot() if hasattr(update, "get_bot") else ctx.bot
                if bot_obj:
                    await ensure_menu_button(bot_obj, chat_id=cid, lang=lang)
            except Exception:
                pass
            return await show_menu(update, cid)
        set_field(cid, "accepted", 0)
        return await show(update, t["declined"])
    if not u["accepted"]:
        return await terms_flow(update, u)

    if p[0] == "M":
        page = p[1]
        if page == "menu":
            return await show_menu(update, cid)
        if page == "tfs":
            text, kb = tfs_view(u)
            return await show(update, text, kb)
        if page == "market":
            rows = [[B(("✅ " if u["market"] == m else "") + t["mkt_" + m], callback_data=f"K:{m}")]
                    for m in ("futures", "spot", "both")]
            return await show(update, t["market_head"], M(rows + [[B(t["b_back"], callback_data="M:menu")]]))
        if page == "lev":
            row = [B(("✅ " if u["max_lev"] == x else "") + f"{x}x", callback_data=f"V:{x}")
                   for x in (3, 5, 10, 20, 50, 100)]
            return await show(update, t["lev_head"], M([row, [B(t["b_back"], callback_data="M:menu")]]))
        if page == "quiet":
            text, kb = quiet_view(u)
            return await show(update, text, kb)
        if page == "lang":
            return await show(update, T["en"]["pick_lang"], lang_kb())
        if page == "donate":
            return await show(update, t["donate"], donate_kb(t))
        if page == "help":
            return await show(update, help_text(t), back_kb(lang))
        if page == "terms":
            return await show(update, t["terms"], back_kb(lang))
        if page == "calc":
            return await show(update, t["calc_usage"], back_kb(lang))
        if page == "hist":
            return await show(update, history_text(u), back_kb(lang))
        if page == "perf":
            return await show(update, perf_text(u, 30), perf_kb(u, 30))
        if page == "open":
            return await show(update, open_text(u), back_kb(lang))
        if page == "alerts":
            text, kb = alerts_view(u)
            return await show(update, text, kb)
        if page == "data":
            if throttled(ctx, "data", 2.0):
                return
            text = await top_text(ctx.application.bot_data["client"], t)
            return await show(update, t["data_head"] + "\n\n" + text,
                              M([[B("🔄", callback_data="M:data")], [B(t["b_back"], callback_data="M:menu")]]))
        if page == "disp":
            text, kb = disp_view(u)
            return await show(update, text, kb)
        if page == "mkts":
            if throttled(ctx, "mkts", 2.0):
                return
            text = await markets_text(ctx.application.bot_data["client"], t)
            return await show(update, text, M([[B("🔄", callback_data="M:mkts")],
                                               [B(t["b_back"], callback_data="M:menu")]]))
        if page == "delete":
            return await show(update, t["delete_ask"], M([[B(t["delete_yes"], callback_data="D:yes"),
                                                           B(t["delete_no"], callback_data="M:menu")]]))
    elif p[0] == "C":
        if p[1] == "t":
            have = user_set("coins", "symbol", cid)
            if p[2] not in have and len(have) >= MAX_COINS:
                return await q.answer(t["limit"].format(n=MAX_COINS), show_alert=True)
            toggle("coins", "symbol", cid, p[2])
            page = int(p[3])
        else:
            page = int(p[2])
        text, kb = coins_view(get_user(cid), page)
        return await show(update, text, kb)
    elif p[0] == "T" and p[1] in TF_LIST:
        toggle("tfs", "tf", cid, p[1])
        text, kb = tfs_view(u)
        return await show(update, text, kb)
    elif p[0] == "K" and p[1] in ("futures", "spot", "both"):
        set_field(cid, "market", p[1])
        return await show_menu(update, cid)
    elif p[0] == "V" and p[1].isdigit():
        set_field(cid, "max_lev", min(int(p[1]), 125))
        return await show_menu(update, cid)
    elif p[0] == "S":
        set_field(cid, "strong_only", 0 if u["strong_only"] else 1)
        return await show_menu(update, cid)
    elif p[0] == "N":
        set_field(cid, "notify_track", 0 if u["notify_track"] else 1)
        return await show_menu(update, cid)
    elif p[0] == "G" and p[1] in ("c", "k"):
        field = "chart" if p[1] == "c" else "compact"
        set_field(cid, field, 0 if u[field] else 1)
        text, kb = disp_view(get_user(cid))
        return await show(update, text, kb)
    elif p[0] == "P":
        set_field(cid, "active", 0 if u["active"] else 1)
        return await show_menu(update, cid)
    elif p[0] == "R" and p[1] in ("7", "30", "0"):
        scope = p[2] if len(p) > 2 and p[2] in ("all", "mine") else "all"
        return await show(update, perf_text(u, int(p[1]), scope), perf_kb(u, int(p[1]), scope))
    elif p[0] == "X" and p[1].isdigit():
        db.execute("DELETE FROM alerts WHERE id=? AND chat_id=?", (int(p[1]), cid))
        db.commit()
        text, kb = alerts_view(u)
        return await show(update, text, kb)
    elif p[0] == "Q" and p[1].isdigit() and (int(p[1]) == 0 or int(p[1]) in core.QUIET):
        set_field(cid, "quiet", int(p[1]))
    elif p[0] == "Z" and p[1] in ("+", "-", "0"):
        if p[1] != "0":
            set_field(cid, "tz", max(-12, min(14, u["tz"] + (1 if p[1] == "+" else -1))))
    elif p[0] == "D" and p[1] == "yes":
        delete_user(cid)
        return await show(update, t["deleted"])
    else:
        return
    if p[0] in ("Q", "Z"):  # sessiz saat sayfasını yenile
        text, kb = quiet_view(get_user(cid))
        return await show(update, text, kb)


async def on_error(update, ctx: ContextTypes.DEFAULT_TYPE):
    err = ctx.error
    if isinstance(err, (NetworkError, Conflict)):
        log.warning("ağ/çakışma hatası: %s", err)  # genelde geçici veya iki bot aynı anda açık
        return
    log.error("Beklenmeyen hata", exc_info=err)
    try:
        if isinstance(update, Update) and update.effective_chat:
            u = get_user(update.effective_chat.id)
            await ctx.bot.send_message(update.effective_chat.id, tx(u["lang"] if u else "en")["err"])
    except Exception:
        pass


# ---------------------------------------------------------------- başlatma
def spawn(coro):
    task = asyncio.create_task(coro)
    BG.add(task)
    task.add_done_callback(BG.discard)


async def post_init(app: Application):
    client = httpx.AsyncClient(timeout=20, headers={"User-Agent": "elena-signals/3.0"})
    app.bot_data["client"] = client
    await load_universe(client)
    try:  # Telegram sol alt / slash komut listesini sadeleştir (Sadece start & terminal)
        for lang in [None] + LANGS:
            t = T[lang or "en"]
            terminal_desc = {
                "ru": "Открыть терминал Elena (Mini App)",
                "tr": "Elena Terminalini Aç (Mini App)",
                "en": "Launch Elena Terminal (Mini App)",
                "uk": "Відкрити термінал Elena (Mini App)"
            }.get(lang, "Launch Elena Terminal (Mini App)")
            lang_desc = {
                "ru": "🌐 Выбрать язык / Change language",
                "tr": "🌐 Dili değiştir / Change language",
                "en": "🌐 Change language / Выбрать язык",
                "uk": "🌐 Змінити мову / Change language"
            }.get(lang, "🌐 Change language")
            terms_desc = {
                "ru": "⚖️ Условия и правовые нормы",
                "tr": "⚖️ Kullanım şartları ve yasal bildirim",
                "en": "⚖️ Terms & Regulatory Disclaimers",
                "uk": "⚖️ Умови та правила"
            }.get(lang, "⚖️ Terms & Regulatory Disclaimers")
            privacy_desc = {
                "ru": "🛡️ Политика конфиденциальности",
                "tr": "🛡️ Gizlilik politikası",
                "en": "🛡️ Privacy Policy",
                "uk": "🛡️ Політика конфіденційності"
            }.get(lang, "🛡️ Privacy Policy")
            cmds = [
                BotCommand("start", "Start / Başlat 🚀"),
                BotCommand("terminal", terminal_desc),
                BotCommand("lang", lang_desc),
                BotCommand("terms", terms_desc),
                BotCommand("privacy", privacy_desc)
            ]
            await app.bot.set_my_commands(cmds, language_code=lang)
            # BotFather üzerinden ayarladığınız bot açıklaması ve hakkında yazısını ezmemesi için kapatıldı.
    except TelegramError as e:
        log.warning("komut/açıklama ayarlanamadı: %s", e)
    spawn(scanner(app))
    spawn(tracker(app))
    spawn(alert_loop(app))
    spawn(broadcast_loop(app))
    spawn(tunnel_watcher_loop(app))
    try:
        import miniapp  # aiohttp'ye bağlı; kurulu değilse bot yine de çalışmaya devam eder
        app.bot_data["miniapp_runner"] = await miniapp.start_miniapp(sys.modules[__name__], ADMIN_ID or None)

        # Güncel tünel URL'sini .miniapp_url veya .env'den çek
        global MINIAPP_URL
        if os.path.exists(".miniapp_url"):
            try:
                cached_url = open(".miniapp_url", encoding="utf-8").read().strip()
                if cached_url.startswith("https://"):
                    MINIAPP_URL = cached_url
            except Exception:
                pass

        live_init_tunnel = get_live_api_tunnel()
        if live_init_tunnel:
            spawn(publish_live_tunnel(live_init_tunnel))

        if MINIAPP_URL:
            log.info("mini app: %s/index.html (oto-bot) · %s/admin.html (yönetim, sadece admin)",
                     MINIAPP_URL, MINIAPP_URL)
            # Sol alttaki Telegram Menü Butonunu hem genel hem de admin için bağla
            await ensure_menu_button(app)
            if ADMIN_ID:
                await ensure_menu_button(app, chat_id=ADMIN_ID)
            log.info("Telegram Menü Butonu bağlandı: %s/index.html", MINIAPP_URL)

            # Yöneticiye açılış linklerini Telegram'dan otomatik ilet
            if ADMIN_ID:
                try:
                    admin_msg = (
                        f"🚀 <b>{BRAND} Başlatıldı!</b>\n\n"
                        f"🌐 <b>Mini App (Kalıcı Adres):</b>\n<code>{MINIAPP_URL}/index.html</code>\n\n"
                        f"📜 <b>Gizlilik Politikası (Privacy Policy):</b>\n<code>{MINIAPP_URL}/privacy.html</code>\n\n"
                        f"⚖️ <b>Kullanım Şartları (Terms):</b>\n<code>{MINIAPP_URL}/terms.html</code>\n\n"
                        f"✅ <i>Sol alttaki Menü butonuna dokunarak paneli doğrudan açabilirsiniz.</i>"
                    )
                    await app.bot.send_message(chat_id=ADMIN_ID, text=admin_msg, parse_mode="HTML")
                except Exception as e:
                    log.warning("Admin başlangıç bildirimi gönderilemedi: %s", e)
        else:
            log.warning("MINIAPP_URL .env'de boş — mini app sunucu 127.0.0.1:8080'de çalışıyor ama menüde buton "
                        "görünmeyecek. cloudflared ile https adres alıp .env'e MINIAPP_URL olarak ekle.")
    except ImportError:
        log.warning("aiohttp kurulu değil (pip install -r requirements.txt) — mini app devre dışı, bot normal çalışıyor")
    except Exception:
        log.exception("mini app sunucusu başlatılamadı (bot normal çalışmaya devam ediyor)")
    log.info("%s botu çalışıyor", BRAND)


async def tunnel_watcher_loop(app: Application):
    """Cloudflare tüneli koptuğunda veya yeni link aldığında menü butonunu ve bildirimleri otomatik günceller."""
    last_known_tunnel = get_live_api_tunnel()
    if last_known_tunnel:
        spawn(publish_live_tunnel(last_known_tunnel))
    counter = 0
    while True:
        await asyncio.sleep(10)
        counter += 1
        current_tunnel = get_live_api_tunnel()
        # Tünel değiştiyse veya her 2 dakikada bir (counter % 12 == 0) ntfy kanalına heartbeat gönder
        tunnel_changed = bool(current_tunnel and current_tunnel != last_known_tunnel)
        if tunnel_changed or (counter % 12 == 0 and current_tunnel):
            if current_tunnel != last_known_tunnel:
                log.info("Yeni tünel linki algılandı: %s (önceki: %s)", current_tunnel, last_known_tunnel)
            last_known_tunnel = current_tunnel
            spawn(publish_live_tunnel(current_tunnel))
            try:
                await ensure_menu_button(app)
                if ADMIN_ID:
                    await ensure_menu_button(app, chat_id=ADMIN_ID)
                    if not tunnel_changed:
                        continue
                    live_tunnel = get_live_api_tunnel()
                    app_url = build_miniapp_web_url("index.html")
                    admin_url = build_miniapp_web_url("admin.html")
                    privacy_url = build_miniapp_web_url("privacy.html")
                    terms_url = build_miniapp_web_url("terms.html")
                    webhook_url = f"{live_tunnel}/api/webhook/tradingview" if live_tunnel else "Tünel aktif değil"
                    notice = (
                        f"🔄 <b>Елена Хьюз · Tünel & Mini App Linkleri Senkronize Edildi!</b>\n\n"
                        f"🌐 <b>Mini App (Kalıcı CDN):</b>\n<code>{app_url}</code>\n\n"
                        f"⚙️ <b>Admin Terminali:</b>\n<code>{admin_url}</code>\n\n"
                        f"📜 <b>Gizlilik Politikası (Privacy Policy):</b>\n<code>{privacy_url}</code>\n\n"
                        f"⚖️ <b>Kullanım Şartları (Terms of Service):</b>\n<code>{terms_url}</code>\n\n"
                        f"📡 <b>TradingView Webhook:</b>\n<code>{webhook_url}</code>\n\n"
                        f"✅ <i>Telegram Menü Butonu ve komut butonları GitHub Pages CDN üzerinden kesintisiz çalışmaya başladı!</i>\n"
                        f"💡 <i>Admin paneline erişmek için /admin komutunu kullanabilir veya yukarıdaki Admin Terminali linkini açabilirsiniz.</i>"
                    )
                    kb = M([[B("👑 Yönetim Terminalini Aç", web_app=WebAppInfo(url=admin_url))]])
                    await app.bot.send_message(chat_id=ADMIN_ID, text=notice, parse_mode="HTML", reply_markup=kb)
            except Exception as e:
                log.warning("Tünel yenileme senkronizasyon hatası: %s", e)


async def broadcast_loop(app: Application):
    """Mini app admin panelinden gelen yayın kuyruğunu işler."""
    while True:
        await asyncio.sleep(4)
        if BROADCAST_QUEUE:
            msg = BROADCAST_QUEUE.pop(0)
            text = HEAD + "\n\n" + msg
            ids = [r[0] for r in db.execute("SELECT chat_id FROM users WHERE accepted=1 AND active=1")]
            for cid in ids:
                await send(app, cid, text)
                await asyncio.sleep(0.05)


async def post_shutdown(app: Application):
    await app.bot_data["client"].aclose()
    runner = app.bot_data.get("miniapp_runner")
    if runner:
        await runner.cleanup()


def main():
    if not TOKEN:
        sys.exit("BOT_TOKEN yok. .env dosyasına BOT_TOKEN=... yaz (README'ye bak).")
    init_db()
    from telegram.request import HTTPXRequest
    req = HTTPXRequest(connect_timeout=30.0, read_timeout=30.0, write_timeout=30.0, pool_timeout=30.0)
    app = Application.builder().token(TOKEN).request(req).post_init(post_init).post_shutdown(post_shutdown).build()
    handlers = (("start", cmd_start), ("menu", cmd_menu), ("help", cmd_help), ("coins", cmd_coins),
                ("tfs", cmd_tfs), ("lang", cmd_lang), ("donate", cmd_donate), ("terms", cmd_terms), ("privacy", cmd_privacy), ("terminal", cmd_menu), ("app", cmd_menu),
                ("delete", cmd_delete), ("add", cmd_add), ("remove", cmd_remove), ("price", cmd_price),
                ("top", cmd_top), ("calc", cmd_calc), ("test", cmd_test), ("history", cmd_history),
                ("stats", cmd_stats), ("open", cmd_open), ("alert", cmd_alert), ("alerts", cmd_alerts),
                ("backtest", cmd_backtest), ("admin", cmd_admin), ("broadcast", cmd_broadcast),
                ("corr", cmd_corr), ("explain", cmd_explain), ("markets", cmd_markets),
                ("backup", cmd_backup), ("glossary", cmd_glossary), ("matrix", cmd_matrix),
                ("mtf", cmd_mtf), ("ban", cmd_ban), ("unban", cmd_unban))
    for name, fn in handlers:
        app.add_handler(CommandHandler(name, fn))
    app.add_handler(CallbackQueryHandler(on_button))
    app.add_error_handler(on_error)
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
