# Ringkasan Meeting 23 Mei 2026

Dokumen ini adalah ringkasan public-safe dari notulen meeting pengembangan aplikasi umum DPDM PASKUS SO-791 pada Sabtu, 23 Mei 2026.

## Arah Produk

Aplikasi dirancang sebagai aplikasi resmi PASKUS791 untuk mendukung kebutuhan PvE anggota. Konsepnya berkembang dari ide HCO/map planner, tetapi dibuat lebih umum agar bisa dipakai anggota yang berlangganan.

Nilai utama aplikasi:

- Informasi PvE yang lebih terstruktur.
- Strategi siap pakai untuk latihan dan eksekusi.
- Data yang diperbarui oleh tim scouting dan PTI.
- Akses lintas perangkat, dimulai dari web.
- Perlindungan akses agar informasi internal tidak mudah tersebar.

## Fitur Yang Dibahas

- Dashboard informasi PvE.
- Sistem marker map berbasis kategori.
- Template input data scouting.
- Validasi data sebelum publikasi.
- Overlay map sebagai fitur lanjutan setelah MVP stabil.
- Watermark personal pada tampilan aplikasi.
- Lisensi perangkat dan batas maksimal device per pengguna.
- Audit login dan riwayat perubahan device.

## Risiko Utama

- Kebocoran akses ke pihak luar.
- Data scouting yang belum tervalidasi.
- Scope MVP terlalu besar untuk target awal.
- Penggunaan IP saja tidak cukup kuat sebagai kontrol keamanan.
- Repo publik tidak aman untuk menyimpan data strategi atau data anggota.

## Keputusan Awal

- Mulai dengan MVP web agar cepat diuji.
- Siapkan halaman publik "coming soon" lebih dulu.
- Gunakan GitHub untuk kolaborasi kode dan status publik.
- Pisahkan data publik dari data internal.
- Buat SOP scouting, validasi, upload, dan review berkala.

