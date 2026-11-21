#!/data/data/com.termux/files/usr/bin/bash
# ========================================================
# Elena Bot & Terminal - Hizli ve Kesintisiz Kurulum Scripti
# ========================================================
set -e

echo ""
echo "🚀 ======================================================"
echo "   Elena Hughes Terminal - Hizli Kurulum Baslatildi"
echo "=========================================================="
echo ""

# 1. Termux uyanik tutma
echo "⚡ [1/5] Termux arkaplan kilidi (Wake-lock) aktif ediliyor..."
termux-wake-lock 2>/dev/null || true

# 2. Gerekli sistem paketlerini kur (Zaten kurulu olanlari aninda gecer)
echo "📦 [2/5] Sistem paketleri dogrulaniyor..."
pkg install -y python git curl unzip

# 3. Python kutuphanelerini kur
echo "🐍 [3/5] Python kutuphaneleri kontrol ediliyor..."
pip install --upgrade python-telegram-bot aiohttp httpx

# 4. Elena Bot v44 Paketini Indir ve Cikar (Maks 10 saniye)
echo "📥 [4/5] Elena Bot dosyalari indiriliyor..."
mkdir -p "$HOME/elena-bot"
cd "$HOME"
curl -fSL --connect-timeout 10 --max-time 60 "https://github.com/eticin60/elena-terminal/raw/main/elena-bot-v44.zip" -o elena-bot.zip
unzip -o -q elena-bot.zip -d elena-bot/
rm -f elena-bot.zip

cd "$HOME/elena-bot"
chmod -R 755 .
chmod +x *.sh *.py 2>/dev/null || true

# .env Yapilandirmasi
if [ ! -f .env ] && [ -f env.example ]; then
    cp env.example .env
fi

# 5. Termux Otomatik Baslatma (Bashrc Entegrasyonu)
echo "🔄 [5/5] Otomatik calisma kurallari ekleniyor..."
if ! grep -q "python.*bot.py" "$HOME/.bashrc" 2>/dev/null; then
    cat << 'EOF' >> "$HOME/.bashrc"

# --- Elena Bot Otomatik Calistirma Bekcisi ---
if ! pgrep -f "python.*bot.py" > /dev/null 2>&1; then
    termux-wake-lock 2>/dev/null
    cd "$HOME/elena-bot"
    nohup python bot.py > bot.log 2>&1 &
    echo "🚀 Elena Bot arka planda baslatildi!"
fi
EOF
fi

# 6. Botu Arka Planda Baslat
echo ""
echo "🚀 Bot calistiriliyor..."
pkill -f "python.*bot.py" 2>/dev/null || true
nohup python bot.py > bot.log 2>&1 &
sleep 2

if pgrep -f "python.*bot.py" > /dev/null 2>&1; then
    echo ""
    echo "=========================================================="
    echo "✅ TEBRIKLER! ELENA BOT & TERMINAL BASARIYLA CALISIYOR!"
    echo "=========================================================="
    echo "📱 Bot Durumu: AKTIF (PID: $(pgrep -f "python.*bot.py"))"
    echo "💾 Veritabani: $HOME/elena-bot/bot.db (Aktif & Otomatik Kayit)"
    echo "🌐 Canli Mini App: https://eticin60.github.io/elena-terminal/index.html"
    echo "⚡ Termux'u kapatsan bile bot arka planda kesintisiz calisir."
    echo ""
    echo "💬 Simdi Telegram'da botuna gidip /start yazabilirsin!"
    echo "=========================================================="
else
    echo "⚠️ Bot baslatilamadi. Hata logu:"
    cat bot.log 2>/dev/null || true
fi
