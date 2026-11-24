-- =====================================================================
-- Migration 005: perbarui 2 artikel sesuai riset ilmu produk QOWIY
--   - puasa-dan-penelitian: tambah panduan waktu olahraga saat puasa
--     (Aspetar Clinical Guideline — Ramadan Fasting & Exercise) + catatan
--     bahaya olahraga sebelum berbuka bagi penderita diabetes
--   - jalan-kaki-ke-masjid: tambah penjelasan NEAT (non-exercise activity
--     thermogenesis) dan rujukan Mayo Clinic
-- Aman dijalankan berkali-kali (idempotent) — hanya meng-UPDATE kolom
-- body & sources pada 2 baris artikel yang sudah ada berdasarkan slug;
-- tidak menyentuh tabel lain (settings, plans, modules, dll).
-- =====================================================================

update public.articles set
  body = 'Puasa adalah ibadah; tujuan utamanya takwa, bukan diet. Namun banyak yang bertanya: apa dampaknya pada tubuh?

## Temuan meta-analisis
Tinjauan sistematis dan meta-analisis tahun 2019 di jurnal Nutrients menghimpun data dari 70 publikasi (2.947 peserta dewasa sehat non-atlet). Hasilnya:
- Berat badan dan persentase lemak cenderung turun selama Ramadan, terutama pada orang dengan kelebihan berat badan atau obesitas.
- Sekitar 2–5 pekan setelah Ramadan, berat dan komposisi tubuh cenderung kembali mendekati kondisi sebelum Ramadan.
- Efeknya bervariasi antarindividu, tergantung apakah porsi saat berbuka dan sahur "membalas dendam" atau tidak.

Pelajarannya: manfaat puasa untuk berat badan bisa bertahan bila pola makan sederhana saat berbuka diteruskan, misalnya dengan puasa Senin–Kamis.

## Berbuka dan sahur sesuai sunnah
Nabi ﷺ berbuka dengan beberapa butir kurma segar, atau kurma kering, atau beberapa teguk air, lalu sholat — tidak langsung makan besar. Sahur pun dianjurkan karena mengandung keberkahan.

## Puasa Senin–Kamis
Rasulullah ﷺ menyukai amalnya diperlihatkan kepada Allah dalam keadaan berpuasa pada hari Senin dan Kamis. Bagi peserta jalur Turun Berat, dua hari ini bisa menjadi jangkar ibadah sekaligus kendali porsi.

## Kapan waktu terbaik berolahraga saat puasa?
Untuk orang sehat tanpa kondisi medis khusus, panduan klinis Aspetar (pusat kedokteran olahraga di Qatar) menyarankan waktu latihan terbaik selama puasa adalah: 2 jam setelah berbuka, setelah sholat Isya/Tarawih, atau setelah sahur/Tahajud — hindari latihan berat menjelang berbuka saat cairan tubuh paling rendah. Modul Ramadan Mode di QOWIY mengikuti jadwal ini.

## Siapa yang perlu hati-hati?
Allah memberi keringanan bagi yang sakit. Penderita diabetes (terutama yang memakai insulin atau obat penurun gula tertentu) sebaiknya menghindari olahraga sebelum berbuka karena risiko gula darah turun drastis (hipoglikemia); ibu hamil/menyusui dan pasien penyakit kronis lain wajib berkonsultasi dengan dokter sebelum berpuasa sunnah atau mengatur latihan saat puasa.',
  sources = '[{"judul":"Fernando HA dkk. Effect of Ramadan Fasting on Weight and Body Composition in Healthy Non-Athlete Adults: A Systematic Review and Meta-Analysis. Nutrients 11(2):478","penerbit":"MDPI","tahun":2019,"url":"https://doi.org/10.3390/nu11020478"},{"judul":"Aspetar Clinical Guideline — Ramadan Fasting and Exercise","penerbit":"Aspetar Sports Medicine Journal","tahun":2021,"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC10966349"}]'::jsonb
where slug = 'puasa-dan-penelitian';

update public.articles set
  body = 'Setiap langkah menuju masjid dicatat sebagai kebaikan: satu langkah menghapus kesalahan, langkah lainnya mengangkat derajat. Ternyata langkah-langkah itu juga bernilai bagi kesehatan.

## Berapa langkah yang cukup?
Meta-analisis di The Lancet Public Health (2022) yang menggabungkan 15 kohort internasional menemukan risiko kematian menurun seiring bertambahnya langkah harian:
- Usia 60 tahun ke atas: manfaat terus bertambah hingga sekitar 6.000–8.000 langkah per hari.
- Usia di bawah 60 tahun: hingga sekitar 8.000–10.000 langkah per hari.

Kabar baiknya, target ini tidak harus dicapai sekaligus.

## Bukan cuma soal olahraga terstruktur
Istilah ilmiahnya NEAT (*non-exercise activity thermogenesis*) — energi yang terbakar dari gerakan sehari-hari di luar sesi olahraga: berjalan, berdiri, naik-turun tangga. Penelitian Mayo Clinic mencatat NEAT bisa berbeda hingga sekitar 2.000 kkal/hari antarindividu dengan berat badan serupa — berperan besar dalam mengelola berat badan, terutama bagi yang jarang punya waktu olahraga terjadwal.

## Cara mengumpulkan langkah ala QOWIY
- Jalan kaki ke masjid untuk sholat berjamaah (bagi ikhwan) — 5 kali sehari bisa menyumbang ribuan langkah.
- Jalan cepat 20–30 menit di waktu Dhuha.
- Parkir lebih jauh, naik tangga, dan jalan 5 menit setiap selesai duduk satu jam.

Catat langkah harian Anda di checklist sunnah pada dashboard.',
  sources = '[{"judul":"Paluch AE dkk. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health 7(3):e219–e228","penerbit":"Elsevier","tahun":2022,"url":"https://doi.org/10.1016/S2468-2667(21)00302-9"},{"judul":"Levine JA. Nonexercise activity thermogenesis (NEAT). Mayo Clin Proc","penerbit":"Mayo Clinic","tahun":2015,"url":"https://pubmed.ncbi.nlm.nih.gov/25841254/"}]'::jsonb
where slug = 'jalan-kaki-ke-masjid';
