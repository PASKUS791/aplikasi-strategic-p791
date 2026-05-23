# Rencana Server dan Domain

## Kondisi Saat Ini

- Halaman publik disiapkan untuk GitHub Pages.
- Target domain resmi nanti adalah `strategic.paskus791.cloud`.
- Akses SSH server sudah diketahui oleh pemilik, tetapi password tidak dimasukkan ke repo atau command deployment.

## Rekomendasi Keamanan SSH

Gunakan SSH key, bukan password, untuk deployment.

Langkah yang disarankan:

1. Buat SSH key khusus deploy.
2. Pasang public key di server pada user deploy atau user yang disetujui.
3. Simpan private key sebagai GitHub Actions secret.
4. Deploy otomatis dari branch `main`.
5. Batasi permission folder web hanya untuk kebutuhan deploy.

## DNS Untuk Domain Resmi

Jika memakai GitHub Pages:

1. Buat record CNAME:

```text
strategic.paskus791.cloud -> <username>.github.io
```

2. Tambahkan custom domain di Settings > Pages.
3. Aktifkan HTTPS.

Jika memakai server sendiri:

1. Arahkan DNS `A` atau `CNAME` ke server/proxy.
2. Pasang Nginx/Caddy.
3. Aktifkan TLS.
4. Jalankan aplikasi dari service manager seperti systemd atau Docker.

## Catatan

Untuk fase coming soon, GitHub Pages sudah cukup. Untuk aplikasi berbayar dengan login, lisensi device, dan data internal, pindahkan ke backend privat.

