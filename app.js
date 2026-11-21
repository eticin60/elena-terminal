// Елена Хьюз · Main Mini App Terminal — Liquid Glass Fullscreen
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
    tab_coins: "🪙 Coinler", tab_tools: "🧮 Araçlar", tab_markets: "📊 Canlı Piyasa", tab_settings: "⚙️ Ayarlar",
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
    tab_coins: "🪙 Монеты", tab_tools: "🧮 Инструменты", tab_markets: "📊 Живой рынок", tab_settings: "⚙️ Настройки",
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
    tab_coins: "🪙 Coins", tab_tools: "🧮 Tools", tab_markets: "📊 Live Market", tab_settings: "⚙️ Settings",
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
    tab_coins: "🪙 Монети", tab_tools: "🧮 Інструменти", tab_markets: "📊 Живий ринок", tab_settings: "⚙️ Налаштування",
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
    tab_coins: "🪙 Coins", tab_tools: "🧮 Tools", tab_markets: "📊 Live-Markt", tab_settings: "⚙️ Einstellungen",
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
    tab_coins: "🪙 Monedas", tab_tools: "🧮 Herramientas", tab_markets: "📊 Mercado en vivo", tab_settings: "⚙️ Ajustes",
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
    tab_coins: "🪙 Cryptos", tab_tools: "🧮 Outils", tab_markets: "📊 Marché en direct", tab_settings: "⚙️ Paramètres",
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
    tab_coins: "🪙 العملات", tab_tools: "🧮 الأدوات", tab_markets: "📊 السوق المباشر", tab_settings: "⚙️ الإعدادات",
    lbl_pwd: "كلمة المرور الأمنية", lbl_extra_pwd: "كلمة المرور الإضافية",
    pwd_saved: "✅ معرّف", pwd_not_saved: "غير معرّف"
  }
};

let currentLang = "tr";

function applyLanguage(lang) {
  if (!I18N[lang]) lang = "tr";
  currentLang = lang;
  const dict = I18N[lang];

  document.getElementById("current-lang-label").textContent = lang.toUpperCase();
  if ($("#i18n-landing-sub"))   $("#i18n-landing-sub").textContent   = dict.landing_sub;
  if ($("#i18n-btn-connect"))   $("#i18n-btn-connect").textContent   = dict.btn_connect;
  if ($("#i18n-btn-manual-addr")) $("#i18n-btn-manual-addr").textContent = dict.btn_manual_addr;
  if ($("#i18n-landing-disc"))  $("#i18n-landing-disc").textContent  = dict.landing_disc;
  if ($("#i18n-btn-admin"))     $("#i18n-btn-admin").textContent     = dict.btn_admin;

  // Pill title'ları (hem eski id hem yeni id formatlarını destekle)
  const setEl = (id, val) => { const e = $(id); if (e && val) e.textContent = val; };
  setEl("#i18n-feat-1-title",    dict.feat_1_title);
  setEl("#i18n-feat-auto-title", dict.feat_auto_title);
  setEl("#i18n-feat-multi-title",dict.feat_multi_title);
  setEl("#i18n-feat-2-title",    dict.feat_2_title);
  setEl("#i18n-feat-3-title",    dict.feat_3_title);
  // Pill açıklamaları
  setEl("#i18n-feat-1",          dict.feat_1);
  setEl("#i18n-feat-auto-desc",  dict.feat_auto);
  setEl("#i18n-feat-multi-desc", dict.feat_multi);
  setEl("#i18n-feat-2",          dict.feat_2);
  setEl("#i18n-feat-3",          dict.feat_3);

  // Tab etiket <span>'larını güncelle — ikon korunur, sadece metin span değişir
  const stripEmoji = s => (s||"").replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u,"").trim();
  const setTab = (id,val,fb) => { const e=$(id); if(e) e.textContent=stripEmoji(val)||fb; };
  setTab("#tab-lbl-wallet",   dict.tab_wallet,   "Cüzdan");
  setTab("#tab-lbl-auto",     dict.tab_auto,     "Oto-Bot");
  setTab("#tab-lbl-exchange", dict.tab_exchange, "Borsa");
  setTab("#tab-lbl-manual",   dict.tab_manual,   "Manuel");
  setTab("#tab-lbl-signals",  dict.tab_signals,  "Sinyaller");
  setTab("#tab-lbl-coins",    dict.tab_coins,    "Coinler");
  setTab("#tab-lbl-tools",    dict.tab_tools,    "Araçlar");
  setTab("#tab-lbl-markets",  dict.tab_markets,  "Piyasa");
  setTab("#tab-lbl-settings", dict.tab_settings, "Ayarlar");
  setTab("#tab-lbl-guide",    dict.tab_guide,    "Rehber");
  setTab("#tab-lbl-dashboard",dict.tab_dashboard,"Pano");

  if ($("#i18n-lbl-pwd")) $("#i18n-lbl-pwd").textContent = dict.lbl_pwd;
  if ($("#i18n-lbl-extra-pwd")) $("#i18n-lbl-extra-pwd").textContent = dict.lbl_extra_pwd;

  localStorage.setItem("elena_lang", lang);
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
  var src  = COIN_LOGOS[base];
  if (src) {
    var img = document.createElement("img");
    img.src = src; img.width = size; img.height = size;
    img.style.cssText = "border-radius:50%;object-fit:contain;vertical-align:middle;flex-shrink:0;background:rgba(255,255,255,0.06);padding:2px";
    img.onerror = function(){ this.replaceWith(coinBadge(base, size)); };
    return img;
  }
  return coinBadge(base, size);
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

async function api(path, body = {}) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, ...body })
  });
  if (!r.ok) {
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
}));

// ========================================================
// CÜZDAN: WALLETCONNECT v2 & MULTI-CHAIN (Tron + BSC + ETH)
// ========================================================
async function initWalletConnect() {
  if (!CFG?.wc_project_id) {
    toast("WalletConnect Project ID bulunamadı", "error");
    return;
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
  try {
    // wcClient sadece bir kez init olur (dil değişmediyse yeniden oluşturmaya gerek yok)
    // Dil değişikliği durumu için lang'ı sakla
    if (!wcClient || wcClient.__lang !== currentLang) {
      wcClient = null;
      await initWalletConnect();
      if (wcClient) wcClient.__lang = currentLang;
    }
    if (!wcClient) return;

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

    // URI varsa modal aç (QR / deep-link)
    if (uri) {
      try { wcModal.openModal({ uri }); } catch (_) {}
    }

    // Cüzdan onayını bekle — bu Promise cüzdan uygulaması onayladığında resolve olur
    let session;
    try {
      session = await approval();
    } finally {
      // Her durumda (başarı veya hata) modal'ı kapat
      try { wcModal.closeModal(); } catch (_) {}
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

    await api("/api/wallet/connect", { address, chain });
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
    toast("Bağlantı hatası: " + (e.message || "Bilinmeyen hata"), "error");
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
    await api("/api/wallet/connect", { address: addr, chain: finalChain });
    if (manualModal) manualModal.style.display = "none";
    toast("Cüzdan başarıyla bağlandı ✅", "success");
    await loadWallet();
  } catch (e) {
    toast("Kayıt hatası: " + (e.message || "Bilinmeyen hata"), "error");
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
  const r = await api("/api/wallet/status");
  if (r.connected) {
    WALLET = r;
    document.getElementById("landing-view").style.display = "none";
    document.getElementById("app-view").style.display   = "block";
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

  // --- TRON ---
  if (isTron) {
    try {
      const r = await api("/api/wallet/balance");
      if (r.ok) {
        if (nativeEl) nativeEl.textContent = (r.native ?? 0).toFixed(4) + " TRX";
        if (chainEl) chainEl.textContent = "TRON";
        list.innerHTML = "";
        if (r.tokens && r.tokens.length) {
          r.tokens.forEach(t => _appendToken(list, t));
        } else {
          list.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:6px 0">TRC20 token bulunamadı</div>`;
        }
      }
    } catch(e) { list.innerHTML = `<div style="color:var(--accent-red);font-size:12px">Bakiye alınamadı</div>`; }
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
  await api("/api/wallet/disconnect");
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
window.selectExchange = function(exch, btn) {
  currentExchange = exch;
  $all('.exch-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  const okxRow = document.getElementById('okx-passphrase-row');
  if (okxRow) okxRow.style.display = exch === 'okx' ? 'block' : 'none';
};

async function loadExchangeTab() {
  try {
    const r = await api("/api/exchange/status");
    if (r.connected && $('#f-api-key') && r.masked_key) {
      $('#f-api-key').placeholder = `Kayıtlı: ${r.masked_key}`;
    }
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
    // Price row
    var prices = document.createElement("div");
    prices.style.cssText = "display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:12px;margin-bottom:8px;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px";
    prices.innerHTML = "<div><div style='color:var(--text-muted);font-size:10px;margin-bottom:2px'>GİRİŞ</div><strong style='color:#fff'>" + (s.entry||"—") + "</strong></div>"
      + "<div><div style='color:var(--text-muted);font-size:10px;margin-bottom:2px'>STOP</div><strong style='color:var(--accent-red)'>" + (s.sl||"—") + "</strong></div>"
      + "<div><div style='color:var(--text-muted);font-size:10px;margin-bottom:2px'>SONUÇ</div><strong style='color:" + (s.r_result >= 0 ? "var(--accent-green)" : "var(--accent-red)") + "'>" + (s.r_result != null ? (s.r_result >= 0 ? "+" : "") + s.r_result.toFixed(2) + "R" : "—") + "</strong></div>";
    card.appendChild(prices);
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
  try {
    const r = await api('/api/user/stats');
    if ($('#d-total')) $('#d-total').textContent = r.total_signals ?? 0;
    if ($('#d-open')) $('#d-open').textContent = r.open_signals ?? 0;
    if ($('#d-win')) $('#d-win').textContent = r.wins ?? 0;
    if ($('#d-lose')) $('#d-lose').textContent = r.losses ?? 0;
  } catch (e) {}
}

// ========================================================
// ANA BAŞLATICI (MAIN)
// ========================================================
async function main() {
  // Telegram WebApp initData varsa doğrula; yoksa da (Main App / doğrudan açılış) terminali aç
  try {
    ME = await api("/api/verify");
  } catch (e) {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    ME = {
      ok: true,
      user_id: tgUser?.id || 0,
      username: tgUser?.username || "Guest",
      first_name: tgUser?.first_name || "Trader",
      lang: tgUser?.language_code?.slice(0, 2) || localStorage.getItem("elena_lang") || "tr",
      is_admin: false
    };
  }

  // Dil ayarla: Botta seçilen dil önceliklidir (ME.lang), yoksa cihaz/tarayıcı dili veya kayıtlı tercih
  const botLang = ME?.lang;
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.slice(0, 2);
  const activeLang = botLang || localStorage.getItem("elena_lang") || tgLang || "tr";
  applyLanguage(activeLang);
  checkLegalAgreement(activeLang);

  // Yönetici ise Landing ve Menü butonlarını göster
  if (ME.is_admin) {
    const landAdmin = document.getElementById("landing-admin-btn");
    if (landAdmin) landAdmin.style.display = "inline-flex";
  }

  try {
    CFG = await (await fetch("/api/config")).json();
    if (document.getElementById("webhook-url-box") && CFG.webhook_url) {
      document.getElementById("webhook-url-box").textContent = CFG.webhook_url;
      document.getElementById("btn-copy-webhook").onclick = () => {
        navigator.clipboard?.writeText(CFG.webhook_url).then(() => toast("Webhook URL kopyalandı ✅", "success"));
      };
    }
  } catch (e) { CFG = {}; }

  try {
    const st = await api("/api/user/settings");
    SETTINGS = { ...EXTRA_DEFAULTS, ...(st.settings || {}) };
  } catch {
    SETTINGS = { ...EXTRA_DEFAULTS };
  }

  renderAutoForm();
  await loadWallet();
  await checkPasswordStatus();
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
    chip.innerHTML = `${isSelected ? '✅' : '➕'} <strong>${s.replace('USDT', '')}</strong>`;
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
  rawSymbol = rawSymbol.trim().toUpperCase();
  // Temizle ve formatla: BINANCE:BTCUSDT veya genel arama
  let formatted = rawSymbol;
  if (!formatted.includes(":")) {
    if (!formatted.endsWith("USDT") && !formatted.endsWith("USD") && !formatted.endsWith("TRY") && !formatted.endsWith("BTC")) {
      formatted += "USDT";
    }
    formatted = "BINANCE:" + formatted;
  }
  currentTvSymbol = formatted;
  if (interval) currentTvInterval = interval;

  const displaySym = currentTvSymbol.split(":")[1] || currentTvSymbol;
  const badge = document.getElementById("tv-active-badge");
  if (badge) badge.textContent = displaySym;

  const sel = document.getElementById("tv-symbol-select");
  if (sel) {
    let found = false;
    for (let opt of sel.options) {
      if (opt.value === currentTvSymbol) {
        sel.value = currentTvSymbol;
        found = true;
        break;
      }
    }
    if (!found) {
      const newOpt = document.createElement("option");
      newOpt.value = currentTvSymbol;
      newOpt.textContent = displaySym.replace("USDT", "/USDT");
      newOpt.selected = true;
      sel.appendChild(newOpt);
    }
  }

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

document.getElementById("tv-symbol-select")?.addEventListener("change", (e) => {
  setTradingViewSymbol(e.target.value);
});

document.getElementById("tv-interval-select")?.addEventListener("change", (e) => {
  currentTvInterval = e.target.value;
  renderTradingViewChart(currentTvSymbol, currentTvInterval);
});

document.getElementById("btn-tv-search")?.addEventListener("click", () => {
  const inp = document.getElementById("tv-custom-symbol-input");
  if (inp && inp.value) {
    setTradingViewSymbol(inp.value);
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

async function loadMarketsTab() {
  renderTradingViewChart(document.getElementById("tv-symbol-select")?.value || "BINANCE:BTCUSDT");
  updatePaperUI();
  const volBox = document.getElementById("market-volume-list");
  const gainBox = document.getElementById("market-gainers-list");
  const lossBox = document.getElementById("market-losers-list");
  if (volBox) volBox.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Yükleniyor…</div>`;
  if (gainBox) gainBox.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Yükleniyor…</div>`;
  if (lossBox) lossBox.innerHTML = `<div style="color:var(--text-muted);font-size:12px">Yükleniyor…</div>`;

  try {
    const r = await api("/api/markets/live");
    if (!r.ok) return;

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
