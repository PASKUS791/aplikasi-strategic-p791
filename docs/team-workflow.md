# Workflow Kerja Tim

## Prinsip

- `main` harus selalu bisa dideploy.
- Data internal tidak masuk repo publik.
- Update fitur memakai branch kecil dan pull request.
- Semua perubahan data harus punya penanggung jawab.

## Branch

Gunakan pola:

```text
feature/nama-fitur
fix/nama-bug
data/update-status
docs/topik-dokumen
```

## Alur Update

1. Pull data terbaru.
2. Buat branch baru.
3. Ubah file yang diperlukan.
4. Jalankan pengecekan lokal.
5. Commit dengan pesan jelas.
6. Push branch.
7. Buat pull request.
8. Review oleh PTI atau penanggung jawab.
9. Merge ke `main`.

## Update Status Publik

File:

```text
site/data/app-status.json
```

Contoh field yang boleh diubah:

- `status`
- `headline`
- `message`
- `phase`
- `lastUpdated`

Jangan masukkan:

- Detail marker/map internal.
- Data user.
- Informasi lisensi device.
- Password, token, IP pribadi, atau kredensial server.
- Strategi yang belum boleh dilihat publik.

## Data Real-time Untuk Aplikasi Sebenarnya

GitHub Pages cocok untuk halaman status publik. Untuk aplikasi anggota berbayar, gunakan:

- Backend API dengan autentikasi.
- Database privat.
- Log audit.
- Role-based access control.
- Deployment server yang bisa rollback.

