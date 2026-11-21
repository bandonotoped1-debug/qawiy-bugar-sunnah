# QOWIY — Bugar ala Sunnah

Aplikasi kebugaran & gaya hidup sehat untuk Muslim dan Muslimah berdasarkan Al-Qur'an dan Sunnah, dengan artikel kesehatan bersumber ilmiah. Strukturnya terinspirasi dari dashboard e-course (peta program, progres otomatis, paket langganan).

## Isi aplikasi

**Aplikasi member (`index.html`)**
- **Tes kebugaran 11 pertanyaan** → hasil personal (IMT klasifikasi Kemenkes, TDEE Mifflin-St Jeor, target kalori, protein, jalur program, rencana harian mengikuti waktu sholat) → diarahkan ke **halaman langganan**. Setiap hasil tersimpan sebagai *lead* di database.
- **Langganan**: 3 paket (bisa diubah di admin), pembayaran QRIS/transfer/link pembayaran + konfirmasi WhatsApp, verifikasi oleh admin.
- **Dashboard**: sapaan & statistik, "Lanjutkan" lesson, **rutinitas hari ini** (Ba'da Subuh, Dhuha, Ba'da Ashar, Ba'da Isya), **peta program** (Start → Fondasi Sunnah → Pola Latihan → Jalur A Turun Berat / Jalur B Bugar & Kuat + Ramadan Mode + Stuck?), **checklist sunnah harian** dengan grafik 7 hari & streak, motivasi trainer, artikel, kontak WA.
- **Kalkulator kesehatan** (gratis, tanpa login, gaya calculator.net berbahasa Indonesia): kalori (3 rumus BMR — Mifflin-St Jeor, Revised Harris-Benedict, Katch-McArdle; 7 level aktivitas; target turun/naik 0,25–1 kg/pekan; satuan kkal/kJ; siklus kalori zigzag; tabel kalori makanan & olahraga), **BMR**, **IMT/BMI** (Kemenkes + berat ideal), **lemak tubuh** (U.S. Navy).
- **Rencana makan** otomatis dari hasil kuis: porsi Daftar Bahan Makanan Penukar Kemenkes (nasi, lauk hewani & nabati, sayur, buah, minyak dalam ukuran rumah tangga), menu 7 hari + menu hari puasa (sahur–berbuka kurma–makan malam). Hari 1 tampil gratis di halaman hasil kuis; sisanya untuk member.
- Halaman lesson (video + tandai selesai), video rutinitas & motivasi (dipisah ikhwan/akhwat), artikel dengan dalil (nomor hadits + tautan sunnah.com/quran.com) & sumber ilmiah, kalkulator kalori, akun.

**Panel admin (`admin.html`)**
- Upload **video rutinitas harian** (waktu sholat, hari tayang, untuk ikhwan/akhwat/semua) dan **video motivasi trainer** — upload file langsung ke Supabase Storage (dengan progress bar) atau tempel link YouTube/Google Drive/MP4.
- Kelola modul & lesson peta program, tulis artikel (dalil + sumber ilmiah), verifikasi pembayaran & aktifkan langganan, beri akses manual, lihat & unduh CSV hasil kuis + follow-up WA, pengaturan brand/harga/QRIS/rekening.

## Menjalankan
Tanpa konfigurasi, aplikasi berjalan dalam **mode demo** (data di browser). Akun admin demo: `admin@qowiy.id` / `admin123`.

## Menghubungkan database online (Supabase)
1. Buat proyek di https://supabase.com (gratis).
2. Buka **SQL Editor** → jalankan isi `supabase/schema.sql`, lalu `supabase/seed.sql` (konten awal: modul, lesson, video contoh, 7 artikel).
3. **Project Settings → API** → salin *Project URL* dan *anon public key* ke `assets/js/config.js`.
4. **Authentication → URL Configuration** → isi *Site URL* dengan domain Vercel Anda.
5. Buka aplikasi, **daftar** dengan email Anda, lalu di SQL Editor jalankan:
   ```sql
   update public.profiles set role = 'admin' where email = 'email-anda@gmail.com';
   ```
6. Masuk ke `/admin` dan ubah **Pengaturan** (nomor WA admin, rekening, QRIS, harga).

Catatan: paket gratis Supabase membatasi ukuran file upload 50 MB. Untuk video panjang, unggah ke YouTube (unlisted) lalu tempel linknya.

## Keamanan
- Row Level Security aktif di semua tabel: member hanya bisa membaca/menulis datanya sendiri; konten berbayar & file video hanya bisa diakses member dengan langganan aktif; hanya admin yang bisa mengubah konten.
- File video disimpan di bucket privat `media` dan diputar lewat *signed URL* berumur 3 jam.

## Deploy
Situs statis — tanpa build. Di Vercel: *Import Git Repository* → Framework: **Other** → Deploy. Setiap push ke branch `main` otomatis di-deploy ulang.

Produksi: https://qowiy.vercel.app

## Rujukan utama konten
WHO Guidelines on Physical Activity 2020 · Kemenkes RI (G4 G1 L5, Pedoman Gizi Seimbang) · Fernando dkk., *Nutrients* 2019 (puasa Ramadan) · Paluch dkk., *Lancet Public Health* 2022 (langkah harian) · Morton dkk., *BJSM* 2018 (protein) · Watson dkk., *Sleep* 2015 (durasi tidur) · Andrade dkk., *J Am Diet Assoc* 2008 (makan perlahan) · Mifflin dkk., *AJCN* 1990 (BMR). Hadits dirujuk dengan nomor riwayat ke sunnah.com.

> Konten bersifat edukasi umum dan tidak menggantikan konsultasi dokter. Sebaiknya artikel ditinjau oleh ustadz/ahli gizi tim Anda sebelum dipublikasikan.
