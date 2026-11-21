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

# 3. Python kutuphanelerini kur
echo "🐍 [3/6] Python paketleri (python-telegram-bot, aiohttp, httpx) kuruluyor..."
pip install --upgrade pip
pip install --upgrade python-telegram-bot aiohttp httpx

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
    cd "$HOME/elena-bot" && nohup python bot.py > bot.log 2>&1 &
    echo "🚀 Elena Bot arka planda baslatildi!"
fi
EOF
fi

# 7. Botu Baslat
echo ""
echo "🚀 Bot calistiriliyor..."
pkill -f "python.*bot.py" 2>/dev/null || true
nohup python bot.py > bot.log 2>&1 &
sleep 3

if pgrep -f "python.*bot.py" > /dev/null 2>&1; then
    echo ""
    echo "=========================================================="
    echo "✅ TEBRIKLER! ELENA BOT & TERMINAL BASARIYLA CALISIYOR!"
    echo "=========================================================="
    echo "📱 Bot Durumu: AKTIF (PID: $(pgrep -f "python.*bot.py"))"
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
