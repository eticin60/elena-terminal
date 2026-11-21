#!/data/data/com.termux/files/usr/bin/bash
# ========================================================
# Elena Bot & Terminal - Tek Tus Kurulum ve Baslatma Scripti
# ========================================================
set -e

echo ""
echo "🚀 ======================================================"
echo "   Elena Hughes Terminal - Otomatik Kurulum Baslatildi"
echo "=========================================================="
echo ""

# 1. Termux uyanik tutma
echo "⚡ [1/6] Termux arkaplan kilidi (Wake-lock) aktif ediliyor..."
termux-wake-lock 2>/dev/null || true

# 2. Gerekli sistem paketlerini kur
echo "📦 [2/6] Paketler guncelleniyor ve bagimliliklar yukleniyor..."
pkg update -y
pkg install -y python git curl unzip clang libffi openssl

# 3. Python kutuphanelerini kur (Termux pip uyarisi vermeyecek sekilde)
echo "🐍 [3/6] Python paketleri (python-telegram-bot, aiohttp, httpx) kuruluyor..."
pip install --upgrade python-telegram-bot aiohttp httpx

# Cloudflared tünel aracını kontrol et / kur
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "🌐 Cloudflared tunel araci kuruluyor..."
  case "$(uname -m)" in
    aarch64|arm64) A=arm64 ;;
    armv7l|armv8l) A=arm ;;
    x86_64) A=amd64 ;;
    *) A=arm64 ;;
  esac
  curl -L -s -o "$PREFIX/bin/cloudflared" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$A" 2>/dev/null || true
  chmod +x "$PREFIX/bin/cloudflared" 2>/dev/null || true
fi

# 4. Elena Bot v44 Paketini Indir ve Cikar
echo "📥 [4/6] Elena Bot v44 dosyalari indiriliyor..."
mkdir -p "$HOME/elena-bot"
cd "$HOME"
curl -fSL "https://github.com/eticin60/elena-terminal/raw/main/elena-bot-v44.zip" -o elena-bot.zip
unzip -o -q elena-bot.zip -d elena-bot/
rm -f elena-bot.zip

cd "$HOME/elena-bot"
chmod -R 755 .
chmod +x *.sh *.py 2>/dev/null || true

# 5. .env Yapilandirmasi
echo "⚙️ [5/6] Konfigurasyon ve ortam degiskenleri kontrol ediliyor..."
if [ ! -f .env ] && [ -f env.example ]; then
    cp env.example .env
fi

# 6. Termux Otomatik Baslatma (Bashrc Entegrasyonu)
echo "🔄 [6/6] Termux her acildiginda otomatik calisma kurali ekleniyor..."
if ! grep -q "python.*bot.py" "$HOME/.bashrc" 2>/dev/null; then
    cat << 'EOF' >> "$HOME/.bashrc"

# --- Elena Bot Otomatik Calistirma Bekcisi ---
if ! pgrep -f "python.*bot.py" > /dev/null 2>&1; then
    termux-wake-lock 2>/dev/null
    cd "$HOME/elena-bot"
    pkill -f "cloudflared" 2>/dev/null || true
    if command -v cloudflared >/dev/null 2>&1; then
        nohup cloudflared tunnel --url http://127.0.0.1:8080 > .tunnel.log 2>&1 &
    fi
    nohup python bot.py > bot.log 2>&1 &
    echo "🚀 Elena Bot ve Tunel arka planda baslatildi!"
fi
EOF
fi

# 7. Bot ve Cloudflared Tuneli Baslat
echo ""
echo "🚀 Bot ve Tunel calistiriliyor..."
pkill -f "python.*bot.py" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true

if command -v cloudflared >/dev/null 2>&1; then
    echo "🌐 Cloudflare tuneli baslatiliyor..."
    nohup cloudflared tunnel --url http://127.0.0.1:8080 > .tunnel.log 2>&1 &
fi

nohup python bot.py > bot.log 2>&1 &
sleep 3

if pgrep -f "python.*bot.py" > /dev/null 2>&1; then
    echo ""
    echo "=========================================================="
    echo "✅ TEBRIKLER! ELENA BOT & TERMINAL BASARIYLA CALISIYOR!"
    echo "=========================================================="
    echo "📱 Bot Durumu: AKTIF (PID: $(pgrep -f "python.*bot.py"))"
    echo "💾 Veritabani: $HOME/elena-bot/bot.db (Aktif & Otomatik Kayit)"
    echo "🌐 Canli Mini App: https://eticin60.github.io/elena-terminal/index.html"
    echo "⚡ Termux'u kapatsan veya telefon yeniden baslasa bile"
    echo "   bot arka planda kesintisiz calismaya devam eder."
    echo ""
    echo "💬 Telegram botunuza gidip /start yazarak kullanabilirsiniz!"
    echo "=========================================================="
else
    echo "⚠️ Bot baslatilamadi. Hata logu:"
    cat bot.log 2>/dev/null || true
fi
