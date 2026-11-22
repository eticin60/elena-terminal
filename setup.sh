#!/data/data/com.termux/files/usr/bin/bash
# ========================================================
# Elena Bot & Terminal - Hizli ve Eksiksiz Kurulum
# ========================================================
set -e

echo ""
echo "🚀 ======================================================"
echo "   Elena Hughes Terminal - Tam Kurulum Baslatildi"
echo "=========================================================="
echo ""

# 1. Termux uyanik tutma
echo "⚡ [1/5] Termux arkaplan kilidi (Wake-lock) aktif ediliyor..."
termux-wake-lock 2>/dev/null || true

# 2. Paketleri ve Cloudflared Tünelini Kur (Termux resmi deposundan)
echo "📦 [2/5] Sistem paketleri ve Cloudflare tüneli kuruluyor..."
pkg install -y python git curl unzip tur-repo 2>/dev/null || true
pkg install -y cloudflared 2>/dev/null || true

# 3. Python kutuphanelerini kur
echo "🐍 [3/5] Python kutuphaneleri kontrol ediliyor..."
pip install --upgrade python-telegram-bot aiohttp httpx

# 4. Elena Bot v45 Paketini Indir ve Cikar
echo "📥 [4/5] Elena Bot dosyalari indiriliyor..."
mkdir -p "$HOME/elena-bot"
cd "$HOME"
curl -fSL --connect-timeout 10 --max-time 60 "https://github.com/eticin60/elena-terminal/raw/main/elena-bot-v45.zip" -o elena-bot.zip
unzip -o -q elena-bot.zip -d elena-bot/
rm -f elena-bot.zip

cd "$HOME/elena-bot"
chmod -R 755 .
chmod +x *.sh *.py 2>/dev/null || true

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
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    if command -v cloudflared >/dev/null 2>&1; then
        nohup cloudflared tunnel --url http://127.0.0.1:8080 > .tunnel.log 2>&1 &
    fi
    nohup python bot.py > bot.log 2>&1 &
    echo "🚀 Elena Bot ve Tünel arka planda baslatildi!"
fi
EOF
fi

# 6. Botu ve Cloudflared Tünelini Başlat
echo ""
echo "🚀 Bot ve Tünel servisi calistiriliyor..."
pkill -f "python.*bot.py" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true

if command -v cloudflared >/dev/null 2>&1; then
    echo "🌐 Cloudflare tüneli baslatiliyor (127.0.0.1:8080)..."
    nohup cloudflared tunnel --url http://127.0.0.1:8080 > .tunnel.log 2>&1 &
    sleep 3
    TUNNEL_URL=$(grep -oE "https://[a-zA-Z0-9-]+\.trycloudflare\.com" .tunnel.log 2>/dev/null | head -n1 || true)
    if [ -n "$TUNNEL_URL" ]; then
        echo "$TUNNEL_URL" > .miniapp_url
        echo "✅ Canli Tünel URL: $TUNNEL_URL"
    fi
fi

nohup python bot.py > bot.log 2>&1 &
sleep 2

if pgrep -f "python.*bot.py" > /dev/null 2>&1; then
    echo ""
    echo "=========================================================="
    echo "✅ TEBRIKLER! ELENA BOT & TERMINAL BASARIYLA CALISIYOR!"
    echo "=========================================================="
    echo "📱 Bot Durumu: AKTIF (PID: $(pgrep -f "python.*bot.py"))"
    echo "💾 Veritabani: $HOME/elena-bot/bot.db (Aktif & Otomatik Kayit)"
    if [ -f .miniapp_url ]; then
        echo "🌐 Canli Tünel (Admin & Webhook): $(cat .miniapp_url)"
    fi
    echo "🌐 7/24 Kesintisiz Panel: https://eticin60.github.io/elena-terminal/index.html"
    echo "👑 Telegram'da bota /admin yazarak Yönetim Panelini aninda acabilirsin!"
    echo "=========================================================="
else
    echo "⚠️ Bot baslatilamadi. Hata logu:"
    cat bot.log 2>/dev/null || true
fi
