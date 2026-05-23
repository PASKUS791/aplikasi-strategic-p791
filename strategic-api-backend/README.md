## API Strategic (`strategic-api`)

Backend ini dibuat mengikuti pola backend contoh dari tim:

- `router`
- `controller`
- `model`
- `middleware`

Tujuannya supaya gampang dipindahkan ke `api.strategic.so791.com` dan familier buat tim backend.

### Endpoint utama

- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/resources/:resourceKey`
- `PUT /api/resources/:resourceKey`
- `GET /api/events`
- `GET /api/strategic/users`
- `POST /api/strategic/users`
- `DELETE /api/strategic/users/:username`
- `POST /api/strategic/strategic-saves/:id/dispatch`
- `POST /api/strategic/server-addresses/dispatch`
- `PUT /api/strategic/server-addresses/:messageId`
- `DELETE /api/strategic/server-addresses/:messageId`

### Cara jalanin lokal

1. Copy env:

```bash
cp .env.example .env
```

2. Install dependency:

```bash
npm install
```

3. Jalankan:

```bash
npm run dev
```

### Reset user Strategic (sisakan admin utama + tambah admin baru)

Jika ingin reset akun Strategic cepat:

```bash
npm run reset:strategic-users
```

Default hasil reset:

- admin utama: `strategicadmin` / password dari `PRIMARY_STRATEGIC_PASSWORD`
- admin tambahan: `adminstrategic` / password default `ChangeMeAdminStrategic123!`

Opsional override admin tambahan via env:

- `NEW_STRATEGIC_ADMIN_USERNAME`
- `NEW_STRATEGIC_ADMIN_PASSWORD`

### Env penting untuk dispatch Discord

`POST /api/strategic/strategic-saves/:id/dispatch` sekarang akan mengirim payload ke webhook Discord.

Isi env berikut di server:

- `DISCORD_STRATEGIC_WEBHOOK_URL` (wajib) -> webhook channel strategic save
- `Strategic_SERVER_ADDRESS_WEBHOOK_URL` (opsional) -> override webhook tetap untuk menu administrasi server
- `PUBLIC_APP_URL` (opsional) -> base URL untuk avatar default webhook
- `Strategic_WEBHOOK_AVATAR_URL` (opsional) -> override avatar webhook

### Security Event

Backend ini sekarang sudah bisa mengirim `securityEvent` ke frontend Strategic untuk memunculkan overlay keamanan saat:

- percobaan login berulang masuk kategori brute force
- payload login terlihat seperti probing / pentest
- request tulis datang dari origin atau referer yang tidak tepercaya

### Seed data

Secara default backend akan membaca file:

- `../backend-contract/strategic-seed.json`

Kalau mau pakai file lain, isi `Strategic_SEED_FILE` di `.env`.
