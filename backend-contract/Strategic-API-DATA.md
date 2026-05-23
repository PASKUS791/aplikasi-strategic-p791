# Strategic API Data Guide

Dokumen ini dibuat supaya tim backend bisa langsung lihat data apa saja yang dibutuhkan frontend Strategic.

Base URL yang dipakai frontend Strategic sekarang:

- `https://api.strategic.so791.com`

## Endpoint Wajib

### 1. Login Strategic

`POST /api/auth/login`

Request body:

```json
{
  "scope": "strategic",
  "username": "strategicadmin",
  "password": "ChangeMeStrategic123!"
}
```

Response minimal:

```json
{
  "user": {
    "id": "strategicadmin",
    "username": "strategicadmin",
    "label": "Strategic Admin",
    "nama": "Strategic Admin",
    "unit": "Strategic Command",
    "scope": "strategic"
  }
}
```

### 2. Session Check

`GET /api/auth/session`

Response saat login masih valid:

```json
{
  "authenticated": true,
  "user": {
    "id": "strategicadmin",
    "username": "strategicadmin",
    "label": "Strategic Admin",
    "nama": "Strategic Admin",
    "unit": "Strategic Command",
    "scope": "strategic"
  }
}
```

Response saat belum login:

```json
{
  "authenticated": false
}
```

### 3. Logout

`POST /api/auth/logout`

Response minimal:

```json
{
  "ok": true
}
```

### 4. Resource Sync

Frontend Strategic membaca dan menyimpan data melalui resource berikut:

- `strategic.plannerState`
- `strategic.customMaps`
- `strategic.strategicSaves`
- `strategic.mapPlannerUsers`

Endpoint:

- `GET /api/resources/:resourceKey`
- `PUT /api/resources/:resourceKey`

Response `GET` minimal:

```json
{
  "resource": "strategic.plannerState",
  "value": {
    "actions": [],
    "enabledCategoryIds": ["2", "3", "4", "5", "6", "7", "8", "enemy-intel"],
    "viewport": null
  }
}
```

Request `PUT` minimal:

```json
{
  "value": {
    "actions": [],
    "enabledCategoryIds": ["2", "3", "4", "5", "6", "7", "8", "enemy-intel"],
    "viewport": null
  }
}
```

### 5. SSE / Realtime Sync

`GET /api/events`

Frontend Strategic pakai `EventSource` untuk update realtime. Event message minimal:

```json
{
  "resource": "strategic.customMaps",
  "updatedAt": "2026-04-06T00:00:00.000Z"
}
```

Yang penting:

- content type `text/event-stream`
- event dikirim ulang saat salah satu resource Strategic berubah

### 6. Daftar User Strategic

`GET /api/strategic/users`

Response minimal:

```json
{
  "users": [
    {
      "id": "strategicadmin",
      "username": "strategicadmin",
      "label": "Strategic Admin",
      "unit": "Strategic Command",
      "scope": "strategic",
      "access": {
        "mainPlanner": true,
        "customMaps": true,
        "saves": true
      }
    }
  ]
}
```

### 7. Tambah User Strategic

`POST /api/strategic/users`

Request body:

```json
{
  "username": "ronoalpha",
  "label": "Rono Alpha",
  "unit": "Strategic Tactical Cell",
  "password": "ChangeMeStrategic123!"
}
```

Response minimal:

```json
{
  "message": "User map planner berhasil ditambahkan."
}
```

### 8. Hapus User Strategic

`DELETE /api/strategic/users/:username`

Response minimal:

```json
{
  "message": "Anggota Strategic berhasil dihapus."
}
```

### 9. Dispatch Strategic Save

`POST /api/strategic/strategic-saves/:id/dispatch`

Response minimal:

```json
{
  "message": "Strategi berhasil dikirim."
}
```

## File Seed Siap Pakai

File seed yang sudah saya siapkan ada di:

- [strategic-seed.json](/Users/jerikho/Documents/New%20project/StrategicP791Web/backend-contract/strategic-seed.json)

Isi file ini:

- akun awal Strategic
- resource awal untuk planner
- contoh custom map
- contoh strategic save planner utama
- contoh strategic save custom map

## Struktur Resource yang Dipakai Frontend

### `strategic.plannerState`

```json
{
  "actions": [],
  "enabledCategoryIds": ["2", "3", "4", "5", "6", "7", "8", "enemy-intel"],
  "viewport": null
}
```

### `strategic.customMaps`

Array of object:

```json
[
  {
    "id": "custom-map-sample-001",
    "title": "Operation Harbor Grid",
    "description": "Map custom untuk latihan jalur serbu sisi timur.",
    "imageDataUrl": "data:image/png;base64,...",
    "createdAt": "2026-04-06T00:00:00.000Z",
    "updatedAt": "2026-04-06T00:00:00.000Z",
    "createdBy": {
      "id": "strategicadmin",
      "username": "strategicadmin",
      "label": "Strategic Admin"
    },
    "board": {
      "actions": [],
      "viewport": null
    }
  }
]
```

### `strategic.strategicSaves`

Array of object:

```json
[
  {
    "id": "main-strategy-001",
    "ownerId": "strategicadmin",
    "ownerUsername": "strategicadmin",
    "ownerLabel": "Strategic Admin",
    "title": "Route North Push",
    "note": "Masuk dari utara lalu potong supply lane.",
    "createdAt": "2026-04-06T00:00:00.000Z",
    "updatedAt": "2026-04-06T00:00:00.000Z",
    "actionCount": 2,
    "categoryCount": 8,
    "thumbnailDataUrl": "data:image/webp;base64,...",
    "snapshot": {
      "actions": [],
      "enabledCategoryIds": ["2", "3", "4", "5", "6", "7", "8", "enemy-intel"],
      "viewport": {
        "scale": 0.12,
        "offsetX": 148,
        "offsetY": 26,
        "width": 1380,
        "height": 860
      },
      "frame": {
        "width": 1380,
        "height": 860
      }
    }
  }
]
```

### `strategic.mapPlannerUsers`

```json
[
  {
    "username": "ronoalpha",
    "access": {
      "mainPlanner": true,
      "customMaps": true,
      "saves": true
    },
    "updatedAt": "2026-04-06T00:00:00.000Z"
  }
]
```

## Catatan Backend

- frontend Strategic menormalisasi username ke lowercase
- user `strategicadmin` dianggap admin utama oleh frontend
- user admin utama tidak wajib ada di `strategic.mapPlannerUsers`, karena access-nya otomatis full
- image dan thumbnail untuk custom map / strategic save disimpan sebagai `data URL`
- kalau backend mau lebih efisien, image bisa dipindah ke object storage lalu field `imageDataUrl` dan `thumbnailDataUrl` diganti ke URL publik, tapi frontend saat ini paling aman tetap dengan format string biasa
