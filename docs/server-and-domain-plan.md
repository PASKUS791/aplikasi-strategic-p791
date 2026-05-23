# Rencana Server dan Domain

## Kondisi Saat Ini

- GitHub Pages disiapkan sebagai preview/pembesaran frontend aplikasi.
- Domain utama `strategic.so791.com` akan menjalankan halaman coming soon dari server.
- Akses publik domain utama lewat Cloudflare Tunnel, bukan langsung expose port server.
- Akses SSH server sudah diketahui oleh pemilik, tetapi password tidak dimasukkan ke repo atau command deployment.

## Arsitektur Yang Dipakai

```text
Tim update GitHub
        |
        v
Repo GitHub: aplikasi-strategic-p791
        |
        +--> GitHub Pages untuk preview/pengembangan frontend
        |
        +--> Server pull/sync folder site/
                 |
                 v
            Static service lokal 127.0.0.1:17912
                 |
                 v
            Cloudflare Tunnel
                 |
                 v
            strategic.so791.com
```

Dengan pola ini, domain utama tetap dikendalikan dari server dan Cloudflare, sedangkan GitHub tetap menjadi pusat kerja tim.

## Rekomendasi Keamanan SSH

Gunakan SSH key, bukan password, untuk deployment.

Langkah yang disarankan:

1. Buat SSH key khusus deploy.
2. Pasang public key di server pada user deploy atau user yang disetujui.
3. Simpan private key sebagai GitHub Actions secret.
4. Deploy otomatis dari branch `main`.
5. Batasi permission folder web hanya untuk kebutuhan deploy.

## Cloudflare Tunnel Untuk Domain Resmi

Untuk coming soon di domain utama, jangan arahkan `strategic.so791.com` ke GitHub Pages. Buat Cloudflare Tunnel yang route-nya mengarah ke service lokal server:

```text
https://strategic.so791.com -> http://127.0.0.1:17912
```

Langkah umum:

1. Install `cloudflared` di server.
2. Buat tunnel bernama `strategic-p791-coming-soon`.
3. Route DNS `strategic.so791.com` ke tunnel.
4. Jalankan service static lokal yang melayani folder static `site/`.
5. Jalankan timer sync agar server menarik update terbaru dari GitHub.

File template tersedia di:

```text
deploy/server/
```

## Catatan Implementasi Server

Server saat ini sudah memiliki Nginx/layanan lain yang memakai port 80/443 dan port aplikasi internal. Karena itu halaman coming soon dipasang sebagai systemd static service terpisah pada:

```text
http://127.0.0.1:17912
```

Cloudflare Tunnel tinggal diarahkan ke service lokal tersebut.

## GitHub Pages

GitHub Pages tetap dipakai untuk:

- preview publik awal,
- review perubahan UI,
- pembesaran frontend static,
- dokumentasi deployment.

Jangan pasang custom domain utama ke GitHub Pages selama domain utama ingin tetap running dari server via Cloudflare Tunnel.

## Catatan

Untuk aplikasi berbayar dengan login, lisensi device, dan data internal, GitHub Pages hanya boleh memegang frontend/static shell. Backend, database, audit login, dan data internal harus berada di server/API privat.
