-- Konten awal QOWIY (dibuat otomatis dari assets/js/seed.js)
-- Jalankan SETELAH schema.sql. Aman diulang (on conflict do update).

insert into public.settings (id, data) values (1, '{"brand":"QOWIY","tagline":"Aplikasi Kebugaran Muslim — sehat untuk ibadah, kuat untuk umat.","hero_title":"Badan kuat, ibadah makin semangat.","hero_sub":"Program kebugaran 12–16 minggu untuk Muslim & Muslimah: latihan yang mengikuti waktu sholat, pola makan sepertiga perut, dan kebiasaan sunnah harian — dipandu trainer, dibuktikan sains.","whatsapp":"6281234567890","community_link":"","payment_link":"","qris_url":"","bank_info":"Transfer BSI 7xxxxxxxxx a.n. QOWIY Indonesia","plans":[{"id":"mandiri","name":"Program Mandiri","price":99000,"strike":150000,"period":"sekali bayar","badge":"","desc":"Semua kelas video + rutinitas harian, belajar sesuai ritme sendiri.","features":["Semua kelas video program 12–16 minggu","Video rutinitas harian (Ba''da Subuh s.d. Ba''da Isya)","Checklist sunnah harian & kalkulator kalori","Artikel kesehatan bersumber dalil & jurnal","Akses selamanya"]},{"id":"jamaah","name":"Mandiri + Halaqah","price":180000,"strike":250000,"period":"sekali bayar","badge":"PALING LARIS","desc":"Kelas lengkap + grup halaqah kebugaran bersama trainer.","features":["Semua di Program Mandiri","Grup halaqah (ikhwan & akhwat terpisah)","Video motivasi trainer tiap pekan","Tanya-jawab trainer di grup","Contoh menu harian halal & terjangkau"]},{"id":"coaching","name":"Coaching 1-on-1","price":1500000,"strike":0,"period":"per bulan","badge":"SLOT TERBATAS","months":1,"desc":"Program & porsi makan disetel pribadi oleh trainer sesuai gender.","features":["Semua di paket Halaqah","Program latihan disusun pribadi","Target kalori disetel ulang tiap pekan","Check-in pribadi via WhatsApp","Trainer ikhwan untuk ikhwan, akhwat untuk akhwat"]}]}'::jsonb)
  on conflict (id) do update set data = excluded.data;

insert into public.modules (id,title,subtitle,track,sort,tag) values ('ce7b3ed7-8272-4ca6-ace3-b5dfb517da32','Start','Niat & cara kerja program','start',1,'START')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('843ba868-e355-4f41-a6c9-48f1372373a9','Fondasi Sunnah','Adab makan, minum & tidur','start',2,'FONDASI')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('36f3df2d-dc62-4371-a65e-8d0c7d71282f','Pola Latihan','Jadwal mengikuti waktu sholat','start',3,'POLA LATIHAN')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('f204832e-ba35-4683-af77-457669b6c9e2','Turun Berat','Atur pola makan defisit','turun',1,'JALUR A')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('58b4b968-309a-4789-ac0e-6ae1d912a368','Week 1','Adaptasi','turun',2,'WEEK 1')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('b0f470ca-67f4-424e-a117-45d203ed0bfd','Week 2–4','Rutinitas','turun',3,'WEEK 2–4')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('4c8e963d-4231-4787-af5d-53cdde55d50f','Week 5–8','Progresif','turun',4,'WEEK 5–8')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('b17fd764-e849-4011-a178-732a68763e5f','Week 9–12','Pemantapan','turun',5,'WEEK 9–12')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('0fb91bb9-569a-413f-a048-ddaed154e545','Bugar & Kuat','Bina otot & stamina','kuat',1,'JALUR B')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('a25d0e5d-2430-48b5-a5cc-5ca961af726f','Week 1','Adaptasi','kuat',2,'WEEK 1')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('e3caa7c6-b73f-4241-a382-e7080ce1e241','Week 2–4','Rutinitas','kuat',3,'WEEK 2–4')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('6c85aa72-4594-44ee-ac6c-72e774827cb9','Week 5–8','Progresif','kuat',4,'WEEK 5–8')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('75507038-b7e5-4e8d-a056-e364d683b2ac','Week 9–12','Pemantapan','kuat',5,'WEEK 9–12')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('309c6ff1-d795-405d-a36d-17c1b359e45a','Ramadan Mode','Latihan & makan saat puasa','ekstra',1,'RAMADAN')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;
insert into public.modules (id,title,subtitle,track,sort,tag) values ('3c82ca75-82fd-4421-ab00-9bb4276c3e47','Stuck?','Pecah plateau','ekstra',2,'STUCK?')
  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;

insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('c7100c9b-168a-4010-ae70-cbc5dddab3b9','ce7b3ed7-8272-4ca6-ace3-b5dfb517da32','Selamat datang: niat & cara kerja program','Cara memakai aplikasi, memilih jalur (Turun Berat atau Bugar & Kuat), dan meluruskan niat: menjaga amanah tubuh agar kuat beribadah.','“Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada keduanya ada kebaikan.” (HR. Muslim no. 2664)',null,null,1,true)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('937bd223-fd99-4ad6-ab8c-13550f934e7d','843ba868-e355-4f41-a6c9-48f1372373a9','Sepertiga perut: porsi makan ala sunnah','Praktik membagi piring dan berhenti sebelum kenyang, dipadukan dengan konsep Isi Piringku dari Kemenkes.','Sepertiga untuk makanan, sepertiga untuk minuman, sepertiga untuk napas. (HR. Tirmidzi no. 2380, shahih)',null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('9152ac33-3da9-4a28-ac16-b38a10cb852b','843ba868-e355-4f41-a6c9-48f1372373a9','Adab minum & hidrasi harian','Minum sambil duduk, dalam beberapa tegukan, dan target cairan harian yang realistis.','Nabi ﷺ biasa bernapas tiga kali ketika minum (di luar bejana). (HR. Muslim no. 2028)',null,null,2,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('dd6817c2-15e3-47ed-a4eb-f2e9cd6895e4','843ba868-e355-4f41-a6c9-48f1372373a9','Tidur awal, bangun Subuh','Menyusun jam tidur agar cukup 7 jam dan bangun segar untuk Subuh serta latihan pagi.','Nabi ﷺ tidak menyukai tidur sebelum Isya dan berbincang-bincang setelahnya. (HR. Bukhari no. 568)',null,null,3,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('77baa4ec-8e92-4c78-a609-956cdebce9b8','36f3df2d-dc62-4371-a65e-8d0c7d71282f','Pola 5x/pekan','Split latihan 5 sesi, cocok bila punya waktu Ba''da Subuh atau Ba''da Ashar hampir setiap hari.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('21e10565-c9c8-42c4-af25-c65411905384','36f3df2d-dc62-4371-a65e-8d0c7d71282f','Pola 4x/pekan','Upper–lower 2x pekan. Seimbang antara latihan dan pemulihan.',null,null,null,2,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('15741e6c-015f-4800-a567-5338c2301ab1','36f3df2d-dc62-4371-a65e-8d0c7d71282f','Pola 3x/pekan','Full body 3 sesi (mis. Ahad–Selasa–Kamis) — paling ramah pemula.',null,null,null,3,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('c4f92ecd-c8a1-44e4-abea-dd873f4c9232','36f3df2d-dc62-4371-a65e-8d0c7d71282f','Pola 2x/pekan','Minimal efektif untuk yang sangat sibuk, ditambah jalan kaki harian.',null,null,null,4,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('6cfd4d7c-5543-47de-aa40-99fbe245f62f','f204832e-ba35-4683-af77-457669b6c9e2','Atur pola makan defisit','Menghitung target kalori dengan kalkulator, defisit wajar ±15–20%, dan memilih menu halal-thayyib yang mengenyangkan.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('b0b70ada-bd23-4ee0-a3d3-b90b97d2333b','58b4b968-309a-4789-ac0e-6ae1d912a368','Adaptasi: pekan pertama','Mulai jalan kaki harian, 2–3 sesi latihan ringan, dan biasakan berhenti makan sebelum kenyang.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('491a02b7-2bd6-4d9e-a6f9-e4b8bcfd333b','b0f470ca-67f4-424e-a117-45d203ed0bfd','Rutinitas: membangun konsistensi','Menambah volume latihan bertahap dan mengunci jadwal di sekitar waktu sholat.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('8a8ac68c-478f-4869-ab0b-cef1e3d1f20e','4c8e963d-4231-4787-af5d-53cdde55d50f','Progresif: naikkan beban & langkah','Progressive overload, target langkah harian, dan evaluasi lingkar perut.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('b229b666-fabc-4189-ae50-fceef8b8e01c','b17fd764-e849-4011-a178-732a68763e5f','Pemantapan: menjaga hasil','Transisi ke pola makan pemeliharaan agar berat tidak naik lagi.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('eaf66715-d74a-4f8d-a79b-e24bc1cd00e7','0fb91bb9-569a-413f-a048-ddaed154e545','Atur pola makan untuk otot','Surplus ringan ±5–10%, protein ±1,6 g/kg berat badan, dan waktu makan yang nyaman.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('3304a458-7f9a-4c09-a30c-7e265dc692fd','a25d0e5d-2430-48b5-a5cc-5ca961af726f','Adaptasi: teknik dasar','Belajar gerakan dasar: squat, push-up, hinge, row — dengan teknik aman.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('62b9457b-109d-44a5-ab88-7f46594fbe50','e3caa7c6-b73f-4241-a382-e7080ce1e241','Rutinitas: volume bertahap','Menambah set dan repetisi setiap pekan secara terukur.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('087e939f-0945-4feb-a2de-32ca46b8a335','6c85aa72-4594-44ee-ac6c-72e774827cb9','Progresif: kekuatan & stamina','Variasi beban, latihan kondisi, dan pemulihan.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('4108d81b-1b73-41d9-a749-dde4401010c6','75507038-b7e5-4e8d-a056-e364d683b2ac','Pemantapan: program jangka panjang','Menyusun program mandiri setelah 12 pekan.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('f817c053-f67f-4c5c-ae4c-929f5b5801a6','309c6ff1-d795-405d-a36d-17c1b359e45a','Latihan saat Ramadan','Pilihan waktu latihan (menjelang berbuka atau setelah Tarawih), intensitas, dan hidrasi antara Maghrib–Subuh.','Nabi ﷺ berbuka dengan ruthab, jika tidak ada dengan tamr, jika tidak ada dengan beberapa teguk air. (HR. Abu Dawud no. 2356)',null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;
insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values ('6097b769-0d87-44eb-aff3-e31df3a78e45','3c82ca75-82fd-4421-ab00-9bb4276c3e47','Pecah plateau','Apa yang dilakukan saat berat berhenti turun: cek porsi, langkah harian, tidur, dan diet break.',null,null,null,1,false)
  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;

insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('220d0d23-54c7-408c-a4f1-1e8be392a7a9','routine','Peregangan & mobilitas Ba''da Subuh','Membangunkan sendi dan otot setelah Subuh. Tanpa alat.','Coach QOWIY','subuh',null,'semua','pemula',null,'10 menit',false,1)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('8554aeb2-3227-423d-a594-cf41f116a3b5','routine','Jalan cepat pagi + dzikir pagi','Jalan cepat sambil merutinkan dzikir pagi. Target ±3.000 langkah.','Coach QOWIY','dhuha',null,'semua','pemula',null,'20–30 menit',false,2)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('c29ed87c-2bd8-4e90-a00e-326adbc1b132','routine','Full body tanpa alat (pemula)','Squat, push-up, glute bridge, row dengan handuk, plank.','Coach QOWIY','ashar','{0,2,4}'::int[],'semua','pemula',null,'25 menit',false,3)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('f38d1504-ccdf-4f41-abb3-298adef9e257','routine','Latihan beban rumahan — upper body','Dumbbell/botol air: press, row, curl, triceps.','Coach QOWIY','ashar','{1,3}'::int[],'semua','menengah',null,'30 menit',false,4)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('e34865b4-c90e-44db-a689-71d40df2012c','routine','Latihan muslimah di rumah — low impact','Latihan berdampak rendah, ramah sendi, bisa dilakukan dengan pakaian syar''i.','Coach QOWIY','dhuha',null,'akhwat','pemula',null,'20 menit',false,5)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('1f24f42a-8126-4886-a244-951cee461d37','routine','Relaksasi & peregangan sebelum tidur','Menenangkan tubuh sebelum tidur, ditutup wudhu & dzikir sebelum tidur.','Coach QOWIY','isya',null,'semua','pemula',null,'8 menit',false,6)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('7515d553-a827-4783-acb1-4853d9b30a6f','motivation','Luruskan niat: sehat untuk ibadah','Mengapa menjaga tubuh termasuk menunaikan hak badan.','Coach QOWIY',null,null,'semua','pemula',null,'4 menit',true,1)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('6fd6f9b0-0f5d-4545-a7e3-d008c2bab22c','motivation','Sedikit tapi rutin lebih dicintai','Amal yang paling dicintai Allah adalah yang paling kontinu walau sedikit (HR. Bukhari no. 6464).','Coach QOWIY',null,null,'semua','pemula',null,'5 menit',false,2)
  on conflict (id) do nothing;
insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values ('e737e609-5e3a-4612-a41c-565714fdcebe','motivation','Saat semangat turun di pekan ketiga','Strategi kecil agar tidak berhenti di tengah jalan.','Coach QOWIY',null,null,'semua','pemula',null,'6 menit',false,3)
  on conflict (id) do nothing;

insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('b6057ee7-8a1d-4685-a9da-2feb8002e636','mukmin-yang-kuat','Mukmin yang Kuat: Olahraga sebagai Bekal Ibadah','Dasar','Islam memandang kesehatan sebagai nikmat sekaligus amanah. WHO pun menetapkan takaran gerak minimal untuk orang dewasa.','Banyak dari kita baru menghargai sehat ketika sakit datang. Rasulullah ﷺ sudah mengingatkan bahwa kesehatan dan waktu luang adalah dua nikmat yang sering membuat manusia merugi — karena dibiarkan lewat begitu saja.

## Kuat dalam arti luas
Hadits tentang mukmin yang kuat sering dimaknai para ulama sebagai kekuatan iman, tekad, dan kesungguhan beramal. Namun tubuh yang bugar jelas menopang semua itu: berdiri lama saat tarawih, berjalan ke masjid, mencari nafkah, hingga merawat keluarga.

## Badan punya hak
Ketika seorang sahabat berlebihan dalam ibadah sampai mengabaikan dirinya, Nabi ﷺ menegur bahwa jasadnya pun punya hak atas dirinya. Menjaga tubuh — tidur cukup, makan secukupnya, bergerak — termasuk menunaikan hak itu.

## Berapa banyak gerak yang dianjurkan?
Pedoman WHO 2020 untuk orang dewasa 18–64 tahun:
- 150–300 menit aktivitas aerobik intensitas sedang per pekan (misalnya jalan cepat), atau 75–150 menit intensitas berat.
- Latihan penguatan otot minimal 2 hari per pekan.
- Kurangi waktu duduk terlalu lama; gerak sedikit lebih baik daripada tidak sama sekali.

## Praktik di QOWIY
Kami membagi target itu mengikuti waktu sholat: peregangan Ba''da Subuh, jalan cepat di waktu Dhuha, latihan beban Ba''da Ashar. Dengan begitu, jadwal sholat menjadi "alarm" alami untuk bergerak.','[{"teks":"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada keduanya ada kebaikan.","rujukan":"HR. Muslim no. 2664","url":"https://sunnah.com/muslim:2664"},{"teks":"Dua nikmat yang banyak manusia tertipu di dalamnya: kesehatan dan waktu luang.","rujukan":"HR. Bukhari no. 6412","url":"https://sunnah.com/bukhari:6412"},{"teks":"Sesungguhnya jasadmu memiliki hak atas dirimu.","rujukan":"HR. Bukhari no. 1975","url":"https://sunnah.com/bukhari:1975"}]'::jsonb,'[{"judul":"WHO Guidelines on Physical Activity and Sedentary Behaviour","penerbit":"World Health Organization","tahun":2020,"url":"https://www.who.int/publications/i/item/9789240015128"},{"judul":"Bull FC dkk. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med 54(24):1451–1462","penerbit":"BMJ","tahun":2020,"url":"https://doi.org/10.1136/bjsports-2020-102955"}]'::jsonb,4,now() + interval '0 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('f25778c7-7c1f-460b-aa36-cecec3bc528e','sepertiga-perut','Sepertiga untuk Makanan: Porsi ala Sunnah & Bukti Ilmiah','Pola Makan','Berhenti sebelum kenyang bukan sekadar nasihat bijak. Penelitian menunjukkan makan perlahan membantu rasa kenyang datang lebih cepat.','Al-Qur''an memerintahkan kita makan dan minum, namun melarang berlebih-lebihan. Rasulullah ﷺ memberi ukuran yang sangat praktis: cukuplah beberapa suap yang menegakkan punggung; kalau harus lebih, bagilah perut menjadi sepertiga untuk makanan, sepertiga untuk minuman, dan sepertiga untuk napas.

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
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('5a7ab4ae-a3eb-497e-a1be-e42bfe731d98','puasa-dan-penelitian','Puasa Sunnah & Ramadan: Apa Kata Penelitian?','Puasa','Meta-analisis 70 publikasi menemukan berat badan turun selama Ramadan — tetapi cenderung kembali setelahnya. Kuncinya ada pada kebiasaan setelah berbuka.','Puasa adalah ibadah; tujuan utamanya takwa, bukan diet. Namun banyak yang bertanya: apa dampaknya pada tubuh?

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
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('7d8a8adb-04bc-4c1c-a7f3-2ec70b480cd0','tidur-awal-bangun-subuh','Tidur Awal, Bangun Subuh: Ritme Harian Seorang Muslim','Tidur','Orang dewasa dianjurkan tidur minimal 7 jam. Sunnah tidur setelah Isya membuat target itu jauh lebih mudah dicapai.','Kurang tidur sering jadi "penyakit tersembunyi" orang yang ingin sehat. Latihan sudah rutin, makan sudah dijaga, tapi tidur larut malam merusak semuanya.

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
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('2661a80b-518f-4a48-a77f-3f036be0968c','jalan-kaki-ke-masjid','Jalan Kaki ke Masjid: Langkah Kecil yang Dihitung','Aktivitas','Meta-analisis 15 kohort internasional menunjukkan makin banyak langkah harian, makin rendah risiko kematian — hingga titik tertentu sesuai usia.','Setiap langkah menuju masjid dicatat sebagai kebaikan: satu langkah menghapus kesalahan, langkah lainnya mengangkat derajat. Ternyata langkah-langkah itu juga bernilai bagi kesehatan.

## Berapa langkah yang cukup?
Meta-analisis di The Lancet Public Health (2022) yang menggabungkan 15 kohort internasional menemukan risiko kematian menurun seiring bertambahnya langkah harian:
- Usia 60 tahun ke atas: manfaat terus bertambah hingga sekitar 6.000–8.000 langkah per hari.
- Usia di bawah 60 tahun: hingga sekitar 8.000–10.000 langkah per hari.

Kabar baiknya, target ini tidak harus dicapai sekaligus.

## Cara mengumpulkan langkah ala QOWIY
- Jalan kaki ke masjid untuk sholat berjamaah (bagi ikhwan) — 5 kali sehari bisa menyumbang ribuan langkah.
- Jalan cepat 20–30 menit di waktu Dhuha.
- Parkir lebih jauh, naik tangga, dan jalan 5 menit setiap selesai duduk satu jam.

Catat langkah harian Anda di checklist sunnah pada dashboard.','[{"teks":"Barang siapa bersuci di rumahnya lalu berjalan ke salah satu rumah Allah untuk menunaikan kewajiban, maka satu langkahnya menghapus kesalahan dan langkah lainnya mengangkat derajat.","rujukan":"HR. Muslim no. 666","url":"https://sunnah.com/muslim:666"}]'::jsonb,'[{"judul":"Paluch AE dkk. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health 7(3):e219–e228","penerbit":"Elsevier","tahun":2022,"url":"https://doi.org/10.1016/S2468-2667(21)00302-9"}]'::jsonb,4,now() + interval '4 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('090ef6b3-2c22-4f04-a4b5-8a3eb89d2790','latihan-beban-dan-protein','Latihan Beban & Protein: Membangun Tubuh yang Kuat','Latihan','Latihan beban 2x sepekan adalah rekomendasi WHO. Untuk hasil otot, asupan protein total sekitar 1,6 g/kg/hari sudah memadai bagi kebanyakan orang.','Banyak yang mengira latihan beban hanya untuk binaragawan. Padahal WHO menganjurkan latihan penguatan otot minimal dua hari per pekan untuk semua orang dewasa — termasuk muslimah.

## Berapa protein yang dibutuhkan?
Meta-analisis 49 uji acak terkontrol (1.863 peserta) di British Journal of Sports Medicine (2018) menemukan suplementasi protein membantu menambah kekuatan dan massa otot selama latihan beban. Namun, manfaat tambahan untuk massa bebas lemak tidak lagi terlihat ketika total asupan protein melebihi sekitar 1,6 g per kg berat badan per hari.

Contoh: berat 60 kg → sekitar 96 g protein per hari, dibagi 3–4 kali makan. Sumber halal-thayyib yang terjangkau: telur, tempe, tahu, ikan, ayam, susu, kacang-kacangan.

## Prinsip latihan
- Mulai dari gerakan dasar: squat, push-up, hinge (hip hinge), row, plank.
- Naikkan beban/repetisi bertahap (progressive overload).
- Istirahat cukup — otot tumbuh saat pemulihan.

## Adab berlatih
Kenakan pakaian yang menutup aurat dan tidak membentuk tubuh, jaga pandangan, dan pilih tempat latihan yang aman bagi muslimah. Video latihan akhwat di QOWIY dirancang agar bisa dilakukan di rumah.

## Catatan
Penderita penyakit ginjal atau kondisi medis tertentu perlu berkonsultasi sebelum menaikkan asupan protein.','[{"teks":"Wahai manusia, makanlah dari (makanan) yang halal lagi baik yang terdapat di bumi.","rujukan":"QS. Al-Baqarah [2]: 168","url":"https://quran.com/2/168"},{"teks":"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah.","rujukan":"HR. Muslim no. 2664","url":"https://sunnah.com/muslim:2664"}]'::jsonb,'[{"judul":"Morton RW dkk. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med 52(6):376–384","penerbit":"BMJ","tahun":2018,"url":"https://doi.org/10.1136/bjsports-2017-097608"},{"judul":"WHO Guidelines on Physical Activity and Sedentary Behaviour","penerbit":"World Health Organization","tahun":2020,"url":"https://www.who.int/publications/i/item/9789240015128"}]'::jsonb,5,now() + interval '5 seconds')
  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;
insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values ('41f426e5-4565-48d3-ac6b-32aa439412fb','batas-gula-garam-lemak','Gula, Garam, Lemak: Batas Harian dan Prinsip Tidak Berlebihan','Pola Makan','Kemenkes menganjurkan batas per orang per hari: gula 50 g (4 sdm), garam 5 g (1 sdt), lemak 67 g (5 sdm minyak).','Larangan berlebih-lebihan dalam makan dan minum punya terjemahan yang sangat konkret di dunia gizi: batasi gula, garam, dan lemak.

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
