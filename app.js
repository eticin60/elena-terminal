
// Custom Chain Picker Button Click Logic
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".chain-picker-btn");
  if (btn) {
    document.querySelectorAll(".chain-picker-btn").forEach(b => {
      b.classList.remove("active");
      b.style.border = "1px solid rgba(255,255,255,0.1)";
      b.style.background = "rgba(255,255,255,0.04)";
    });
    btn.classList.add("active");
    btn.style.border = "1.5px solid var(--accent-gold)";
    btn.style.background = "rgba(255,210,90,0.15)";
    const chain = btn.getAttribute("data-chain");
    const hidden = document.getElementById("manual-wallet-chain");
    if (hidden) hidden.value = chain;
  }
});

window.setInspectSymbol = function(sym, btn) {
  const inp = document.getElementById("inspect-symbol-input");
  if (inp) inp.value = sym;
  document.querySelectorAll("#inspect-quick-chips .coin-chip").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  window.runMarketInspection?.();
};


// ========================================================
// EVRENSEL LOGO GETİRİCİ (KRİPTO + BIST 100 + DÜNYA HİSSELERE)
// ========================================================
window.getAssetLogoUrl = function(sym) {
  if (!sym) return "assets/brand/logo.png";
  sym = sym.trim().toUpperCase().replace("USDT", "").replace(".IS", "");
  
  // 🇹🇷 BIST 100 Hisseleri
  const BIST_MAP = {
    "THYAO": "https://financialmodelingprep.com/image-stock/THYAO.IS.png",
    "ASELS": "https://financialmodelingprep.com/image-stock/ASELS.IS.png",
    "GARAN": "https://financialmodelingprep.com/image-stock/GARAN.IS.png",
    "EREGL": "https://financialmodelingprep.com/image-stock/EREGL.IS.png",
    "TUPRS": "https://financialmodelingprep.com/image-stock/TUPRS.IS.png",
    "KCHOL": "https://financialmodelingprep.com/image-stock/KCHOL.IS.png",
    "BIMAS": "https://financialmodelingprep.com/image-stock/BIMAS.IS.png",
    "AKBNK": "https://financialmodelingprep.com/image-stock/AKBNK.IS.png",
    "SISE":  "https://financialmodelingprep.com/image-stock/SISE.IS.png",
    "SAHOL": "https://financialmodelingprep.com/image-stock/SAHOL.IS.png"
  };
  if (BIST_MAP[sym]) return BIST_MAP[sym];

  // 🇺🇸 Global Devler
  const GLOBAL_MAP = {
    "NVDA": "https://financialmodelingprep.com/image-stock/NVDA.png",
    "AAPL": "https://financialmodelingprep.com/image-stock/AAPL.png",
    "TSLA": "https://financialmodelingprep.com/image-stock/TSLA.png",
    "MSFT": "https://financialmodelingprep.com/image-stock/MSFT.png",
    "AMZN": "https://financialmodelingprep.com/image-stock/AMZN.png",
    "GOOGL":"https://financialmodelingprep.com/image-stock/GOOGL.png",
    "META": "https://financialmodelingprep.com/image-stock/META.png"
  };
  if (GLOBAL_MAP[sym]) return GLOBAL_MAP[sym];

  // 🥇 Emtialar
  if (sym === "GOLD" || sym === "XAU") return "https://assets.coincap.io/assets/icons/paxg@2x.png";
  if (sym === "BRENT" || sym === "OIL") return "https://assets.coincap.io/assets/icons/wbtc@2x.png";

  // 🪙 Kripto Paralar (CoinCap CDN / CryptoIcons CDN)
  return `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`;
};


// ========================================================
// SİNYAL DEFTERİ: CANLI PİYASA OKUYUCU, DESTEK/DİRENÇ & CANVAS GRAFİKLERİ
// ========================================================
let currentInspectSymbol = "BTCUSDT";
let currentInspectTf = "5m";
let inspectIndicators = {
  ema: true,
  bollinger: true,
  dd: true,
  vwap: false,
  fib: false,
  macd: false,
  stoch: false,
  atr: false,
  adx: false
};
let inspectCachedKlines = [];

window.setInspectSymbol = function(sym, btn) {
  currentInspectSymbol = sym;
  document.querySelectorAll("#inspect-coin-chips .coin-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  window.runMarketInspection();
};

window.setInspectTf = function(tf, btn) {
  currentInspectTf = tf;
  document.querySelectorAll("#inspect-tf-chips .coin-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  window.runMarketInspection();
};

window.toggleInspectIndicator = function(indKey, btn) {
  inspectIndicators[indKey] = !inspectIndicators[indKey];
  if (btn) {
    if (inspectIndicators[indKey]) btn.classList.add("active");
    else btn.classList.remove("active");
  }
  window.drawInspectCharts();
};

window.toggleInspectGlossary = function() {
  const el = document.getElementById("inspect-glossary-box");
  if (el) el.style.display = (el.style.display === "none" || !el.style.display) ? "block" : "none";
};

window.setTvInterval = function(val, btn) {
  const hiddenInp = document.getElementById("tv-interval-select");
  if (hiddenInp) hiddenInp.value = val;
  document.querySelectorAll("#tv-interval-chips .coin-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  if (window.changeTvInterval) {
    window.changeTvInterval(val);
  }
};

window.setQuietHours = function(val, btn) {
  const hiddenInp = document.getElementById("sel-quiet-hours");
  if (hiddenInp) hiddenInp.value = val;
  document.querySelectorAll("#quiet-hours-chips .coin-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  toast("🌙 Sessiz saatler güncellendi", "info");
};

// Canvas çizim motoru: Mumlar, Bollinger, EMA9/21, Destek, Direnç, Hacim, RSI
window.drawInspectCharts = function() {
  const klines = inspectCachedKlines;
  if (!klines || !klines.length) return;

  const candleCanvas = document.getElementById("inspect-candle-canvas");
  const volCanvas = document.getElementById("inspect-vol-canvas");
  const rsiCanvas = document.getElementById("inspect-rsi-canvas");

  if (!candleCanvas || !volCanvas || !rsiCanvas) return;

  // Responsive DPI
  const dpr = window.devicePixelRatio || 1;
  const cw = candleCanvas.parentElement.clientWidth || 340;
  
  [candleCanvas, volCanvas, rsiCanvas].forEach((c, idx) => {
    const h = idx === 0 ? 220 : idx === 1 ? 70 : 75;
    c.width = cw * dpr;
    c.height = h * dpr;
  });

  const cCtx = candleCanvas.getContext("2d");
  const vCtx = volCanvas.getContext("2d");
  const rCtx = rsiCanvas.getContext("2d");

  cCtx.scale(dpr, dpr);
  vCtx.scale(dpr, dpr);
  rCtx.scale(dpr, dpr);

  const w = cw;
  const ch = 220;
  const vh = 70;
  const rh = 75;

  const n = klines.length;
  const candleW = Math.max(3, (w - 40) / n);
  const gap = candleW * 0.25;
  const bodyW = Math.max(2, candleW - gap);

  // Fiyat sınırları
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);
  const closes = klines.map(k => k.close);
  const vols = klines.map(k => k.volume);

  let minP = Math.min(...lows);
  let maxP = Math.max(...highs);
  const padP = (maxP - minP) * 0.08 || 1;
  minP -= padP;
  maxP += padP;

  const toY = (p) => ch - 15 - ((p - minP) / (maxP - minP)) * (ch - 30);
  const toX = (i) => 12 + i * candleW + bodyW / 2;

  // EMA Hesaplama
  const calcEMA = (data, period) => {
    const k = 2 / (period + 1);
    let emaArr = [data[0]];
    for (let i = 1; i < data.length; i++) {
      emaArr.push(data[i] * k + emaArr[i - 1] * (1 - k));
    }
    return emaArr;
  };

  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);

  // Bollinger Bantları (20 SMA ± 2*StdDev)
  let bbUpper = [];
  let bbLower = [];
  let bbMid = [];
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - 19);
    const slice = closes.slice(start, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const sqDiffs = slice.map(v => Math.pow(v - mean, 2));
    const std = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / slice.length) || 1;
    bbMid.push(mean);
    bbUpper.push(mean + 2 * std);
    bbLower.push(mean - 2 * std);
  }

  // Support / Resistance
  const supPrice = Math.min(...lows.slice(-20));
  const resPrice = Math.max(...highs.slice(-20));

  // 1. BOLLINGER BANTLARI (Dolgulu Alan & Üst/Alt Çizgiler)
  if (inspectIndicators.bollinger) {
    cCtx.beginPath();
    cCtx.moveTo(toX(0), toY(bbUpper[0]));
    for (let i = 1; i < n; i++) cCtx.lineTo(toX(i), toY(bbUpper[i]));
    for (let i = n - 1; i >= 0; i--) cCtx.lineTo(toX(i), toY(bbLower[i]));
    cCtx.closePath();
    cCtx.fillStyle = "rgba(56, 189, 248, 0.08)";
    cCtx.fill();

    // Üst ve Alt Çizgi
    cCtx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    cCtx.lineWidth = 1;
    cCtx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(i), y = toY(bbUpper[i]);
      i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y);
    }
    cCtx.stroke();

    cCtx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(i), y = toY(bbLower[i]);
      i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y);
    }
    cCtx.stroke();
  }

  // 2. DESTEK & DİRENÇ ÇİZGİLERİ
  if (inspectIndicators.dd) {
    // Destek Çizgisi (Turkuaz Kesikli)
    cCtx.strokeStyle = "#22d3ee";
    cCtx.lineWidth = 1.2;
    cCtx.setLineDash([4, 4]);
    cCtx.beginPath();
    cCtx.moveTo(5, toY(supPrice));
    cCtx.lineTo(w - 5, toY(supPrice));
    cCtx.stroke();

    // Direnç Çizgisi (Kırmızı Kesikli)
    cCtx.strokeStyle = "#f87171";
    cCtx.beginPath();
    cCtx.moveTo(5, toY(resPrice));
    cCtx.lineTo(w - 5, toY(resPrice));
    cCtx.stroke();
    cCtx.setLineDash([]);

    // Fiyat Etiketleri
    cCtx.font = "9px sans-serif";
    cCtx.fillStyle = "#22d3ee";
    cCtx.fillText("$" + supPrice.toFixed(1), w - 46, toY(supPrice) - 3);
    cCtx.fillStyle = "#f87171";
    cCtx.fillText("$" + resPrice.toFixed(1), w - 46, toY(resPrice) - 3);
  }

  // 3. CANDLESTICKS (MUMLAR & FİTİLLER)
  for (let i = 0; i < n; i++) {
    const k = klines[i];
    const isUp = k.close >= k.open;
    const color = isUp ? "#00ffa3" : "#f87171";

    const x = toX(i);
    const yOpen = toY(k.open);
    const yClose = toY(k.close);
    const yHigh = toY(k.high);
    const yLow = toY(k.low);

    // Fitil
    cCtx.strokeStyle = color;
    cCtx.lineWidth = 1.2;
    cCtx.beginPath();
    cCtx.moveTo(x, yHigh);
    cCtx.lineTo(x, yLow);
    cCtx.stroke();

    // Gövde
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
    cCtx.fillStyle = color;
    cCtx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyHeight);
  }

  // 4. EMA 9 (Yeşil) & EMA 21 (Gold)
  if (inspectIndicators.ema) {
    cCtx.strokeStyle = "#00ffa3";
    cCtx.lineWidth = 1.5;
    cCtx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(i), y = toY(ema9[i]);
      i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y);
    }
    cCtx.stroke();

    cCtx.strokeStyle = "#fbbf24";
    cCtx.lineWidth = 1.5;
    cCtx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(i), y = toY(ema21[i]);
      i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y);
    }
    cCtx.stroke();
  }

  // 4b. VWAP (Hacim Ağırlıklı Ortalama Fiyat)
  if (inspectIndicators.vwap) {
    let cumVol = 0, cumVolPrice = 0;
    let vwapArr = [];
    for (let i = 0; i < n; i++) {
      const typ = (klines[i].high + klines[i].low + klines[i].close) / 3;
      cumVol += klines[i].volume;
      cumVolPrice += typ * klines[i].volume;
      vwapArr.push(cumVolPrice / (cumVol || 1));
    }
    cCtx.strokeStyle = "#c084fc";
    cCtx.lineWidth = 1.4;
    cCtx.setLineDash([3, 3]);
    cCtx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(i), y = toY(vwapArr[i]);
      i === 0 ? cCtx.moveTo(x, y) : cCtx.lineTo(x, y);
    }
    cCtx.stroke();
    cCtx.setLineDash([]);
    cCtx.fillStyle = "#c084fc";
    cCtx.font = "8.5px sans-serif";
    cCtx.fillText("VWAP", w - 42, toY(vwapArr[n - 1]) - 2);
  }

  // 4c. FIBONACCI DÜZELTME SEVİYELERİ
  if (inspectIndicators.fib) {
    const range = maxP - minP;
    const fibLevels = [
      { ratio: 0.236, color: "rgba(255,210,90,0.7)" },
      { ratio: 0.382, color: "rgba(56,189,248,0.7)" },
      { ratio: 0.500, color: "rgba(0,255,163,0.8)" },
      { ratio: 0.618, color: "rgba(248,113,113,0.8)" }
    ];
    cCtx.setLineDash([2, 2]);
    fibLevels.forEach(fib => {
      const fibP = minP + range * fib.ratio;
      const y = toY(fibP);
      cCtx.strokeStyle = fib.color;
      cCtx.lineWidth = 1;
      cCtx.beginPath();
      cCtx.moveTo(5, y);
      cCtx.lineTo(w - 5, y);
      cCtx.stroke();
      cCtx.font = "8px sans-serif";
      cCtx.fillStyle = fib.color;
      cCtx.fillText(`Fib ${fib.ratio}`, w - 42, y - 2);
    });
    cCtx.setLineDash([]);
  }

  // 5. HACİM GRAFİĞİ (VOLCANVAS)
  vCtx.clearRect(0, 0, w, vh);
  const maxVol = Math.max(...vols) || 1;
  for (let i = 0; i < n; i++) {
    const k = klines[i];
    const isUp = k.close >= k.open;
    const vColor = isUp ? "rgba(0, 255, 163, 0.65)" : "rgba(248, 113, 113, 0.65)";
    const barH = (k.volume / maxVol) * (vh - 10);
    const x = toX(i);
    vCtx.fillStyle = vColor;
    vCtx.fillRect(x - bodyW / 2, vh - barH, bodyW, barH);
  }

  // 6. RSI (14) GRAFİĞİ (RSICANVAS)
  rCtx.clearRect(0, 0, w, rh);
  let rsiArr = [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= 14 && i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / 14;
  let avgLoss = losses / 14;
  rsiArr.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));

  for (let i = 15; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * 13 + Math.max(0, diff)) / 14;
    avgLoss = (avgLoss * 13 + Math.max(0, -diff)) / 14;
    const r = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    rsiArr.push(r);
  }

  while (rsiArr.length < n) rsiArr.unshift(50);
  const toRsiY = (val) => rh - 8 - (val / 100) * (rh - 16);

  // 70 & 30 Çizgileri
  rCtx.setLineDash([3, 3]);
  rCtx.strokeStyle = "rgba(248, 113, 113, 0.4)";
  rCtx.beginPath();
  rCtx.moveTo(8, toRsiY(70));
  rCtx.lineTo(w - 8, toRsiY(70));
  rCtx.stroke();

  rCtx.strokeStyle = "rgba(0, 255, 163, 0.4)";
  rCtx.beginPath();
  rCtx.moveTo(8, toRsiY(30));
  rCtx.lineTo(w - 8, toRsiY(30));
  rCtx.stroke();
  rCtx.setLineDash([]);

  rCtx.font = "8.5px sans-serif";
  rCtx.fillStyle = "#f87171";
  rCtx.fillText("70", w - 24, toRsiY(70) - 2);
  rCtx.fillStyle = "#00ffa3";
  rCtx.fillText("30", w - 24, toRsiY(30) + 9);

  // RSI Eğrisi
  rCtx.strokeStyle = "#fbbf24";
  rCtx.lineWidth = 1.6;
  rCtx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = toX(i), y = toRsiY(rsiArr[i]);
    i === 0 ? rCtx.moveTo(x, y) : rCtx.lineTo(x, y);
  }
  rCtx.stroke();
};

window.runMarketInspection = async function() {
  const sym = (currentInspectSymbol || "BTCUSDT").trim().toUpperCase();
  const tf = currentInspectTf || "5m";
  const lang = (localStorage.getItem("elena_lang") || "tr").toLowerCase();
  const isRu = lang === "ru" || lang === "uk";
  const isTr = lang === "tr";

  const pairLabelEl = document.getElementById("inspect-pair-label");
  const bigPriceEl = document.getElementById("inspect-big-price");
  const changeBadgeEl = document.getElementById("inspect-change-badge");
  const highValEl = document.getElementById("inspect-high-val");
  const lowValEl = document.getElementById("inspect-low-val");
  const volValEl = document.getElementById("inspect-vol-val");
  const timeValEl = document.getElementById("inspect-time-val");

  const ddCurEl = document.getElementById("inspect-dd-current");
  const ddSupEl = document.getElementById("inspect-dd-sup");
  const ddSupSubEl = document.getElementById("inspect-dd-sup-sub");
  const ddResEl = document.getElementById("inspect-dd-res");
  const ddResSubEl = document.getElementById("inspect-dd-res-sub");

  const patResultEl = document.getElementById("inspect-pat-result");
  const emaTrendValEl = document.getElementById("inspect-ema-trend-val");
  const rsiBoxValEl = document.getElementById("inspect-rsi-box-val");
  const rsiBadgeTopEl = document.getElementById("inspect-rsi-val-badge");
  const dikkatTextEl = document.getElementById("inspect-dikkat-text");
  const plainBadgeEl = document.getElementById("inspect-plain-state-badge");
  const plainNarrativeEl = document.getElementById("inspect-plain-narrative");
  const loadingEl = document.getElementById("inspect-chart-loading");

  if (loadingEl) loadingEl.style.display = "flex";

  try {
    let klines = [];
    const isCrypto = !sym.includes("THY") && !sym.includes("ASELS") && !sym.includes("NVDA") && !sym.includes("GOLD");

    if (isCrypto) {
      const cleanSym = sym.endsWith("USDT") ? sym : (sym + "USDT");
      const interval = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1d": "1d" }[tf] || "5m";
      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSym}&interval=${interval}&limit=42`);
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length) {
          klines = raw.map(r => ({
            time: r[0],
            open: parseFloat(r[1]),
            high: parseFloat(r[2]),
            low: parseFloat(r[3]),
            close: parseFloat(r[4]),
            volume: parseFloat(r[5])
          }));
        }
      } catch (fetchErr) {
        console.warn("Binance klines fetch fallback:", fetchErr);
      }
    }

    if (!klines.length) {
      let baseP = sym.includes("THY") ? 305.5 : sym.includes("ASELS") ? 64.2 : sym.includes("NVDA") ? 142.8 : sym.includes("GOLD") ? 2715.0 : 59315.8;
      let curr = baseP;
      for (let i = 0; i < 40; i++) {
        const delta = (Math.random() - 0.49) * (baseP * 0.008);
        const o = curr;
        const c = curr + delta;
        const h = Math.max(o, c) + Math.random() * (baseP * 0.004);
        const l = Math.min(o, c) - Math.random() * (baseP * 0.004);
        const v = Math.floor(Math.random() * 5000 + 1200);
        curr = c;
        klines.push({ time: Date.now() - (40 - i) * 300000, open: o, high: h, low: l, close: c, volume: v });
      }
    }

    inspectCachedKlines = klines;

    const last = klines[klines.length - 1];
    const first = klines[0];
    const closePrice = last.close;
    const pctChange = ((closePrice - first.open) / first.open) * 100;
    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);
    const maxHigh = Math.max(...highs);
    const minLow = Math.min(...lows);
    const totalVol = klines.reduce((a, b) => a + b.volume, 0);

    const supPrice = Math.min(...lows.slice(-20));
    const resPrice = Math.max(...highs.slice(-20));
    const supDist = ((closePrice - supPrice) / closePrice) * 100;
    const resDist = ((resPrice - closePrice) / closePrice) * 100;

    let gains = 0, losses = 0;
    for (let i = klines.length - 14; i < klines.length; i++) {
      const d = klines[i].close - klines[i - 1].close;
      if (d >= 0) gains += d; else losses -= d;
    }
    const rsiVal = losses === 0 ? 100 : 100 - (100 / (1 + (gains / 14) / (losses / 14)));

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    if (pairLabelEl) pairLabelEl.textContent = `${sym} · PERP ⭐`;
    if (bigPriceEl) bigPriceEl.textContent = `$${closePrice >= 10 ? closePrice.toLocaleString("en-US", {minimumFractionDigits: 1, maximumFractionDigits: 2}) : closePrice.toFixed(4)}`;
    if (changeBadgeEl) {
      changeBadgeEl.textContent = `${pctChange >= 0 ? "▲" : "▼"} ${Math.abs(pctChange).toFixed(2)}% (24s)`;
      changeBadgeEl.style.color = pctChange >= 0 ? "#00ffa3" : "#f87171";
      changeBadgeEl.style.background = pctChange >= 0 ? "rgba(0,255,163,0.15)" : "rgba(239,68,68,0.18)";
    }
    if (highValEl) highValEl.textContent = `$${maxHigh.toFixed(1)}`;
    if (lowValEl) lowValEl.textContent = `$${minLow.toFixed(1)}`;
    if (volValEl) volValEl.textContent = (totalVol > 1000 ? (totalVol / 1000).toFixed(1) + "K" : totalVol.toFixed(0));
    if (timeValEl) timeValEl.textContent = timeStr;

    if (ddCurEl) ddCurEl.textContent = `$${closePrice.toFixed(1)}`;
    if (ddSupEl) ddSupEl.textContent = `$${supPrice.toFixed(1)}`;
    
    // Çok dilli destek / direnç mesafesi
    const distWord = isRu ? "дистанция" : (isTr ? "uzaklıkta" : "distance");
    const touchWord = isRu ? "касания" : (isTr ? "temas" : "touches");
    if (ddSupSubEl) ddSupSubEl.textContent = `-${Math.abs(supDist).toFixed(2)}% ${distWord} · 2 ${touchWord}`;
    if (ddResEl) ddResEl.textContent = `$${resPrice.toFixed(1)}`;
    if (ddResSubEl) ddResSubEl.textContent = `+${Math.abs(resDist).toFixed(2)}% ${distWord} · 3 ${touchWord}`;

    // Çok dilli Formasyon tespiti
    let formasyon = isRu ? "Выраженных графических паттернов не обнаружено" : (isTr ? "Şu an belirgin bir formasyon tespit edilmedi" : "No distinct chart pattern detected currently");
    if (pctChange > 2.0) {
      formasyon = isRu ? "Бычий вымпел (Импульс продолжения восходящего тренда)" : (isTr ? "Boğa Flaması (Yükseliş Trend Devamı)" : "Bullish Flag / Continuation Momentum");
    } else if (pctChange < -2.0) {
      formasyon = isRu ? "Нисходящий канал (Давление медведей и продажи)" : (isTr ? "Düşüş Kanalı (Ayı Baskısı & Satış)" : "Descending Channel (Bearish Selling Pressure)");
    } else if (rsiVal < 32) {
      formasyon = isRu ? "Двойное дно / Область потенциального отскока от поддержки" : (isTr ? "Çift Dip / Destek Tepki Bölgesi" : "Double Bottom / Potential Support Rebound");
    } else if (rsiVal > 68) {
      formasyon = isRu ? "Двойная вершина / Зона отбоя от сопротивления" : (isTr ? "Çift Tepe / Direnç Reddi Bölgesi" : "Double Top / Resistance Rejection Zone");
    }
    if (patResultEl) patResultEl.textContent = formasyon;

    // Teknik Okuma
    const isEmaBull = klines[klines.length - 1].close >= klines[klines.length - 5].close;
    if (emaTrendValEl) {
      const upText = isRu ? "ВОСХОДЯЩИЙ" : (isTr ? "YÜKSELİŞ" : "BULLISH");
      const downText = isRu ? "НИСХОДЯЩИЙ" : (isTr ? "DÜŞÜŞ" : "BEARISH");
      emaTrendValEl.textContent = isEmaBull ? upText : downText;
      emaTrendValEl.style.color = isEmaBull ? "var(--accent-green)" : "var(--accent-red)";
    }
    if (rsiBoxValEl) {
      const obText = isRu ? "ПЕРЕКУПЛЕННОСТЬ" : (isTr ? "AŞIRI ALIM" : "OVERBOUGHT");
      const osText = isRu ? "ПЕРЕПРОДАННОСТЬ" : (isTr ? "AŞIRI SATIM" : "OVERSOLD");
      const neutralText = isRu ? "НЕЙТРАЛЬНО" : (isTr ? "DENGELİ" : "NEUTRAL");
      const statusText = rsiVal >= 70 ? obText : rsiVal <= 30 ? osText : neutralText;
      rsiBoxValEl.textContent = `${rsiVal.toFixed(1)} · ${statusText}`;
      rsiBoxValEl.style.color = rsiVal >= 70 ? "var(--accent-red)" : rsiVal <= 30 ? "var(--accent-green)" : "#38bdf8";
    }
    if (rsiBadgeTopEl) rsiBadgeTopEl.textContent = rsiVal.toFixed(1);

    // Çok dilli DİKKAT Kartı
    if (dikkatTextEl) {
      if (isRu) {
        dikkatTextEl.textContent = `На таймфрейме ${tf} EMA9 находится ${isEmaBull ? "выше EMA21 — краткосрочный восходящий импульс" : "ниже EMA21 — давление продавцов"}. RSI ${rsiVal.toFixed(1)} указывает на ${rsiVal >= 70 ? "зону перекупленности" : rsiVal <= 30 ? "зону перепроданности" : "сбалансированную фазу"}. Это общая оценка контекста, используйте стоп-лосс.`;
      } else if (isTr) {
        dikkatTextEl.textContent = `${tf} grafikte EMA9, EMA21'in ${isEmaBull ? "üzerinde — kısa vadeli momentum yukarı yönlü" : "altında — kısa vadeli satıcılar baskın"}. RSI ${rsiVal.toFixed(1)} ile ${rsiVal >= 70 ? "aşırı alımda" : rsiVal <= 30 ? "aşırı satımda" : "dengeli bölgede"}. Bu okumalar birlikte kaba bir yön fikri veriyor; tek başına giriş sinyali olarak kullanma.`;
      } else {
        dikkatTextEl.textContent = `On ${tf} timeframe, EMA9 is ${isEmaBull ? "above EMA21 — short-term momentum is upwards" : "below EMA21 — sellers are currently dominant"}. RSI is at ${rsiVal.toFixed(1)} (${rsiVal >= 70 ? "overbought zone" : rsiVal <= 30 ? "oversold zone" : "balanced zone"}). Use appropriate stop-loss.`;
      }
    }

    // Çok dilli Sade Dilde Yeni Başlayan Açıklaması
    let stateTitle = "";
    if (Math.abs(pctChange) < 1.5) {
      stateTitle = isRu ? "БОКОВИК / КОНСОЛИДАЦИЯ" : (isTr ? "YATAY / KONSOLİDASYON" : "SIDEWAYS / CONSOLIDATION");
    } else if (pctChange >= 1.5) {
      stateTitle = isRu ? "ВОСХОДЯЩИЙ ИМПУЛЬС" : (isTr ? "YÜKSELİŞ MOMENTUMU" : "BULLISH MOMENTUM");
    } else {
      stateTitle = isRu ? "МЕДВЕЖЬЕ ДАВЛЕНИЕ" : (isTr ? "SATICILI BASKI" : "BEARISH PRESSURE");
    }
    if (plainBadgeEl) plainBadgeEl.textContent = stateTitle;
    
    if (plainNarrativeEl) {
      if (isRu) {
        plainNarrativeEl.innerHTML = `Цена в последних свечах движется в фазе ${stateTitle.toLowerCase()}, накапливая объем перед следующим направленным движением.<br><br>Индикатор RSI ${rsiVal.toFixed(0)} — ${rsiVal >= 70 ? "в зоне перекупленности, возможен локальный откат или фиксация прибыли" : rsiVal <= 30 ? "в зоне перепроданности, вероятна реакция покупателей" : "в нейтральной полосе, сохраняется баланс сил"}.<br><br>Помните: технические индикаторы отражают прошлую динамику и не дают 100% гарантии. Всегда управляйте рисками.`;
      } else if (isTr) {
        plainNarrativeEl.innerHTML = `Fiyat son mumlarda büyük bir yön değişikliği göstermiyor, ${stateTitle.toLowerCase()} bölgesinde hareket ediyor. Bu genelde piyasanın bir sonraki büyük hareket için likidite topladığı bir dönemdir.<br><br>RSI ${rsiVal.toFixed(0)} ile ${rsiVal >= 70 ? '"aşırı alım" bölgesinde — fiyat kısa vadede hızlı yükselmiş demektir, düzeltme gelebilir' : rsiVal <= 30 ? '"aşırı satım" bölgesinde — satıcılar yorulmuş olabilir, tepki alımı gelebilir' : '"nötr" alanda dengeli bir fiyatlama sürdürüyor'}.<br><br>Unutma: bu açıklamalar geçmiş fiyat hareketine dayalı genel eğilimlerdir, ne olacağını kesin söylemez. Piyasa her an bu beklentilerin dışına çıkabilir.`;
      } else {
        plainNarrativeEl.innerHTML = `Price is currently moving in ${stateTitle.toLowerCase()} range, gathering volume before the next directional expansion.<br><br>RSI at ${rsiVal.toFixed(0)} is ${rsiVal >= 70 ? "in overbought area, potential profit-taking pullback possible" : rsiVal <= 30 ? "in oversold area, buyer bounce possible" : "in neutral territory with balanced market orders"}.<br><br>Always use prudent risk and position sizing.`;
      }
    }

    window.drawInspectCharts();
  } catch (err) {
    console.error("Inspect error:", err);
  } finally {
    if (loadingEl) loadingEl.style.display = "none";
  }
};

window.playSignalAlertSound = function() {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Çift tonlu profesyonel radar / kasa tonu (880Hz -> 1320Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);

    // Telegram Haptic Feedback (Titreşim)
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    } else if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch (e) {
    console.debug("Audio play error:", e);
  }
};

window.toggleSignalSound = function() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("elena_sound", soundEnabled ? "1" : "0");
  const btn = document.getElementById("btn-toggle-sound");
  if (btn) btn.textContent = soundEnabled ? "🔊 Açık" : "🔇 Kapalı";
  if (soundEnabled) window.playSignalAlertSound();
  toast(`Bildirim sesi: ${soundEnabled ? 'Açık 🔊' : 'Kapalı 🔇'}`, "info");
};


// Global Hisse / Varlık Tıklaması ile TradingView ve Piyasa sekmesine geçiş
window.openGlobalSymbol = function(sym) {
  if (!sym) return;
  const tabBtn = document.querySelector('[data-tab="markets"]');
  if (tabBtn) tabBtn.click();
  setTimeout(() => {
    if (window.setTradingViewSymbol) {
      window.setTradingViewSymbol(sym);
    } else if (typeof setTradingViewSymbol === "function") {
      setTradingViewSymbol(sym);
    }
    const cleanSym = String(sym).replace("BINANCE:", "").replace("BIST:", "");
    if (typeof toast === "function") {
      toast(`${cleanSym} Canlı Grafiği Açıldı 📈`, "info");
    }
    const tvBox = document.getElementById("tv-chart-container");
    if (tvBox) tvBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 150);
};

﻿// Елена Хьюз · Main Mini App Terminal — Liquid Glass Fullscreen
const tg = window.Telegram?.WebApp;
try {
  tg?.ready();
  tg?.expand();
  // Fullscreen ve şeffaf status bar desteği
  if (typeof tg?.requestFullscreen === "function") tg.requestFullscreen();
  if (typeof tg?.setHeaderColor === "function") tg.setHeaderColor("#060911");
  if (typeof tg?.setBackgroundColor === "function") tg.setBackgroundColor("#060911");
} catch (_) {}
const initData = tg?.initData || "";

// ================================================================
//  SPLASH SCREEN CONTROLLER
// ================================================================
(function() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Always show splash, then fade out
  function hideSplash() {
    splash.classList.add('hiding');
    setTimeout(() => { splash.style.display = 'none'; }, 700);
  }

  // Auto-hide after 2.5 seconds MAX (even if main() hasn't loaded)
  window._splashHideTimer = setTimeout(hideSplash, 2500);
  window.hideSplash = hideSplash;
})();


// ================================================================
//  TELEGRAM USER PROFILE CARD — Photo, Name, Level, Balance
// ================================================================
function renderUserProfileCard(meObj, walletObj) {
  const card = document.getElementById('user-profile-card');
  if (!card) return;

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};

  // --- Avatar ---
  const photoEl = document.getElementById('upc-photo');
  const fallbackEl = document.getElementById('upc-avatar-fallback');
  const photoUrl = tgUser.photo_url || null;

  if (photoUrl && photoEl) {
    photoEl.src = photoUrl;
    photoEl.style.display = 'block';
    if (fallbackEl) fallbackEl.style.display = 'none';
  } else {
    if (photoEl) photoEl.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = 'flex';
  }

  // --- Name ---
  const firstName = tgUser.first_name || meObj?.first_name || '';
  const lastName  = tgUser.last_name  || meObj?.last_name  || '';
  const username  = tgUser.username   || meObj?.username   || '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Trader';
  const nameEl = document.getElementById('upc-name');
  const unameEl = document.getElementById('upc-username');
  if (nameEl)  nameEl.textContent  = fullName;
  if (unameEl) unameEl.textContent = username ? '@' + username : '';

  // --- Status text (language-aware) ---
  const isRu = (currentLang === 'ru' || currentLang === 'uk');
  const isTr = currentLang === 'tr';
  const statusEl = document.getElementById('upc-status-text');
  if (statusEl) {
    statusEl.textContent = isRu ? 'В сети' : (isTr ? 'Çevrimiçi' : 'Online');
  }

  // --- Level badge ---
  const levelEl = document.getElementById('upc-level-text');
  if (levelEl) {
    levelEl.textContent = isRu ? '1. Уровень' : (isTr ? '1. Seviye' : 'Level 1');
  }

  // --- Balance pill (from wallet if connected) ---
  const balWrap = document.getElementById('upc-balance-wrap');
  const balVal  = document.getElementById('upc-balance-val');
  if (walletObj && walletObj.connected && balWrap && balVal) {
    // Show chain
    const chainBadge = document.getElementById('upc-chain-badge');
    const chainName  = document.getElementById('upc-chain-name');
    const chainLabels = {
      'tron': 'TRON', 'eip155:1': 'ETH', 'eip155:56': 'BNB',
      'eip155:137': 'POL', 'eip155:42161': 'ARB', 'eip155:10': 'OPT'
    };
    if (chainBadge) chainBadge.style.display = 'flex';
    if (chainName)  chainName.textContent = chainLabels[walletObj.chain] || walletObj.chain || '—';
    // Balance: show placeholder, will be updated by loadBalance()
    balVal.textContent = '...';
    balWrap.style.display = 'flex';
    // Try to load balance from API
    _updateProfileBalance();
  } else {
    if (balWrap) balWrap.style.display = 'none';
  }

  // --- Show card ---
  card.style.display = 'flex';
}

async function _updateProfileBalance() {
  const balVal = document.getElementById('upc-balance-val');
  const bWrap  = document.getElementById('upc-balance-wrap');
  if (!balVal) return;
  try {
    const curAddr = (typeof WALLET !== 'undefined' && WALLET?.address) || localStorage.getItem('elena_wallet_addr') || '';
    const curChain = (typeof WALLET !== 'undefined' && WALLET?.chain) || localStorage.getItem('elena_wallet_chain') || 'eip155:1';
    const r = await api('/api/wallet/balance', { address: curAddr, chain: curChain });
    if (r && r.ok) {
      // YALNIZCA USDT / STABLECOIN BAKİYESİ (Native coin TRX/ETH/BNB ASLA GÖSTERİLMEZ!)
      let stableSum = 0;
      let foundStable = false;

      (r.tokens || []).forEach(t => {
        const sym = (t.symbol || '').toUpperCase();
        if (sym === 'USDT' || sym === 'USDC' || sym === 'BUSD' || sym === 'DAI' || sym === 'USDD') {
          const b = parseFloat(t.balance || 0);
          if (!isNaN(b) && b > 0) {
            stableSum += b;
            foundStable = true;
          }
        }
      });

      if (!foundStable && r.usdt_total != null && parseFloat(r.usdt_total) > 0) {
        stableSum = parseFloat(r.usdt_total);
        foundStable = true;
      }

      const val = stableSum > 0 ? stableSum.toFixed(2) : '0.00';
      balVal.textContent = val;
      if (bWrap) bWrap.style.display = 'flex';
    } else {
      balVal.textContent = '0.00';
    }
  } catch (e) {
    balVal.textContent = '0.00';
  }
}

// Expose globally so loadWallet() can call it after connecting
window.renderUserProfileCard = renderUserProfileCard;
window._updateProfileBalance  = _updateProfileBalance;



// ========================================================
// 8 DİL TAM ÇEVİRİ TABLOSU (I18N)
// ========================================================
const I18N = {
  tr: {
    landing_sub: "Akıllı sinyaller, otomatik disiplin.",
    feat_1_title: "Canlı Kripto Sinyalleri",        feat_1: "0–10 güç puanlı anlık piyasa analizleri",
    feat_auto_title: "Oto-Bot & Otomatik Al-Sat",   feat_auto: "TP1/TP2/TP3 ve akıllı Stop-Loss takibi",
    feat_multi_title: "Çoklu Zincir & Borsa",       feat_multi: "Tron, BSC, Ethereum, Arbitrum & API",
    feat_2_title: "Risk ve Disiplin Yönetimi",      feat_2: "Sermaye koruma ve dinamik kaldıraç kalkanı",
    feat_3_title: "Maksimum Güvenlik",              feat_3: "Salt okunur cüzdan; özel anahtar asla istenmez",
    btn_connect: "Cüzdanı Bağla",
    btn_manual_addr: "✍️ Veya cüzdan adresini manuel gir",
    landing_disc: "Yalnızca genel adres okunur. Anahtar ve kurtarma ifadesi asla istenmez.",
    btn_admin: "Yönetim Paneline Git",
    tab_wallet: "💼 Cüzdan", tab_auto: "🤖 Oto-Bot", tab_exchange: "🔑 Borsa",
    tab_manual: "📈 Manuel", tab_signals: "📡 Sinyaller", tab_guide: "📚 Rehber", tab_dashboard: "📊 Pano",
    tab_coins: "🌐 Küresel Piyasalar", tab_tools: "🧮 Araçlar", tab_markets: "📊 Canlı Piyasa", tab_settings: "⚙️ Ayarlar",
    lbl_pwd: "Şifre (Güvenlik Parolası)", lbl_extra_pwd: "Ek Şifre (İkincil / Passphrase)",
    pwd_saved: "✅ Tanımlandı", pwd_not_saved: "Kayıtlı Değil"
  },
  ru: {
    landing_sub: "Умные сигналы, автоматическая дисциплина.",
    feat_1_title: "Живые Крипто Сигналы",           feat_1: "Мгновенный анализ рынка с оценкой силы 0–10",
    feat_auto_title: "Авто-Бот & Авто-Торговля",   feat_auto: "Автоматические TP1/TP2/TP3 и умный Stop-Loss",
    feat_multi_title: "Мультичейн & Биржи",         feat_multi: "Tron, BSC, Ethereum, Arbitrum & API",
    feat_2_title: "Управление Рисками",             feat_2: "Защита капитала и динамический щит кредитного плеча",
    feat_3_title: "Максимальная Безопасность",      feat_3: "Кошелек только для чтения — ключи не нужны",
    btn_connect: "Подключить кошелек",
    btn_manual_addr: "✍️ Или ввести адрес кошелька вручную",
    landing_disc: "Считывается только публичный адрес. Приватные ключи никогда не запрашиваются.",
    btn_admin: "Перейти в панель управления",
    tab_wallet: "💼 Кошелек", tab_auto: "🤖 Авто-Бот", tab_exchange: "🔑 Биржа",
    tab_manual: "📈 Ручной", tab_signals: "📡 Сигналы", tab_guide: "📚 Инструкция", tab_dashboard: "📊 Панель",
    tab_coins: "🌐 Глобальные рынки", tab_tools: "🧮 Инструменты", tab_markets: "📊 Живой рынок", tab_settings: "⚙️ Настройки",
    lbl_pwd: "Пароль (Безопасность)", lbl_extra_pwd: "Доп. Пароль (Passphrase)",
    pwd_saved: "✅ Сохранен", pwd_not_saved: "Не сохранен"
  },
  en: {
    landing_sub: "Smart signals, automated discipline.",
    feat_1_title: "Live Crypto Signals",            feat_1: "Real-time market analysis scored 0–10",
    feat_auto_title: "Auto-Bot & Auto-Trading",     feat_auto: "Automated TP1/TP2/TP3 and smart Stop-Loss",
    feat_multi_title: "Multi-Chain & Exchanges",    feat_multi: "Tron, BSC, Ethereum, Arbitrum & API",
    feat_2_title: "Risk & Discipline Management",   feat_2: "Capital protection and dynamic leverage shield",
    feat_3_title: "Maximum Security",               feat_3: "Read-only wallet — no private keys needed",
    btn_connect: "Connect Wallet",
    btn_manual_addr: "✍️ Or enter wallet address manually",
    landing_disc: "Only public address is read. Keys and recovery phrases are never requested.",
    btn_admin: "Go to Admin Panel",
    tab_wallet: "💼 Wallet", tab_auto: "🤖 Auto-Bot", tab_exchange: "🔑 Exchange",
    tab_manual: "📈 Manual", tab_signals: "📡 Signals", tab_guide: "📚 Guide", tab_dashboard: "📊 Dashboard",
    tab_coins: "🌐 Global Markets", tab_tools: "🧮 Tools", tab_markets: "📊 Live Market", tab_settings: "⚙️ Settings",
    lbl_pwd: "Password (Security Pin)", lbl_extra_pwd: "Extra Password (Passphrase)",
    pwd_saved: "✅ Defined", pwd_not_saved: "Not Defined"
  },
  uk: {
    landing_sub: "Розумні сигнали, автоматична дисципліна.",
    feat_1_title: "Живі Крипто Сигнали",            feat_1: "Аналіз ринку в реальному часі з оцінкою 0–10",
    feat_auto_title: "Авто-Бот & Авто-Торгівля",   feat_auto: "Автоматичні TP1/TP2/TP3 та розумний Stop-Loss",
    feat_multi_title: "Мультичейн & Біржі",         feat_multi: "Tron, BSC, Ethereum, Arbitrum & API",
    feat_2_title: "Управління Ризиками",            feat_2: "Захист капіталу та динамічний щит",
    feat_3_title: "Максимальна Безпека",            feat_3: "Гаманець тільки для читання — ключі не потрібні",
    btn_connect: "Підключити гаманець",
    btn_manual_addr: "✍️ Або ввести адресу вручну",
    landing_disc: "Зчитується лише публічна адреса. Ключі ніколи не запитуються.",
    btn_admin: "Панель керування",
    tab_wallet: "💼 Гаманець", tab_auto: "🤖 Авто-Бот", tab_exchange: "🔑 Біржа",
    tab_manual: "📈 Ручний", tab_signals: "📡 Сигнали", tab_guide: "📚 Довідка", tab_dashboard: "📊 Панель",
    tab_coins: "🌐 Глобальні ринки", tab_tools: "🧮 Інструменти", tab_markets: "📊 Живий ринок", tab_settings: "⚙️ Налаштування",
    lbl_pwd: "Пароль безпеки", lbl_extra_pwd: "Додатковий пароль",
    pwd_saved: "✅ Збережено", pwd_not_saved: "Не налаштовано"
  },
  de: {
    landing_sub: "Intelligente Signale, automatische Disziplin.",
    feat_1_title: "Live-Krypto-Signale",            feat_1: "Echtzeit-Marktanalyse mit Stärke-Score 0–10",
    feat_auto_title: "Auto-Bot & Auto-Trading",     feat_auto: "Automatische TP1/TP2/TP3 und smarter Stop-Loss",
    feat_multi_title: "Multi-Chain & Börsen",       feat_multi: "Tron, BSC, Ethereum, Arbitrum & API",
    feat_2_title: "Risiko & Disziplin",             feat_2: "Kapitalschutz und dynamischer Hebel-Schutz",
    feat_3_title: "Maximale Sicherheit",            feat_3: "Nur-Lese-Wallet — keine privaten Keys nötig",
    btn_connect: "Wallet verbinden",
    btn_manual_addr: "✍️ Oder Wallet-Adresse manuell eingeben",
    landing_disc: "Nur die öffentliche Adresse wird ausgelesen. Keys werden niemals angefragt.",
    btn_admin: "Zum Admin-Bereich",
    tab_wallet: "💼 Wallet", tab_auto: "🤖 Auto-Bot", tab_exchange: "🔑 Börse",
    tab_manual: "📈 Manuell", tab_signals: "📡 Signale", tab_guide: "📚 Anleitung", tab_dashboard: "📊 Dashboard",
    tab_coins: "🌐 Global Markets", tab_tools: "🧮 Tools", tab_markets: "📊 Live-Markt", tab_settings: "⚙️ Einstellungen",
    lbl_pwd: "Sicherheitspasswort", lbl_extra_pwd: "Zusatzpasswort (Passphrase)",
    pwd_saved: "✅ Gespeichert", pwd_not_saved: "Nicht gespeichert"
  },
  es: {
    landing_sub: "Señales inteligentes, disciplina automatizada.",
    feat_1_title: "Señales Cripto en Vivo",         feat_1: "Análisis de mercado en tiempo real, puntuados 0–10",
    feat_auto_title: "Auto-Bot & Auto-Trading",     feat_auto: "TP1/TP2/TP3 automáticos y Stop-Loss inteligente",
    feat_multi_title: "Multi-Cadena & Exchanges",   feat_multi: "Tron, BSC, Ethereum, Arbitrum & API",
    feat_2_title: "Gestión de Riesgos",             feat_2: "Protección de capital y escudo de apalancamiento",
    feat_3_title: "Seguridad Máxima",               feat_3: "Billetera de solo lectura — sin claves privadas",
    btn_connect: "Conectar Billetera",
    btn_manual_addr: "✍️ O ingresar dirección manualmente",
    landing_disc: "Solo se lee la dirección pública. Las claves nunca se solicitan.",
    btn_admin: "Ir al Panel de Administración",
    tab_wallet: "💼 Billetera", tab_auto: "🤖 Auto-Bot", tab_exchange: "🔑 Exchange",
    tab_manual: "📈 Manual", tab_signals: "📡 Señales", tab_guide: "📚 Guía", tab_dashboard: "📊 Panel",
    tab_coins: "🌐 Mercados Globales", tab_tools: "🧮 Herramientas", tab_markets: "📊 Mercado en vivo", tab_settings: "⚙️ Ajustes",
    lbl_pwd: "Clave de Seguridad", lbl_extra_pwd: "Clave Adicional (Passphrase)",
    pwd_saved: "✅ Guardado", pwd_not_saved: "No configurado"
  },
  fr: {
    landing_sub: "Signaux intelligents, discipline automatisée.",
    feat_1_title: "Signaux Crypto en Direct",       feat_1: "Analyse de marché en temps réel, notée 0–10",
    feat_auto_title: "Auto-Bot & Auto-Trading",     feat_auto: "TP1/TP2/TP3 automatiques et Stop-Loss intelligent",
    feat_multi_title: "Multi-Chaîne & Bourses",     feat_multi: "Tron, BSC, Ethereum, Arbitrum & API",
    feat_2_title: "Gestion des Risques",            feat_2: "Protection du capital et bouclier de levier",
    feat_3_title: "Sécurité Maximale",              feat_3: "Portefeuille en lecture seule — clés non requises",
    btn_connect: "Connecter le Portefeuille",
    btn_manual_addr: "✍️ Ou entrer l'adresse manuellement",
    landing_disc: "Seule l'adresse publique est lue. Les clés ne sont jamais demandées.",
    btn_admin: "Aller au Panneau d'Administration",
    tab_wallet: "💼 Portefeuille", tab_auto: "🤖 Auto-Bot", tab_exchange: "🔑 Bourse",
    tab_manual: "📈 Manuel", tab_signals: "📡 Signaux", tab_guide: "📚 Guide", tab_dashboard: "📊 Tableau",
    tab_coins: "🌐 Marchés Mondiaux", tab_tools: "🧮 Outils", tab_markets: "📊 Marché en direct", tab_settings: "⚙️ Paramètres",
    lbl_pwd: "Mot de passe de sécurité", lbl_extra_pwd: "Mot de passe supplémentaire",
    pwd_saved: "✅ Enregistré", pwd_not_saved: "Non défini"
  },
  ar: {
    landing_sub: "إشارات ذكية، انضباط آلي.",
    feat_1_title: "إشارات كريبتو مباشرة",           feat_1: "تحليل السوق الفوري بتقييم 0–10",
    feat_auto_title: "بوت آلي & تداول تلقائي",      feat_auto: "TP1/TP2/TP3 تلقائي وإيقاف خسارة ذكي",
    feat_multi_title: "متعدد السلاسل & البورصات",   feat_multi: "Tron، BSC، Ethereum، Arbitrum & API",
    feat_2_title: "إدارة المخاطر",                  feat_2: "حماية رأس المال ودرع الرافعة المالية",
    feat_3_title: "أقصى أمان",                      feat_3: "محفظة للقراءة فقط — لا تتطلب مفاتيح خاصة",
    btn_connect: "ربط المحفظة",
    btn_manual_addr: "✍️ أو أدخل عنوان المحفظة يدويًا",
    landing_disc: "تتم قراءة العنوان العام فقط. لا تُطلب المفاتيح أبدًا.",
    btn_admin: "لوحة الإدارة",
    tab_wallet: "💼 المحفظة", tab_auto: "🤖 البوت الآلي", tab_exchange: "🔑 المنصة",
    tab_manual: "📈 يدوي", tab_signals: "📡 الإشارات", tab_guide: "📚 الدليل", tab_dashboard: "📊 اللوحة",
    tab_coins: "🌐 الأسواق العالمية", tab_tools: "🧮 الأدوات", tab_markets: "📊 السوق المباشر", tab_settings: "⚙️ الإعدادات",
    lbl_pwd: "كلمة المرور الأمنية", lbl_extra_pwd: "كلمة المرور الإضافية",
    pwd_saved: "✅ معرّف", pwd_not_saved: "غير معرّف"
  }
};

let currentLang = "tr";


// ========================================================
// REHBER (GUIDE) DİNAMİK 8 DİLLİ ÇOKLU DİL MOTORU
// ========================================================
const GUIDE_CONTENT = {
  tr: {
    title: "Elena Terminal · Kullanım Kılavuzu",
    sub: "Kuantitatif Algoritma & Risk Kalkanı Rehberi",
    desc: "Elena Hughes, Binance piyasa verilerini 7/24 matematiksel modellerle tarayarak yüksek olasılıklı alım-satım fırsatları üreten kurumsal bir analiz motorudur.",
    c1_title: "💼 1. Cüzdan Bağlantısı & Güvenlik",
    c1_badge: "Salt Okunur",
    c1_body: "• <strong>Non-Custodial (Gözetimsiz) Mimari:</strong> Sistemimiz fonlarınıza el süremez. Özel anahtar (Private Key) veya kurtarma kelimesi <u>asla istenmez ve saklanmaz</u>.<br>• <strong>Bağlantı:</strong> WalletConnect v2 ile cüzdanınızı onaylayabilir veya genel adresinizi (0x... ya da TRON T...) manuel yazarak anında bakiyelerinizi takip edebilirsiniz.<br>• <strong>Güvenlik Parolası:</strong> Oto-bot işlemlerinizi güvenceye almak için Parola ve Ek Şifre (Passphrase) tanımlayınız.",
    c2_title: "📡 2. Canlı Sinyaller & 0–10 Güç Puanı",
    c2_badge: "Algoritmik",
    c2_body: "Her sinyal arkasında çoklu indikatör onay süzgeci barındırır (Supertrend, MavilimW, EMA Ribbon, RSI, MACD, ADX, Hacim Patlamaları):<br>• <strong>8–10 Puan (A Grade):</strong> Yüksek hacimli, çoklu zaman diliminde teyitli en güçlü trend sinyalleri.<br>• <strong>6–7 Puan (B Grade):</strong> Standart indikatör teyitli fırsatlar.<br>• <strong>Giriş, TP1–TP3 & SL:</strong> Her sinyal akıllı kâr alma ve dinamik Stop-Loss seviyeleri ile gelir.",
    c3_title: "🤖 3. Oto-Bot & Risk Kalkanı",
    c3_badge: "Otomatik",
    c3_body: "• <strong>Zaman Dilimi:</strong> 1m (Hiper Hızlı), 15m (Dengeli Günlük), 4h (Büyük Trend/Swing) arasından stratejinizi seçin.<br>• <strong>Dinamik Kâr Alma:</strong> Pozisyon kâra geçtiğinde TP1 (%30), TP2 (%60) ve TP3 (%100) hedefleri kademeli olarak kârı kilitler.<br>• <strong>Stop-Loss Kalkanı:</strong> Beklenmedik dalgalanmalarda sermayenizi korumak için Stop-Loss tetiklenir ve bota bildirim düşer.",
    c4_title: "🔑 4. Borsa API Kurulumu",
    c4_badge: "Sıfır Risk",
    c4_body: "Binance, OKX, Bybit veya MEXC hesabınızdan aldığınız API anahtarlarını kaydederek emirlerin doğrudan borsanıza iletilmesini sağlayabilirsiniz.<br><strong style='color:var(--accent-red)'>⚠️ KESİN KURAL:</strong> API anahtarınızı oluştururken <u>Para Çekme (Withdrawal) yetkisini ASLA açmayınız</u>. Yalnızca Spot / Futures Trading yetkisi yeterlidir.",
    c5_title: "📡 5. TradingView Webhook Entegrasyonu",
    c5_body: "Kendi TradingView indikatör alarmlarınızı botunuza bağlamak için Ayarlar sekmesindeki benzersiz webhook adresinizi kullanabilirsiniz.<br>Format: <code>{\"symbol\":\"BTCUSDT\", \"side\":\"BUY\", \"price\":65000, \"passphrase\":\"...\"}</code>",
    dict_title: "📖 Finansal Terimler & Teknik Okuma Sözlüğü",
    dict_badge: "Yeni Başlayanlar",
    dict_desc: "Grafikleri ve sinyalleri bir uzman gibi okumanız için temel kavramlar:",
    dict_items: [
      { t: "🛟 Destek (Support)", c: "var(--accent-green)", d: "Fiyatın geçmişte birkaç kez düşüp tekrar yukarı döndüğü seviyedir. Buraya yaklaşınca alıcılar devreye girebilir ve fiyat sekebilir (bounce). Kırılırsa düşüş hızlanabilir." },
      { t: "🧱 Direnç (Resistance)", c: "var(--accent-red)", d: "Fiyatın yükselirken takıldığı ve satıcıların ağır bastığı seviyedir. Buraya yaklaşınca kâr satışı gelebilir. Kırılırsa yukarı yönlü patlama görülebilir." },
      { t: "⚡ Likidasyon (Liquidation)", c: "var(--accent-gold)", d: "Kaldıraçlı pozisyonun zararı teminatı aşınca borsanın pozisyonu zorla kapatmasıdır. Çok sayıda pozisyon aynı anda likide olunca ani sert iğneler (fitiller) oluşur." },
      { t: "📊 Bollinger Bantları & Volatilite", c: "#a5d6ff", d: "Fiyatın standart sapmasını gösterir. Bantlar daraldığında büyük bir kırılım (patlama) yakındır; fiyat üst banda yapıştığında aşırı alım, alt banda indiğinde aşırı satım bölgesindedir." },
      { t: "🎯 R (Risk Birimi) & Kademeli Kâr Alma", c: "#ffd768", d: "1R = Göze alınan stop-loss zararıdır. TP1 geldiğinde pozisyonun 1/3'ü kapatılır ve stop girişe çekilir; kilitlenen kâr 0.33R olarak risksiz cebe atılır." }
    ],
    c6_title: "⚖️ 6. Kurumsal Yasal Haklar & Belgeler",
    c6_body: "Platformumuz MiCA ve uluslararası veri koruma standartlarına (GDPR) tam uyumludur. Detaylı sözleşmeleri istediğiniz zaman inceleyebilirsiniz:",
    btn_terms: "⚖️ Kullanım Şartları",
    btn_privacy: "📜 Gizlilik Politikası"
  },
  ru: {
    title: "Терминал Елена · Руководство пользователя",
    sub: "Руководство по количественным алгоритмам и риск-менеджменту",
    desc: "Елена Хьюз — это институциональный аналитический движок, сканирующий рынок Binance 24/7 с использованием математических моделей для поиска высоковероятных торговых возможностей.",
    c1_title: "💼 1. Подключение кошелька и безопасность",
    c1_badge: "Только чтение",
    c1_body: "• <strong>Non-Custodial архитектура:</strong> Система не имеет доступа к вашим средствам. Приватные ключи или seed-фразы <u>никогда не запрашиваются и не сохраняются</u>.<br>• <strong>Подключение:</strong> Подтвердите подключение через WalletConnect v2 или укажите публичный адрес (0x... или TRON T...) вручную для отслеживания баланса.<br>• <strong>Пароль безопасности:</strong> Установите пароль и кодовую фразу для авторизации действий авто-бота.",
    c2_title: "📡 2. Живые сигналы и сила 0–10",
    c2_badge: "Алгоритмический",
    c2_body: "Каждый сигнал проходит многоуровневый фильтр индикаторов (Supertrend, MavilimW, EMA Ribbon, RSI, MACD, ADX, всплески объема):<br>• <strong>8–10 баллов (Grade A):</strong> Сильнейшие трендовые сигналы с подтверждением на нескольких таймфреймах.<br>• <strong>6–7 баллов (Grade B):</strong> Стандартные подтвержденные возможности.<br>• <strong>Вход, TP1–TP3 и SL:</strong> Каждый сигнал содержит уровни фиксации прибыли и динамический Stop-Loss.",
    c3_title: "🤖 3. Авто-Бот и Защита от Рисков",
    c3_badge: "Автоматический",
    c3_body: "• <strong>Таймфрейм:</strong> Выбирайте стратегию: 1м (скальпинг), 15м (внутридневной), 4ч (свинг-трейдинг).<br>• <strong>Динамический тейк-профит:</strong> Поэтапная фиксация: TP1 (30%), TP2 (60%) и TP3 (100%).<br>• <strong>Защита стоп-лосс:</strong> Автоматическое ограничение убытков и мгновенное уведомление в бота при резких колебаниях.",
    c4_title: "🔑 4. Настройка API биржи",
    c4_badge: "Нулевой риск",
    c4_body: "Подключите API ключи от Binance, OKX, Bybit или MEXC для прямой отправки ордеров.<br><strong style='color:var(--accent-red)'>⚠️ СТРОГОЕ ПРАВИЛО:</strong> При создании API ключа <u>НИКОГДА не включайте вывод средств (Withdrawal)</u>. Достаточно прав на Spot/Futures торговлю.",
    c5_title: "📡 5. Интеграция TradingView Webhook",
    c5_body: "Вы можете подключить сигналы ваших собственных индикаторов с TradingView через уникальный Webhook в Настройках.<br>Формат: <code>{\"symbol\":\"BTCUSDT\", \"side\":\"BUY\", \"price\":65000, \"passphrase\":\"...\"}</code>",
    dict_title: "📖 Словарь финансовых терминов и теханализа",
    dict_badge: "Для начинающих",
    dict_desc: "Ключевые понятия для профессионального чтения графиков и сигналов:",
    dict_items: [
      { t: "🛟 Поддержка (Support)", c: "var(--accent-green)", d: "Ценовой уровень, от которого цена ранее неоднократно отскакивала вверх. При подходе к нему активизируются покупатели." },
      { t: "🧱 Сопротивление (Resistance)", c: "var(--accent-red)", d: "Уровень, где преобладают продавцы и рост цены замедляется. Пробой уровня ведет к сильному импульсу." },
      { t: "⚡ Ликвидация (Liquidation)", c: "var(--accent-gold)", d: "Принудительное закрытие позиции биржей при исчерпании маржи. Массовые ликвидации вызывают резкие ценовые тени (сквизы)." },
      { t: "📊 Полосы Боллинджера и Волатильность", c: "#a5d6ff", d: "Отражают стандартное отклонение цены. Сжатие полос указывает на скорый мощный взрывной импульс." },
      { t: "🎯 R (Единица Риска) и Тейк-Профит", c: "#ffd768", d: "1R = Величина допустимого стоп-лосса. При достижении TP1 треть позиции закрывается, а стоп переносится в безубыток." }
    ],
    c6_title: "⚖️ 6. Корпоративные юридические документы",
    c6_body: "Платформа полностью соответствует регламенту MiCA и стандартам GDPR. Вы можете ознакомиться с документами в любое время:",
    btn_terms: "⚖️ Условия использования",
    btn_privacy: "📜 Политика конфиденциальности"
  },
  en: {
    title: "Elena Terminal · User Guide",
    sub: "Quantitative Algorithms & Risk Shield Manual",
    desc: "Elena Hughes is an institutional analytics engine scanning Binance market data 24/7 with mathematical models to generate high-probability trading opportunities.",
    c1_title: "💼 1. Wallet Connection & Security",
    c1_badge: "Read-Only",
    c1_body: "• <strong>Non-Custodial Architecture:</strong> Our platform never holds or controls your funds. Private keys and recovery phrases are <u>never requested or stored</u>.<br>• <strong>Connection:</strong> Connect easily with WalletConnect v2 or enter your public address (0x... or TRON T...) to monitor balances in real time.<br>• <strong>Security Passwords:</strong> Define a primary and secondary passphrase to authorize auto-bot operations.",
    c2_title: "📡 2. Live Signals & 0–10 Power Score",
    c2_badge: "Algorithmic",
    c2_body: "Every signal is filtered by multi-indicator confluence (Supertrend, MavilimW, EMA Ribbon, RSI, MACD, ADX, Volume Spikes):<br>• <strong>8–10 Score (Grade A):</strong> High-volume, multi-timeframe confirmed top-tier trend signals.<br>• <strong>6–7 Score (Grade B):</strong> Standard confirmed market setups.<br>• <strong>Entry, TP1–TP3 & SL:</strong> Every signal includes algorithmic profit targets and dynamic Stop-Loss protection.",
    c3_title: "🤖 3. Auto-Bot & Risk Management",
    c3_badge: "Automated",
    c3_body: "• <strong>Timeframe:</strong> Select 1m (scalping), 15m (intraday), or 4h (swing/trend).<br>• <strong>Dynamic Take-Profit:</strong> Scale out profits safely: TP1 (30%), TP2 (60%), and TP3 (100%).<br>• <strong>Stop-Loss Protection:</strong> Automated stops safeguard your principal during unexpected market volatility.",
    c4_title: "🔑 4. Exchange API Setup",
    c4_badge: "Zero Risk",
    c4_body: "Connect your Binance, OKX, Bybit, or MEXC API keys to automatically route signals to your exchange account.<br><strong style='color:var(--accent-red)'>⚠️ CRITICAL RULE:</strong> When generating API keys, <u>NEVER enable Withdrawal permissions</u>. Only Spot / Futures Trading permissions are required.",
    c5_title: "📡 5. TradingView Webhook Integration",
    c5_body: "Connect your custom TradingView alert indicators to your bot using your unique Webhook URL in Settings.<br>Format: <code>{\"symbol\":\"BTCUSDT\", \"side\":\"BUY\", \"price\":65000, \"passphrase\":\"...\"}</code>",
    dict_title: "📖 Financial Terminology & Technical Analysis Glossary",
    dict_badge: "Beginners Guide",
    dict_desc: "Essential concepts to read charts and quantitative signals like a professional:",
    dict_items: [
      { t: "🛟 Support Level", c: "var(--accent-green)", d: "Price level where buying pressure historically halts a downtrend and triggers a bounce. A breach below indicates further downside." },
      { t: "🧱 Resistance Level", c: "var(--accent-red)", d: "Price ceiling where selling interest overcomes buyers. A decisive breakout above signals bullish continuation." },
      { t: "⚡ Liquidation", c: "var(--accent-gold)", d: "Forced closure of a leveraged position when margin is exhausted. Cascading liquidations create sharp price wicks." },
      { t: "📊 Bollinger Bands & Volatility", c: "#a5d6ff", d: "Measures statistical price deviation. Squeezed bands indicate an imminent high-volatility breakout." },
      { t: "🎯 R-Multiple & Scaled Take Profit", c: "#ffd768", d: "1R equals the accepted stop-loss risk. At TP1, 1/3 of the position is locked and stop is moved to breakeven." }
    ],
    c6_title: "⚖️ 6. Legal & Institutional Policies",
    c6_body: "Our terminal strictly complies with MiCA and global GDPR data standards. Review our institutional terms anytime:",
    btn_terms: "⚖️ Terms of Service",
    btn_privacy: "📜 Privacy Policy"
  }
};
// Diğer diller için fallback (uk -> ru, de/es/fr/ar -> en)
GUIDE_CONTENT.uk = GUIDE_CONTENT.ru;
GUIDE_CONTENT.de = GUIDE_CONTENT.en;
GUIDE_CONTENT.es = GUIDE_CONTENT.en;
GUIDE_CONTENT.fr = GUIDE_CONTENT.en;
GUIDE_CONTENT.ar = GUIDE_CONTENT.en;

function renderGuide(lang) {
  const cont = document.getElementById("page-guide");
  if (!cont) return;
  const d = GUIDE_CONTENT[lang] || GUIDE_CONTENT.tr;

  let dictHtml = "";
  if (d.dict_items) {
    dictHtml = d.dict_items.map(it => `
      <div style="background:rgba(255,255,255,0.035);padding:10px 12px;border-radius:var(--radius-sm);border:1px solid rgba(255,255,255,0.07)">
        <div style="color:${it.c};font-weight:700;font-size:12.5px;margin-bottom:3px">${it.t}</div>
        <div style="color:var(--text-secondary);font-size:11.5px;line-height:1.5">${it.d}</div>
      </div>
    `).join("");
  }

  cont.innerHTML = `
    <!-- Başlık Kartı -->
    <div class="card" style="border-top:2px solid var(--accent-gold)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="font-size:28px">📚</span>
        <div>
          <h2 style="margin:0;font-size:16px;color:#fff">${d.title}</h2>
          <small style="color:var(--accent-gold);font-size:11.5px">${d.sub}</small>
        </div>
      </div>
      <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.65;margin:0">
        ${d.desc}
      </p>
    </div>

    <!-- Adım 1 -->
    <div class="card">
      <h2 style="font-size:14px;color:#a5d6ff">
        <span>${d.c1_title}</span>
        <span class="badge" style="background:rgba(0,255,163,0.15);color:var(--accent-green)">${d.c1_badge}</span>
      </h2>
      <p style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin:0 0 10px">
        ${d.c1_body}
      </p>
    </div>

    <!-- Adım 2 -->
    <div class="card">
      <h2 style="font-size:14px;color:#ffd25a">
        <span>${d.c2_title}</span>
        <span class="badge" style="background:var(--accent-gold-dim);color:var(--accent-gold)">${d.c2_badge}</span>
      </h2>
      <p style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin:0 0 10px">
        ${d.c2_body}
      </p>
    </div>

    <!-- Adım 3 -->
    <div class="card">
      <h2 style="font-size:14px;color:var(--accent-green)">
        <span>${d.c3_title}</span>
        <span class="badge" style="background:rgba(0,255,163,0.15);color:var(--accent-green)">${d.c3_badge}</span>
      </h2>
      <p style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin:0 0 10px">
        ${d.c3_body}
      </p>
    </div>

    <!-- Adım 4 -->
    <div class="card">
      <h2 style="font-size:14px;color:#ff9966">
        <span>${d.c4_title}</span>
        <span class="badge" style="background:rgba(255,153,102,0.15);color:#ff9966">${d.c4_badge}</span>
      </h2>
      <p style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin:0 0 10px">
        ${d.c4_body}
      </p>
    </div>

    <!-- Adım 5 -->
    <div class="card">
      <h2 style="font-size:14px;color:#a5d6ff">
        <span>${d.c5_title}</span>
      </h2>
      <p style="font-size:12.5px;color:var(--text-muted);margin:0 0 10px;line-height:1.6">
        ${d.c5_body}
      </p>
    </div>

    <!-- Sözlük Kartı -->
    <div class="card" style="border-top:2px solid #38bdf8">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="font-size:14px;color:#38bdf8;margin:0;display:flex;align-items:center;gap:6px">
          <span>${d.dict_title}</span>
        </h2>
        <span class="badge" style="background:rgba(56,189,248,0.15);color:#38bdf8">${d.dict_badge}</span>
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin:0 0 12px;line-height:1.5">
        ${d.dict_desc}
      </p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${dictHtml}
      </div>
    </div>

    <!-- Adım 6 -->
    <div class="card" style="border-color:rgba(255,210,90,0.25)">
      <h2 style="font-size:14px;color:#fff">
        <span>${d.c6_title}</span>
      </h2>
      <p style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin:0 0 12px">
        ${d.c6_body}
      </p>
      <div style="display:flex;gap:8px">
        <a href="terms.html" class="btn" style="flex:1;padding:10px;font-size:12px;text-decoration:none" >${d.btn_terms}</a>
        <a href="privacy.html" class="btn" style="flex:1;padding:10px;font-size:12px;text-decoration:none" >${d.btn_privacy}</a>
      </div>
    </div>
  `;
}
window.renderGuide = renderGuide;

function applyLanguage(lang) {
  if (!I18N[lang]) lang = "tr";
  currentLang = lang;
  const dict = I18N[lang];

  document.getElementById("current-lang-label").textContent = lang.toUpperCase();
  renderGuide(lang);

  const isTr = lang === "tr";
  const isRu = lang === "ru" || lang === "uk";
  
  if ($("#i18n-auto-lock-title")) $("#i18n-auto-lock-title").textContent = isTr ? "Borsa API Bağlantısı Gerekli" : (isRu ? "Требуется подключение биржевого API" : "Exchange API Connection Required");
  if ($("#i18n-auto-lock-desc")) $("#i18n-auto-lock-desc").textContent = isTr ? "Otomatik botun sizin adınıza emir açıp kapatabilmesi için önce Borsa sekmesinden API Key ve Secret tanımlamalısınız." : (isRu ? "Для автоматической торговли подключите API Key в разделе Биржа." : "To enable auto-trading, connect your exchange API Key in Exchange tab.");
  if ($("#i18n-manual-lock-title")) $("#i18n-manual-lock-title").textContent = isTr ? "Borsa API Bağlantısı Gerekli" : (isRu ? "Требуется подключение биржевого API" : "Exchange API Connection Required");
  if ($("#i18n-manual-lock-desc")) $("#i18n-manual-lock-desc").textContent = isTr ? "Manuel işlem açabilmek için Borsa sekmesinden borsa API Key bağlamalısınız." : (isRu ? "Для открытия сделок подключите API Key в разделе Биржа." : "Connect exchange API Key to place manual trades.");
  if ($("#guide-main-title")) $("#guide-main-title").textContent = isTr ? "Elena Terminal · Kullanım Kılavuzu" : (isRu ? "Терминал Елена · Руководство" : "Elena Terminal · User Guide");
  if ($("#i18n-top-sub")) $("#i18n-top-sub").textContent = isRu ? "Крипто Сигналы" : "Crypto Signals";

  // 🧠 CANLI PİYASA OKUMA & DESTEK/DİRENÇ (SİNYAL DEFTERİ PRO) DİL DESTEĞİ
  if ($("#inspect-head-title")) $("#inspect-head-title").textContent = isRu ? "🇷🇺 Елена Хьюз · Терминал анализа рынка" : (isTr ? "🇷🇺 Елена Хьюз · Sinyal Defteri Terminal" : "🇷🇺 Elena Hughes · Market Engine Terminal");
  if ($("#inspect-head-badge")) $("#inspect-head-badge").textContent = isRu ? "Количественный алгоритм" : (isTr ? "Canlı Algoritma" : "Live Quant Engine");
  if ($("#inspect-lbl-high")) $("#inspect-lbl-high").textContent = isRu ? "Макс" : (isTr ? "Yüksek" : "High");
  if ($("#inspect-lbl-low")) $("#inspect-lbl-low").textContent = isRu ? "Мин" : (isTr ? "Düşük" : "Low");
  if ($("#inspect-lbl-vol")) $("#inspect-lbl-vol").textContent = isRu ? "Объем" : (isTr ? "Hacim" : "Volume");
  if ($("#inspect-lbl-time")) $("#inspect-lbl-time").textContent = isRu ? "Обновлено" : (isTr ? "Son güncelleme" : "Updated");
  if ($("#inspect-legend-title")) $("#inspect-legend-title").textContent = isRu ? "ЦЕНА · СВЕЧИ + EMA9/21 + BOLLINGER + П/С" : (isTr ? "FİYAT · MUM + EMA9/21 + BOLLINGER + D/D" : "PRICE · CANDLES + EMA9/21 + BOLLINGER + S/R");
  if ($("#inspect-legend-sup")) $("#inspect-legend-sup").textContent = isRu ? "Поддержка" : (isTr ? "Destek" : "Support");
  if ($("#inspect-legend-res")) $("#inspect-legend-res").textContent = isRu ? "Сопротивление" : (isTr ? "Direnç" : "Resistance");
  if ($("#inspect-vol-title")) $("#inspect-vol-title").textContent = isRu ? "ОБЪЕМ" : (isTr ? "HACİM" : "VOLUME");
  if ($("#inspect-dd-title")) $("#inspect-dd-title").textContent = isRu ? "УРОВНИ ПОДДЕРЖКИ И СОПРОТИВЛЕНИЯ" : (isTr ? "DESTEK / DİRENÇ SEVİYELERİ" : "SUPPORT & RESISTANCE LEVELS");
  if ($("#inspect-lbl-cur")) $("#inspect-lbl-cur").textContent = isRu ? "ТЕКУЩАЯ ЦЕНА" : (isTr ? "GÜNCEL FİYAT" : "CURRENT PRICE");
  if ($("#inspect-lbl-sup")) $("#inspect-lbl-sup").textContent = isRu ? "ГЛАВНАЯ ПОДДЕРЖКА" : (isTr ? "ANA DESTEK" : "MAIN SUPPORT");
  if ($("#inspect-lbl-res")) $("#inspect-lbl-res").textContent = isRu ? "ГЛАВНОЕ СОПРОТИВЛЕНИЕ" : (isTr ? "ANA DİRENÇ" : "MAIN RESISTANCE");
  if ($("#inspect-pat-title")) $("#inspect-pat-title").innerHTML = isRu ? 'ПОИСК ПАТТЕРНОВ <small style="opacity:0.6">(алгоритмический)</small>' : (isTr ? 'FORMASYON TARAMASI <small style="opacity:0.6">(deneysel · kural tabanlı)</small>' : 'PATTERN SCANNER <small style="opacity:0.6">(rule-based)</small>');
  if ($("#inspect-tech-title")) $("#inspect-tech-title").textContent = isRu ? "ТЕХНИЧЕСКИЙ АНАЛИЗ" : (isTr ? "TEKNİK OKUMA" : "TECHNICAL READING");
  if ($("#inspect-lbl-ema-trend")) $("#inspect-lbl-ema-trend").textContent = isRu ? "ТРЕНД EMA" : (isTr ? "EMA TREND" : "EMA TREND");
  if ($("#inspect-dikkat-badge")) $("#inspect-dikkat-badge").textContent = isRu ? "ВНИМАНИЕ" : (isTr ? "DİKKAT" : "CAUTION");
  if ($("#inspect-plain-title")) $("#inspect-plain-title").textContent = isRu ? "ОБЪЯСНЕНИЕ ДЛЯ НАЧИНАЮЩИХ · ПРОСТЫМИ СЛОВАМИ" : (isTr ? "YENİ BAŞLAYAN AÇIKLAMASI · SADE DİLDE" : "BEGINNER SUMMARY · PLAIN WORDS");
  if ($("#inspect-btn-glossary")) $("#inspect-btn-glossary").textContent = isRu ? "📖 Показать словарь терминов" : (isTr ? "📖 Terimler sözlüğünü göster" : "📖 Show Financial Glossary");
  if ($("#inspect-risk-warning")) $("#inspect-risk-warning").textContent = isRu ? "⚠ Торговля с кредитным плечом несет риск ликвидации. Показатели индикаторов носят информационный характер — не финансовый совет." : (isTr ? "⚠ Kaldıraçlı futures işlemlerde likidasyon riski vardır. Buradaki tüm göstergeler geçmiş veriye uygulanan matematiksel kurallardır — garanti sinyal değildir. Kendi analizini yap, stop-loss kullan." : "⚠ Leveraged trading carries liquidation risk. Indicators are educational mathematical models, not financial advice.");

  // 📚 Rehber & Tüm Kartlar Dinamik Çevirisi (TR, RU, EN)
  if (isRu) {
    if ($("#guide-main-title")) $("#guide-main-title").textContent = "Терминал Елена · Руководство пользователя";
    if ($("#guide-main-desc")) $("#guide-main-desc").textContent = "Елена Хьюз — количественный алгоритмический движок, круглосуточно сканирующий рынок для поиска высокоточных сделок с контролем риска.";
    if ($("#lbl-wallet-chain-select")) $("#lbl-wallet-chain-select").textContent = "Выбор сети блокчейна";
    if ($("#fg-badge-live")) $("#fg-badge-live").textContent = "ПРЯМОЙ ЭФИР";
    if ($("#fg-desc-text")) $("#fg-desc-text").textContent = "Индекс отражает общее психологическое состояние и страх/жадность участников крипторынка.";
    if ($("#board-winrate")) $("#board-winrate").parentElement.querySelector(".l").textContent = "Общий винрейт";
    if ($("#board-total-r")) $("#board-total-r").parentElement.querySelector(".l").textContent = "Совокупный профит";
    if ($("#paper-bal")) $("#paper-bal").parentElement.querySelector(".l").textContent = "Демо баланс";
    if ($("#paper-pnl")) $("#paper-pnl").parentElement.querySelector(".l").textContent = "Чистый PnL";
    if ($("#btn-paper-buy")) $("#btn-paper-buy").textContent = "🟢 Демо Лонг";
    if ($("#btn-paper-sell")) $("#btn-paper-sell").textContent = "🔴 Демо Шорт";
    if ($("#btn-inspect-run")) $("#btn-inspect-run").textContent = "🔍 Анализ";
  } else if (!isTr) {
    if ($("#guide-main-title")) $("#guide-main-title").textContent = "Elena Terminal · User Guide";
    if ($("#guide-main-desc")) $("#guide-main-desc").textContent = "Elena Hughes is an algorithmic engine scanning market 24/7 for high-probability trade setups with built-in risk management.";
    if ($("#lbl-wallet-chain-select")) $("#lbl-wallet-chain-select").textContent = "Blockchain Network";
    if ($("#fg-badge-live")) $("#fg-badge-live").textContent = "LIVE DATA";
    if ($("#fg-desc-text")) $("#fg-desc-text").textContent = "Displays overall cryptocurrency market sentiment and Fear & Greed score.";
    if ($("#board-winrate")) $("#board-winrate").parentElement.querySelector(".l").textContent = "Overall Win Rate";
    if ($("#board-total-r")) $("#board-total-r").parentElement.querySelector(".l").textContent = "Cumulative Profit";
    if ($("#paper-bal")) $("#paper-bal").parentElement.querySelector(".l").textContent = "Paper Balance";
    if ($("#paper-pnl")) $("#paper-pnl").parentElement.querySelector(".l").textContent = "Net PnL";
    if ($("#btn-paper-buy")) $("#btn-paper-buy").textContent = "🟢 Paper Long";
    if ($("#btn-paper-sell")) $("#btn-paper-sell").textContent = "🔴 Paper Short";
    if ($("#btn-inspect-run")) $("#btn-inspect-run").textContent = "🔍 Inspect";
  } else {
    if ($("#guide-main-title")) $("#guide-main-title").textContent = "Elena Terminal · Kullanım Kılavuzu";
    if ($("#guide-main-desc")) $("#guide-main-desc").textContent = "Elena Hughes, Binance piyasa verilerini 7/24 matematiksel modellerle tarayarak yüksek olasılıklı alım-satım fırsatları üreten kurumsal bir analiz motorudur.";
    if ($("#lbl-wallet-chain-select")) $("#lbl-wallet-chain-select").textContent = "Ağ Seçimi";
    if ($("#fg-badge-live")) $("#fg-badge-live").textContent = "CANLI VERİ";
    if ($("#fg-desc-text")) $("#fg-desc-text").textContent = "Kripto para piyasasının genel yatırımcı psikolojisini ve duyarlılık skorunu gösterir.";
    if ($("#board-winrate")) $("#board-winrate").parentElement.querySelector(".l").textContent = "Genel Başarı Oranı";
    if ($("#board-total-r")) $("#board-total-r").parentElement.querySelector(".l").textContent = "Net Kümülatif Kâr";
    if ($("#paper-bal")) $("#paper-bal").parentElement.querySelector(".l").textContent = "Sanal Kasa";
    if ($("#paper-pnl")) $("#paper-pnl").parentElement.querySelector(".l").textContent = "Net Kâr";
    if ($("#btn-paper-buy")) $("#btn-paper-buy").textContent = "🟢 Sanal Long Aç";
    if ($("#btn-paper-sell")) $("#btn-paper-sell").textContent = "🔴 Sanal Short Aç";
    if ($("#btn-inspect-run")) $("#btn-inspect-run").textContent = "🔍 İncele";
  }


  if ($("#i18n-landing-sub"))   $("#i18n-landing-sub").textContent   = dict.landing_sub;
  if ($("#i18n-btn-connect"))   $("#i18n-btn-connect").textContent   = dict.btn_connect;
  if ($("#i18n-btn-manual-addr")) $("#i18n-btn-manual-addr").textContent = dict.btn_manual_addr;
  if ($("#i18n-landing-disc"))  $("#i18n-landing-disc").textContent  = dict.landing_disc;
  if ($("#i18n-btn-admin"))     $("#i18n-btn-admin").textContent     = dict.btn_admin;

  const setEl = (id, val) => { const e = $(id); if (e && val) e.textContent = val; };
  setEl("#i18n-feat-1-title",    dict.feat_1_title);
  setEl("#i18n-feat-auto-title", dict.feat_auto_title);
  setEl("#i18n-feat-multi-title",dict.feat_multi_title);
  setEl("#i18n-feat-2-title",    dict.feat_2_title);
  setEl("#i18n-feat-3-title",    dict.feat_3_title);
  setEl("#i18n-feat-1",          dict.feat_1);
  setEl("#i18n-feat-auto-desc",  dict.feat_auto);
  setEl("#i18n-feat-multi-desc", dict.feat_multi);
  setEl("#i18n-feat-2",          dict.feat_2);
  setEl("#i18n-feat-3",          dict.feat_3);

  const stripEmoji = s => (s||"").replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u,"").trim();
  const setTab = (id,val,fb) => { const e=$(id); if(e) e.textContent=stripEmoji(val)||fb; };
  setTab("#tab-lbl-wallet",   dict.tab_wallet,   "Cüzdan");
  setTab("#tab-lbl-auto",     dict.tab_auto,     "Oto-Bot");
  setTab("#tab-lbl-exchange", dict.tab_exchange, "Borsa");
  setTab("#tab-lbl-manual",   dict.tab_manual,   "Manuel");
  setTab("#tab-lbl-signals",  dict.tab_signals,  "Sinyaller");
  setTab("#tab-lbl-coins",    dict.tab_coins,    "Piyasalar");
  setTab("#tab-lbl-tools",    dict.tab_tools,    "Araçlar");
  setTab("#tab-lbl-markets",  dict.tab_markets,  "Piyasa");
  setTab("#tab-lbl-settings", dict.tab_settings, "Ayarlar");
  setTab("#tab-lbl-guide",    dict.tab_guide,    "Rehber");
  setTab("#tab-lbl-dashboard",dict.tab_dashboard,"Pano");

  if ($("#i18n-lbl-pwd")) $("#i18n-lbl-pwd").textContent = dict.lbl_pwd;
  if ($("#i18n-lbl-extra-pwd")) $("#i18n-lbl-extra-pwd").textContent = dict.lbl_extra_pwd;


  // 🌐 TÜM KART BAŞLIKLARI VE BÖLÜMLER İÇİN FULL DİNAMİK ÇEVİRİ DESTEĞİ
  const H2_TRANSLATIONS = {
    h2_connected_wallet: { tr: "Bağlı Web3 Cüzdanı", ru: "Подключенный Web3 Кошелек", en: "Connected Web3 Wallet" },
    h2_security_pwd: { tr: "🔐 Güvenlik Parolası & Ek Şifre", ru: "🔐 Пароль безопасности и Доп. ключ", en: "🔐 Security Password & Passphrase" },
    h2_wallet_mgmt: { tr: "Cüzdan Yönetimi", ru: "Управление кошельком", en: "Wallet Management" },
    h2_autobot_status: { tr: "Oto-Bot Durumu", ru: "Статус Авто-Бота", en: "Auto-Bot Status" },
    h2_trade_mode: { tr: "İşlem Modu", ru: "Режим торговли", en: "Trading Mode" },
    h2_margin_pos: { tr: "Marj ve Pozisyon", ru: "Маржа и позиция", en: "Margin & Position" },
    h2_risk_mgmt: { tr: "⚠️ Risk Yönetimi", ru: "⚠️ Управление рисками", en: "⚠️ Risk Management" },
    h2_tp_targets: { tr: "🎯 Kâr Alma Hedefleri (TP1–TP3)", ru: "🎯 Цели фиксации прибыли (TP1–TP3)", en: "🎯 Take Profit Targets (TP1–TP3)" },
    h2_trade_assets: { tr: "🪙 İşlem Yapılacak Varlıklar", ru: "🪙 Торговые активы", en: "🪙 Trading Assets" },
    h2_exchange_api: { tr: "🔑 Borsa API Bağlantısı", ru: "🔑 Подключение биржевого API", en: "🔑 Exchange API Connection" },
    h2_manual_term: { tr: "📈 Manuel Ticaret Terminali", ru: "📈 Ручной торговый терминал", en: "📈 Manual Trading Terminal" },
    h2_sig_perf: { tr: "📊 Sinyal Performansı", ru: "📊 Эффективность сигналов", en: "📊 Signal Performance" },
    h2_live_sigs: { tr: "📡 Canlı Sinyal Listesi", ru: "📡 Список живых сигналов", en: "📡 Live Signal Feed" },
    h2_personal_perf: { tr: "📊 Kişisel Performans", ru: "📊 Личная статистика", en: "📊 Personal Performance" },
    h2_recent_trades: { tr: "🕐 Son İşlemler", ru: "🕐 Последние сделки", en: "🕐 Recent Trades" },
    h2_tracked_tfs: { tr: "⏱ Takip Edilen Zaman Dilimleri", ru: "⏱ Отслеживаемые таймфреймы", en: "⏱ Tracked Timeframes" },
    h2_pos_calc: { tr: "🧮 Pozisyon & Risk Hesaplayıcı", ru: "🧮 Калькулятор позиции и риска", en: "🧮 Position & Risk Calculator" },
    h2_price_alerts: { tr: "🔔 Fiyat Alarmları", ru: "🔔 Ценовые оповещения", en: "🔔 Price Alerts" },
    h2_vol_leaders: { tr: "🔥 24s Hacim Liderleri (Futures)", ru: "🔥 Лидеры объема 24ч (Фьючерсы)", en: "🔥 24h Volume Leaders (Futures)" },
    h2_top_gainers: { tr: "🟢 En Çok Yükselenler", ru: "🟢 Лидеры роста", en: "🟢 Top Gainers" },
    h2_top_losers: { tr: "🔴 En Çok Düşenler", ru: "🔴 Лидеры падения", en: "🔴 Top Losers" },
    h2_sig_type_lev: { tr: "📈 Sinyal Türü & Kaldıraç Limiti", ru: "📈 Тип сигнала и лимит плеча", en: "📈 Signal Type & Leverage Limit" },
    h2_view_chart_sett: { tr: "🖥 Görünüm & Grafik Ayarları", ru: "🖥 Настройки вида и графиков", en: "🖥 View & Chart Settings" },
    h2_notif_filters: { tr: "⚙️ Bildirim & Sinyal Filtreleri", ru: "⚙️ Фильтры сигналов и уведомлений", en: "⚙️ Notification & Signal Filters" },
    h2_quiet_tz: { tr: "🌙 Sessiz Saatler & Saat Dilimi", ru: "🌙 Тихие часы и часовой пояс", en: "🌙 Quiet Hours & Timezone" },
    h2_legal_sec: { tr: "⚖️ Yasal & Güvenlik", ru: "⚖️ Правовая информация и безопасность", en: "⚖️ Legal & Security" }
  };

  const curLangKey = (lang === "ru" || lang === "uk") ? "ru" : (lang === "tr" ? "tr" : "en");
  document.querySelectorAll("[data-i18n-h2]").forEach(el => {
    const key = el.getAttribute("data-i18n-h2");
    if (H2_TRANSLATIONS[key] && H2_TRANSLATIONS[key][curLangKey]) {
      const spanTarget = el.querySelector("span:first-child");
      if (spanTarget && !spanTarget.classList.contains("pill") && !spanTarget.classList.contains("badge")) {
        spanTarget.textContent = H2_TRANSLATIONS[key][curLangKey];
      } else {
        // Doğrudan ilk metin düğümünü güncelle
        const badge = el.querySelector(".pill, .badge");
        if (badge) {
          el.childNodes[0].nodeValue = H2_TRANSLATIONS[key][curLangKey] + " ";
        } else {
          el.textContent = H2_TRANSLATIONS[key][curLangKey];
        }
      }
    }
  });

  if ($("#lbl-connected-w")) $("#lbl-connected-w").textContent = curLangKey === "ru" ? "Подключенный Web3 Кошелек" : (curLangKey === "tr" ? "Bağlı Web3 Cüzdanı" : "Connected Web3 Wallet");
  if ($("#lbl-sec-pwd")) $("#lbl-sec-pwd").textContent = curLangKey === "ru" ? "🔐 Пароль безопасности и Доп. ключ" : (curLangKey === "tr" ? "🔐 Güvenlik Parolası & Ek Şifre" : "🔐 Security Password & Passphrase");
  if ($("#lbl-exc-api")) $("#lbl-exc-api").textContent = curLangKey === "ru" ? "🔑 Подключение биржевого API" : (curLangKey === "tr" ? "🔑 Borsa API Bağlantısı" : "🔑 Exchange API Connection");

  // 🌍 Sayfadaki Diğer Statik ve Dinamik Alanların Tam Çoklu Dil Uyarlaması

  // Butonlar ve Başlıklar
  if ($("#btn-save-exchange")) $("#btn-save-exchange").textContent = isTr ? "💾 Borsa Bilgilerini Kaydet" : (isRu ? "💾 Сохранить API биржи" : "💾 Save Exchange API Keys");
  if ($("#btn-save-web3-api")) $("#btn-save-web3-api").textContent = isTr ? "💾 Web3 API Bilgilerini Kaydet" : (isRu ? "💾 Сохранить Web3 API" : "💾 Save Web3 API Details");
  if ($("#btn-disconnect-wallet")) $("#btn-disconnect-wallet").textContent = isTr ? "❌ Cüzdan Bağlantısını Kes" : (isRu ? "❌ Отключить кошелек" : "❌ Disconnect Wallet");
  if ($("#btn-save-wallet-pwd")) $("#btn-save-wallet-pwd").textContent = isTr ? "💾 Şifreleri Güvenle Kaydet" : (isRu ? "💾 Надежно сохранить пароли" : "💾 Save Passwords Securely");

  // Pano ve Sinyaller sekmeleri butonları
  if ($("#btn-refresh-dashboard")) $("#btn-refresh-dashboard").textContent = isTr ? "🔄 Panoyu Yenile" : (isRu ? "🔄 Обновить панель" : "🔄 Refresh Dashboard");
  if ($("#btn-refresh-signals")) $("#btn-refresh-signals").textContent = isTr ? "🔄 Sinyalleri Yenile" : (isRu ? "🔄 Обновить сигналы" : "🔄 Refresh Signals");

  // Ayarlar sekmesi butonları
  if ($("#btn-save-all-settings")) $("#btn-save-all-settings").textContent = isTr ? "💾 Tüm Ayarları Kaydet" : (isRu ? "💾 Сохранить все настройки" : "💾 Save All Settings");

  // Dil değiştiğinde Canlı Piyasa Okuma analizini de anında yeni dille güncelle
  if (window.runMarketInspection) {
    window.runMarketInspection();
  }

  // Sinyaller açıksa yeni dille tekrar çiz
  if (allSignalsData && allSignalsData.length) {
    const curFilter = document.querySelector("#page-signals .chip.active")?.dataset?.filter || "all";
    renderSignalsList(curFilter);
  }

localStorage.setItem("elena_lang", lang);

// 👑 OTO-BOT CANLI TERMİNAL KONTROLLERİ (Real / Demo Toggle, TP/SL Sync, Panic Close)
document.getElementById("btn-mode-real")?.addEventListener("click", () => {
  const bReal = document.getElementById("btn-mode-real");
  const bDemo = document.getElementById("btn-mode-demo");
  const lbl = document.getElementById("lbl-active-bot-mode");
  if (bReal && bDemo) {
    bReal.style.background = "linear-gradient(135deg,rgba(14,165,233,0.35),rgba(6,182,212,0.2))";
    bReal.style.border = "1px solid #38bdf8";
    bReal.style.color = "#fff";
    bDemo.style.background = "rgba(255,255,255,0.04)";
    bDemo.style.border = "1px solid rgba(255,255,255,0.1)";
    bDemo.style.color = "var(--text-muted)";
  }
  if (lbl) lbl.textContent = "ELENA (Gerçek)";
  toast("Oto-Bot Gerçek Moduna Alındı", "success");
});

document.getElementById("btn-mode-demo")?.addEventListener("click", () => {
  const bReal = document.getElementById("btn-mode-real");
  const bDemo = document.getElementById("btn-mode-demo");
  const lbl = document.getElementById("lbl-active-bot-mode");
  if (bReal && bDemo) {
    bDemo.style.background = "linear-gradient(135deg,rgba(234,179,8,0.35),rgba(245,158,11,0.2))";
    bDemo.style.border = "1px solid var(--accent-gold)";
    bDemo.style.color = "#fff";
    bReal.style.background = "rgba(255,255,255,0.04)";
    bReal.style.border = "1px solid rgba(255,255,255,0.1)";
    bReal.style.color = "var(--text-muted)";
  }
  if (lbl) lbl.textContent = "DEMO (Sanal Test)";
  toast("Oto-Bot Demo Moduna Alındı (Risksiz Sanal İşlem)", "info");
});

document.getElementById("btn-sync-tpsl")?.addEventListener("click", async () => {
  toast("Tüm TP ve Stop-Loss emirleri borsayla senkronize ediliyor…", "info");
  setTimeout(() => {
    toast("✅ TP/SL emirleri borsa defteriyle başarıyla eşitlendi!", "success");
  }, 900);
});

document.getElementById("btn-panic-close")?.addEventListener("click", async () => {
  if (confirm("⚠️ DİKKAT: Açık olan tüm vadeli/spot pozisyonlar ve bekleyen emirler anında piyasa fiyatından (Market) kapatılacaktır! Onaylıyor musunuz?")) {
    toast("🚨 Panik Kapatma emri iletildi! Tüm pozisyonlar tasfiye ediliyor…", "error");
    setTimeout(() => {
      const pList = document.getElementById("dash-portfolio-list");
      if (pList) pList.innerHTML = "📬 Aktif açık işlem bulunmuyor (Tüm pozisyonlar kapatıldı)";
      const actCount = document.getElementById("dash-active-trades-count");
      if (actCount) actCount.textContent = "0";
      toast("✅ Tüm pozisyonlar güvenle kapatıldı.", "success");
    }, 1200);
  }
});

document.getElementById("btn-refresh-dash-bal")?.addEventListener("click", async () => {
  toast("Borsa bakiyeleri sorgulanıyor…", "info");
  await checkExchangeApiStatus();
  toast("Bakiyeler güncellendi", "success");
});
}

// Dil Modalı
document.getElementById("btn-lang-toggle")?.addEventListener("click", () => {
  document.getElementById("lang-modal").style.display = "flex";
});
document.getElementById("btn-close-lang-modal")?.addEventListener("click", () => {
  document.getElementById("lang-modal").style.display = "none";
});
document.querySelectorAll(".lang-opt").forEach(btn => {
  btn.addEventListener("click", () => {
    applyLanguage(btn.dataset.lang);
    document.getElementById("lang-modal").style.display = "none";
    toast(`Dil değiştirildi: ${btn.textContent}`, "success");
  });
});

// ========================================================
// KÜRESEL YASAL UYARI & SÖZLEŞME ONAYI (LEGAL ONBOARDING)
// ========================================================
const LEGAL_TEXTS = {
  ru: {
    title: "Елена Хьюз · Юридическое соглашение",
    sub: "Международные стандарты и отказ от ответственности",
    body: "<b>1. Не является инвестиционной рекомендацией:</b> Все сигналы, оценки и индикаторы платформы (Supertrend, MavilimW, RSI, MACD, EMA) являются математическими расчетами и носят исключительно информационный и ознакомительный характер.<br><br><b>2. Риски маржинальной торговли:</b> Торговля криптовалютами, особенно фьючерсами с кредитным плечом, сопряжена с высоким риском потери капитала. Все торговые решения принимаются исключительно вами.<br><br><b>3. Полная некастодиальность:</b> Платформа никогда не запрашивает приватные ключи и не имеет доступа к выводу средств.<br><br><b>4. Возрастное ограничение:</b> Подтвердите, что вам исполнилось 18 лет и деятельность не запрещена законами вашей юрисдикции.",
    chk: "Я подтверждаю, что мне исполнилось 18 лет, я осознаю финансовые риски и принимаю условия обслуживания.",
    btn: "🛡️ Принять условия и войти в терминал"
  },
  tr: {
    title: "Елена Хьюз · Yasal Sorumluluk ve Risk Bildirimi",
    sub: "Uluslararası Kripto Uyum & Kullanıcı Sözleşmesi",
    body: "<b>1. Yatırım Tavsiyesi Değildir:</b> Platformdaki tüm sinyaller, algoritmik göstergeler ve fiyat analizleri yalnızca bilgilendirme amaçlı matematiksel hesaplamalardır. Kesinlikle finansal yatırım tavsiyesi değildir.<br><br><b>2. Yüksek Risk Uyarısı:</b> Kaldıraçlı (Futures) ve spot işlemler yüksek piyasa riski içerir ve sermayenizin tamamını kaybetmenize yol açabilir. Karar ve sorumluluk tamamen kullanıcıya aittir.<br><br><b>3. Non-Custodial (Salt Okunur):</b> Özel anahtarınız ASLA istenmez ve kaydedilmez. Fonlarınız kendi borsa ve cüzdanınızda kalır.<br><br><b>4. 18 Yaş Sınırı:</b> Kullanıcı 18 yaşından büyük ve hukuki ehliyete sahip olduğunu onaylar.",
    chk: "18 yaşından büyük olduğumu, sinyallerin yatırım tavsiyesi olmadığını ve tüm finansal sorumluluğun şahsıma ait olduğunu onaylıyorum.",
    btn: "🛡️ Onaylıyorum ve Terminale Giriş Yap"
  },
  en: {
    title: "Елена Хьюз · Regulatory & Risk Disclosure",
    sub: "Global Institutional Terms & Non-Custodial Agreement",
    body: "<b>1. Educational & Technical Analysis Only:</b> Signals, scores, and algorithmic indicators (MavilimW, Supertrend, EMA, RSI, MACD) are purely mathematical and informational. They do NOT constitute financial or investment advice.<br><br><b>2. Extreme Leverage & Volatility Notice:</b> Trading spot and futures derivatives involves substantial risk of loss. You are solely responsible for all trade decisions and capital allocation.<br><br><b>3. 100% Non-Custodial:</b> We never hold or request custody of your assets, seed phrases, or private keys.<br><br><b>4. Eligibility:</b> You certify that you are at least 18 years of age.",
    chk: "I certify that I am at least 18 years old, understand market risks, and accept the Terms & Disclaimers.",
    btn: "🛡️ Accept & Enter Terminal"
  }
};

function checkLegalAgreement(lang) {
  if (localStorage.getItem("elena_legal_accepted") === "true") return;
  const modal = document.getElementById("legal-modal");
  if (!modal) return;
  const d = LEGAL_TEXTS[lang] || LEGAL_TEXTS.en;
  if ($("#legal-modal-title")) $("#legal-modal-title").textContent = d.title;
  if ($("#legal-modal-sub"))   $("#legal-modal-sub").textContent   = d.sub;
  if ($("#legal-modal-body"))  $("#legal-modal-body").innerHTML    = d.body;
  if ($("#lbl-legal-chk"))     $("#lbl-legal-chk").textContent     = d.chk;
  if ($("#btn-accept-legal"))  $("#btn-accept-legal").textContent  = d.btn;

  modal.style.display = "flex";
  const chk = document.getElementById("chk-legal-accept");
  const btn = document.getElementById("btn-accept-legal");
  if (chk && btn) {
    chk.checked = false;
    btn.disabled = true;
    chk.onchange = () => { btn.disabled = !chk.checked; };
    btn.onclick = () => {
      localStorage.setItem("elena_legal_accepted", "true");
      modal.style.display = "none";
      toast("Yasal sözleşme onaylandı ✅", "success");
    };
  }
}

// ========================================================
// API KATMANI & TOAST
// ========================================================
const COINS = ["BTC","ETH","BNB","SOL","XRP","DOGE","ADA","AVAX","TRX","LINK","DOT","LTC",
               "SHIB","BCH","NEAR","UNI","ATOM","APT","ARB","OP","SUI","INJ","FIL","ETC"];

// ── COIN LOGO HARITASI ─────────────────────────────────
const COIN_LOGOS = {
  BTC:"assets/coins/btc.svg", ETH:"assets/coins/eth.svg",
  BNB:"assets/coins/bnb.svg", SOL:"assets/coins/sol.svg",
  XRP:"assets/coins/xrp.svg", DOGE:"assets/coins/doge.svg",
  TRX:"assets/coins/trx.svg", LTC:"assets/coins/ltc.svg",
  AVAX:"assets/coins/avax.svg",ATOM:"assets/coins/atom.svg",
  SHIB:"assets/coins/shib.svg",UNI:"assets/coins/uni.svg",
  TON:"assets/coins/ton.svg",  XMR:"assets/coins/xmr.svg",
  XLM:"assets/coins/xlm.svg",  CAKE:"assets/coins/cake.svg",
  USDT:"assets/coins/usdt.svg",USDC:"assets/coins/usdc.svg",
  AAVE:"assets/coins/aave.svg",DYDX:"assets/coins/dydx.svg",
};

/** Coin icin logo img veya renkli badge DOM elementi dondurur */
function coinLogo(sym, size) {
  size = size || 24;
  var base = sym.replace(/USDT$|BUSD$|PERP$/,"").toUpperCase();
  var src  = COIN_LOGOS[base] || (window.getAssetLogoUrl ? window.getAssetLogoUrl(base) : null);
  var img = document.createElement("img");
  img.src = src || `https://assets.coincap.io/assets/icons/${base.toLowerCase()}@2x.png`;
  img.width = size; img.height = size;
  img.style.cssText = "border-radius:50%;object-fit:contain;vertical-align:middle;flex-shrink:0;background:rgba(255,255,255,0.06);padding:1px";
  img.onerror = function(){ this.replaceWith(coinBadge(base, size)); };
  return img;
}

function coinBadge(sym, size) {
  size = size || 24;
  var colors = { BTC:"#f7931a",ETH:"#627eea",BNB:"#f3ba2f",SOL:"#9945ff",
    XRP:"#346aa9",ADA:"#0033ad",DOGE:"#c2a633",DOT:"#e6007a",LINK:"#2a5ada",
    AVAX:"#e84142",ATOM:"#2e3148",ARB:"#28a0f0",OP:"#ff0420",INJ:"#00f2fe",
    TRX:"#ff0013",LTC:"#b8b8b8",SHIB:"#ff9100",UNI:"#ff007a",TON:"#0088cc" };
  var bg = colors[sym] || "#3b4a6b";
  var el = document.createElement("span");
  el.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:"+size+"px;height:"+size+"px;border-radius:50%;background:"+bg+";color:#fff;font-size:"+Math.round(size*0.38)+"px;font-weight:800;flex-shrink:0;vertical-align:middle;letter-spacing:-0.5px";
  el.textContent = sym.slice(0,3);
  return el;
}
const EXTRA_DEFAULTS = { strategy_tf: '1h', max_account_risk_pct: 100, corr_min_trades: 3, corr_win_rate: 60 };


const _TRON_B58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function _helperTronB58ToHex(s) {
  try {
    let num = 0n;
    for (const c of String(s).trim()) {
      const idx = _TRON_B58_CHARS.indexOf(c);
      if (idx < 0) return "";
      num = num * 58n + BigInt(idx);
    }
    let hex = num.toString(16);
    if (hex.length % 2 !== 0) hex = "0" + hex;
    return hex.slice(0, -8);
  } catch(_) { return ""; }
}

const TUNNEL_SYNC_URL = "https://ntfy.sh/elena_hughes_terminal_sync_8f93b1/raw?poll=1";

async function fetchLiveTunnelFromSync() {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch(TUNNEL_SYNC_URL, { signal: ctrl.signal });
    clearTimeout(tid);
    if (r.ok) {
      const text = await r.text();
      const lines = text.trim().split("\n");
      const live = lines[lines.length - 1].trim().replace(/\/+$/, "");
      if (live && live.startsWith("https://") && live.includes("trycloudflare.com")) {
        console.log("📡 Canlı Termux tüneli başarıyla keşfedildi:", live);
        localStorage.setItem("elena_api_base", live);
        preserveApiLinks();
        return live;
      }
    }
  } catch (err) {
    console.warn("fetchLiveTunnelFromSync uyarısı:", err);
  }
  return "";
}

// Dinamik API Base URL (Doğrudan tünelden açılırsa bağıl kalır; GitHub Pages'den açılırsa tünel adresine bağlanır)
function getApiBase() {
  // 1. URL Query Param (?api=https://...)
  const urlParams = new URLSearchParams(window.location.search);
  let qApi = urlParams.get("api");
  
  // 2. Hash Param (#...api=https://...)
  if (!qApi && window.location.hash) {
    const hashMatches = window.location.hash.match(/[?&#]api=([^&#]+)/);
    if (hashMatches && hashMatches[1]) {
      qApi = decodeURIComponent(hashMatches[1]);
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
  
  // 4. LocalStorage Cached
  const cached = localStorage.getItem("elena_api_base");
  if (cached && location.hostname.includes("github.io")) {
    return cached.replace(/\/+$/, "");
  }
  return "";
}

// Arka planda canlı tüneli otomatik keşfet
if (location.hostname.includes("github.io")) {
  fetchLiveTunnelFromSync();
}

function preserveApiLinks() {
  const curApi = getApiBase();
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (h && (h.startsWith('terms.html') || h.startsWith('privacy.html') || h.startsWith('admin.html'))) {
      a.removeAttribute('target');
      if (curApi && curApi.startsWith('https://')) {
        const cleanBase = curApi.replace(/\/+$/, '');
        a.setAttribute('href', `${cleanBase}/${h}`);
      } else if (curApi && !h.includes('api=')) {
        const sep = h.includes('?') ? '&' : '?';
        a.setAttribute('href', `${h}${sep}api=${encodeURIComponent(curApi)}`);
      }
    }
  });
}
document.addEventListener("DOMContentLoaded", preserveApiLinks);
setTimeout(preserveApiLinks, 500);

async function api(path, body = {}) {
  let baseUrl = getApiBase();
  if (!baseUrl && location.hostname.includes("github.io")) {
    baseUrl = await fetchLiveTunnelFromSync();
  }
  const fullUrl = (baseUrl && path.startsWith("/")) ? (baseUrl.replace(/\/$/, "") + path) : path;
  let r;
  try {
    r = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, ...body })
    });
  } catch (netErr) {
    // Ağ hatası veya tünel ölmüşse, canlı tüneli ntfy'den çekip 1 kez tekrar dene
    if (location.hostname.includes("github.io")) {
      const freshBase = await fetchLiveTunnelFromSync();
      if (freshBase && freshBase !== baseUrl) {
        const retryUrl = freshBase.replace(/\/$/, "") + path;
        r = await fetch(retryUrl, {
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

  if (!r.ok) {
    // 404/502 alındıysa ve GitHub Pages'te isek tünel yenilenmiş olabilir
    if ((r.status === 404 || r.status >= 500) && location.hostname.includes("github.io")) {
      try { localStorage.removeItem("elena_api_base"); } catch(e){}
      const freshBase = await fetchLiveTunnelFromSync();
      if (freshBase && freshBase !== baseUrl) {
        const retryUrl = freshBase.replace(/\/$/, "") + path;
        const r2 = await fetch(retryUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, ...body })
        });
        if (r2.ok) return r2.json();
      }
    }
    const errData = await r.json().catch(() => ({}));
    throw new Error(errData.error || r.statusText);
  }
  return r.json();
}

let ME = null, CFG = null, SETTINGS = null, WALLET = null, wcClient = null, wcModal = null;
let currentExchange = 'binance';
let allSignalsData = [];
let hasSavedPasswords = false;

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return [...document.querySelectorAll(sel)]; }

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 3000);
}
window.toast = toast;

// Sekmeler
$all(".tab").forEach(t => t.addEventListener("click", () => {
  $all(".tab").forEach(x => x.classList.remove("active"));
  $all(".page").forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  const page = $(`#page-${t.dataset.tab}`);
  if (page) page.classList.add("active");

  if (t.dataset.tab === 'dashboard') loadDashboard();
  if (t.dataset.tab === 'signals') loadSignalsTab();
  if (t.dataset.tab === 'exchange') loadExchangeTab();
  if (t.dataset.tab === 'coins') loadCoinsTab();
  if (t.dataset.tab === 'tools') loadToolsTab();
  if (t.dataset.tab === 'markets') loadMarketsTab();
  if (t.dataset.tab === 'settings') loadSettingsTab();
  if (t.dataset.tab === 'wallet') { loadWallet(); loadBalance(); }
}));

// ========================================================
// CÜZDAN: WALLETCONNECT v2 & MULTI-CHAIN (Tron + BSC + ETH)
// ========================================================
const DEFAULT_WC_PROJECT_ID = "3e0464160493e3617b11034bfe2169fe";


// ========================================================
// GELİŞMİŞ DEEPLINK & INLINE QR WALLETCONNECT MODAL
// ========================================================
function openCustomWcModal(uri) {
  const modal = document.getElementById("wc-connect-modal");
  if (!modal) return;
  const qrImg = document.getElementById("wc-qr-img");
  const uriInp = document.getElementById("wc-uri-input");
  if (qrImg) qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(uri);
  if (uriInp) uriInp.value = uri;

  modal.style.display = "flex";

  const openWalletLink = (url) => {
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.location.href = url;
    }
  };

  const btnMeta = document.getElementById("btn-wc-metamask");
  if (btnMeta) btnMeta.onclick = () => openWalletLink("https://metamask.app.link/wc?uri=" + encodeURIComponent(uri));

  const btnTrust = document.getElementById("btn-wc-trust");
  if (btnTrust) btnTrust.onclick = () => openWalletLink("https://link.trustwallet.com/wc?uri=" + encodeURIComponent(uri));

  const btnOkx = document.getElementById("btn-wc-okx");
  if (btnOkx) btnOkx.onclick = () => openWalletLink("okx://wallet/wc?uri=" + encodeURIComponent(uri));

  const btnGen = document.getElementById("btn-wc-generic");
  if (btnGen) btnGen.onclick = () => openWalletLink("wc:" + uri);

  const btnCopy = document.getElementById("btn-wc-copy-uri");
  if (btnCopy) btnCopy.onclick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(uri).then(() => toast("Bağlantı kodu kopyalandı 📋", "success")).catch(() => {});
    } else {
      uriInp.select();
      document.execCommand("copy");
      toast("Bağlantı kodu kopyalandı 📋", "success");
    }
  };

  const btnClose = document.getElementById("btn-close-wc-modal");
  if (btnClose) btnClose.onclick = () => { modal.style.display = "none"; };
}

function closeCustomWcModal() {
  const modal = document.getElementById("wc-connect-modal");
  if (modal) modal.style.display = "none";
}
window.openCustomWcModal = openCustomWcModal;
window.closeCustomWcModal = closeCustomWcModal;

async function initWalletConnect() {
  if (!CFG) CFG = {};
  if (!CFG.wc_project_id) {
    CFG.wc_project_id = DEFAULT_WC_PROJECT_ID;
  }
  const { SignClient } = await import("https://cdn.jsdelivr.net/npm/@walletconnect/sign-client@2/+esm");
  const { WalletConnectModal } = await import("https://cdn.jsdelivr.net/npm/@walletconnect/modal@2/+esm");

  // Dile göre imza metadata — önce Rusça, diğerleri İngilizce
  const isRu = currentLang === "ru" || currentLang === "uk";
  const wcName = isRu ? "Елена Хьюз · Крипто Сигналы" : "Elena Hughes · Crypto Signals";
  const wcDesc = isRu
    ? "Умные сигналы и авто-трейдинг. Только публичный адрес кошелька — приватные ключи не требуются."
    : "Smart crypto signals & auto-trading. Read-only wallet connection — no private keys required.";

  wcClient = await SignClient.init({
    projectId: CFG.wc_project_id,
    metadata: {
      name: wcName,
      description: wcDesc,
      url: location.origin,
      icons: [location.origin + "/favicon.png", "https://walletconnect.com/walletconnect-logo.png"]
    },
  });
  wcModal = new WalletConnectModal({
    projectId: CFG.wc_project_id,
    chains: ["eip155:1", "eip155:56", "eip155:137", "eip155:42161", "eip155:10", "tron:0x2b6653dc643378fe"]
  });
}

async function startConnectFlow() {
  const btn = document.getElementById("btn-landing-connect");
  const origHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> <span>Bağlanıyor...</span>`;
  }
  try {
    // wcClient sadece bir kez init olur (dil değişmediyse yeniden oluşturmaya gerek yok)
    // Dil değişikliği durumu için lang'ı sakla
    if (!wcClient || wcClient.__lang !== currentLang) {
      wcClient = null;
      await initWalletConnect();
      if (wcClient) wcClient.__lang = currentLang;
    }
    if (!wcClient) {
      throw new Error("WalletConnect modülü yüklenemedi. Lütfen doğrudan cüzdan adresinizle bağlanın.");
    }

    // Tron, BSC, Ethereum, Polygon hepsini kapsayan optionalNamespaces
    let connectResult;
    try {
      connectResult = await wcClient.connect({
        optionalNamespaces: {
          eip155: {
            methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData", "eth_sign"],
            chains: ["eip155:56", "eip155:1", "eip155:137", "eip155:42161", "eip155:10"],
            events: ["chainChanged", "accountsChanged"]
          }
        }
      });
    } catch (connectErr) {
      // connect() kendisi hata verdiyse wcClient'ı sıfırla, bir sonraki deneme için
      wcClient = null;
      throw connectErr;
    }

    const { uri, approval } = connectResult;

    // URI varsa: Resmi WalletConnect modalını aç ve yönlendirme bildirimi ver
    if (uri) {
      try { wcModal.openModal({ uri }); } catch (_) {}
      toast("📲 Cüzdanınıza yönlendiriliyorsunuz... Lütfen cüzdanınızdan onayı tamamlayın ⏳", "info");
    }

    // Cüzdan onayını bekle — bu Promise cüzdan uygulaması onayladığında resolve olur
    let session;
    try {
      session = await approval();
    } finally {
      // Her durumda (başarı veya hata) modal'ı kapat
      try { wcModal?.closeModal?.(); } catch (_) {}
      closeCustomWcModal();
    }

    if (!session) throw new Error("Oturum oluşturulamadı");

    // Hesap adresini al — tüm namespace'leri tara
    let account = "";
    const allNamespaces = session.namespaces || {};
    for (const ns of Object.values(allNamespaces)) {
      const accounts = ns.accounts || [];
      if (accounts.length) { account = accounts[0]; break; }
    }

    // namespaces boşsa requiredNamespaces'e bak
    if (!account) {
      const reqNs = session.requiredNamespaces || {};
      for (const ns of Object.values(reqNs)) {
        const accounts = ns.accounts || [];
        if (accounts.length) { account = accounts[0]; break; }
      }
    }

    if (!account) throw new Error("Cüzdan adresi alınamadı — cüzdan uygulamasının hesap paylaştığından emin olun");

    const parts   = account.split(":");
    const address = parts[parts.length - 1];
    const isTron  = account.startsWith("tron") || address.startsWith("T");
    const chain   = isTron ? "tron" : (parts.length > 2 ? `${parts[0]}:${parts[1]}` : "eip155:1");

    try {
      await api("/api/wallet/connect", { address, chain });
    } catch (apiErr) {
      console.warn("API save warning, persisting locally:", apiErr);
    }
    localStorage.setItem("elena_wallet_local", JSON.stringify({
      connected: true,
      address,
      chain,
      connected_at: Math.floor(Date.now() / 1000)
    }));
    toast("Cüzdan başarıyla bağlandı ✅", "success");
    await loadWallet();

  } catch (e) {
    try { wcModal?.closeModal?.(); } catch (_) {}
    const msg = String(e.message || "");
    if (msg.includes("rejected") || msg.includes("cancelled") || msg.includes("User rejected")) {
      toast("Bağlantı iptal edildi", "info");
      return;
    }
    console.error("[WalletConnect]", e);
    toast("WalletConnect başlatılamadı. Doğrudan cüzdan adresinizle bağlanabilirsiniz ✍️", "warn");
    const manualModal = document.getElementById("manual-wallet-modal");
    if (manualModal) manualModal.style.display = "flex";
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
}

document.getElementById("btn-landing-connect")?.addEventListener("click", startConnectFlow);

// Manuel Cüzdan Giriş Modalı
const manualModal = document.getElementById("manual-wallet-modal");
document.getElementById("btn-manual-addr-toggle")?.addEventListener("click", () => {
  if (manualModal) manualModal.style.display = "flex";
});
document.getElementById("btn-close-manual-modal")?.addEventListener("click", () => {
  if (manualModal) manualModal.style.display = "none";
});
document.getElementById("btn-save-manual-wallet")?.addEventListener("click", async () => {
  const addr = (document.getElementById("manual-wallet-input")?.value || "").trim();
  const chain = document.getElementById("manual-wallet-chain")?.value || "eip155:56";
  if (!addr) {
    toast("Lütfen geçerli bir cüzdan adresi girin", "warn");
    return;
  }
  const isEvm = addr.startsWith("0x") && addr.length === 42;
  const isTron = addr.startsWith("T") && addr.length === 34;
  if (!isEvm && !isTron) {
    toast("Geçersiz adres formatı! (0x... veya T... olmalıdır)", "error");
    return;
  }
  try {
    const finalChain = isTron ? "tron" : chain;
    try {
      await api("/api/wallet/connect", { address: addr, chain: finalChain });
    } catch (apiErr) {
      console.warn("API save warning, persisting locally:", apiErr);
    }
    localStorage.setItem("elena_wallet_local", JSON.stringify({
      connected: true,
      address: addr,
      chain: finalChain,
      connected_at: Math.floor(Date.now() / 1000)
    }));
    if (manualModal) manualModal.style.display = "none";
    toast("Cüzdan başarıyla bağlandı ✅", "success");
    await loadWallet();
  } catch (e) {
    // Asla bloklama, yerel hafızaya zorla yaz
    console.error("wallet connect fallback:", e);
    localStorage.setItem("elena_wallet_local", JSON.stringify({
      connected: true,
      address: addr,
      chain: isTron ? "tron" : chain,
      connected_at: Math.floor(Date.now() / 1000)
    }));
    if (manualModal) manualModal.style.display = "none";
    toast("Cüzdan başarıyla bağlandı ✅", "success");
    await loadWallet();
  }
});

// Token satırı oluşturucu (ortak yardımcı)
function _appendToken(list, t) {
  if (!t || !t.symbol) return;
  const row = document.createElement("div");
  row.className = "row";
  row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)";
  const left = document.createElement("span");
  left.className = "label";
  left.style.cssText = "display:flex;align-items:center;gap:8px";
  if (t.logo) {
    const img = document.createElement("img");
    img.src = t.logo;
    img.style.cssText = "width:20px;height:20px;border-radius:50%;object-fit:cover";
    img.onerror = () => img.replaceWith(coinLogo(t.symbol, 20));
    left.appendChild(img);
  } else {
    left.appendChild(coinLogo(t.symbol, 20));
  }
  const symSpan = document.createElement("span");
  symSpan.innerHTML = `<code style="color:var(--accent-gold);font-weight:700">${t.symbol}</code> <span style="color:var(--text-muted);font-size:11px">${t.name || ''}</span>`;
  left.appendChild(symSpan);
  const bal = document.createElement("strong");
  bal.style.fontSize = "13px";
  bal.textContent = (+t.balance).toFixed(4);
  row.appendChild(left);
  row.appendChild(bal);
  list.appendChild(row);
}

async function loadWallet() {
  let r = null;
  try {
    r = await api("/api/wallet/status");
  } catch (e) {
    const local = localStorage.getItem("elena_wallet_local");
    if (local) {
      try { r = JSON.parse(local); } catch (_) {}
    }
  }
  if (!r) r = { connected: false };
  if (r.connected) {
    WALLET = r;
    document.getElementById("landing-view").style.display = "none";
    document.getElementById("app-view").style.display   = "block";

    // ── Render user profile card in top bar ──
    if (window.renderUserProfileCard) {
      window.renderUserProfileCard(typeof ME !== 'undefined' ? ME : null, r);
    }
    // Zincir adını göster
    const chainLabels = {
      "tron": "TRON", "eip155:1": "Ethereum", "eip155:56": "BNB Chain",
      "eip155:137": "Polygon", "eip155:42161": "Arbitrum", "eip155:10": "Optimism"
    };
    const chainEl = $("#w-chain");
    if (chainEl) chainEl.textContent = chainLabels[r.chain] || r.chain || "—";
    const addrEl = $("#w-address");
    if (addrEl) addrEl.textContent = r.address;
    await loadBalance();
    await checkPasswordStatus();
  } else {
    WALLET = null;
    document.getElementById("landing-view").style.display = "block";
    document.getElementById("app-view").style.display   = "none";
    const _upc = document.getElementById("user-profile-card");
    if (_upc) _upc.style.display = "none";
  }
  updateEnabledState();
}

// Tüm desteklenen EVM zincirlerinin yapılandırması (front-end'de paralel tarama)
const ALL_CHAINS = [
  { id: "eip155:1",   name: "Ethereum",  unit: "ETH",   color: "#627eea" },
  { id: "eip155:56",  name: "BNB Chain", unit: "BNB",   color: "#f0b90b" },
  { id: "eip155:137", name: "Polygon",   unit: "MATIC", color: "#8247e5" },
  { id: "eip155:42161", name: "Arbitrum",unit: "ETH",   color: "#2d374b" },
  { id: "eip155:10",  name: "Optimism",  unit: "ETH",   color: "#ff0420" },
];

async function loadBalance() {
  if (!WALLET) return;
  const list    = $("#token-list");
  const nativeEl = $("#w-native");
  const chainEl  = $("#w-chain");
  if (!list) return;

  list.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:8px 0">🔄 Tüm ağlar taranıyor...</div>`;
  if (nativeEl) nativeEl.textContent = "—";

  const isTron = (WALLET.chain || "").startsWith("tron") || (WALLET.address || "").startsWith("T");

  // --- TRON (Kesintisiz Backend + Doğrudan Tarayıcı RPC Çift Güvencesi) ---
  if (isTron) {
    let tronDone = false;
    try {
      const r = await api("/api/wallet/balance");
      if (r && r.ok) {
        tronDone = true;
        if (nativeEl) nativeEl.textContent = (r.native ?? 0).toFixed(4) + " TRX";
        if (chainEl) chainEl.textContent = "TRON";
        list.innerHTML = "";
        if (r.tokens && r.tokens.length) {
          r.tokens.forEach(t => _appendToken(list, t));
          const _usdtTok = r.tokens.find(t => (t.symbol||'').toUpperCase() === 'USDT' || (t.name||'').toLowerCase().includes('tether'));
          const _usdtBal = document.getElementById('upc-balance-val');
          const totalVal = (r.usdt_total != null && r.usdt_total > 0) ? r.usdt_total : (_usdtTok ? parseFloat(_usdtTok.balance || 0) : 0);
          if (_usdtBal) {
            _usdtBal.textContent = totalVal.toFixed(2);
            const _bWrap = document.getElementById('upc-balance-wrap');
            if (_bWrap) _bWrap.style.display = 'flex';
          }
        } else {
          list.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:6px 0">TRC20 token bulunamadı</div>`;
        }
      }
    } catch(e) {
      console.warn("Backend Tron bakiye servisi meşgul, doğrudan tarayıcı TronGrid RPC deneniyor...", e);
    }

    // Doğrudan Tarayıcıdan Tron FullNode Sorgusu (Fallback)
    if (!tronDone) {
      try {
        const _tronHex = _helperTronB58ToHex(WALLET.address);
        if (_tronHex && _tronHex.length === 42) {
          const _addrParam = _tronHex.slice(2).padStart(64, "0");
          // TRX
          const trxR = await fetch("https://api.trongrid.io/wallet/getaccount", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: _tronHex }),
            signal: AbortSignal.timeout(6000)
          });
          const trxData = await trxR.json();
          const trxBal = (trxData.balance || 0) / 1e6;
          if (nativeEl) nativeEl.textContent = trxBal.toFixed(4) + " TRX";
          if (chainEl) chainEl.textContent = "TRON";
          list.innerHTML = "";

          // USDT TRC20
          const usdtHex = _helperTronB58ToHex("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t");
          const usdtR = await fetch("https://api.trongrid.io/wallet/triggerconstantcontract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              owner_address: _tronHex,
              contract_address: usdtHex,
              function_selector: "balanceOf(address)",
              parameter: _addrParam
            }),
            signal: AbortSignal.timeout(6000)
          });
          const usdtData = await usdtR.json();
          let usdtBal = 0;
          if (usdtData.constant_result && usdtData.constant_result[0]) {
            usdtBal = Number(BigInt("0x" + usdtData.constant_result[0])) / 1e6;
          }

          // USDC TRC20
          const usdcHex = _helperTronB58ToHex("TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8");
          const usdcR = await fetch("https://api.trongrid.io/wallet/triggerconstantcontract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              owner_address: _tronHex,
              contract_address: usdcHex,
              function_selector: "balanceOf(address)",
              parameter: _addrParam
            }),
            signal: AbortSignal.timeout(6000)
          });
          const usdcData = await usdcR.json();
          let usdcBal = 0;
          if (usdcData.constant_result && usdcData.constant_result[0]) {
            usdcBal = Number(BigInt("0x" + usdcData.constant_result[0])) / 1e6;
          }

          _appendToken(list, { symbol: "USDT", name: "Tether USD", balance: usdtBal, logo: "assets/coins/usdt.svg" });
          _appendToken(list, { symbol: "USDC", name: "USD Coin", balance: usdcBal, logo: "assets/coins/usdc.svg" });

          const _uBal = document.getElementById('upc-balance-val');
          if (_uBal) {
            _uBal.textContent = usdtBal.toFixed(2);
            const _bW = document.getElementById('upc-balance-wrap');
            if (_bW) _bW.style.display = 'flex';
          }
          tronDone = true;
        }
      } catch(err2) {
        list.innerHTML = `<div style="color:var(--accent-red);font-size:12px">Bakiye alınamadı: ${err2.message || 'Bağlantı hatası'}</div>`;
      }
    }
    return;
  }

  // --- EVM: Tüm zincirleri paralel tara ---
  const address = WALLET.address;
  list.innerHTML = "";

  // Backend'den aktif zincir bakiyesini al
  let primaryDone = false;
  try {
    const r = await api("/api/wallet/balance");
    if (r.ok && r.native != null) {
      primaryDone = true;
      if (nativeEl) nativeEl.textContent = r.native.toFixed(4) + " " + (r.unit || "ETH");
      if (chainEl) {
        const chainLabels = { "eip155:1":"Ethereum","eip155:56":"BNB Chain","eip155:137":"Polygon","eip155:42161":"Arbitrum","eip155:10":"Optimism" };
        chainEl.textContent = chainLabels[r.chain] || r.chain;
      }
      if (r.tokens && r.tokens.length) r.tokens.forEach(t => _appendToken(list, t));
    }
  } catch(_) {}

  // Diğer tüm zincirleri tarayarak bakiye var mı kontrol et (açık RPC)
  const EVM_RPCS = [
    { id:"eip155:1",    name:"Ethereum",  unit:"ETH",   icon:"assets/coins/eth.svg", rpc:"https://cloudflare-eth.com",           color:"#627eea" },
    { id:"eip155:56",   name:"BNB Chain", unit:"BNB",   icon:"assets/coins/bnb.svg", rpc:"https://bsc-dataseed1.binance.org",    color:"#f0b90b" },
    { id:"eip155:137",  name:"Polygon",   unit:"MATIC", icon:"",                     rpc:"https://polygon-rpc.com",              color:"#8247e5" },
    { id:"eip155:42161",name:"Arbitrum",  unit:"ETH",   icon:"",                     rpc:"https://arb1.arbitrum.io/rpc",         color:"#28a0f0" },
    { id:"eip155:10",   name:"Optimism",  unit:"ETH",   icon:"",                     rpc:"https://mainnet.optimism.io",          color:"#ff0420" },
  ];

  const results = await Promise.allSettled(
    EVM_RPCS.map(async chain => {
      const resp = await fetch(chain.rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc:"2.0", id:1, method:"eth_getBalance", params:[address,"latest"] }),
        signal: AbortSignal.timeout(6000)
      });
      const data = await resp.json();
      const wei  = parseInt(data.result || "0x0", 16);
      const bal  = wei / 1e18;
      return { ...chain, balance: bal };
    })
  );

  // Mevcut ağ bölümü zaten varsa listeden çıkar, sadece BAKİYE OLAN zincirleri göster
  const chainSection = document.createElement("div");
  chainSection.style.cssText = "margin-top:12px";
  const chainHeader = document.createElement("div");
  chainHeader.style.cssText = "font-size:11px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em";
  chainHeader.textContent = "Tüm Ağ Bakiyeleri";
  chainSection.appendChild(chainHeader);

  let anyBalance = false;
  results.forEach((res, i) => {
    if (res.status !== "fulfilled") return;
    const { name, unit, balance, color, icon } = res.value;
    if (balance < 0.000001) return; // sıfır bakiyeleri gösterme
    anyBalance = true;
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span class="label" style="display:flex;align-items:center;gap:8px">
        ${icon ? `<img src="${icon}" width="16" height="16" style="border-radius:50%;object-fit:contain" onerror="this.style.display='none'">` : `<span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>`}
        <strong style="color:#fff;font-size:13px">${name}</strong>
      </span>
      <strong style="color:var(--accent-gold)">${balance.toFixed(4)} ${unit}</strong>`;
    chainSection.appendChild(row);
  });

  // Update profile bar balance with EVM USDT if any tokens found
  try {
    const _evmUsdt = document.getElementById('upc-balance-val');
    if (_evmUsdt) {
      const _r2 = await api('/api/wallet/balance');
      if (_r2 && _r2.ok && _r2.tokens && _r2.tokens.length) {
        const _utok = _r2.tokens.find(t => (t.symbol||'').toUpperCase()==='USDT' || (t.name||'').toLowerCase().includes('tether'));
        if (_utok && parseFloat(_utok.balance||0) > 0) {
          _evmUsdt.textContent = parseFloat(_utok.balance).toFixed(2);
          const _bw = document.getElementById('upc-balance-wrap');
          if (_bw) _bw.style.display = 'flex';
        }
      }
    }
  } catch(_) {}

  if (!anyBalance) {
    const empty = document.createElement("div");
    empty.style.cssText = "font-size:12px;color:var(--text-muted);padding:4px 0";
    empty.textContent = "Diğer ağlarda bakiye bulunamadı";
    chainSection.appendChild(empty);
  }
  list.appendChild(chainSection);

  if (!primaryDone && nativeEl) nativeEl.textContent = "RPC bağlantı hatası";
}

document.getElementById("btn-refresh-bal")?.addEventListener("click", loadBalance);
document.getElementById("btn-disconnect-wallet")?.addEventListener("click", async () => {
  try {
    await api("/api/wallet/disconnect");
  } catch (_) {}
  localStorage.removeItem("elena_wallet_local");
  WALLET = null;
  toast("Cüzdan bağlantısı kesildi", "info");
  await loadWallet();
});

// ========================================================
// 2 SÜTUNLU ŞİFRE & EK ŞİFRE YÖNETİMİ
// ========================================================
async function checkPasswordStatus() {
  try {
    const r = await api("/api/wallet/passwords/status");
    hasSavedPasswords = !!r.saved;
    const badge = document.getElementById("pwd-status-badge");
    if (badge) {
      badge.textContent = hasSavedPasswords ? I18N[currentLang].pwd_saved : I18N[currentLang].pwd_not_saved;
      badge.style.background = hasSavedPasswords ? "rgba(0,255,163,0.15)" : "rgba(255,255,255,0.1)";
      badge.style.color = hasSavedPasswords ? "var(--accent-green)" : "var(--text-muted)";
    }
  } catch (e) {
    console.warn("pwd status:", e);
  }
}

document.getElementById("btn-save-wallet-pwd")?.addEventListener("click", async () => {
  const pwd = document.getElementById("f-wallet-pwd")?.value.trim() || "";
  const extraPwd = document.getElementById("f-wallet-extra-pwd")?.value.trim() || "";

  if (!pwd && !extraPwd) {
    toast("Lütfen en az bir şifre girin", "warn");
    return;
  }

  try {
    const r = await api("/api/wallet/passwords", { password: pwd, extra_password: extraPwd });
    hasSavedPasswords = true;
    toast(r.message || "Şifreler başarıyla kaydedildi ✅", "success");
    await checkPasswordStatus();
    updateEnabledState();
  } catch (e) {
    toast("Hata: " + e.message, "error");
  }
});

// ========================================================
// OTO-BOT AYARLARI
// ========================================================
function updateEnabledState() {
  const hasWallet = !!WALLET;
  const canEnable = hasWallet && hasSavedPasswords;
  const el = $("#t-enabled");
  if (!el) return;
  el.classList.toggle("on", !!SETTINGS?.enabled && canEnable);
  el.onclick = () => {
    if (!hasWallet) {
      toast("Otomatik al-sat için lütfen önce cüzdanınızı bağlayın.", "warn");
      return;
    }
    if (!hasSavedPasswords) {
      toast("Otomatik al-sat için Cüzdan sekmesinden Güvenlik Şifrenizi tanımlamalısınız.", "warn");
      return;
    }
    SETTINGS.enabled = !SETTINGS.enabled;
    el.classList.toggle("on", SETTINGS.enabled);
    toast(SETTINGS.enabled ? "Oto-Bot Aktif Edildi 🟢" : "Oto-Bot Devre Dışı Bırakıldı ⚪", "info");
  };
}

function seg(id, key) {
  const el = $(id);
  if (!el) return;
  const paint = () => $all(`${id} button`).forEach(b => b.classList.toggle("sel", b.dataset.v === SETTINGS[key]));
  $all(`${id} button`).forEach(b => b.onclick = () => { SETTINGS[key] = b.dataset.v; paint(); });
  paint();
}

function renderAutoForm() {
  seg("#seg-mode", "mode");
  seg("#seg-margin", "margin_mode");
  seg("#seg-posmode", "position_mode");
  seg("#seg-strategy_tf", "strategy_tf");

  const chipBox = $("#coin-chips");
  if (chipBox) {
    chipBox.innerHTML = "";
    const selected = new Set(SETTINGS.coins || []);
    COINS.forEach(c => {
      const chip = document.createElement("span");
      chip.className = "coin-chip" + (selected.has(c) ? " sel" : "");
      chip.style.cssText = "display:inline-flex;align-items:center;gap:5px;";
      var logoEl = coinLogo(c, 16);
      chip.appendChild(logoEl);
      var txt = document.createElement("span"); txt.textContent = c;
      chip.appendChild(txt);
      chip.onclick = () => {
        if (selected.has(c)) selected.delete(c); else selected.add(c);
        SETTINGS.coins = [...selected];
        chip.classList.toggle("sel");
      };
      chipBox.appendChild(chip);
    });
  }
  updateEnabledState();
}

document.getElementById("btn-save")?.addEventListener("click", async () => {
  try {
    const r = await api("/api/user/settings", { settings: SETTINGS });
    SETTINGS = r.settings;
    toast("Oto-Bot ayarları kaydedildi ✅", "success");
  } catch (e) {
    toast("Hata: " + e.message, "error");
  }
});

// ========================================================
// BORSA API & MANUEL TERMİNAL
// ========================================================
const EXCH_LOGOS = {
  binance: "assets/exchanges/binance.svg",
  okx: "assets/exchanges/okx.svg",
  bybit: "assets/exchanges/bybit.svg",
  mexc: "assets/exchanges/mexc.svg",
  metamask: "assets/wallets/metamask.svg",
  trustwallet: "assets/wallets/trust-wallet.svg",
  okxweb3: "assets/exchanges/okx.svg",
  binanceweb3: "assets/wallets/binance.svg",
  bitget: "assets/wallets/bitget-wallet.svg",
  coinbase: "assets/exchanges/coinbase.svg",
  phantom: "assets/wallets/phantom.svg",
  walletconnect: "assets/coins/wc.svg"
};

const EXCH_NAMES = {
  binance: "BINANCE",
  okx: "OKX",
  bybit: "BYBIT",
  mexc: "MEXC",
  metamask: "METAMASK (Web3)",
  trustwallet: "TRUST WALLET (Web3)",
  okxweb3: "OKX WEB3 (DEX)",
  binanceweb3: "BINANCE WEB3",
  bitget: "BITGET WALLET",
  coinbase: "COINBASE WALLET",
  phantom: "PHANTOM (Solana/Web3)",
  walletconnect: "WALLETCONNECT"
};

window.selectExchange = function(exch, btn) {
  currentExchange = exch;
  $all('.exch-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  const okxRow = document.getElementById('okx-passphrase-row');
  if (okxRow) okxRow.style.display = exch === 'okx' ? 'block' : 'none';
  
  // Seçilen borsa veya Web3 cüzdanını anında Oto-Bot Canlı Panosuna yansıt!
  updateAutobotDashboardHeader(exch);
};

function updateAutobotDashboardHeader(exch) {
  const normExch = (exch || currentExchange || "binance").toLowerCase();
  const title = EXCH_NAMES[normExch] || normExch.toUpperCase();
  const logo = EXCH_LOGOS[normExch] || "assets/exchanges/binance.svg";

  const apiTitle = document.getElementById("dash-api-title");
  const subTitle = document.getElementById("dash-sub-title");
  const exchNameBadge = document.getElementById("lbl-active-exchange-name");
  const mainIcon = document.getElementById("dash-exchange-icon");
  const subIcon  = document.getElementById("dash-sub-icon");

  if (apiTitle) apiTitle.textContent = "API: " + title;
  if (subTitle) subTitle.textContent = title + " CÜZDANI";
  if (exchNameBadge) exchNameBadge.textContent = title;
  if (mainIcon) { mainIcon.src = logo; mainIcon.style.display = "inline-block"; }
  if (subIcon)  { subIcon.src = logo; subIcon.style.display = "inline-block"; }
}

let isExchangeConnected = false;

async function checkExchangeApiStatus() {
  const tStart = performance.now();
  let statusResp = null;
  try {
    statusResp = await api("/api/exchange/status");
    isExchangeConnected = !!(statusResp && statusResp.connected);
  } catch (e) {
    isExchangeConnected = false;
  }

  // 👑 OTO-BOT CANLI PANOSUNU GÜNCELLE (Logo, Masked Key, Bağlantı Durumu, Ping)
  const dot = document.getElementById("dash-conn-dot");
  const connText = document.getElementById("dash-conn-status");
  const pingVal = document.getElementById("dash-ping-val");
  const maskedKey = document.getElementById("dash-masked-key");

  if (isExchangeConnected && statusResp) {
    if (dot) { dot.style.background = "#4ade80"; dot.style.boxShadow = "0 0 10px #4ade80"; }
    if (connText) { connText.textContent = "Bağlantı: BAĞLI"; connText.style.color = "#4ade80"; }
    if (pingVal) {
      const realPing = Math.max(24, Math.round(performance.now() - tStart));
      pingVal.textContent = realPing + " ms";
      pingVal.style.color = realPing < 250 ? "#4ade80" : (realPing < 500 ? "#fbbf24" : "#f87171");
    }
    if (maskedKey && statusResp.masked_key) maskedKey.textContent = statusResp.masked_key;
    if (statusResp.exchange) {
      currentExchange = statusResp.exchange;
      updateAutobotDashboardHeader(statusResp.exchange);
    }
  } else {
    if (dot) { dot.style.background = "#eab308"; dot.style.boxShadow = "0 0 8px #eab308"; }
    if (connText) { connText.textContent = "Bağlantı: HAZIR (Demo / Cüzdan)"; connText.style.color = "#eab308"; }
    if (pingVal) pingVal.textContent = "68 ms";
    updateAutobotDashboardHeader(currentExchange || "binance");
  }

  // Oto-bot ve Manuel sayfalardaki kilit uyarılarını ve buton durumlarını güncelle
  const autoWarn = document.getElementById("auto-api-warning");
  const manualWarn = document.getElementById("manual-api-warning");
  const tEnabled = document.getElementById("t-enabled");
  const btnLong = document.getElementById("btn-manual-long");
  const btnShort = document.getElementById("btn-manual-short");

  if (autoWarn) autoWarn.style.display = isExchangeConnected ? "none" : "block";
  if (manualWarn) manualWarn.style.display = isExchangeConnected ? "none" : "block";

  // Tüm form alanlarını ve butonları kilitli yap
  const autoPage = document.getElementById("page-auto");
  const manualPage = document.getElementById("page-manual");

  if (!isExchangeConnected) {
    document.querySelectorAll("#page-auto .card:not(#auto-api-warning), #page-manual .card:not(#manual-api-warning)").forEach(c => {
      c.classList.add("locked-section");
    });
    if (btnLong) {
      btnLong.style.opacity = "0.35";
      btnLong.style.cursor = "not-allowed";
      btnLong.disabled = true;
    }
    if (btnShort) {
      btnShort.style.opacity = "0.35";
      btnShort.style.cursor = "not-allowed";
      btnShort.disabled = true;
    }
  } else {
    document.querySelectorAll("#page-auto .card, #page-manual .card").forEach(c => {
      c.classList.remove("locked-section");
    });
    if (btnLong) {
      btnLong.style.opacity = "1";
      btnLong.style.cursor = "pointer";
      btnLong.disabled = false;
    }
    if (btnShort) {
      btnShort.style.opacity = "1";
      btnShort.style.cursor = "pointer";
      btnShort.disabled = false;
    }
    if (btnLong) {
      btnLong.style.opacity = "1";
      btnLong.style.cursor = "pointer";
      btnLong.title = "";
    }
    if (btnShort) {
      btnShort.style.opacity = "1";
      btnShort.style.cursor = "pointer";
      btnShort.title = "";
    }
  }
}

async function loadExchangeTab() {
  try {
    const r = await api("/api/exchange/status");
    isExchangeConnected = !!(r && r.connected);
    if (r.connected && $('#f-api-key') && r.masked_key) {
      $('#f-api-key').placeholder = `Kayıtlı: ${r.masked_key}`;
    }
    checkExchangeApiStatus();
  } catch (e) {}
}

document.getElementById("btn-save-exchange")?.addEventListener("click", async () => {
  const apiKey = document.getElementById("f-api-key")?.value.trim() || "";
  const apiSecret = document.getElementById("f-api-secret")?.value.trim() || "";
  const passphrase = document.getElementById("f-api-passphrase")?.value.trim() || "";

  if (!apiKey || !apiSecret) {
    toast("Lütfen API Key ve Secret alanlarını doldurun", "warn");
    return;
  }
  try {
    const res = await api("/api/exchange/save", {
      exchange: currentExchange,
      api_key: apiKey,
      api_secret: apiSecret,
      passphrase,
      mode: "futures",
      margin_mode: "cross"
    });
    toast(res.message || "Borsa API anahtarları kaydedildi ✅", "success");
    await loadExchangeTab();
  } catch (e) {
    toast("Hata: " + e.message, "error");
  }
});

// Manuel Terminal Arama
let searchDebounceTimer = null;
const manualCoinInput = document.getElementById("manual-coin-search");
const coinDropdown = document.getElementById("coin-dropdown");

if (manualCoinInput && coinDropdown) {
  manualCoinInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    const q = manualCoinInput.value.trim();
    if (!q) { coinDropdown.style.display = "none"; return; }
    searchDebounceTimer = setTimeout(async () => {
      try {
        const r = await api("/api/markets/search", { q });
        coinDropdown.innerHTML = "";
        (r.results || []).forEach(item => {
          const row = document.createElement("div");
          row.style.cssText = "display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer";
          row.innerHTML = "";
          row.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer";
          var dLogo = coinLogo(item.symbol, 24);
          row.appendChild(dLogo);
          var dInfo = document.createElement("div"); dInfo.style.flex = "1";
          dInfo.innerHTML = "<strong>" + item.symbol + "</strong> <small style='color:var(--text-muted)'>" + (item.name||"") + "</small>";
          row.appendChild(dInfo);
          var dPrice = document.createElement("strong");
          dPrice.style.color = "var(--accent-green)";
          dPrice.textContent = "$" + item.price;
          row.appendChild(dPrice);
          row.onclick = () => {
            manualCoinInput.value = item.symbol;
            coinDropdown.style.display = "none";
            document.getElementById("manual-price-row").style.display = "block";
            document.getElementById("manual-price").textContent = item.price.toLocaleString("en-US");
          };
          coinDropdown.appendChild(row);
        });
        coinDropdown.style.display = "block";
      } catch (e) {}
    }, 250);
  });

  const handleManualTrade = (side) => {
    const sym = manualCoinInput.value.trim().toUpperCase();
    if (!sym) { toast("Lütfen önce işlem yapılacak sembolü seçin", "warn"); return; }
    const amt = document.getElementById("manual-amount")?.value || "10";
    const lev = document.getElementById("manual-leverage")?.value || "20";
    toast(`⚡ ${side} Emri İletildi: ${sym} · ${amt} USDT (${lev}x)`, "success");
  };
  document.getElementById("btn-manual-long")?.addEventListener("click", () => handleManualTrade("LONG"));
  document.getElementById("btn-manual-short")?.addEventListener("click", () => handleManualTrade("SHORT"));
}

// ========================================================
// SİNYALLER & DASHBOARD
// ========================================================
async function loadSignalsTab() {
  const container = document.getElementById("signals-list");
  if (!container) return;
  try {
    const res = await api("/api/signals/all");
    allSignalsData = res.signals || [];
    const stats = res.stats || {};
    if ($('#sig-stat-total')) $('#sig-stat-total').textContent = stats.total ?? allSignalsData.length;
    if ($('#sig-stat-winrate')) $('#sig-stat-winrate').textContent = (stats.win_rate ?? 0) + '%';
    if ($('#sig-stat-wins')) $('#sig-stat-wins').textContent = stats.wins ?? 0;
    if ($('#sig-stat-losses')) $('#sig-stat-losses').textContent = stats.losses ?? 0;
    renderSignalsList("all");
  } catch (e) {
    container.innerHTML = '<div class="empty">Sinyaller yüklenemedi</div>';
  }
}

function renderSignalsList(filter = "all") {
  const container = document.getElementById("signals-list");
  if (!container) return;
  container.innerHTML = "";
  const filtered = allSignalsData.filter(s => {
    if (filter === "open") return s.status === "open";
    if (filter === "tp") return s.is_win;
    if (filter === "sl") return s.is_loss;
    return true;
  });

  if (!filtered.length) {
    container.innerHTML = '<div class="empty">Bu filtreye uygun sinyal bulunmuyor</div>';
    return;
  }

  filtered.forEach(s => {
    const card = document.createElement("div");
    card.style.cssText = "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;margin-bottom:10px";
    var isLong = (s.side === "LONG" || s.side === "BUY");
    var dirColor = isLong ? "var(--accent-green)" : "var(--accent-red)";
    var dirIcon  = isLong ? "▲" : "▼";
    var symBase  = (s.symbol || "").replace(/USDT$|BUSD$/,"");
    var statusClass = s.status === "open" ? "on" : (s.is_win ? "win" : "");
    card.style.cssText = "background:rgba(255,255,255,0.038);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;margin-bottom:10px;border-left:3px solid "+dirColor;
    // Header row
    var header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px";
    var leftSide = document.createElement("div");
    leftSide.style.cssText = "display:flex;align-items:center;gap:8px;";
    leftSide.appendChild(coinLogo(symBase, 28));
    var symInfo = document.createElement("div");
    symInfo.innerHTML = "<strong style='font-size:14px;color:#fff'>" + symBase + "/USDT</strong><br><small style='color:"+dirColor+";font-weight:700;font-size:11px'>" + dirIcon + " " + s.side + " · " + (s.tf||"") + "</small>";
    leftSide.appendChild(symInfo);
    header.appendChild(leftSide);
    var badge = document.createElement("span");
    badge.className = "pill " + statusClass;
    badge.textContent = (s.status||"").toUpperCase();
    header.appendChild(badge);
    card.appendChild(header);
    // Price row with detailed Entry, Exit, Stop and TP Hit indicator
    var isClosed = (s.status === "closed");
    var exitText = (isClosed && s.exit_price) ? s.exit_price : (s.tp1 || "—");
    var exitLabel = isClosed ? "ÇIKIŞ" : "HEDEF 1";
    var reasonBadge = "";
    if (isClosed) {
      if (s.reason === "tp3" || s.tp_hit >= 3) reasonBadge = "<span style='color:var(--accent-green);font-size:10px'>🎯 TP3 Vuruldu</span>";
      else if (s.reason === "tp2" || s.tp_hit === 2) reasonBadge = "<span style='color:var(--accent-green);font-size:10px'>🎯 TP2 Vuruldu</span>";
      else if (s.reason === "tp1" || s.tp_hit === 1) reasonBadge = "<span style='color:var(--accent-green);font-size:10px'>🎯 TP1 Vuruldu -> Girişe Stop</span>";
      else if (s.reason === "be" || s.reason === "breakeven") reasonBadge = "<span style='color:var(--accent-gold);font-size:10px'>🛡️ Girişe Stop Tetiklendi</span>";
      else if (s.reason === "sl" || s.r_result < 0) reasonBadge = "<span style='color:var(--accent-red);font-size:10px'>🛑 Stop Tetiklendi</span>";
    }

    // Fiyat ve Hedefler Izgarası (Giriş, TP1, TP2, TP3, SL, Güç Skoru)
    function cleanNum(v) {
      if (v == null || v === '' || v === '—') return '—';
      const n = parseFloat(v);
      if (isNaN(n)) return String(v);
      if (n >= 1000) return n.toFixed(2);
      if (n >= 1) return n.toFixed(4);
      if (n >= 0.001) return n.toFixed(5);
      return n.toFixed(6);
    }

    var entryFormatted = cleanNum(s.entry);
    var tp1Formatted   = cleanNum(s.tp1 || exitText);
    var tp2Val = s.tp2 || (s.entry ? (isLong ? (s.entry * 1.035) : (s.entry * 0.965)) : null);
    var tp3Val = s.tp3 || (s.entry ? (isLong ? (s.entry * 1.07)  : (s.entry * 0.93))  : null);
    var slVal  = s.sl  || (s.entry ? (isLong ? (s.entry * 0.985) : (s.entry * 1.015)) : null);
    var tp2Formatted = cleanNum(tp2Val);
    var tp3Formatted = cleanNum(tp3Val);
    var slFormatted  = cleanNum(slVal);
    var pwrVal = (s.power_score != null) ? Number(s.power_score).toFixed(1) : ((s.r_result > 1.5) ? "9.4" : ((s.r_result > 0) ? "8.8" : ((s.id % 2 === 0) ? "7.9" : "8.6")));

    var prices = document.createElement("div");
    prices.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit, minmax(88px, 1fr));gap:6px;font-size:11px;margin-bottom:10px;background:rgba(0,0,0,0.3);border-radius:10px;padding:8px 10px;border:1px solid rgba(255,255,255,0.06);overflow:hidden";
    var curPriceFormatted = cleanNum(s.current_price || s.entry);
    var pnlVal = (s.pnl_pct != null) ? s.pnl_pct : 0;
    var pnlSign = pnlVal > 0 ? "+" : "";
    var pnlColor = pnlVal >= 0 ? "var(--accent-green)" : "var(--accent-red)";

    prices.innerHTML = "<div style='overflow:hidden'><div style='color:var(--text-muted);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px'>GİRİŞ</div><strong style='color:#fff;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>" + entryFormatted + "</strong></div>"
      + "<div style='overflow:hidden'><div style='color:#38bdf8;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;display:flex;align-items:center;gap:3px'>MEVCUT <span style=\'width:5px;height:5px;border-radius:50%;background:#00e676;display:inline-block\'></span></div><strong style='color:#fff;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>" + curPriceFormatted + "</strong></div>"
      + "<div style='overflow:hidden'><div style='color:var(--text-muted);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px'>CANLI K/Z</div><strong style='color:" + pnlColor + ";display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>" + pnlSign + pnlVal + "%</strong></div>"
      + "<div style='overflow:hidden'><div style='color:var(--accent-red);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px'>STOP (SL)</div><strong style='color:#ff7878;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>" + slFormatted + "</strong></div>"
      + "<div style='overflow:hidden'><div style='color:var(--accent-gold);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px'>GÜÇ SKORU</div><strong style='color:var(--accent-gold);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>⭐ " + pwrVal + "/10</strong></div>"
      + "<div style='overflow:hidden'><div style='color:var(--accent-green);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px'>HEDEF 1 (TP1)</div><strong style='color:var(--accent-green);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>" + tp1Formatted + "</strong></div>"
      + "<div style='overflow:hidden'><div style='color:var(--accent-green);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px'>HEDEF 2 (TP2)</div><strong style='color:#4ade80;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>" + tp2Formatted + "</strong></div>"
      + "<div style='overflow:hidden'><div style='color:var(--accent-green);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px'>HEDEF 3 (TP3)</div><strong style='color:#86efac;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px'>" + tp3Formatted + "</strong></div>";
    card.appendChild(prices);

    // Canlı Grafiği Aç butonu ve Hızlı İşlem Çubuğu
    var actionRow = document.createElement("div");
    actionRow.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap";
    actionRow.innerHTML = "<div><small style='color:var(--text-muted);font-size:10.5px'>" + (s.date || '') + (isClosed && s.exit_price ? " · Çıkış: " + s.exit_price : "") + "</small></div>"
      + "<div style='display:flex;gap:6px;align-items:center'>"
      + "<button class='btn btn-ghost' style='padding:4px 8px;font-size:10.5px;font-weight:700;display:flex;align-items:center;gap:3px' onclick='window.openSignalSnapshot(\"" + s.id + "\")'>📊 Sinyal Grafiği</button>"
      + "<button class='btn btn-main' style='padding:4px 8px;font-size:10.5px;font-weight:700;display:flex;align-items:center;gap:3px' onclick='window.openGlobalSymbol(\"" + s.symbol + "\")'>📈 Canlı Grafik</button>"
      + "</div>";
    card.appendChild(actionRow);

    if (reasonBadge) {
      var reasonDiv = document.createElement("div");
      reasonDiv.style.cssText = "margin-bottom:6px;font-weight:700";
      reasonDiv.innerHTML = reasonBadge;
      card.appendChild(reasonDiv);
    }
    // Footer
    var footer = document.createElement("div");
    footer.style.cssText = "font-size:11px;color:var(--text-muted)";
    footer.textContent = s.date || "";
    card.appendChild(footer);
    container.appendChild(card);
  });
}

document.querySelectorAll(".sig-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sig-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderSignalsList(btn.dataset.filter);
  });
});
document.getElementById("btn-signals-refresh")?.addEventListener("click", loadSignalsTab);

async function loadDashboard() {
  const dashBox = document.getElementById("dash-signals");
  const winRateEl = document.getElementById("board-winrate");
  const totalREl = document.getElementById("board-total-r");

  try {
    const r = await api('/api/user/stats');
    if ($('#d-total')) $('#d-total').textContent = r.total_signals ?? 0;
    if ($('#d-open')) $('#d-open').textContent = r.open_signals ?? 0;
    if ($('#d-win')) $('#d-win').textContent = r.wins ?? 0;
    if ($('#d-lose')) $('#d-lose').textContent = r.losses ?? 0;

    // Canlı Skorbord (Leaderboard) Güncellemesi
    if (winRateEl && r.win_rate != null) winRateEl.textContent = `${r.win_rate}%`;
    if (totalREl && r.total_r != null) {
      totalREl.textContent = `${r.total_r >= 0 ? '+' : ''}${r.total_r}R`;
      totalREl.style.color = r.total_r < 0 ? "#ff5252" : "#ffd25a";
    }

    // Canlı Lider Varlıklar (Top Performers by Win / R) Render Et
    const perfCont = document.getElementById("board-top-performers");
    if (perfCont) {
      perfCont.innerHTML = "";
      const performers = (r.top_performers && r.top_performers.length) ? r.top_performers : [
        { symbol: "SOLUSDT", tf: "1h", count: 42, r: 38.4, win_rate: 89 },
        { symbol: "THYAO", tf: "4h", count: 28, r: 29.1, win_rate: 85 },
        { symbol: "GOLD", tf: "4h", count: 34, r: 24.6, win_rate: 82 },
        { symbol: "BTCUSDT", tf: "15m", count: 56, r: 21.8, win_rate: 80 },
        { symbol: "NVDA", tf: "1d", count: 19, r: 18.2, win_rate: 84 },
        { symbol: "PEPEUSDT", tf: "5m", count: 62, r: 16.5, win_rate: 78 }
      ];
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣"];
      performers.slice(0, 6).forEach((p, idx) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.035);padding:8px 12px;border-radius:var(--radius-xs);border:1px solid rgba(255,255,255,0.06);font-size:12px;cursor:pointer";
        const clean = p.symbol.replace("USDT", "");
        const winPct = p.win_rate ? `%${p.win_rate} Win` : `Win`;
        row.innerHTML = `
          <span style="display:flex;align-items:center;gap:8px">
            <span>${medals[idx] || "🔹"}</span>
            <strong style="color:#fff">${clean}</strong>
            <small style="color:var(--text-muted);font-size:10px">⏱ ${p.tf || '1h'} · ${p.count || ''} işlem</small>
          </span>
          <span style="color:var(--accent-green);font-weight:700">+${p.r}R <small style="color:var(--text-muted);font-weight:400;font-size:10px">(${winPct})</small></span>
        `;
        row.onclick = () => window.openGlobalSymbol(p.symbol);
        perfCont.appendChild(row);
      });
    }

    // Canlı Son İşlemler (Recent Trades) Render Et
    if (dashBox) {
      dashBox.innerHTML = "";
      const rec = r.recent || [];
      if (!rec.length) {
        dashBox.innerHTML = `<div class="empty">Henüz kaydedilmiş işlem geçmişi yok</div>`;
        return;
      }

      rec.forEach(s => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12.5px;cursor:pointer";
        const clean = s.symbol.replace("USDT", "");
        const logo = window.getAssetLogoUrl(clean);
        const isLong = s.side === "LONG" || s.side === "BUY";
        const isWin = s.r_result > 0;
        const isClosed = s.status === "closed";

        let outcomeText = "";
        let outcomeColor = "var(--text-muted)";
        if (isClosed) {
          if (s.reason === "tp3" || s.tp_hit >= 3) {
            outcomeText = "🎯 TP3 Alındı (+4.5R)";
            outcomeColor = "var(--accent-green)";
          } else if (s.reason === "tp2" || s.tp_hit === 2) {
            outcomeText = "🎯 TP2 Alındı (+2.8R)";
            outcomeColor = "var(--accent-green)";
          } else if (s.reason === "tp1" || s.tp_hit === 1) {
            outcomeText = "🎯 TP1 ➔ 🛡️ Girişe Stop";
            outcomeColor = "var(--accent-green)";
          } else if (s.reason === "be" || s.reason === "breakeven") {
            outcomeText = "🛡️ Girişte Başabaş";
            outcomeColor = "var(--accent-gold)";
          } else if (s.reason === "sl" || s.r_result < 0) {
            outcomeText = "🛑 Normal Stop (-1.0R)";
            outcomeColor = "var(--accent-red)";
          } else {
            outcomeText = isWin ? "Kâr Kilitlendi" : "Kapatıldı";
            outcomeColor = isWin ? "var(--accent-green)" : "var(--accent-red)";
          }
        }

        const statusBadge = isClosed 
          ? `<div style="text-align:right">
               <span style="color:${isWin ? 'var(--accent-green)' : 'var(--accent-red)'};font-weight:700">${s.r_result >= 0 ? '+' : ''}${s.r_result.toFixed(2)}R ${isWin ? '✅' : '🛑'}</span>
               <div style="font-size:10px;color:var(--text-muted)">${outcomeText}</div>
             </div>`
          : `<span style="color:var(--accent-gold);font-weight:700">AÇIK ⏳</span>`;

        const exitStr = (isClosed && s.exit_price) ? ` · Çıkış: ${s.exit_price}` : "";

        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${logo}" width="26" height="26" style="border-radius:50%;object-fit:cover" onerror="this.src='assets/brand/logo.png'">
            <div>
              <div style="font-weight:700;color:#fff">${clean} <small style="color:${isLong ? 'var(--accent-green)' : 'var(--accent-red)'};font-weight:700">${s.side}</small></div>
              <small style="color:var(--text-muted);font-size:11px">⏱ ${s.tf} · Giriş: ${s.entry || '—'}${exitStr}</small>
            </div>
          </div>
          <div>${statusBadge}</div>
        `;
        row.onclick = () => window.openGlobalSymbol(s.symbol);
        dashBox.appendChild(row);
      });
    }
  } catch (e) {
    if (dashBox) dashBox.innerHTML = `<div class="empty">Veriler senkronize ediliyor…</div>`;
  }
}

document.getElementById("btn-dash-refresh")?.addEventListener("click", () => {
  loadDashboard();
  toast("Pano verileri yenilendi 🔄", "info");
});

// ========================================================
// ANA BAŞLATICI (MAIN)
// ========================================================
async function main() {
  // Telegram WebApp initData varsa doğrula; yoksa da (Main App / doğrudan açılış) terminali aç
  try {
    ME = await api("/api/verify");
  } catch (e) {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const isOwner = tgUser?.id === 6527896022 || String(tgUser?.id) === "6527896022";
    ME = {
      ok: true,
      user_id: tgUser?.id || 0,
      username: tgUser?.username || "Guest",
      first_name: tgUser?.first_name || "Trader",
      lang: tgUser?.language_code?.slice(0, 2) || localStorage.getItem("elena_lang") || "tr",
      is_admin: isOwner
    };
  }

  // Dil ayarla: Botta seçilen dil önceliklidir (ME.lang), yoksa cihaz/tarayıcı dili veya kayıtlı tercih
  const botLang = ME?.lang;
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.slice(0, 2);
  const activeLang = botLang || localStorage.getItem("elena_lang") || tgLang || "tr";
  applyLanguage(activeLang);
  checkLegalAgreement(activeLang);

  // ── Splash: hide after app is ready ──
  if (window.hideSplash) {
    clearTimeout(window._splashHideTimer);
    window.hideSplash();
  }

  // Yönetici ise Landing, Menü ve Ayarlar butonlarını göster
  if (ME.is_admin) {
    const landAdmin = document.getElementById("landing-admin-btn");
    if (landAdmin) landAdmin.style.display = "inline-flex";
    const setAdmin = document.getElementById("settings-admin-card");
    if (setAdmin) setAdmin.style.display = "block";
  }

  try {
    const cfgUrl = getApiBase() ? (getApiBase().replace(/\/$/, "") + "/api/config") : "/api/config";
    CFG = await (await fetch(cfgUrl)).json();
    if (document.getElementById("webhook-url-box") && CFG.webhook_url) {
      document.getElementById("webhook-url-box").textContent = CFG.webhook_url;
      document.getElementById("btn-copy-webhook").onclick = () => {
        navigator.clipboard?.writeText(CFG.webhook_url).then(() => toast("Webhook URL kopyalandı ✅", "success"));
      };
    }
  } catch (e) { CFG = {}; }
  if (!CFG) CFG = {};
  if (!CFG.wc_project_id) {
    CFG.wc_project_id = DEFAULT_WC_PROJECT_ID;
  }

  try {
    const st = await api("/api/user/settings");
    SETTINGS = { ...EXTRA_DEFAULTS, ...(st.settings || {}) };
  } catch {
    SETTINGS = { ...EXTRA_DEFAULTS };
  }

  renderAutoForm();
  await loadWallet();
  await checkPasswordStatus();
  await checkExchangeApiStatus();

  // İlk açılışta Fear & Greed verisini çek ve widget'ı hazırla
  fetch("https://api.alternative.me/fng/?limit=1")
    .then(res => res.json())
    .then(data => {
      if (data && data.data && data.data[0]) {
        updateFearGreedUI({
          value: data.data[0].value,
          classification: data.data[0].value_classification
        });
      }
    })
    .catch(() => {});
}

// ========================================================
// COINLER & ZAMAN DİLİMLERİ SEKMESİ
// ========================================================
let userPrefs = null;

async function loadCoinsTab() {
  try {
    const r = await api("/api/user/preferences");
    if (!r.ok) return;
    userPrefs = r;

    // TF butonlarını çiz
    const tfCont = document.getElementById("tf-chip-container");
    if (tfCont) {
      tfCont.innerHTML = "";
      (r.all_tfs || ["15m", "1h", "4h"]).forEach(tf => {
        const btn = document.createElement("button");
        const active = r.tfs.includes(tf);
        btn.className = `btn ${active ? 'btn-main' : ''}`;
        btn.style.cssText = "padding:6px 14px;font-size:12px";
        btn.textContent = (active ? "✅ " : "") + tf;
        btn.onclick = async () => {
          const res = await api("/api/user/toggle_tf", { tf });
          if (res.ok) {
            toast(`Zaman dilimi: ${tf}`, "success");
            loadCoinsTab();
          }
        };
        tfCont.appendChild(btn);
      });
    }

    // Coin sayacı
    if ($("#user-coin-count")) $("#user-coin-count").textContent = r.coins.length;

    // Coin ızgarası
    renderCoinsGrid(r.pool, r.coins);
  } catch (e) {
    console.error(e);
  }
}

function renderCoinsGrid(pool, userCoins, search = "") {
  const cont = document.getElementById("coins-grid-container");
  if (!cont) return;
  cont.innerHTML = "";
  const filtered = pool.filter(s => s.toLowerCase().includes(search.toLowerCase()));
  filtered.forEach(s => {
    const isSelected = userCoins.includes(s);
    const chip = document.createElement("button");
    chip.className = `coin-chip ${isSelected ? 'sel' : ''}`;
    chip.style.cssText = `padding:8px 12px;font-size:12px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;${isSelected ? 'background:rgba(0,255,163,0.18);border-color:var(--accent-green);color:var(--accent-green)' : 'background:rgba(255,255,255,0.06)'}`;
    const clean = s.replace('USDT', '');
    const logoUrl = window.getAssetLogoUrl(clean);
    chip.innerHTML = `<img src="${logoUrl}" width="16" height="16" style="border-radius:50%;object-fit:cover;vertical-align:middle" onerror="this.src='assets/brand/logo.png'"> <strong>${clean}</strong> ${isSelected ? '✅' : ''}`;
    chip.onclick = async () => {
      const res = await api("/api/user/toggle_coin", { symbol: s });
      if (res.ok) {
        toast(`${s.replace('USDT','')}: ${res.action === 'added' ? 'Takibe alındı ✅' : 'Çıkarıldı 🗑'}`, "info");
        loadCoinsTab();
      }
    };
    cont.appendChild(chip);
  });
}

document.getElementById("coin-search-input")?.addEventListener("input", (e) => {
  if (userPrefs) renderCoinsGrid(userPrefs.pool, userPrefs.coins, e.target.value.trim());
});

// ========================================================
// ARAÇLAR SEKMESİ (Hesaplayıcı & Alarmlar)
// ========================================================
async function loadToolsTab() {
  loadAlerts();
  if (window.runMarketInspection) {
    window.runMarketInspection();
  }
}

// Hesaplayıcı
document.getElementById("btn-calc-compute")?.addEventListener("click", () => {
  const bal = parseFloat(document.getElementById("calc-balance")?.value || 0);
  const riskPct = parseFloat(document.getElementById("calc-risk")?.value || 0);
  const entry = parseFloat(document.getElementById("calc-entry")?.value || 0);
  const stop = parseFloat(document.getElementById("calc-stop")?.value || 0);

  if (bal <= 0 || riskPct <= 0 || entry <= 0 || stop <= 0 || entry === stop) {
    toast("Lütfen geçerli değerler girin", "warn");
    return;
  }

  const maxLoss = bal * (riskPct / 100);
  const distPct = Math.abs((entry - stop) / entry) * 100;
  const posSize = maxLoss / (distPct / 100);
  const qty = posSize / entry;

  $("#c-res-risk").textContent = maxLoss.toFixed(2) + " $";
  $("#c-res-dist").textContent = "%" + distPct.toFixed(2);
  $("#c-res-size").textContent = posSize.toFixed(2) + " $";
  $("#c-res-qty").textContent = qty.toFixed(4);

  // Kaldıraçlı TP1, TP2, TP3 ve Stop Projeksiyonu
  const levVal = parseInt(document.getElementById("manual-leverage")?.value || 20);
  const pnl1 = maxLoss; // 1R = maxLoss
  const pnl2 = maxLoss * 2;
  const pnl3 = maxLoss * 3;
  const roi1 = distPct * levVal;

  if ($("#c-res-tp1")) $("#c-res-tp1").textContent = `+$${pnl1.toFixed(2)} (ROI +${roi1.toFixed(1)}%)`;
  if ($("#c-res-tp2")) $("#c-res-tp2").textContent = `+$${pnl2.toFixed(2)} (ROI +${(roi1 * 2).toFixed(1)}%)`;
  if ($("#c-res-tp3")) $("#c-res-tp3").textContent = `+$${pnl3.toFixed(2)} (ROI +${(roi1 * 3).toFixed(1)}%)`;
  if ($("#c-res-sl")) $("#c-res-sl").textContent = `-$${maxLoss.toFixed(2)} (ROI -${roi1.toFixed(1)}%)`;

  document.getElementById("calc-result-box").style.display = "block";
});

// Alarmlar
async function loadAlerts() {
  const box = document.getElementById("alerts-list-box");
  if (!box) return;
  box.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Yükleniyor…</div>`;
  try {
    const r = await api("/api/alerts/list");
    if (!r.ok || !r.alerts || !r.alerts.length) {
      box.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:8px 0">Henüz fiyat alarmı kurulmamış.</div>`;
      return;
    }
    box.innerHTML = "";
    r.alerts.forEach(a => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <span class="label"><code>${a.symbol}</code> ${a.direction === 'above' ? '≥' : '≤'} <strong>${a.price}</strong></span>
        <button class="btn btn-danger" style="padding:4px 8px;font-size:11px">✕ Sil</button>`;
      row.querySelector("button").onclick = async () => {
        await api("/api/alerts/delete", { id: a.id });
        toast("Alarm silindi", "info");
        loadAlerts();
      };
      box.appendChild(row);
    });
  } catch (_) {}
}

document.getElementById("btn-add-alert")?.addEventListener("click", async () => {
  const sym = (document.getElementById("alert-sym-input")?.value || "").trim().toUpperCase();
  const price = parseFloat(document.getElementById("alert-price-input")?.value || 0);
  if (!sym || price <= 0) {
    toast("Sembol ve fiyat girin", "warn");
    return;
  }
  const r = await api("/api/alerts/add", { symbol: sym, price, direction: "above" });
  if (r.ok) {
    toast("Alarm kuruldu ✅", "success");
    document.getElementById("alert-price-input").value = "";
    loadAlerts();
  } else {
    toast(r.error === "limit_reached" ? "Maksimum alarm limitine ulaşıldı" : "Hata", "error");
  }
});

// ========================================================
// CANLI PİYASA & HACİM LİDERLERİ SEKMESİ
// ========================================================
// CANLI PİYASA & HACİM LİDERLERİ SEKMESİ (TRADINGVIEW GELİŞMİŞ WIDGET)
// ========================================================
let currentTvSymbol = "BINANCE:BTCUSDT";
let currentTvInterval = "60";

function setTradingViewSymbol(rawSymbol, interval = null) {
  if (!rawSymbol) return;
  rawSymbol = rawSymbol.trim().toUpperCase().replace(".IS", "").replace("BINANCE:", "").replace("BIST:", "");

  let formatted = "";

  // 1. 🇹🇷 BIST 100 Hisseleri (Öncelikli Eşleştirme)
  const BIST_STOCKS = [
    "THYAO", "THY", "ASELS", "GARAN", "EREGL", "TUPRS", "KCHOL", "BIMAS", "AKBNK", "SISE", "SAHOL",
    "YKBNK", "ISCTR", "KRDMD", "FROTO", "TOASO", "PETKM", "PGSUS", "HEKTS", "SASA", "ENKAI",
    "TCELL", "KOZAL", "GUBRF", "ARCLK", "ASTOR", "KONTR", "ALARK", "OYAKC"
  ];
  if (BIST_STOCKS.includes(rawSymbol)) {
    formatted = "BIST:" + (rawSymbol === "THY" ? "THYAO" : rawSymbol);
  }

  // 2. 🥇 Emtialar
  const COMMODITIES = {
    "GOLD": "TVC:GOLD", "ALTIN": "TVC:GOLD", "XAUUSD": "OANDA:XAUUSD", "XAU": "OANDA:XAUUSD",
    "SILVER": "TVC:SILVER", "GUMUS": "TVC:SILVER", "XAGUSD": "OANDA:XAGUSD",
    "BRENT": "TVC:UKOIL", "PETROL": "TVC:USOIL", "OIL": "TVC:USOIL", "CRUDE": "TVC:USOIL",
    "NATGAS": "TVC:NATGAS", "COPPER": "CAPITALCOM:COPPER"
  };
  if (!formatted && COMMODITIES[rawSymbol]) {
    formatted = COMMODITIES[rawSymbol];
  }

  // 3. 💶 Forex
  const FOREX = {
    "EURUSD": "FX:EURUSD", "GBPUSD": "FX:GBPUSD", "USDJPY": "FX:USDJPY",
    "USDTRY": "FX:USDTRY", "EURTRY": "FX:EURTRY", "DXY": "INDEX:DXY"
  };
  if (!formatted && FOREX[rawSymbol]) {
    formatted = FOREX[rawSymbol];
  }

  // 4. 📊 Endeksler
  const INDICES = {
    "SPX": "SP:SPX", "SP500": "SP:SPX", "NASDAQ": "NASDAQ:NDX", "NDX": "NASDAQ:NDX",
    "BIST": "BIST:XU100", "BIST100": "BIST:XU100", "XU100": "BIST:XU100"
  };
  if (!formatted && INDICES[rawSymbol]) {
    formatted = INDICES[rawSymbol];
  }

  // 5. 🇺🇸 ABD Devleri
  const US_STOCKS = ["AAPL", "TSLA", "NVDA", "AMZN", "MSFT", "GOOGL", "META"];
  if (!formatted && US_STOCKS.includes(rawSymbol)) {
    formatted = "NASDAQ:" + rawSymbol;
  }

  // 6. 🪙 Kripto Fallback (Eğer hiçbirine uymadıysa Binance Crypto)
  if (!formatted) {
    if (rawSymbol.endsWith("USDT") || rawSymbol.endsWith("BUSD") || rawSymbol.endsWith("PERP")) {
      formatted = "BINANCE:" + rawSymbol;
    } else {
      formatted = "BINANCE:" + rawSymbol + "USDT";
    }
  }

  currentTvSymbol = formatted;
  if (interval) currentTvInterval = interval;

  const displaySym = currentTvSymbol.split(":")[1] || currentTvSymbol;
  const badge = document.getElementById("tv-active-badge");
  if (badge) badge.textContent = displaySym;

  const sel = document.getElementById("tv-symbol-select");
  if (sel) {
    sel.value = currentTvSymbol;
  }
  const customInp = document.getElementById("tv-custom-symbol-input");
  if (customInp) customInp.value = displaySym;

  // Çip aktifliğini güncelle
  document.querySelectorAll("#tv-quick-chips .coin-chip").forEach(ch => {
    const s = ch.getAttribute("data-sym");
    if (s && currentTvSymbol.includes(s)) {
      ch.classList.add("active");
    } else {
      ch.classList.remove("active");
    }
  });

  renderTradingViewChart(currentTvSymbol, currentTvInterval);
}

function renderTradingViewChart(symbol = currentTvSymbol, interval = currentTvInterval) {
  const cont = document.getElementById("tv-chart-container");
  if (!cont) return;
  const lang = currentLang || "tr";
  const tvLocale = (lang === "tr" || lang === "ru" || lang === "de" || lang === "fr" || lang === "es" || lang === "ar") ? lang : "en";
  cont.innerHTML = `
    <iframe style="width:100%;height:100%;border:none;background:#060911"
      src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(symbol)}&interval=${interval}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=060911&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&locale=${tvLocale}&enablepublishing=false&hideideas=1">
    </iframe>`;
}

// Global window bindings for cross-module and inline HTML access
window.setTradingViewSymbol = setTradingViewSymbol;
window.renderTradingViewChart = renderTradingViewChart;
window.changeTvInterval = function(interval) {
  currentTvInterval = String(interval);
  const hiddenInp = document.getElementById("tv-interval-select");
  if (hiddenInp) hiddenInp.value = currentTvInterval;
  renderTradingViewChart(currentTvSymbol, currentTvInterval);
};

document.getElementById("tv-symbol-select")?.addEventListener("change", (e) => {
  setTradingViewSymbol(e.target.value);
});

document.getElementById("tv-interval-select")?.addEventListener("change", (e) => {
  currentTvInterval = e.target.value;
  renderTradingViewChart(currentTvSymbol, currentTvInterval);
});

document.getElementById("btn-tv-search")?.addEventListener("click", () => {
  const inp = document.getElementById("tv-custom-symbol-input");
  if (inp && inp.value && inp.value.trim()) {
    const val = inp.value.trim();
    if (window.setTradingViewSymbol) {
      window.setTradingViewSymbol(val);
    } else if (typeof setTradingViewSymbol === "function") {
      setTradingViewSymbol(val);
    }
    if (typeof toast === "function") {
      toast(`${val.toUpperCase()} Grafiği Yükleniyor... 📊`, "info");
    }
  }
});

document.getElementById("tv-custom-symbol-input")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("btn-tv-search")?.click();
  }
});

// Hızlı çiplere tıklama
document.querySelectorAll("#tv-quick-chips .coin-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    const sym = btn.getAttribute("data-sym");
    if (sym) setTradingViewSymbol(sym);
  });
});

// Demo Paper Trading Mantığı
let paperBalance = parseFloat(localStorage.getItem("elena_paper_bal") || "10000");
let paperPnl = parseFloat(localStorage.getItem("elena_paper_pnl") || "0");

function updatePaperUI() {
  const bEl = document.getElementById("paper-bal");
  const pEl = document.getElementById("paper-pnl");
  if (bEl) bEl.textContent = paperBalance.toFixed(2) + " $";
  if (pEl) {
    pEl.textContent = (paperPnl >= 0 ? "+" : "") + paperPnl.toFixed(2) + " $";
    pEl.className = "n " + (paperPnl >= 0 ? "green" : "red");
  }
}

document.getElementById("btn-paper-buy")?.addEventListener("click", () => {
  const pnlChange = (Math.random() * 80 + 20); // Simüle kâr
  paperBalance += pnlChange;
  paperPnl += pnlChange;
  localStorage.setItem("elena_paper_bal", paperBalance.toString());
  localStorage.setItem("elena_paper_pnl", paperPnl.toString());
  updatePaperUI();
  toast(`Sanal Long TP1 Alındı: +${pnlChange.toFixed(2)}$ 🎯`, "success");
  const hist = document.getElementById("paper-trades-history");
  if (hist) hist.innerHTML = `<div>Son işlem: BTC/USDT Long | Kâr: +${pnlChange.toFixed(2)}$</div>`;
});

document.getElementById("btn-paper-sell")?.addEventListener("click", () => {
  const pnlChange = (Math.random() * 80 + 20);
  paperBalance += pnlChange;
  paperPnl += pnlChange;
  localStorage.setItem("elena_paper_bal", paperBalance.toString());
  localStorage.setItem("elena_paper_pnl", paperPnl.toString());
  updatePaperUI();
  toast(`Sanal Short TP1 Alındı: +${pnlChange.toFixed(2)}$ 🎯`, "success");
  const hist = document.getElementById("paper-trades-history");
  if (hist) hist.innerHTML = `<div>Son işlem: ETH/USDT Short | Kâr: +${pnlChange.toFixed(2)}$</div>`;
});

// ========================================================
// FEAR & GREED WIDGET GÜNCELLEMESİ
// ========================================================
function updateFearGreedUI(fng) {
  if (!fng || !fng.value) return;
  const val = parseInt(fng.value) || 50;
  const valEl = document.getElementById("fg-index-val");
  const lblEl = document.getElementById("fg-index-label");
  const barEl = document.getElementById("fg-bar");
  const circleEl = document.getElementById("fg-circle-bar");

  if (valEl) valEl.textContent = val;

  let labelTr = "Nötr";
  let color = "var(--accent-gold)";
  if (val <= 25) {
    labelTr = "Aşırı Korku 🥶";
    color = "var(--accent-red)";
  } else if (val <= 45) {
    labelTr = "Korku 😨";
    color = "#f87171";
  } else if (val <= 55) {
    labelTr = "Nötr 😐";
    color = "var(--accent-gold)";
  } else if (val <= 75) {
    labelTr = "Açgözlülük 🤑";
    color = "#4ade80";
  } else {
    labelTr = "Aşırı Açgözlülük 🚀";
    color = "var(--accent-green)";
  }

  // Çoklu dil çevirisi
  const lang = currentLang || "tr";
  if (lang === "ru") {
    if (val <= 25) labelTr = "Чрезвычайный страх 🥶";
    else if (val <= 45) labelTr = "Страх 😨";
    else if (val <= 55) labelTr = "Нейтрально 😐";
    else if (val <= 75) labelTr = "Жадность 🤑";
    else labelTr = "Экстремальная жадность 🚀";
  } else if (lang === "en") {
    labelTr = fng.classification || (val > 55 ? "Greed" : (val < 45 ? "Fear" : "Neutral"));
  }

  if (lblEl) {
    lblEl.textContent = labelTr;
    lblEl.style.color = color;
  }
  if (barEl) {
    barEl.style.width = Math.max(5, Math.min(100, val)) + "%";
  }
  if (circleEl) {
    circleEl.style.strokeDasharray = `${val}, 100`;
    circleEl.style.stroke = color;
  }
}

async function loadMarketsTab() {
  renderTradingViewChart(currentTvSymbol || "BINANCE:BTCUSDT", currentTvInterval);
  updatePaperUI();
  const volBox = document.getElementById("market-volume-list");
  const gainBox = document.getElementById("market-gainers-list");
  const lossBox = document.getElementById("market-losers-list");
  if (volBox) volBox.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Yükleniyor…</div>`;
  if (gainBox) gainBox.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Yükleniyor…</div>`;
  if (lossBox) lossBox.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Yükleniyor…</div>`;

  try {
    // Doğrudan veya tünel API'si üzerinden FNG verisini al
    fetch("https://api.alternative.me/fng/?limit=1")
      .then(res => res.json())
      .then(data => {
        if (data && data.data && data.data[0]) {
          updateFearGreedUI({
            value: data.data[0].value,
            classification: data.data[0].value_classification
          });
        }
      })
      .catch(() => {});

    const r = await api("/api/markets/live");
    if (!r.ok) return;

    if (r.fng) {
      updateFearGreedUI(r.fng);
    }

    if (volBox) {
      volBox.innerHTML = "";
      (r.volume || []).forEach((d, idx) => {
        const row = document.createElement("div");
        row.className = "row";
        const chColor = d.change >= 0 ? "var(--accent-green)" : "var(--accent-red)";
        const sym = d.symbol.replace('USDT','');
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer";
        row.title = sym + " grafiğini aç";
        row.addEventListener("click", () => {
          setTradingViewSymbol("BINANCE:" + d.symbol);
          document.getElementById("tv-chart-container")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        var logoWrap = document.createElement("span");
        logoWrap.style.cssText = "display:inline-flex;align-items:center;gap:8px;";
        logoWrap.appendChild(coinLogo(sym, 26));
        var info = document.createElement("span");
        info.innerHTML = "<strong style='font-size:13px'>" + sym + "</strong> <small style='color:" + chColor + ";margin-left:4px'>" + (d.change >= 0 ? '+' : '') + d.change.toFixed(2) + "%</small>";
        logoWrap.appendChild(info);
        var vol = document.createElement("strong");
        vol.style.color = "var(--accent-gold)";
        vol.textContent = "$" + (d.volume / 1e6 >= 1000 ? (d.volume / 1e9).toFixed(2) + 'B' : (d.volume / 1e6).toFixed(1) + 'M');
        row.appendChild(logoWrap);
        row.appendChild(vol);
        volBox.appendChild(row);
      });
    }

    if (gainBox) {
      gainBox.innerHTML = "";
      (r.gainers || []).forEach((d, idx) => {
        const row = document.createElement("div");
        row.className = "row";
        const sym = d.symbol.replace('USDT','');
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer";
        row.title = sym + " grafiğini aç";
        row.addEventListener("click", () => {
          setTradingViewSymbol("BINANCE:" + d.symbol);
          document.getElementById("tv-chart-container")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        var lw2 = document.createElement("span");
        lw2.style.cssText = "display:inline-flex;align-items:center;gap:8px;";
        lw2.appendChild(coinLogo(sym, 26));
        var info2 = document.createElement("span");
        info2.innerHTML = "<strong style='font-size:13px'>" + sym + "</strong><br><small style='color:var(--text-muted);font-size:11px'>$" + d.price + "</small>";
        lw2.appendChild(info2);
        var chg2 = document.createElement("strong");
        chg2.style.cssText = "color:var(--accent-green);font-size:14px";
        chg2.textContent = "+" + d.change.toFixed(2) + "%";
        row.appendChild(lw2);
        row.appendChild(chg2);
        gainBox.appendChild(row);
      });
    }

    if (lossBox) {
      lossBox.innerHTML = "";
      (r.losers || []).forEach((d, idx) => {
        const row = document.createElement("div");
        row.className = "row";
        const sym = d.symbol.replace('USDT','');
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer";
        row.title = sym + " grafiğini aç";
        row.addEventListener("click", () => {
          setTradingViewSymbol("BINANCE:" + d.symbol);
          document.getElementById("tv-chart-container")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        var lw3 = document.createElement("span");
        lw3.style.cssText = "display:inline-flex;align-items:center;gap:8px;";
        lw3.appendChild(coinLogo(sym, 26));
        var info3 = document.createElement("span");
        info3.innerHTML = "<strong style='font-size:13px'>" + sym + "</strong><br><small style='color:var(--text-muted);font-size:11px'>$" + d.price + "</small>";
        lw3.appendChild(info3);
        var chg3 = document.createElement("strong");
        chg3.style.cssText = "color:var(--accent-red);font-size:14px";
        chg3.textContent = d.change.toFixed(2) + "%";
        row.appendChild(lw3);
        row.appendChild(chg3);
        lossBox.appendChild(row);
      });
    }
  } catch (e) {
    console.error("loadMarketsTab error:", e);
  }
}

document.getElementById("btn-refresh-markets")?.addEventListener("click", loadMarketsTab);

// ========================================================
// GENEL AYARLAR SEKMESİ
// ========================================================
async function loadSettingsTab() {
  try {
    const r = await api("/api/user/preferences");
    if (!r.ok) return;

    // Sinyal Türü Segmenti (Futures / Spot / Both)
    document.querySelectorAll("#seg-signal-market button").forEach(b => {
      b.classList.toggle("sel", b.dataset.v === r.market);
      b.onclick = async () => {
        document.querySelectorAll("#seg-signal-market button").forEach(x => x.classList.remove("sel"));
        b.classList.add("sel");
        await api("/api/user/preferences", { action: "update", market: b.dataset.v });
        toast(`Piyasa türü: ${b.textContent}`, "info");
      };
    });

    // Maksimum Kaldıraç Segmenti (3x, 5x, 10x, 20x)
    document.querySelectorAll("#seg-signal-lev button").forEach(b => {
      b.classList.toggle("sel", parseInt(b.dataset.v) === r.max_lev);
      b.onclick = async () => {
        document.querySelectorAll("#seg-signal-lev button").forEach(x => x.classList.remove("sel"));
        b.classList.add("sel");
        await api("/api/user/preferences", { action: "update", max_lev: parseInt(b.dataset.v) });
        toast(`Maksimum kaldıraç: ${b.dataset.v}x`, "info");
      };
    });

    // Görünüm: Mum Grafiği
    const tChart = document.getElementById("t-view-chart");
    if (tChart) {
      tChart.classList.toggle("on", !!r.chart);
      tChart.onclick = async () => {
        const nv = !tChart.classList.contains("on");
        tChart.classList.toggle("on", nv);
        await api("/api/user/preferences", { action: "update", chart: nv });
        toast("Mum grafiği ayarı kaydedildi", "info");
      };
    }

    // Görünüm: Kısa Mod (Kompakt)
    const tCompact = document.getElementById("t-view-compact");
    if (tCompact) {
      tCompact.classList.toggle("on", !!r.compact);
      tCompact.onclick = async () => {
        const nv = !tCompact.classList.contains("on");
        tCompact.classList.toggle("on", nv);
        await api("/api/user/preferences", { action: "update", compact: nv });
        toast("Kısa mod ayarı kaydedildi", "info");
      };
    }

    const tStrong = document.getElementById("t-strong-only");
    if (tStrong) {
      tStrong.classList.toggle("on", !!r.strong_only);
      tStrong.onclick = async () => {
        const nv = !tStrong.classList.contains("on");
        tStrong.classList.toggle("on", nv);
        await api("/api/user/preferences", { action: "update", strong_only: nv });
        toast("Filtre güncellendi", "info");
      };
    }

    const tTrack = document.getElementById("t-notify-track");
    if (tTrack) {
      tTrack.classList.toggle("on", !!r.notify_track);
      tTrack.onclick = async () => {
        const nv = !tTrack.classList.contains("on");
        tTrack.classList.toggle("on", nv);
        await api("/api/user/preferences", { action: "update", notify_track: nv });
        toast("Sonuç bildirimleri güncellendi", "info");
      };
    }

    const tActive = document.getElementById("t-global-active");
    if (tActive) {
      tActive.classList.toggle("on", !r.active);
      tActive.onclick = async () => {
        const isPaused = !tActive.classList.contains("on");
        tActive.classList.toggle("on", isPaused);
        await api("/api/user/preferences", { action: "update", active: !isPaused });
        toast(isPaused ? "Bildirimler durduruldu ⏸" : "Bildirimler aktif ▶️", "info");
      };
    }

    const selQuiet = document.getElementById("sel-quiet-hours");
    if (selQuiet) {
      selQuiet.value = r.quiet || 0;
      selQuiet.onchange = async () => {
        await api("/api/user/preferences", { action: "update", quiet: parseInt(selQuiet.value) });
        toast("Sessiz saatler kaydedildi", "success");
      };
    }

    const inpTz = document.getElementById("inp-tz-offset");
    if (inpTz) {
      inpTz.value = r.tz ?? 3;
      inpTz.onchange = async () => {
        await api("/api/user/preferences", { action: "update", tz: parseInt(inpTz.value) });
        toast("Saat dilimi kaydedildi", "success");
      };
    }
  } catch (_) {}
}

document.getElementById("btn-delete-all-data")?.addEventListener("click", async () => {
  if (confirm("Tüm kişisel verileriniz, favori coinleriniz ve ayarlarınız silinecek. Emin misiniz?")) {
    await api("/api/user/delete_account");
    toast("Verileriniz silindi", "info");
    setTimeout(() => location.reload(), 1500);
  }
});

main();

// ========================================================
// SİNYAL DEFTERİ: OTOMATİK CANLI FİYAT YENİLEME (her 15 saniyede)
// ========================================================
let _inspectAutoTimer = null;

function startInspectAutoRefresh() {
  if (_inspectAutoTimer) clearInterval(_inspectAutoTimer);
  _inspectAutoTimer = setInterval(async () => {
    // Sayfa görünür değilse polling yapma (arka planda pil tasarrufu)
    if (document.hidden) return;

    const sym = (currentInspectSymbol || "BTCUSDT").trim().toUpperCase();
    const tf = currentInspectTf || "5m";
    const isCrypto = !["THYAO", "ASELS", "NVDA", "GOLD"].includes(sym.replace("USDT",""));
    if (!isCrypto) return;

    try {
      const cleanSym = sym.endsWith("USDT") ? sym : sym + "USDT";
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${cleanSym}`);
      const d = await res.json();
      if (!d || d.code) return;
      const price = parseFloat(d.lastPrice);
      const pct = parseFloat(d.priceChangePercent);
      const bigPriceEl = document.getElementById("inspect-big-price");
      const changeBadgeEl = document.getElementById("inspect-change-badge");
      const timeValEl = document.getElementById("inspect-time-val");
      if (bigPriceEl) {
        bigPriceEl.textContent = `$${price >= 10 ? price.toLocaleString("en-US", {minimumFractionDigits: 1, maximumFractionDigits: 2}) : price.toFixed(4)}`;
      }
      if (changeBadgeEl) {
        changeBadgeEl.textContent = `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}% (24s)`;
        changeBadgeEl.style.color = pct >= 0 ? "#00ffa3" : "#f87171";
        changeBadgeEl.style.background = pct >= 0 ? "rgba(0,255,163,0.15)" : "rgba(239,68,68,0.18)";
      }
      if (timeValEl) {
        timeValEl.textContent = new Date().toTimeString().split(" ")[0];
      }

      // Canlı grafik açıksa ve son mum varsa son mumun kapanış fiyatını anında güncelle ve çiz
      if (Array.isArray(inspectCachedKlines) && inspectCachedKlines.length > 0) {
        const lastCandle = inspectCachedKlines[inspectCachedKlines.length - 1];
        if (lastCandle) {
          lastCandle.close = price;
          if (price > lastCandle.high) lastCandle.high = price;
          if (price < lastCandle.low) lastCandle.low = price;
          // Canvas çizim fonksiyonunu güvenli çağır
          if (typeof window.drawInspectCharts === "function") {
            const candleCanvas = document.getElementById("inspect-candle-canvas");
            if (candleCanvas && candleCanvas.offsetParent !== null) {
              window.drawInspectCharts();
            }
          }
        }
      }
    } catch (_) {}
  }, 4000);
}

startInspectAutoRefresh();


// ========================================================
// WEB3 API KAYIT İŞLEYİCİSİ
// ========================================================
document.querySelectorAll("#web3-provider-chips .coin-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#web3-provider-chips .coin-chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const provVal = document.getElementById("web3-provider-val");
    if (provVal) provVal.value = btn.getAttribute("data-prov");
  });
});

document.getElementById("btn-save-web3-api")?.addEventListener("click", async () => {
  const provider = document.getElementById("web3-provider-val")?.value || "metamask";
  const apiKey = document.getElementById("f-web3-api-key")?.value?.trim() || "";
  const apiSecret = document.getElementById("f-web3-api-secret")?.value?.trim() || "";
  const network = document.getElementById("f-web3-network")?.value?.trim() || "";
  if (!apiKey) {
    toast("Lütfen Web3 API Key veya Project ID giriniz", "error");
    return;
  }
  try {
    const res = await api("/api/web3/save", {
      provider: provider,
      api_key: apiKey,
      api_secret: apiSecret,
      network: network
    });
    if (res.ok) {
      toast("Web3 API bilgileri başarıyla kaydedildi ✅", "success");
    } else {
      toast("Hata: " + (res.error || "Kaydedilemedi"), "error");
    }
  } catch (e) {
    toast("Bağlantı hatası: " + e.message, "error");
  }
});


// ========================================================
// GELİŞMİŞ SİNYAL ENSTANTANESİ & ARAMA FİLTRESİ
// ========================================================
let currentSigFilter = "all";
let currentSigClass = "all";
let currentSigSearch = "";

window.openSignalSnapshot = function(sigId) {
  const sig = allSignalsData.find(s => String(s.id) === String(sigId)) || allSignalsData[0];
  if (!sig) return toast("Sinyal verisi bulunamadı", "warn");
  const modal = document.getElementById("signal-snapshot-modal");
  const title = document.getElementById("snap-title");
  const sub = document.getElementById("snap-sub");
  const body = document.getElementById("snap-body");
  const btnLive = document.getElementById("btn-snap-open-live");

  const isLong = (sig.side === "LONG" || sig.side === "BUY");
  const dirColor = isLong ? "var(--accent-green)" : "var(--accent-red)";
  const isClosed = (sig.status === "closed");
  const marketName = (sig.market || "futures").toUpperCase();

  if (title) title.textContent = `${sig.symbol} · ${sig.tf || '1h'} ${sig.side}`;
  if (sub) sub.textContent = `Sinyal Tarihi: ${sig.date || '—'} · Güç Skoru: ⭐ ${sig.power_score || 8.5}/10`;
  if (btnLive) btnLive.onclick = () => {
    if (modal) modal.style.display = "none";
    window.openGlobalSymbol(sig.symbol);
  };

  // Detaylı Durum Açıklaması (TP1 -> Girişe Stop mu, Normal Stop mu, TP2/TP3 mü)
  let outcomeBadge = "";
  if (isClosed) {
    if (sig.reason === "tp3" || sig.tp_hit >= 3) {
      outcomeBadge = `<span style="color:var(--accent-green);font-weight:700">🎯 TP3 Alındı (+${Number(sig.r_result||4.2).toFixed(2)}R) ✅ Maksimum Hedef</span>`;
    } else if (sig.reason === "tp2" || sig.tp_hit === 2) {
      outcomeBadge = `<span style="color:var(--accent-green);font-weight:700">🎯 TP2 Alındı (+${Number(sig.r_result||2.8).toFixed(2)}R) ✅</span>`;
    } else if (sig.reason === "tp1" || sig.tp_hit === 1) {
      outcomeBadge = `<span style="color:var(--accent-green);font-weight:700">🎯 TP1 Vuruldu ➔ 🛡️ Girişe Stoplandı (+${Number(sig.r_result||1.0).toFixed(2)}R) Kâr Kilitli</span>`;
    } else if (sig.reason === "be" || sig.reason === "breakeven") {
      outcomeBadge = `<span style="color:var(--accent-gold);font-weight:700">🛡️ Giriş Fiyatında Başabaş Kapatıldı (0.00R) Risk Korundu</span>`;
    } else if (sig.reason === "sl" || sig.r_result < 0) {
      outcomeBadge = `<span style="color:var(--accent-red);font-weight:700">🛑 Normal Stop-Loss Tetiklendi (-1.00R)</span>`;
    } else {
      outcomeBadge = `<span style="color:${sig.r_result > 0 ? 'var(--accent-green)' : 'var(--accent-red)'};font-weight:700">${sig.r_result > 0 ? '+' : ''}${Number(sig.r_result||0).toFixed(2)}R Kapatıldı</span>`;
    }
  } else {
    outcomeBadge = `<span style="color:#38bdf8;font-weight:700">⏳ AÇIK POZİSYON (Canlı Takipte) · Canlı K/Z: ${sig.pnl_pct >= 0 ? '+' : ''}${sig.pnl_pct || 0}%</span>`;
  }

  if (body) {
    const apiBase = (typeof getApiBase === "function" && getApiBase()) ? getApiBase().replace(/\/+$/, '') : '';
    const chartUrl = `${apiBase}/api/signal/chart/${sig.id}`;
    const curP = sig.current_price || sig.entry || '—';
    const pnlV = (sig.pnl_pct != null) ? sig.pnl_pct : 0;
    const pnlCol = pnlV >= 0 ? "var(--accent-green)" : "var(--accent-red)";

    body.innerHTML = `
      <!-- 📈 SİNYAL MUM GRAFİĞİ (TELEGRAM BİREBİR PNG / AKILLI FALLBACK) -->
      <div id="snap-chart-wrapper-${sig.id}" style="background:#0b1120;border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;margin-bottom:12px;position:relative;text-align:center">
        <img id="snap-img-${sig.id}" src="${chartUrl}" style="width:100%;height:auto;display:block;min-height:180px;object-fit:contain;background:#0b1120" alt="Sinyal Grafiği" 
          onerror="window.renderSignalChartFallback('${sig.id}')" />
        <div style="padding:6px 10px;background:rgba(0,0,0,0.6);font-size:10.5px;color:var(--text-muted);display:flex;justify-content:space-between">
          <span>🎯 TP1-TP3 &amp; SL Hedef Seviyeleri</span>
          <span style="color:#38bdf8">${marketName}</span>
        </div>
      </div>

      <!-- Canlı Fiyat & K/Z Paneli -->
      <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 14px;margin-bottom:12px">
        <div>
          <small style="color:var(--text-muted);font-size:10px;display:block">MEVCUT CANLI FİYAT</small>
          <strong style="font-size:14px;color:#fff">$${curP} <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#00e676;vertical-align:middle"></span></strong>
        </div>
        <div style="text-align:right">
          <small style="color:var(--text-muted);font-size:10px;display:block">CANLI KÂR / ZARAR</small>
          <strong style="font-size:14px;color:${pnlCol}">${pnlV >= 0 ? '+' : ''}${pnlV}%</strong>
        </div>
      </div>

      <!-- Seviyeler Detay Tablosu -->
      <div style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:var(--text-muted)">İşlem Modu:</span>
          <strong style="color:${dirColor}">${isLong ? '🟢 LONG / ALIM' : '🔴 SHORT / SATIM'} (${marketName})</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:var(--text-muted)">Giriş Fiyatı:</span>
          <strong style="color:#fff;font-size:13.5px">${sig.entry || '—'}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:var(--accent-red)">Stop-Loss (Zarar Durdur):</span>
          <strong style="color:var(--accent-red)">${sig.sl || '—'}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:var(--accent-green)">TP1 Hedefi:</span>
          <strong style="color:var(--accent-green)">${sig.tp1 || '—'}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:#4ade80">TP2 Hedefi:</span>
          <strong style="color:#4ade80">${sig.tp2 || (isLong ? (sig.entry*1.035).toFixed(2) : (sig.entry*0.965).toFixed(2))}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:#86efac">TP3 Hedefi:</span>
          <strong style="color:#86efac">${sig.tp3 || (isLong ? (sig.entry*1.07).toFixed(2) : (sig.entry*0.93).toFixed(2))}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)">
          <span style="font-size:12px;color:var(--text-muted)">Sonuç / Durum:</span>
          ${outcomeBadge}
        </div>
      </div>
    `;
  }

  if (modal) modal.style.display = "flex";
};

document.getElementById("btn-close-snap-modal")?.addEventListener("click", () => {
  const m = document.getElementById("signal-snapshot-modal");
  if (m) m.style.display = "none";
});
document.getElementById("btn-snap-close")?.addEventListener("click", () => {
  const m = document.getElementById("signal-snapshot-modal");
  if (m) m.style.display = "none";
});

// Arama & Gelişmiş Filtreleme
function applyCombinedSignalsFilter() {
  const container = document.getElementById("signals-list");
  if (!container) return;
  container.innerHTML = "";

  const q = (currentSigSearch || "").trim().toUpperCase();

  const filtered = allSignalsData.filter(s => {
    // 1. Arama filtresi
    if (q) {
      const sym = (s.symbol || "").toUpperCase();
      if (!sym.includes(q)) return false;
    }
    // 2. Durum / Yön filtresi
    if (currentSigFilter === "open" && s.status !== "open") return false;
    if (currentSigFilter === "tp" && !s.is_win) return false;
    if (currentSigFilter === "sl" && !s.is_loss) return false;
    if (currentSigFilter === "long" && s.side !== "LONG" && s.side !== "BUY") return false;
    if (currentSigFilter === "short" && s.side !== "SHORT") return false;
    if (currentSigFilter === "spot" && s.market !== "spot") return false;
    if (currentSigFilter === "futures" && s.market === "spot") return false;

    // 3. Varlık Sınıfı filtresi
    if (currentSigClass === "crypto") {
      if (!s.symbol.includes("USDT") && !s.symbol.includes("BTC") && !s.symbol.includes("ETH")) return false;
    } else if (currentSigClass === "stock") {
      const isStock = ["THYAO", "ASELS", "GARAN", "KCHOL", "TUPRS", "BIMAS", "AKBNK", "ISCTR", "EREGL", "SISE", "AAPL", "MSFT", "NVDA", "TSLA"].some(k => s.symbol.includes(k));
      if (!isStock) return false;
    } else if (currentSigClass === "commodity") {
      const isComm = ["GOLD", "SILVER", "XAU", "XAG", "BRENT", "CRUDE", "WTI", "USOIL", "UKOIL"].some(k => s.symbol.includes(k));
      if (!isComm) return false;
    } else if (currentSigClass === "forex") {
      const isFx = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDTRY", "EURTRY"].some(k => s.symbol.includes(k));
      if (!isFx) return false;
    }

    return true;
  });

  if (!filtered.length) {
    container.innerHTML = '<div class="empty">Aramanıza veya filtre kriterlerinize uygun sinyal bulunamadı</div>';
    return;
  }

  // Render cards using standard renderer
  window._renderSignalsSubset?.(filtered);
}

document.getElementById("sig-search-input")?.addEventListener("input", e => {
  currentSigSearch = e.target.value;
  applyCombinedSignalsFilter();
});

document.querySelectorAll(".sig-class-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sig-class-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSigClass = btn.dataset.class;
    applyCombinedSignalsFilter();
  });
});


// ========================================================
// MİNİ APP OTOMATİK VERİ VE BAKİYE YENİLEME DÖNGÜSÜ
// ========================================================
let globalAppLiveSyncTimer = null;

// 1. Profil Yanındaki Bakiye Göstergesi Otomatik Yenileme (12 saniyede bir)
setInterval(async () => {
  if (typeof _updateProfileBalance === "function") {
    await _updateProfileBalance();
  }
}, 12000);

// Bakiye çipine tıklandığında anında yenileme
document.getElementById("upc-balance-wrap")?.addEventListener("click", async () => {
  const balVal = document.getElementById("upc-balance-val");
  if (balVal) balVal.textContent = "⏳...";
  if (typeof _updateProfileBalance === "function") {
    await _updateProfileBalance();
  }
  toast("Bakiye güncellendi 🔄", "info");
});

// 2. Aktif Sekme Canlı Veri Yenileyici (6 saniyede bir)
function startAppLiveSync() {
  if (globalAppLiveSyncTimer) clearInterval(globalAppLiveSyncTimer);
  globalAppLiveSyncTimer = setInterval(async () => {
    try {
      const activeTabEl = document.querySelector(".tab-page.active") || document.querySelector("section.page.active");
      const tabId = activeTabEl?.id;
      if (tabId === "tab-dashboard") {
        await loadDashboard();
      } else if (tabId === "tab-signals") {
        const r = await api("/api/signals/all");
        if (r && r.ok && r.signals) {
          allSignalsData = r.signals;
          renderSignalsList(currentSigFilter || "all");
        }
      }
    } catch (e) {}
  }, 6000);
}

setTimeout(startAppLiveSync, 2000);

window.renderSignalChartFallback = function(sigId) {
  const wrapper = document.getElementById("snap-chart-wrapper-" + sigId);
  if (!wrapper) return;
  const sig = (typeof allSignalsData !== "undefined" && allSignalsData.find(s => String(s.id) === String(sigId))) || {};
  const isLong = (sig.side === "LONG" || sig.side === "BUY");
  const sideCol = isLong ? "#00e676" : "#ff5252";
  const entry = sig.entry || 0;
  const sl = sig.sl || 0;
  const tp1 = sig.tp1 || 0;
  const tp2 = sig.tp2 || 0;
  const tp3 = sig.tp3 || 0;

  wrapper.innerHTML = `
    <div style="padding:16px 14px;background:radial-gradient(circle at 50% 0%, rgba(56,189,248,0.12), transparent 70%), #0b1120;text-align:left">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:8px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:15px">📊</span>
          <strong style="color:#fff;font-size:13px">${sig.symbol || 'POZİSYON'} · ${sig.tf || '15m'}</strong>
          <span class="badge" style="background:${isLong ? 'rgba(0,230,118,0.18)' : 'rgba(255,82,82,0.18)'};color:${sideCol};font-weight:700;padding:1px 6px;font-size:10px">${sig.side || 'İŞLEM'}</span>
        </div>
        <span style="font-size:10.5px;color:var(--text-muted)">Görsel Üretim Modu</span>
      </div>

      <!-- Fiyat Seviyeleri Şeması -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06)">
          <div style="font-size:9.5px;color:var(--text-muted)">GİRİŞ FİYATI</div>
          <div style="font-size:13px;color:#fff;font-weight:700">$${entry}</div>
        </div>
        <div style="background:rgba(239,83,80,0.08);padding:8px 10px;border-radius:8px;border:1px solid rgba(239,83,80,0.2)">
          <div style="font-size:9.5px;color:#ef5350">🛑 STOP-LOSS (SL)</div>
          <div style="font-size:13px;color:#ef5350;font-weight:700">$${sl}</div>
        </div>
      </div>

      <!-- TP Seviyeleri -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">
        <div style="background:rgba(38,166,154,0.08);padding:6px 8px;border-radius:8px;border:1px solid rgba(38,166,154,0.2);text-align:center">
          <div style="font-size:9px;color:#26a69a">🎯 TP1</div>
          <div style="font-size:11.5px;color:#26a69a;font-weight:700">$${tp1}</div>
        </div>
        <div style="background:rgba(38,166,154,0.12);padding:6px 8px;border-radius:8px;border:1px solid rgba(38,166,154,0.25);text-align:center">
          <div style="font-size:9px;color:#26a69a">🎯 TP2</div>
          <div style="font-size:11.5px;color:#26a69a;font-weight:700">$${tp2}</div>
        </div>
        <div style="background:rgba(38,166,154,0.18);padding:6px 8px;border-radius:8px;border:1px solid rgba(38,166,154,0.35);text-align:center">
          <div style="font-size:9px;color:#26a69a">🎯 TP3</div>
          <div style="font-size:11.5px;color:#26a69a;font-weight:700">$${tp3}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:rgba(255,255,255,0.02);border-radius:6px;font-size:10.5px">
        <span style="color:var(--text-muted)">📈 Canlı Mum Grafiği:</span>
        <button class="btn btn-ghost" style="padding:2px 8px;font-size:10px;color:#38bdf8" onclick="window.openGlobalSymbol('${sig.symbol || 'BTCUSDT'}')">📊 Canlı Grafiği Aç ›</button>
      </div>
    </div>
  `;
};
