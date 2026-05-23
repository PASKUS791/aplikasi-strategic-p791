# Aplikasi Strategic P791

Project aplikasi resmi berbayar untuk anggota PASKUS791. Basis frontend dan backend awal diambil dari repo referensi yang diberikan, lalu dibersihkan menjadi branding Strategic tanpa unsur nama lama.

## Status

- Repo organisasi: `PASKUS791/aplikasi-strategic-p791`
- Preview pengembangan: `https://paskus791.github.io/aplikasi-strategic-p791/`
- Domain utama sementara: `https://strategic.so791.com`
- Domain utama masih menjalankan halaman `APPS STATUS COMINGSOON` dari server via Cloudflare Tunnel.

## Struktur Utama

```text
strategic-site/            Entry HTML aplikasi React/Vite Strategic
src/strategic/             Planner, custom maps, saves, user access, dan layout aplikasi
src/lib/                   API client, auth provider, synced resources
strategic-api-backend/     Backend Express/MongoDB untuk API Strategic
backend-contract/          Contoh payload, seed, dan kontrak API Strategic
site/                      Halaman coming soon untuk strategic.so791.com
deploy/server/             Service server + Cloudflare Tunnel untuk halaman coming soon
.github/workflows/         Deploy otomatis GitHub Pages
```

## Jalankan Frontend Lokal

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:5174
```

## Build

```bash
npm run build
npm run preview
```

Output build frontend ada di:

```text
dist-strategic/
```

## Environment Frontend

```env
VITE_STRATEGIC_SITE_URL=http://localhost:5174
VITE_STRATEGIC_API_BASE_URL=https://api.strategic.so791.com
```

Untuk GitHub Pages, workflow memakai:

```env
VITE_PUBLIC_BASE_PATH=/aplikasi-strategic-p791/
```

## Catatan Keamanan

- Jangan commit password asli, token Cloudflare, private key, atau secret production.
- Data strategi internal, data anggota berbayar, marker sensitif, dan lisensi device harus masuk backend/private storage.
- Repo publik ini aman untuk frontend preview dan dokumentasi teknis awal.

## Tahap Pengembangan Berikutnya

1. Finalisasi branding visual Strategic P791.
2. Aktifkan backend Strategic privat dengan MongoDB.
3. Bangun login anggota, role PTI/scouting/admin, audit login, dan batas device.
4. Pisahkan data publik dan data berbayar agar GitHub Pages hanya memuat frontend.
5. Tambahkan deployment backend ke server/tunnel setelah MVP siap.
