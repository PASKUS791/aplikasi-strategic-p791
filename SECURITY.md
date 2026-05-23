# Catatan Keamanan

Dokumen ini merangkum proteksi yang sudah aktif di project dan hal-hal yang perlu dijaga saat deploy production.

## Proteksi yang Sudah Aktif

- Password di-hash di sisi server menggunakan `scrypt` dengan parameter yang bisa dikonfigurasi.
- Pepper password tambahan dimuat dari file `.env` melalui `APP_PASSWORD_PEPPER`.
- Session login memakai cookie `HttpOnly`, signed, dan `SameSite=Strict`.
- Endpoint login memiliki proteksi rate limit dan lockout brute force.
- Request tulis ke API memvalidasi `Origin` dan `Referer` tepercaya untuk mengurangi risiko CSRF.
- Backend sekarang memakai MongoDB driver resmi dan tidak membangun query dari string mentah user.
- Header deploy memblokir framing, sniffing, indexing, dan kebijakan lintas domain yang lemah.
- Aturan Apache deploy menolak akses ke source file, dotfile, dan file konfigurasi sensitif.
- Terdapat hardening session secret dan validasi environment untuk production.

## Checklist Production

1. Isi `APP_SESSION_SECRET` dengan nilai acak yang panjang dan kuat.
2. Isi `APP_PASSWORD_PEPPER` dengan nilai acak yang berbeda dari session secret.
3. Set `APP_TRUST_PROXY=true` jika aplikasi berada di belakang reverse proxy tepercaya.
4. Set `APP_ALLOWED_ORIGINS` hanya ke origin production yang resmi.
5. Pastikan domain production selalu memakai HTTPS.
6. Jangan upload `.env`, `server/`, atau source code ke public web root.
7. Ganti password admin bootstrap sebelum aplikasi benar-benar dipakai.
8. Letakkan domain publik di belakang WAF/CDN jika membutuhkan ketahanan DDoS yang lebih kuat.
9. Batasi akses panel admin hanya untuk role dan scope yang benar.
10. Audit ulang webhook dan kredensial sebelum go-live.

## Fokus Pengujian Pentest

- brute force login dan credential stuffing
- pencurian session dan validasi cookie flag
- CSRF pada request tulis yang memerlukan autentikasi
- injection dan query abuse pada endpoint auth, resource, dan admin
- akses langsung ke file deploy tersembunyi atau directory index
- broken access control antara role admin, PTI, scouting, dan anggota
- validasi origin palsu dan probing referer
- replay request pada endpoint sensitif

## Rekomendasi Tambahan

- Tambahkan audit log login dan perubahan data penting.
- Pertimbangkan 2FA untuk akun dengan akses strategis.
- Gunakan secret yang berbeda untuk lokal, beta, dan production.
- Jangan pernah commit file `.env` ke repository publik.
- Lakukan rotasi secret secara berkala untuk environment production.

## Identitas dan Kepemilikan Internal

Dokumentasi dan implementasi keamanan project ini dikelola secara internal oleh:

- Team DUKUN PASKUS 791
- Jevier — Frontend
- Teddy — Backend
- Lee — Cyber Sector
- Osiris — Bot Manufactur
