#!/data/data/com.termux/files/usr/bin/bash
# =====================================================================
# Елена Хьюз · Crypto Signals — Profesyonel Başlatma Scripti (Termux)
# =====================================================================
cd "$(dirname "$0")" || exit 1
termux-wake-lock 2>/dev/null

echo "=========================================="
echo "  Елена Хьюз · Crypto Signals Başlatılıyor"
echo "=========================================="

# 1. Eski süreçleri temizle
echo ">> Eski süreçler temizleniyor..."
pkill -9 -f "python.*bot.py" 2>/dev/null || true
pkill -9 -f "cloudflared" 2>/dev/null || true
sleep 1

# 2. Cloudflared Tünelini Başlat
if command -v cloudflared >/dev/null 2>&1; then
  echo ">> Cloudflare HTTPS tüneli açılıyor (127.0.0.1:8080)..."
  rm -f .tunnel.log .miniapp_url
  nohup cloudflared tunnel --url http://127.0.0.1:8080 > .tunnel.log 2>&1 &
  
  echo ">> Tünel adresi bekleniyor (maks 35 sn)..."
  for i in $(seq 1 35); do
    URL=$(grep -oE "https://[a-zA-Z0-9-]+\.trycloudflare\.com" .tunnel.log 2>/dev/null | tail -n1)
    if [ -n "$URL" ]; then
      echo "=========================================="
      echo ">> TEBRİKLER! CANLI SİSTEM ÇALIŞIYOR"
      echo ">> Mini App / Web: $URL"
      echo ">> Admin Panel:   $URL/admin.html"
      echo "=========================================="
      echo "$URL" > .miniapp_url
      if [ -f .env ]; then
        if grep -q "^MINIAPP_URL=" .env; then
          sed -i "s|^MINIAPP_URL=.*|MINIAPP_URL=$URL|" .env
        else
          echo "MINIAPP_URL=$URL" >> .env
        fi
      fi
      # Yedek ntfy senkronu
      curl -s -d "$URL" https://ntfy.sh/elena_hughes_terminal_sync_8f93b1 >/dev/null 2>&1 &
      break
    fi
    sleep 1
  done
else
  echo ">> UYARI: cloudflared bulunamadı!"
fi

# 3. Bot Döngüsü (Arka planda kesintisiz çalışır)
echo ">> Bot motoru başlatılıyor... (Durdurmak için CTRL+C)"
while true; do
  python bot.py
  echo ">> Bot durdu. 3 saniye sonra yeniden başlayacak..."
  sleep 3
done
