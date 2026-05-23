#!/usr/bin/env bash

set -euo pipefail

echo "[1/5] Install dependency..."
npm install

echo "[2/5] Build frontend..."
npm run build

echo "[3/5] Pastikan file .env sudah ada..."
if [ ! -f ".env" ]; then
  echo "File .env belum ada. Copy dari deploy/strategic.so791.com.env lalu isi nilai backend production."
  exit 1
fi

echo "[4/5] Start / restart PM2..."
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe strategic-p791 >/dev/null 2>&1; then
    pm2 restart ecosystem.config.cjs --only strategic-p791
  else
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
else
  echo "PM2 belum terinstall. Install dulu dengan: npm install -g pm2"
  exit 1
fi

echo "[5/5] Done."
echo "Sekarang cek:"
echo "curl http://127.0.0.1:8787/api/health"
