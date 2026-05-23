# Strategic Workspace Guide

Repo ini sekarang khusus untuk website `Strategic` saja.

Folder edit utama:

- `src/strategic/`
  modul utama planner, custom map, saves, user access, marker, dan tactical UI
- `strategic-api-backend/`
  backend Strategic terpisah dengan struktur `router/controller/model/middleware` untuk domain `api.strategic.so791.com`
- `backend-contract/`
  kontrak endpoint, seed data, dan file `.http` untuk tim backend
- `src/pages/StrategicLoginPortal.jsx`
  login page Strategic
- `src/components/`
  komponen shared yang masih dipakai Strategic seperti rotating logo dan security overlay
- `src/lib/strategicAuth.js`
  auth state Strategic
- `src/lib/strategicApi.js`
  request API Strategic ke backend
- `src/lib/resources.js`
  synced resource helper untuk planner state, custom maps, saves, dan access matrix
- `src/assets/strategic/`
  asset khusus Strategic seperti map image dan delete effect
- `strategic-site/index.html`
  entry HTML website Strategic
- `vite.strategic.config.js`
  config Vite untuk build dan dev Strategic

Command utama:

```bash
npm run dev
npm run build
npm run preview
```

Command backend Strategic:

```bash
cd strategic-api-backend
npm install
npm run dev
```

Output build:

- `dist-strategic/`

Catatan:

- repo ini difokuskan untuk aplikasi Strategic P791.
- data internal dan fitur berbayar tetap harus ditaruh di backend privat.
