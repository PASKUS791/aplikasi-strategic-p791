# Dokumentasi Role-Based Access Strategic P791

Dokumentasi ini menjelaskan pengaturan role dan hak akses baru untuk aplikasi Strategic P791.
Perubahan ini menambahkan tiga role utama: `admin`, `scout`, dan `user`, serta mengaitkan hak akses marker dan planner.

## 1. Tujuan

Menambahkan kontrol akses berbasis role agar:
- `Admin` mendapatkan akses penuh, termasuk menu `Administrasi Server`.
- `Scout` dapat mengakses map planner, membuat marker, dan melihat `Strategic Saves`.
- `User` dapat mengakses map planner dan melihat `Strategic Saves`, tetapi tidak dapat membuat marker atau mengakses `Administrasi Server`.

## 2. Role yang didukung

| Role | Hak akses |
|---|---|
| `admin` | Akses penuh di aplikasi Strategic: planner, marker, `Strategic Saves`, `Administrasi Server`, dan fitur admin lainnya. |
| `scout` | Dapat membuka map planner, menambahkan marker custom, dan mengakses `Strategic Saves`. |
| `user` | Dapat membuka map planner dan mengakses `Strategic Saves`, tetapi tidak dapat membuat marker custom. |

## 3. Implementasi Backend

### 3.1. Schema User

File: `strategic-api-backend/src/model/strategicUser.js`

Penambahan field role pada schema Mongoose:
- `role: { enum: ["admin","scout","user"], default: "user" }`

### 3.2. Serializer dan normalisasi

File: `strategic-api-backend/src/utils/strategicUsers.js`

Perubahan:
- Tambahkan helper `normalizeStrategicRole`.
- Sertakan `role` di output serialisasi user.
- Ekspor helper tersebut agar dapat digunakan oleh seed dan util lain.

### 3.3. Controller

File: `strategic-api-backend/src/controller/users.js`

Perubahan:
- Validasi role saat pembuatan user baru.
- Simpan role ke dalam dokumen user.

### 3.4. Seed data

File: `strategic-api-backend/src/utils/seed.js`

Perubahan:
- Tetapkan primary bootstrap user menjadi `role: "admin"`.
- Pastikan semua data seed menjaga nilai role sesuai kebutuhan.

## 4. Implementasi Frontend

### 4.1. Normalisasi sesi

File: `src/lib/strategicApi.js`

Perubahan:
- Sertakan `role` di dalam data sesi yang dinormalisasi dari backend.

### 4.2. Helper akses strategis

File: `src/strategic/strategicAccess.js`

Penambahan:
- Normalisasi role ke format yang konsisten.
- Helper akses baru seperti `canStrategicUserAddMarkers`.
- Pemetaan hak akses berbasis role untuk `marker`, `planner`, dan `admin`.

### 4.3. UI Manajemen User

File: `src/strategic/StrategicMapPlannerUsersPage.jsx`

Perubahan:
- Tambahkan dropdown select role saat membuat user baru.
- Tampilkan badge role di daftar user.

### 4.4. Gating fitur marker

File: `src/strategic/StrategicDashboardPage.jsx`

Perubahan:
- Tombol marker/gambar di toolbar disembunyikan atau dinonaktifkan untuk user tanpa hak marker.
- Tombol `marker` pada fullscreen toolbar juga memeriksa `canAddMarkers`.
- Jika role berubah, pengguna otomatis tidak bisa memilih tool marker lagi.
- Pembuatan marker (`markerDraft`) diblokir secara langsung jika user tidak berhak.

### 4.5. Navigation & Sidebar Akses

File: `src/strategic/StrategicLayout.jsx`

Perubahan:
- Item sidebar `Administrasi Server` hanya ditampilkan untuk admin.
- Route `/dashboard/server-addresses` diblokir bagi non-admin untuk mencegah akses langsung.
- `scout` dan `user` sekarang dapat melihat sidebar `Strategic Saves` jika akses saves diaktifkan.

## 5. Permissions Matrix

| Role | Map Planner | Buat Marker | Strategic Saves | Administrasi Server | Manajemen Pengguna |
|---|---|---|---|---|---|
| `admin` | Ya | Ya | Ya | Ya | Ya |
| `scout` | Ya | Ya | Ya | Tidak | Tidak |
| `user` | Ya | Tidak | Ya | Tidak | Tidak |

## 6. Catatan Penambahan

- Role masih menggunakan sistem akses berbasis `role` di atas boolean `access` lama.
- Pastikan backend dan frontend tetap menyinkronkan data session `role` saat login.
- Untuk pengembangan lanjutan, dapat menambahkan middleware route-level untuk memaksa validasi role di API.

## 7. File Utama Referensi

- `strategic-api-backend/src/model/strategicUser.js`
- `strategic-api-backend/src/utils/strategicUsers.js`
- `strategic-api-backend/src/controller/users.js`
- `strategic-api-backend/src/utils/seed.js`
- `src/lib/strategicApi.js`
- `src/strategic/strategicAccess.js`
- `src/strategic/StrategicLayout.jsx`
- `src/strategic/StrategicMapPlannerUsersPage.jsx`
- `src/strategic/StrategicDashboardPage.jsx`

