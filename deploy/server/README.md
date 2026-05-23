# Deployment Coming Soon Server

Folder ini menyiapkan deployment untuk domain utama:

```text
strategic.paskus791.cloud
```

Tujuan:

- Domain utama menampilkan halaman coming soon dari server.
- Akses publik memakai Cloudflare Tunnel.
- GitHub Pages tetap dipakai untuk preview/pengembangan aplikasi.
- Update dari GitHub bisa ditarik oleh server secara berkala.

## Komponen

```text
nginx/strategic-p791-coming-soon.conf     Nginx lokal di 127.0.0.1:8787
cloudflared/config.example.yml            Contoh config Cloudflare Tunnel
scripts/sync-coming-soon.sh               Pull repo dan sync site/ ke web root
systemd/strategic-p791-sync.service       Service sync sekali jalan
systemd/strategic-p791-sync.timer         Timer sync berkala
```

## Path Server Yang Disarankan

```text
/opt/strategic-p791/repo
/var/www/strategic-p791-coming-soon
```

## Setup Server

1. Install paket dasar:

```bash
sudo apt update
sudo apt install -y git rsync nginx
```

2. Install `cloudflared` sesuai OS server dari dokumentasi Cloudflare.

3. Clone repo ke server:

```bash
sudo mkdir -p /opt/strategic-p791
sudo chown -R "$USER":"$USER" /opt/strategic-p791
git clone https://github.com/YerikhoArfensiasEffendi/aplikasi-strategic-p791.git /opt/strategic-p791/repo
```

4. Pasang Nginx config:

```bash
sudo cp /opt/strategic-p791/repo/deploy/server/nginx/strategic-p791-coming-soon.conf /etc/nginx/sites-available/strategic-p791-coming-soon
sudo ln -s /etc/nginx/sites-available/strategic-p791-coming-soon /etc/nginx/sites-enabled/strategic-p791-coming-soon
sudo nginx -t
sudo systemctl reload nginx
```

5. Jalankan sync pertama:

```bash
sudo /opt/strategic-p791/repo/deploy/server/scripts/sync-coming-soon.sh
```

6. Aktifkan timer sync:

```bash
sudo cp /opt/strategic-p791/repo/deploy/server/systemd/strategic-p791-sync.service /etc/systemd/system/
sudo cp /opt/strategic-p791/repo/deploy/server/systemd/strategic-p791-sync.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now strategic-p791-sync.timer
```

7. Buat Cloudflare Tunnel:

```bash
cloudflared tunnel create strategic-p791-coming-soon
cloudflared tunnel route dns strategic-p791-coming-soon strategic.paskus791.cloud
```

8. Sesuaikan config tunnel dari `cloudflared/config.example.yml`, lalu jalankan:

```bash
sudo cloudflared service install
sudo systemctl restart cloudflared
```

## Catatan Keamanan

- Jangan commit token tunnel, password SSH, private key, atau file credential Cloudflare.
- Untuk sync dari repo publik, server cukup pull lewat HTTPS.
- Jika repo nanti dibuat private, pakai deploy key khusus read-only.
- Halaman coming soon boleh publik; data aplikasi berbayar tetap harus di backend privat.

