# Deploy Strategic P791

Dokumen ini membedakan dua jalur deployment yang sedang dipakai.

## GitHub Pages

GitHub Pages dipakai sebagai preview pengembangan aplikasi React/Vite.

```text
https://paskus791.github.io/aplikasi-strategic-p791/
```

Alur otomatis:

1. Push ke branch `main`.
2. GitHub Actions menjalankan `npm ci`.
3. GitHub Actions menjalankan `npm run build`.
4. Output `dist-strategic/` dipublish ke GitHub Pages.

Workflow ada di:

```text
.github/workflows/pages.yml
```

## Domain Utama

Domain utama sementara tetap menampilkan halaman coming soon dari server:

```text
https://strategic.so791.com
```

Konten coming soon ada di:

```text
site/
```

Service server dan Cloudflare Tunnel ada di:

```text
deploy/server/
```

## Backend Strategic

Backend hasil clone sudah disiapkan di:

```text
strategic-api-backend/
```

Target API production yang disarankan:

```text
https://api.strategic.so791.com
```

Environment minimal:

```env
NODE_ENV=production
API_PORT=8787
APP_ALLOWED_ORIGINS=https://strategic.so791.com,https://paskus791.github.io
APP_SESSION_SECRET=secret-random-panjang-dan-unik
APP_PASSWORD_PEPPER=pepper-random-panjang-dan-unik
APP_TRUST_PROXY=true
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/strategic-p791
MONGODB_DB_NAME=strategic-p791
PRIMARY_STRATEGIC_USERNAME=strategicadmin
PRIMARY_STRATEGIC_PASSWORD=ganti-password-production
PUBLIC_APP_URL=https://strategic.so791.com
```

Jalankan backend:

```bash
cd strategic-api-backend
npm install
npm start
```

## Catatan

- GitHub Pages hanya untuk frontend preview.
- Domain utama dan backend berbayar sebaiknya tetap lewat server privat.
- Secret production tidak boleh masuk git.
