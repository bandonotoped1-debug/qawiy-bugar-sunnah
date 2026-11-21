-- Konten awal QAWIY (dibuat otomatis dari assets/js/seed.js)
-- Jalankan SETELAH schema.sql. Aman diulang (on conflict do update).

insert into public.settings (id, data) values (1, '{"brand":"QAWIY","tagline":"Bugar ala Sunnah — sehat untuk ibadah, kuat untuk umat.","hero_title":"Badan kuat, ibadah makin semangat.","hero_sub":"Program kebugaran 12–16 minggu untuk Muslim & Muslimah: latihan yang mengikuti waktu sholat, pola makan sepertiga perut, dan kebiasaan sunnah harian — dipandu trainer, dibuktikan sains.","whatsapp":"6281234567890","community_link":"","payment_link":"","qris_url":"","bank_info":"Transfer BSI 7xxxxxxxxx a.n. QAWIY Indonesia","plans":[{"id":"mandiri","name":"Program Mandiri","price":99000,"strike":150000,"period":"sekali bayar","badge":"","desc":"Semua kelas video + rutinitas harian, belajar sesuai ritme sendiri.","features":["Semua kelas video program 12–16 minggu","Video rutinitas harian (Ba''da Subuh s.d. Ba''da Isya)","Checklist sunnah harian & kalkulator kalori","Artikel kesehatan bersumber dalil & jurnal","Akses selamanya"]},{"id":"jamaah","name":"Mandiri + Halaqah","price":180000,"strike":250000,"period":"sekali bayar","badge":"PALING LARIS","desc":"Kelas lengkap + grup halaqah kebugaran bersama trainer.","features":["Semua di Program Mandiri","Grup halaqah (ikhwan & akhwat terpisah)","Video motivasi trainer tiap pekan","Tanya-jawab trainer di grup","Contoh menu harian halal & terjangkau"]},{"id":"coaching","name":"Coaching 1-on-1","price":1500000,"strike":0,"period":"per bulan","badge":"SLOT TERBATAS","months":1,"desc":"Program & porsi makan disetel pribadi oleh trainer sesuai gender.","features":["Semua di paket Halaqah","Program latihan disusun pribadi","Target kalori disetel ulang tiap pekan","Check-in pribadi via WhatsApp","Trainer ikhwan untuk ikhwan, akhwat untuk akhwat"]}]}'::jsonb)
  on conflict (id) do update set data = excluded.data;

insert into public.modules (id,title,subtitle,track,sort,tag) values ('776f6821-dbc8-4fdd-aa97-053e7f7f33db','Start','Niat & cara kerja program','start',1,'START')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('84339a5b-b103-41d0-ad64-7340aba4a013','Fondasi Sunnah','Adab makan, minum & tidur','start',2,'FONDASI')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('530e8fd2-103c-4239-a34d-e1390f4f39d8','Pola Latihan','Jadwal mengikuti waktu sholat','start',3,'POLA LATIHAN')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('c5b06e52-3b31-43ed-a9ca-26706b6c38ca','Turun Berat','Atur pola makan defisit','turun',1,'JALUR A')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('133480b1-0db3-4ae6-af02-e93d6fc17c95','Week 1','Adaptasi','turun',2,'WEEK 1')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('9134036f-bd03-4f3a-a89c-2028a21f4a61','Week 2–4','Rutinitas','turun',3,'WEEK 2–4')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('d9f458bd-bcaf-47d9-a9b6-18e68de3d068','Week 5–8','Progresif','turun',4,'WEEK 5–8')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('3f77cafb-afad-491b-a8b7-fa1ec067a258','Week 9–12','Pemantapan','turun',5,'WEEK 9–12')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('168f14c7-d047-4847-a642-0cc22d16141c','Bugar & Kuat','Bina otot & stamina','kuat',1,'JALUR B')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('fc180f12-eb8a-4495-ae40-47f9d73d0210','Week 1','Adaptasi','kuat',2,'WEEK 1')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('1ad5029e-ee59-4bb1-a27f-a7a9bf541b68','Week 2–4','Rutinitas','kuat',3,'WEEK 2–4')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('47c19ec4-00a7-4615-a117-e33fb826461d','Week 5–8','Progresif','kuat',4,'WEEK 5–8')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('a712c9b7-e820-4dee-a78f-fa400b4ebb56','Week 9–12','Pemantapan','kuat',5,'WEEK 9–12')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('462d8ad5-7a5e-47e3-a6de-8c0c3b375b40','Ramadan Mode','Latihan & makan saat puasa','ekstra',1,'RAMADAN')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('24865b7e-38b7-4e2d-a421-1e09e8cd449b','Stuck?','Pecah plateau','ekstra',2,'STUCK?')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;

insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('8593b4c1-7f38-49f0-a8a4-f6e8dc9fce66','776f6821-dbc8-4fdd-aa97-053e7f7f33db','Selamat datang: niat & cara kerja program','Cara memakai aplikasi, memilih jalur (Turun Berat atau Bugar & Kuat), dan meluruskan niat: menjaga amanah tubuh agar kuat beribadah.','“Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada keduanya ada kebaikan.” (HR. Muslim no. 2664)',null,null,1,true)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('3fffa127-1851-40bd-a2ca-16c6e61fa40b','84339a5b-b103-41d0-ad64-7340aba4a013','Sepertiga perut: porsi makan ala sunnah','Praktik membagi piring dan berhenti sebelum kenyang, dipadukan dengan konsep Isi Piringku dari Kemenkes.','Sepertiga untuk makanan, sepertiga untuk minuman, sepertiga untuk napas. (HR. Tirmidzi no. 2380, shahih)',null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('2820403e-6797-47c7-a991-91914e606b05','84339a5b-b103-41d0-ad64-7340aba4a013','Adab minum & hidrasi harian','Minum sambil duduk, dalam beberapa tegukan, dan target cairan harian yang realistis.','Nabi ﷺ biasa bernapas tiga kali ketika minum (di luar bejana). (HR. Muslim no. 2028)',null,null,2,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('90386024-4bba-487f-a5d6-655ae2418b06','84339a5b-b103-41d0-ad64-7340aba4a013','Tidur awal, bangun Subuh','Menyusun jam tidur agar cukup 7 jam dan bangun segar untuk Subuh serta latihan pagi.','Nabi ﷺ tidak menyukai tidur sebelum Isya dan berbincang-bincang setelahnya. (HR. Bukhari no. 568)',null,null,3,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('b256966f-a889-41c3-a3c7-d7cbb277f7d0','530e8fd2-103c-4239-a34d-e1390f4f39d8','Pola 5x/pekan','Split latihan 5 sesi, cocok bila punya waktu Ba''da Subuh atau Ba''da Ashar hampir setiap hari.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('0192f193-e767-418a-a62a-8787876f3c9d','530e8fd2-103c-4239-a34d-e1390f4f39d8','Pola 4x/pekan','Upper–lower 2x pekan. Seimbang antara latihan dan pemulihan.',null,null,null,2,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('e39e7834-9306-437d-ad02-80e445f2b46e','530e8fd2-103c-4239-a34d-e1390f4f39d8','Pola 3x/pekan','Full body 3 sesi (mis. Ahad–Selasa–Kamis) — paling ramah pemula.',null,null,null,3,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('e69f1728-b457-45c0-ab75-ca6abaed7279','530e8fd2-103c-4239-a34d-e1390f4f39d8','Pola 2x/pekan','Minimal efektif untuk yang sangat sibuk, ditambah jalan kaki harian.',null,null,null,4,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('6e98e1dc-69cc-4ece-aa4e-4e76a02bf7c1','c5b06e52-3b31-43ed-a9ca-26706b6c38ca','Atur pola makan defisit','Menghitung target kalori dengan kalkulator, defisit wajar ±15–20%, dan memilih menu halal-thayyib yang mengenyangkan.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('b40ba086-ef2d-42b6-a1b7-650839905a34','133480b1-0db3-4ae6-af02-e93d6fc17c95','Adaptasi: pekan pertama','Mulai jalan kaki harian, 2–3 sesi latihan ringan, dan biasakan berhenti makan sebelum kenyang.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('d52a23d9-f5d9-4f21-af34-cc71a3087cf6','9134036f-bd03-4f3a-a89c-2028a21f4a61','Rutinitas: membangun konsistensi','Menambah volume latihan bertahap dan mengunci jadwal di sekitar waktu sholat.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('2b2d37c5-0632-47fb-a6ac-0b2539b1134d','d9f458bd-bcaf-47d9-a9b6-18e68de3d068','Progresif: naikkan beban & langkah','Progressive overload, target langkah harian, dan evaluasi lingkar perut.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('1ffc9627-c190-4cbb-ab9a-2b21353e844c','3f77cafb-afad-491b-a8b7-fa1ec067a258','Pemantapan: menjaga hasil','Transisi ke pola makan pemeliharaan agar berat tidak naik lagi.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('0dc884bd-fb0b-4f8f-a4f7-b2ebc3490f01','168f14c7-d047-4847-a642-0cc22d16141c','Atur pola makan untuk otot','Surplus ringan ±5–10%, protein ±1,6 g/kg berat badan, dan waktu makan yang nyaman.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('26a186bf-e354-4bc8-a454-9e5759b827d3','fc180f12-eb8a-4495-ae40-47f9d73d0210','Adaptasi: teknik dasar','Belajar gerakan dasar: squat, push-up, hinge, row — dengan teknik aman.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('eb63ef74-210c-48d9-a36b-a2bbea45bdec','1ad5029e-ee59-4bb1-a27f-a7a9bf541b68','Rutinitas: volume bertahap','Menambah set dan repetisi setiap pekan secara terukur.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('5d3e56be-d61f-45cc-a73a-909a83ac380b','47c19ec4-00a7-4615-a117-e33fb826461d','Progresif: kekuatan & stamina','Variasi beban, latihan kondisi, dan pemulihan.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('7d6ca830-209a-4091-a2a3-7f7dcab68a03','a712c9b7-e820-4dee-a78f-fa400b4ebb56','Pemantapan: program jangka panjang','Menyusun program mandiri setelah 12 pekan.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('ad21f5a6-7ea3-480e-a2ac-fc01fa3e41c6','462d8ad5-7a5e-47e3-a6de-8c0c3b375b40','Latihan saat Ramadan','Pilihan waktu latihan (menjelang berbuka atau setelah Tarawih), intensitas, dan hidrasi antara Maghrib–Subuh.','Nabi ﷺ berbuka dengan ruthab, jika tidak ada dengan tamr, jika tidak ada dengan beberapa teguk air. (HR. Abu Dawud no. 2356)',null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('d152e9e7-d47f-47b6-a97b-f6cf04e85a62','24865b7e-38b7-4e2d-a421-1e09e8cd449b','Pecah plateau','Apa yang dilakukan saat berat berhenti turun: cek porsi, langkah harian, tidur, dan diet break.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;

insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('e36befe3-6677-4030-aaaf-638fe8f36cbc','routine','Peregangan & mobilitas Ba''da Subuh','Membangunkan sendi dan otot setelah Subuh. Tanpa alat.','Coach QAWIY','subuh',null,'semua','pemula',null,'10 menit',false,1)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('0177e41e-a12e-4b44-ac0c-5961700dba7d','routine','Jalan cepat pagi + dzikir pagi','Jalan cepat sambil merutinkan dzikir pagi. Target ±3.000 langkah.','Coach QAWIY','dhuha',null,'semua','pemula',null,'20–30 menit',false,2)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('2138e414-a1fd-4c4c-a3de-bf7e3d9a45ea','routine','Full body tanpa alat (pemula)','Squat, push-up, glute bridge, row dengan handuk, plank.','Coach QAWIY','ashar','{0,2,4}'::int[],'semua','pemula',null,'25 menit',false,3)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('19f17485-849e-48df-a4a8-e8e62267b079','routine','Latihan beban rumahan — upper body','Dumbbell/botol air: press, row, curl, triceps.','Coach QAWIY','ashar','{1,3}'::int[],'semua','menengah',null,'30 menit',false,4)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('e48ccd8c-902f-4a70-ac1c-16c59591ca53','routine','Latihan muslimah di rumah — low impact','Latihan berdampak rendah, ramah sendi, bisa dilakukan dengan pakaian syar''i.','Coach QAWIY','dhuha',null,'akhwat','pemula',null,'20 menit',false,5)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('87db3c75-36b5-4f4f-a28a-de135b2ecea7','routine','Relaksasi & peregangan sebelum tidur','Menenangkan tubuh sebelum tidur, ditutup wudhu & dzikir sebelum tidur.','Coach QAWIY','isya',null,'semua','pemula',null,'8 menit',false,6)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('530cbf3f-d020-42f5-aa9f-fe1ffd02d566','motivation','Luruskan niat: sehat untuk ibadah','Mengapa menjaga tubuh termasuk menunaikan hak badan.','Coach QAWIY',null,null,'semua','pemula',null,'4 menit',true,1)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('19cc2bad-1341-48d8-a44f-a2a365faffdd','motivation','Sedikit tapi rutin lebih dicintai','Amal yang paling dicintai Allah adalah yang paling kontinu walau sedikit (HR. Bukhari no. 6464).','Coach QAWIY',null,null,'semua','pemula',null,'5 menit',false,2)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('f6425f5f-d1ec-4cef-ae57-dd6349bf5ed9','motivation','Saat semangat turun di pekan ketiga','Strategi kecil agar tidak berhenti di tengah jalan.','Coach QAWIY',null,null,'semua','pemula',null,'6 menit',false,3)
  on conflict (id) do nothing;

insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('408cd64b-0481-4ca4-a5d2-9ff17a2c1575','mukmin-yang-kuat','Mukmin yang Kuat: Olahraga sebagai Bekal Ibadah','Dasar','Islam memandang kesehatan sebagai nikmat sekaligus amanah. WHO pun menetapkan takaran gerak minimal untuk orang dewasa.','Banyak dari kita baru menghargai sehat ketika sakit datang. Rasulullah ﷺ sudah mengingatkan bahwa kesehatan dan waktu luang adalah dua nikmat yang sering membuat manusia merugi — karena dibiarkan lewat begitu saja.

## Kuat dalam arti luas
Hadits tentang mukmin yang kuat sering dimaknai para ulama sebagai kekuatan iman, tekad, dan kesungguhan beramal. Namun tubuh yang bugar jelas menopang semua itu: berdiri lama saat tarawih, berjalan ke masjid, mencari nafkah, hingga merawat keluarga.

## Badan punya hak
Ketika seorang sahabat berlebihan dalam ibadah sampai mengabaikan dirinya, Nabi ﷺ menegur bahwa jasadnya pun punya hak atas dirinya. Menjaga tubuh — tidur cukup, makan secukupnya, bergerak — termasuk menunaikan hak itu.

## Berapa banyak gerak yang dianjurkan?
Pedoman WHO 2020 untuk orang dewasa 18–64 tahun:
- 150–300 menit aktivitas aerobik intensitas sedang per pekan (misalnya jalan cepat), atau 75–150 menit intensitas berat.
- Latihan penguatan otot minimal 2 hari per pekan.
- Kurangi waktu duduk terlalu lama; gerak sedikit lebih baik daripada tidak sama sekali.

## Praktik di QAWIY
Kami membagi target itu mengikuti waktu sholat: peregangan Ba''da Subuh, jalan cepat di waktu Dhuha, latihan beban Ba''da Ashar. Dengan begitu, jadwal sholat menjadi "alarm" alami untuk bergerak.','[{"teks":"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada keduanya ada kebaikan.","rujukan":"HR. Muslim no. 2664","url":"https://sunnah.com/muslim:2664"},{"teks":"Dua nikmat yang banyak manusia tertipu di dalamnya: kesehatan dan waktu luang.","rujukan":"HR. Bukhari no. 6412","url":"https://sunnah.com/bukhari:6412"},{"teks":"Sesungguhnya jasadmu memiliki hak atas dirimu.","rujukan":"HR. Bukhari no. 1975","url":"https://sunnah.com/bukhari:1975"}]'::jsonb,'[{"judul":"WHO Guidelines on Physical Activity and Sedentary Behaviour","penerbit":"World Health Organization","tahun":2020,"url":"https://www.who.int/publications/i/item/9789240015128"},{"judul":"Bull FC dkk. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med 54(24):1451–1462","penerbit":"BMJ","tahun":2020,"url":"https://doi.org/10.1136/bjsports-2020-102955"}]'::jsonb,4,now() + interval '0 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('780e015d-2edc-4c4e-af31-e1145a22edd3','sepertiga-perut','Sepertiga untuk Makanan: Porsi ala Sunnah & Bukti Ilmiah','Pola Makan','Berhenti sebelum kenyang bukan sekadar nasihat bijak. Penelitian menunjukkan makan perlahan membantu rasa kenyang datang lebih cepat.','Al-Qur''an memerintahkan kita makan dan minum, namun melarang berlebih-lebihan. Rasulullah ﷺ memberi ukuran yang sangat praktis: cukuplah beberapa suap yang menegakkan punggung; kalau harus lebih, bagilah perut menjadi sepertiga untuk makanan, sepertiga untuk minuman, dan sepertiga untuk napas.

## Kenapa ini masuk akal secara ilmiah?
Sinyal kenyang dari saluran cerna ke otak butuh waktu. Dalam uji coba pada perempuan dewasa sehat, makan dengan perlahan (suapan kecil, mengunyah lebih lama, jeda di antara suapan) menurunkan asupan energi dalam satu kali makan dan meningkatkan rasa kenyang di akhir makan. Artinya, adab makan yang tenang dan tidak tergesa-gesa membantu kita berhenti sebelum kekenyangan.

## Cara praktis membagi piring
Kemenkes melalui Pedoman Gizi Seimbang mengenalkan "Isi Piringku": setengah piring sayur dan buah, setengah lainnya makanan pokok dan lauk berprotein. Gabungkan dengan prinsip sepertiga:
- Ambil porsi di piring sekali saja, hindari menambah.
- Mulai dengan basmalah, makan dengan tangan kanan, dan pelan-pelan.
- Minum air di sela makan, bukan minuman manis.
- Berhenti ketika masih terasa "bisa sedikit lagi".

## Catatan
Prinsip ini bukan ajakan menahan lapar berlebihan. Bagi yang punya riwayat gangguan makan, diabetes, atau sedang hamil/menyusui, konsultasikan porsi dengan tenaga kesehatan.','[{"teks":"Makan dan minumlah, tetapi jangan berlebih-lebihan. Sungguh, Allah tidak menyukai orang yang berlebih-lebihan.","rujukan":"QS. Al-A''raf [7]: 31","url":"https://quran.com/7/31"},{"teks":"Tidaklah anak Adam memenuhi wadah yang lebih buruk daripada perutnya… sepertiga untuk makanannya, sepertiga untuk minumannya, dan sepertiga untuk napasnya.","rujukan":"HR. Tirmidzi no. 2380 (hasan shahih); Ibnu Majah no. 3349","url":"https://sunnah.com/tirmidhi:2380"}]'::jsonb,'[{"judul":"Andrade AM, Greene GW, Melanson KJ. Eating slowly led to decreases in energy intake within meals in healthy women. J Am Diet Assoc 108(7):1186–1191","penerbit":"Elsevier","tahun":2008,"url":"https://doi.org/10.1016/j.jada.2008.04.026"},{"judul":"Peraturan Menteri Kesehatan No. 41 Tahun 2014 tentang Pedoman Gizi Seimbang (Isi Piringku)","penerbit":"Kementerian Kesehatan RI","tahun":2014,"url":""}]'::jsonb,5,now() + interval '1 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('64dd5410-cef4-4ba4-a49c-f3374d9302a6','puasa-dan-penelitian','Puasa Sunnah & Ramadan: Apa Kata Penelitian?','Puasa','Meta-analisis 70 publikasi menemukan berat badan turun selama Ramadan — tetapi cenderung kembali setelahnya. Kuncinya ada pada kebiasaan setelah berbuka.','Puasa adalah ibadah; tujuan utamanya takwa, bukan diet. Namun banyak yang bertanya: apa dampaknya pada tubuh?

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

## Siapa yang perlu hati-hati?
Allah memberi keringanan bagi yang sakit. Penderita diabetes (terutama yang memakai insulin atau obat penurun gula tertentu), ibu hamil/menyusui, dan pasien penyakit kronis wajib berkonsultasi dengan dokter sebelum berpuasa sunnah atau mengatur latihan saat puasa.','[{"teks":"Diwajibkan atas kamu berpuasa sebagaimana diwajibkan atas orang sebelum kamu, agar kamu bertakwa.","rujukan":"QS. Al-Baqarah [2]: 183","url":"https://quran.com/2/183"},{"teks":"Barang siapa sakit atau dalam perjalanan, maka (gantilah) pada hari-hari yang lain… Allah menghendaki kemudahan bagimu.","rujukan":"QS. Al-Baqarah [2]: 184–185","url":"https://quran.com/2/185"},{"teks":"Amal-amal diperlihatkan pada hari Senin dan Kamis, dan aku suka amalku diperlihatkan ketika aku berpuasa.","rujukan":"HR. Tirmidzi no. 747 (hasan)","url":"https://sunnah.com/tirmidhi:747"},{"teks":"Rasulullah ﷺ berbuka dengan ruthab sebelum sholat; jika tidak ada, dengan tamr; jika tidak ada, beberapa teguk air.","rujukan":"HR. Abu Dawud no. 2356 (hasan shahih)","url":"https://sunnah.com/abudawud:2356"}]'::jsonb,'[{"judul":"Fernando HA dkk. Effect of Ramadan Fasting on Weight and Body Composition in Healthy Non-Athlete Adults: A Systematic Review and Meta-Analysis. Nutrients 11(2):478","penerbit":"MDPI","tahun":2019,"url":"https://doi.org/10.3390/nu11020478"}]'::jsonb,5,now() + interval '2 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('011d02a9-41a7-4daf-a8c5-b1fc7aa6a09c','tidur-awal-bangun-subuh','Tidur Awal, Bangun Subuh: Ritme Harian Seorang Muslim','Tidur','Orang dewasa dianjurkan tidur minimal 7 jam. Sunnah tidur setelah Isya membuat target itu jauh lebih mudah dicapai.','Kurang tidur sering jadi "penyakit tersembunyi" orang yang ingin sehat. Latihan sudah rutin, makan sudah dijaga, tapi tidur larut malam merusak semuanya.

## Rekomendasi para ahli tidur
Pernyataan konsensus American Academy of Sleep Medicine dan Sleep Research Society (2015) menyimpulkan orang dewasa sebaiknya tidur 7 jam atau lebih per malam secara teratur. Tidur kurang dari 7 jam secara rutin dikaitkan dengan kenaikan berat badan dan obesitas, diabetes, hipertensi, penyakit jantung, depresi, serta menurunnya daya tahan tubuh.

## Sunnah yang membantu
- Rasulullah ﷺ tidak menyukai tidur sebelum Isya dan begadang mengobrol setelahnya. Bila tidur pukul 21.30 dan bangun pukul 04.00, Anda sudah mendapat 6,5 jam — tambahkan qailulah (tidur siang singkat) untuk melengkapinya.
- Berwudhu sebelum tidur, berbaring di sisi kanan, dan membaca doa sebelum tidur, sebagaimana diajarkan Nabi ﷺ kepada Al-Bara'' bin ''Azib.
- Nabi ﷺ mendoakan keberkahan bagi umatnya di waktu pagi — waktu yang ideal untuk berjalan kaki dan berolahraga ringan.

## Tips praktis
- Matikan layar 30–60 menit sebelum tidur.
- Hindari makan berat dan kafein menjelang tidur.
- Gunakan video "Relaksasi sebelum tidur" di menu Rutinitas Ba''da Isya.','[{"teks":"Nabi ﷺ tidak menyukai tidur sebelum Isya dan berbincang-bincang setelahnya.","rujukan":"HR. Bukhari no. 568; Muslim no. 647","url":"https://sunnah.com/bukhari:568"},{"teks":"Jika engkau hendak tidur, berwudhulah seperti wudhu untuk sholat, lalu berbaringlah di sisi kananmu…","rujukan":"HR. Bukhari no. 247; Muslim no. 2710","url":"https://sunnah.com/bukhari:247"},{"teks":"Ya Allah, berkahilah umatku pada waktu paginya.","rujukan":"HR. Abu Dawud no. 2606; Tirmidzi no. 1212","url":"https://sunnah.com/abudawud:2606"}]'::jsonb,'[{"judul":"Watson NF dkk. Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement of the AASM and SRS. Sleep 38(6):843–844","penerbit":"Sleep Research Society","tahun":2015,"url":"https://doi.org/10.5665/sleep.4716"}]'::jsonb,4,now() + interval '3 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('1fbd8efb-fd95-402f-a6bf-6b49479aaa1c','jalan-kaki-ke-masjid','Jalan Kaki ke Masjid: Langkah Kecil yang Dihitung','Aktivitas','Meta-analisis 15 kohort internasional menunjukkan makin banyak langkah harian, makin rendah risiko kematian — hingga titik tertentu sesuai usia.','Setiap langkah menuju masjid dicatat sebagai kebaikan: satu langkah menghapus kesalahan, langkah lainnya mengangkat derajat. Ternyata langkah-langkah itu juga bernilai bagi kesehatan.

## Berapa langkah yang cukup?
Meta-analisis di The Lancet Public Health (2022) yang menggabungkan 15 kohort internasional menemukan risiko kematian menurun seiring bertambahnya langkah harian:
- Usia 60 tahun ke atas: manfaat terus bertambah hingga sekitar 6.000–8.000 langkah per hari.
- Usia di bawah 60 tahun: hingga sekitar 8.000–10.000 langkah per hari.

Kabar baiknya, target ini tidak harus dicapai sekaligus.

## Cara mengumpulkan langkah ala QAWIY
- Jalan kaki ke masjid untuk sholat berjamaah (bagi ikhwan) — 5 kali sehari bisa menyumbang ribuan langkah.
- Jalan cepat 20–30 menit di waktu Dhuha.
- Parkir lebih jauh, naik tangga, dan jalan 5 menit setiap selesai duduk satu jam.

Catat langkah harian Anda di checklist sunnah pada dashboard.','[{"teks":"Barang siapa bersuci di rumahnya lalu berjalan ke salah satu rumah Allah untuk menunaikan kewajiban, maka satu langkahnya menghapus kesalahan dan langkah lainnya mengangkat derajat.","rujukan":"HR. Muslim no. 666","url":"https://sunnah.com/muslim:666"}]'::jsonb,'[{"judul":"Paluch AE dkk. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health 7(3):e219–e228","penerbit":"Elsevier","tahun":2022,"url":"https://doi.org/10.1016/S2468-2667(21)00302-9"}]'::jsonb,4,now() + interval '4 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('9bd44e26-d69b-4853-a88c-b75f8e959eb2','latihan-beban-dan-protein','Latihan Beban & Protein: Membangun Tubuh yang Kuat','Latihan','Latihan beban 2x sepekan adalah rekomendasi WHO. Untuk hasil otot, asupan protein total sekitar 1,6 g/kg/hari sudah memadai bagi kebanyakan orang.','Banyak yang mengira latihan beban hanya untuk binaragawan. Padahal WHO menganjurkan latihan penguatan otot minimal dua hari per pekan untuk semua orang dewasa — termasuk muslimah.

## Berapa protein yang dibutuhkan?
Meta-analisis 49 uji acak terkontrol (1.863 peserta) di British Journal of Sports Medicine (2018) menemukan suplementasi protein membantu menambah kekuatan dan massa otot selama latihan beban. Namun, manfaat tambahan untuk massa bebas lemak tidak lagi terlihat ketika total asupan protein melebihi sekitar 1,6 g per kg berat badan per hari.

Contoh: berat 60 kg → sekitar 96 g protein per hari, dibagi 3–4 kali makan. Sumber halal-thayyib yang terjangkau: telur, tempe, tahu, ikan, ayam, susu, kacang-kacangan.

## Prinsip latihan
- Mulai dari gerakan dasar: squat, push-up, hinge (hip hinge), row, plank.
- Naikkan beban/repetisi bertahap (progressive overload).
- Istirahat cukup — otot tumbuh saat pemulihan.

## Adab berlatih
Kenakan pakaian yang menutup aurat dan tidak membentuk tubuh, jaga pandangan, dan pilih tempat latihan yang aman bagi muslimah. Video latihan akhwat di QAWIY dirancang agar bisa dilakukan di rumah.

## Catatan
Penderita penyakit ginjal atau kondisi medis tertentu perlu berkonsultasi sebelum menaikkan asupan protein.','[{"teks":"Wahai manusia, makanlah dari (makanan) yang halal lagi baik yang terdapat di bumi.","rujukan":"QS. Al-Baqarah [2]: 168","url":"https://quran.com/2/168"},{"teks":"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah.","rujukan":"HR. Muslim no. 2664","url":"https://sunnah.com/muslim:2664"}]'::jsonb,'[{"judul":"Morton RW dkk. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med 52(6):376–384","penerbit":"BMJ","tahun":2018,"url":"https://doi.org/10.1136/bjsports-2017-097608"},{"judul":"WHO Guidelines on Physical Activity and Sedentary Behaviour","penerbit":"World Health Organization","tahun":2020,"url":"https://www.who.int/publications/i/item/9789240015128"}]'::jsonb,5,now() + interval '5 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('67cea8b3-7ea1-466d-a66b-312cede1da17','batas-gula-garam-lemak','Gula, Garam, Lemak: Batas Harian dan Prinsip Tidak Berlebihan','Pola Makan','Kemenkes menganjurkan batas per orang per hari: gula 50 g (4 sdm), garam 5 g (1 sdt), lemak 67 g (5 sdm minyak).','Larangan berlebih-lebihan dalam makan dan minum punya terjemahan yang sangat konkret di dunia gizi: batasi gula, garam, dan lemak.

## Anjuran Kemenkes (G4 G1 L5)
Batas konsumsi per orang per hari:
- Gula: 50 gram (sekitar 4 sendok makan).
- Garam: 5 gram (sekitar 1 sendok teh), setara 2.000 mg natrium.
- Lemak: 67 gram (sekitar 5 sendok makan minyak).

Kemenkes juga mengingatkan bahwa konsumsi gula, garam, dan lemak berlebih menjadi faktor risiko obesitas, diabetes, hipertensi, dan penyakit jantung.

## Langkah kecil yang terasa
- Ganti minuman manis dengan air putih — minuman manis adalah sumber gula tersembunyi terbesar.
- Kurangi gorengan; pilih rebus, kukus, atau panggang.
- Baca label gizi pada makanan kemasan.
- Saat berbuka, cukup beberapa butir kurma, bukan es teh manis jumbo plus takjil bergula.','[{"teks":"Makan dan minumlah, tetapi jangan berlebih-lebihan.","rujukan":"QS. Al-A''raf [7]: 31","url":"https://quran.com/7/31"},{"teks":"Janganlah kamu jatuhkan (diri sendiri) ke dalam kebinasaan dengan tangan sendiri.","rujukan":"QS. Al-Baqarah [2]: 195","url":"https://quran.com/2/195"}]'::jsonb,'[{"judul":"Cegah Meningkatnya Diabetes, Jangan Berlebihan Konsumsi Gula, Garam, Lemak","penerbit":"Kementerian Kesehatan RI","tahun":2024,"url":"https://www.kemkes.go.id/id/cegah-meningkatnya-diabetes-jangan-berlebihan-konsumsi-gula-garam-lemak"},{"judul":"Permenkes No. 30 Tahun 2013 jo. Permenkes No. 63 Tahun 2015 tentang pencantuman informasi kandungan gula, garam, dan lemak","penerbit":"Kementerian Kesehatan RI","tahun":2015,"url":""}]'::jsonb,3,now() + interval '6 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
