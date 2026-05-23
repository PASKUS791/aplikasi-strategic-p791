# Aplikasi Strategic P791

Status awal proyek untuk aplikasi resmi anggota PASKUS791.

## Ringkasan

Aplikasi Strategic P791 adalah rencana aplikasi berbayar untuk anggota PASKUS791. Arah produk dari hasil meeting 23 Mei 2026:

- Pusat informasi dan strategi PvE resmi PASKUS791.
- Akses lintas perangkat: web lebih dulu, lalu evaluasi desktop/mobile.
- Data operasional diperbarui oleh tim scouting dan PTI melalui alur validasi.
- Proteksi akses memakai kombinasi akun, lisensi device, batas device, watermark, dan audit login.
- Beta test dilakukan oleh PTI dan tim scouting sebelum rilis anggota.

Halaman publik saat ini hanya menampilkan status:

> APPS STATUS COMINGSOON  
> aplikasi resmi untuk anggota paskus791 dan berbayar

## Struktur Repo

```text
site/                         Halaman coming soon dan GitHub Pages preview
site/data/app-status.json     Data status publik yang bisa diperbarui tim
docs/                         Ringkasan meeting dan rencana pengembangan
deploy/server/                Paket deployment server + Cloudflare Tunnel
.github/workflows/pages.yml   Deploy otomatis ke GitHub Pages
```

## Jalankan Lokal

```bash
cd site
python3 -m http.server 4173
```

Buka `http://localhost:4173`.

## Update Data Publik

Untuk update status yang tampil di halaman publik, edit:

```text
site/data/app-status.json
```

Lalu commit dan push ke GitHub. Halaman akan mengambil file itu ulang secara berkala dengan cache-busting ringan.

Catatan penting: data strategi, marker map, scouting, user berbayar, lisensi device, dan informasi internal tidak boleh dimasukkan ke repo publik. Untuk data real-time aplikasi sebenarnya, gunakan backend/private repository dengan autentikasi.

## Domain

Arsitektur domain disiapkan seperti ini:

```text
GitHub Pages                -> preview/pembesaran frontend aplikasi
strategic.so791.com         -> halaman coming soon dari server via Cloudflare Tunnel
```

Selama aplikasi masih dibuat, domain utama menampilkan halaman coming soon dari server. Setelah MVP siap, frontend bisa tetap dibesarkan di GitHub Pages atau dipindahkan ke server yang sama sesuai kebutuhan keamanan aplikasi berbayar.
