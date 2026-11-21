/* =====================================================================
   Konten awal (seed) — dipakai di MODE DEMO dan untuk seed.sql Supabase.
   Semua artikel ditulis ulang dengan bahasa sendiri; dalil & sumber
   ilmiah dicantumkan agar bisa dicek pembaca.
   ===================================================================== */
window.QAWIY_SEED = (function () {
  const settings = {
    brand: "QAWIY",
    tagline: "Bugar ala Sunnah — sehat untuk ibadah, kuat untuk umat.",
    hero_title: "Badan kuat, ibadah makin semangat.",
    hero_sub: "Program kebugaran 12–16 minggu untuk Muslim & Muslimah: latihan yang mengikuti waktu sholat, pola makan sepertiga perut, dan kebiasaan sunnah harian — dipandu trainer, dibuktikan sains.",
    whatsapp: "6281234567890",
    community_link: "",
    payment_link: "",
    qris_url: "",
    bank_info: "Transfer BSI 7xxxxxxxxx a.n. QAWIY Indonesia",
    plans: [
      {
        id: "mandiri", name: "Program Mandiri", price: 99000, strike: 150000, period: "sekali bayar", badge: "",
        desc: "Semua kelas video + rutinitas harian, belajar sesuai ritme sendiri.",
        features: ["Semua kelas video program 12–16 minggu", "Video rutinitas harian (Ba'da Subuh s.d. Ba'da Isya)", "Checklist sunnah harian & kalkulator kalori", "Artikel kesehatan bersumber dalil & jurnal", "Akses selamanya"]
      },
      {
        id: "jamaah", name: "Mandiri + Halaqah", price: 180000, strike: 250000, period: "sekali bayar", badge: "PALING LARIS",
        desc: "Kelas lengkap + grup halaqah kebugaran bersama trainer.",
        features: ["Semua di Program Mandiri", "Grup halaqah (ikhwan & akhwat terpisah)", "Video motivasi trainer tiap pekan", "Tanya-jawab trainer di grup", "Contoh menu harian halal & terjangkau"]
      },
      {
        id: "coaching", name: "Coaching 1-on-1", price: 1500000, strike: 0, period: "per bulan", badge: "SLOT TERBATAS", months: 1,
        desc: "Program & porsi makan disetel pribadi oleh trainer sesuai gender.",
        features: ["Semua di paket Halaqah", "Program latihan disusun pribadi", "Target kalori disetel ulang tiap pekan", "Check-in pribadi via WhatsApp", "Trainer ikhwan untuk ikhwan, akhwat untuk akhwat"]
      }
    ]
  };

  const modules = [
    { key: "m-start", title: "Start", subtitle: "Niat & cara kerja program", track: "start", sort: 1, tag: "START" },
    { key: "m-fondasi", title: "Fondasi Sunnah", subtitle: "Adab makan, minum & tidur", track: "start", sort: 2, tag: "FONDASI" },
    { key: "m-pola", title: "Pola Latihan", subtitle: "Jadwal mengikuti waktu sholat", track: "start", sort: 3, tag: "POLA LATIHAN" },

    { key: "m-turun", title: "Turun Berat", subtitle: "Atur pola makan defisit", track: "turun", sort: 1, tag: "JALUR A" },
    { key: "m-turun-1", title: "Week 1", subtitle: "Adaptasi", track: "turun", sort: 2, tag: "WEEK 1" },
    { key: "m-turun-2", title: "Week 2–4", subtitle: "Rutinitas", track: "turun", sort: 3, tag: "WEEK 2–4" },
    { key: "m-turun-3", title: "Week 5–8", subtitle: "Progresif", track: "turun", sort: 4, tag: "WEEK 5–8" },
    { key: "m-turun-4", title: "Week 9–12", subtitle: "Pemantapan", track: "turun", sort: 5, tag: "WEEK 9–12" },

    { key: "m-kuat", title: "Bugar & Kuat", subtitle: "Bina otot & stamina", track: "kuat", sort: 1, tag: "JALUR B" },
    { key: "m-kuat-1", title: "Week 1", subtitle: "Adaptasi", track: "kuat", sort: 2, tag: "WEEK 1" },
    { key: "m-kuat-2", title: "Week 2–4", subtitle: "Rutinitas", track: "kuat", sort: 3, tag: "WEEK 2–4" },
    { key: "m-kuat-3", title: "Week 5–8", subtitle: "Progresif", track: "kuat", sort: 4, tag: "WEEK 5–8" },
    { key: "m-kuat-4", title: "Week 9–12", subtitle: "Pemantapan", track: "kuat", sort: 5, tag: "WEEK 9–12" },

    { key: "m-ramadan", title: "Ramadan Mode", subtitle: "Latihan & makan saat puasa", track: "ekstra", sort: 1, tag: "RAMADAN" },
    { key: "m-stuck", title: "Stuck?", subtitle: "Pecah plateau", track: "ekstra", sort: 2, tag: "STUCK?" }
  ];

  const L = (key, module, sort, title, description, dalil, extra) =>
    Object.assign({ key, module, sort, title, description, dalil: dalil || "", duration: "", video_url: "", is_free: false }, extra || {});

  const lessons = [
    L("l-start-1", "m-start", 1, "Selamat datang: niat & cara kerja program",
      "Cara memakai aplikasi, memilih jalur (Turun Berat atau Bugar & Kuat), dan meluruskan niat: menjaga amanah tubuh agar kuat beribadah.",
      "“Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada keduanya ada kebaikan.” (HR. Muslim no. 2664)", { is_free: true }),
    L("l-fon-1", "m-fondasi", 1, "Sepertiga perut: porsi makan ala sunnah",
      "Praktik membagi piring dan berhenti sebelum kenyang, dipadukan dengan konsep Isi Piringku dari Kemenkes.",
      "Sepertiga untuk makanan, sepertiga untuk minuman, sepertiga untuk napas. (HR. Tirmidzi no. 2380, shahih)"),
    L("l-fon-2", "m-fondasi", 2, "Adab minum & hidrasi harian",
      "Minum sambil duduk, dalam beberapa tegukan, dan target cairan harian yang realistis.",
      "Nabi ﷺ biasa bernapas tiga kali ketika minum (di luar bejana). (HR. Muslim no. 2028)"),
    L("l-fon-3", "m-fondasi", 3, "Tidur awal, bangun Subuh",
      "Menyusun jam tidur agar cukup 7 jam dan bangun segar untuk Subuh serta latihan pagi.",
      "Nabi ﷺ tidak menyukai tidur sebelum Isya dan berbincang-bincang setelahnya. (HR. Bukhari no. 568)"),
    L("l-pola-1", "m-pola", 1, "Pola 5x/pekan", "Split latihan 5 sesi, cocok bila punya waktu Ba'da Subuh atau Ba'da Ashar hampir setiap hari."),
    L("l-pola-2", "m-pola", 2, "Pola 4x/pekan", "Upper–lower 2x pekan. Seimbang antara latihan dan pemulihan."),
    L("l-pola-3", "m-pola", 3, "Pola 3x/pekan", "Full body 3 sesi (mis. Ahad–Selasa–Kamis) — paling ramah pemula."),
    L("l-pola-4", "m-pola", 4, "Pola 2x/pekan", "Minimal efektif untuk yang sangat sibuk, ditambah jalan kaki harian."),

    L("l-turun-0", "m-turun", 1, "Atur pola makan defisit", "Menghitung target kalori dengan kalkulator, defisit wajar ±15–20%, dan memilih menu halal-thayyib yang mengenyangkan."),
    L("l-turun-1", "m-turun-1", 1, "Adaptasi: pekan pertama", "Mulai jalan kaki harian, 2–3 sesi latihan ringan, dan biasakan berhenti makan sebelum kenyang."),
    L("l-turun-2", "m-turun-2", 1, "Rutinitas: membangun konsistensi", "Menambah volume latihan bertahap dan mengunci jadwal di sekitar waktu sholat."),
    L("l-turun-3", "m-turun-3", 1, "Progresif: naikkan beban & langkah", "Progressive overload, target langkah harian, dan evaluasi lingkar perut."),
    L("l-turun-4", "m-turun-4", 1, "Pemantapan: menjaga hasil", "Transisi ke pola makan pemeliharaan agar berat tidak naik lagi."),

    L("l-kuat-0", "m-kuat", 1, "Atur pola makan untuk otot", "Surplus ringan ±5–10%, protein ±1,6 g/kg berat badan, dan waktu makan yang nyaman."),
    L("l-kuat-1", "m-kuat-1", 1, "Adaptasi: teknik dasar", "Belajar gerakan dasar: squat, push-up, hinge, row — dengan teknik aman."),
    L("l-kuat-2", "m-kuat-2", 1, "Rutinitas: volume bertahap", "Menambah set dan repetisi setiap pekan secara terukur."),
    L("l-kuat-3", "m-kuat-3", 1, "Progresif: kekuatan & stamina", "Variasi beban, latihan kondisi, dan pemulihan."),
    L("l-kuat-4", "m-kuat-4", 1, "Pemantapan: program jangka panjang", "Menyusun program mandiri setelah 12 pekan."),

    L("l-ram-1", "m-ramadan", 1, "Latihan saat Ramadan", "Pilihan waktu latihan (menjelang berbuka atau setelah Tarawih), intensitas, dan hidrasi antara Maghrib–Subuh.",
      "Nabi ﷺ berbuka dengan ruthab, jika tidak ada dengan tamr, jika tidak ada dengan beberapa teguk air. (HR. Abu Dawud no. 2356)"),
    L("l-stuck-1", "m-stuck", 1, "Pecah plateau", "Apa yang dilakukan saat berat berhenti turun: cek porsi, langkah harian, tidur, dan diet break.")
  ];

  const V = (key, kind, title, extra) => Object.assign({ key, kind, title, description: "", trainer: "Coach QAWIY", time_slot: null, days: null, audience: "semua", level: "pemula", video_url: "", duration: "", is_free: false, sort: 0 }, extra);

  const videos = [
    V("v-r1", "routine", "Peregangan & mobilitas Ba'da Subuh", { time_slot: "subuh", duration: "10 menit", description: "Membangunkan sendi dan otot setelah Subuh. Tanpa alat.", sort: 1 }),
    V("v-r2", "routine", "Jalan cepat pagi + dzikir pagi", { time_slot: "dhuha", duration: "20–30 menit", description: "Jalan cepat sambil merutinkan dzikir pagi. Target ±3.000 langkah.", sort: 2 }),
    V("v-r3", "routine", "Full body tanpa alat (pemula)", { time_slot: "ashar", duration: "25 menit", days: [0, 2, 4], description: "Squat, push-up, glute bridge, row dengan handuk, plank.", sort: 3 }),
    V("v-r4", "routine", "Latihan beban rumahan — upper body", { time_slot: "ashar", duration: "30 menit", days: [1, 3], level: "menengah", description: "Dumbbell/botol air: press, row, curl, triceps.", sort: 4 }),
    V("v-r5", "routine", "Latihan muslimah di rumah — low impact", { time_slot: "dhuha", duration: "20 menit", audience: "akhwat", description: "Latihan berdampak rendah, ramah sendi, bisa dilakukan dengan pakaian syar'i.", sort: 5 }),
    V("v-r6", "routine", "Relaksasi & peregangan sebelum tidur", { time_slot: "isya", duration: "8 menit", description: "Menenangkan tubuh sebelum tidur, ditutup wudhu & dzikir sebelum tidur.", sort: 6 }),
    V("v-m1", "motivation", "Luruskan niat: sehat untuk ibadah", { description: "Mengapa menjaga tubuh termasuk menunaikan hak badan.", is_free: true, duration: "4 menit", sort: 1 }),
    V("v-m2", "motivation", "Sedikit tapi rutin lebih dicintai", { description: "Amal yang paling dicintai Allah adalah yang paling kontinu walau sedikit (HR. Bukhari no. 6464).", duration: "5 menit", sort: 2 }),
    V("v-m3", "motivation", "Saat semangat turun di pekan ketiga", { description: "Strategi kecil agar tidak berhenti di tengah jalan.", duration: "6 menit", sort: 3 })
  ];

  const articles = [
    {
      key: "a1", slug: "mukmin-yang-kuat", category: "Dasar", read_min: 4,
      title: "Mukmin yang Kuat: Olahraga sebagai Bekal Ibadah",
      excerpt: "Islam memandang kesehatan sebagai nikmat sekaligus amanah. WHO pun menetapkan takaran gerak minimal untuk orang dewasa.",
      body: `Banyak dari kita baru menghargai sehat ketika sakit datang. Rasulullah ﷺ sudah mengingatkan bahwa kesehatan dan waktu luang adalah dua nikmat yang sering membuat manusia merugi — karena dibiarkan lewat begitu saja.

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
Kami membagi target itu mengikuti waktu sholat: peregangan Ba'da Subuh, jalan cepat di waktu Dhuha, latihan beban Ba'da Ashar. Dengan begitu, jadwal sholat menjadi "alarm" alami untuk bergerak.`,
      dalil: [
        { teks: "Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada keduanya ada kebaikan.", rujukan: "HR. Muslim no. 2664", url: "https://sunnah.com/muslim:2664" },
        { teks: "Dua nikmat yang banyak manusia tertipu di dalamnya: kesehatan dan waktu luang.", rujukan: "HR. Bukhari no. 6412", url: "https://sunnah.com/bukhari:6412" },
        { teks: "Sesungguhnya jasadmu memiliki hak atas dirimu.", rujukan: "HR. Bukhari no. 1975", url: "https://sunnah.com/bukhari:1975" }
      ],
      sources: [
        { judul: "WHO Guidelines on Physical Activity and Sedentary Behaviour", penerbit: "World Health Organization", tahun: 2020, url: "https://www.who.int/publications/i/item/9789240015128" },
        { judul: "Bull FC dkk. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med 54(24):1451–1462", penerbit: "BMJ", tahun: 2020, url: "https://doi.org/10.1136/bjsports-2020-102955" }
      ]
    },
    {
      key: "a2", slug: "sepertiga-perut", category: "Pola Makan", read_min: 5,
      title: "Sepertiga untuk Makanan: Porsi ala Sunnah & Bukti Ilmiah",
      excerpt: "Berhenti sebelum kenyang bukan sekadar nasihat bijak. Penelitian menunjukkan makan perlahan membantu rasa kenyang datang lebih cepat.",
      body: `Al-Qur'an memerintahkan kita makan dan minum, namun melarang berlebih-lebihan. Rasulullah ﷺ memberi ukuran yang sangat praktis: cukuplah beberapa suap yang menegakkan punggung; kalau harus lebih, bagilah perut menjadi sepertiga untuk makanan, sepertiga untuk minuman, dan sepertiga untuk napas.

## Kenapa ini masuk akal secara ilmiah?
Sinyal kenyang dari saluran cerna ke otak butuh waktu. Dalam uji coba pada perempuan dewasa sehat, makan dengan perlahan (suapan kecil, mengunyah lebih lama, jeda di antara suapan) menurunkan asupan energi dalam satu kali makan dan meningkatkan rasa kenyang di akhir makan. Artinya, adab makan yang tenang dan tidak tergesa-gesa membantu kita berhenti sebelum kekenyangan.

## Cara praktis membagi piring
Kemenkes melalui Pedoman Gizi Seimbang mengenalkan "Isi Piringku": setengah piring sayur dan buah, setengah lainnya makanan pokok dan lauk berprotein. Gabungkan dengan prinsip sepertiga:
- Ambil porsi di piring sekali saja, hindari menambah.
- Mulai dengan basmalah, makan dengan tangan kanan, dan pelan-pelan.
- Minum air di sela makan, bukan minuman manis.
- Berhenti ketika masih terasa "bisa sedikit lagi".

## Catatan
Prinsip ini bukan ajakan menahan lapar berlebihan. Bagi yang punya riwayat gangguan makan, diabetes, atau sedang hamil/menyusui, konsultasikan porsi dengan tenaga kesehatan.`,
      dalil: [
        { teks: "Makan dan minumlah, tetapi jangan berlebih-lebihan. Sungguh, Allah tidak menyukai orang yang berlebih-lebihan.", rujukan: "QS. Al-A'raf [7]: 31", url: "https://quran.com/7/31" },
        { teks: "Tidaklah anak Adam memenuhi wadah yang lebih buruk daripada perutnya… sepertiga untuk makanannya, sepertiga untuk minumannya, dan sepertiga untuk napasnya.", rujukan: "HR. Tirmidzi no. 2380 (hasan shahih); Ibnu Majah no. 3349", url: "https://sunnah.com/tirmidhi:2380" }
      ],
      sources: [
        { judul: "Andrade AM, Greene GW, Melanson KJ. Eating slowly led to decreases in energy intake within meals in healthy women. J Am Diet Assoc 108(7):1186–1191", penerbit: "Elsevier", tahun: 2008, url: "https://doi.org/10.1016/j.jada.2008.04.026" },
        { judul: "Peraturan Menteri Kesehatan No. 41 Tahun 2014 tentang Pedoman Gizi Seimbang (Isi Piringku)", penerbit: "Kementerian Kesehatan RI", tahun: 2014, url: "" }
      ]
    },
    {
      key: "a3", slug: "puasa-dan-penelitian", category: "Puasa", read_min: 5,
      title: "Puasa Sunnah & Ramadan: Apa Kata Penelitian?",
      excerpt: "Meta-analisis 70 publikasi menemukan berat badan turun selama Ramadan — tetapi cenderung kembali setelahnya. Kuncinya ada pada kebiasaan setelah berbuka.",
      body: `Puasa adalah ibadah; tujuan utamanya takwa, bukan diet. Namun banyak yang bertanya: apa dampaknya pada tubuh?

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
Allah memberi keringanan bagi yang sakit. Penderita diabetes (terutama yang memakai insulin atau obat penurun gula tertentu), ibu hamil/menyusui, dan pasien penyakit kronis wajib berkonsultasi dengan dokter sebelum berpuasa sunnah atau mengatur latihan saat puasa.`,
      dalil: [
        { teks: "Diwajibkan atas kamu berpuasa sebagaimana diwajibkan atas orang sebelum kamu, agar kamu bertakwa.", rujukan: "QS. Al-Baqarah [2]: 183", url: "https://quran.com/2/183" },
        { teks: "Barang siapa sakit atau dalam perjalanan, maka (gantilah) pada hari-hari yang lain… Allah menghendaki kemudahan bagimu.", rujukan: "QS. Al-Baqarah [2]: 184–185", url: "https://quran.com/2/185" },
        { teks: "Amal-amal diperlihatkan pada hari Senin dan Kamis, dan aku suka amalku diperlihatkan ketika aku berpuasa.", rujukan: "HR. Tirmidzi no. 747 (hasan)", url: "https://sunnah.com/tirmidhi:747" },
        { teks: "Rasulullah ﷺ berbuka dengan ruthab sebelum sholat; jika tidak ada, dengan tamr; jika tidak ada, beberapa teguk air.", rujukan: "HR. Abu Dawud no. 2356 (hasan shahih)", url: "https://sunnah.com/abudawud:2356" }
      ],
      sources: [
        { judul: "Fernando HA dkk. Effect of Ramadan Fasting on Weight and Body Composition in Healthy Non-Athlete Adults: A Systematic Review and Meta-Analysis. Nutrients 11(2):478", penerbit: "MDPI", tahun: 2019, url: "https://doi.org/10.3390/nu11020478" }
      ]
    },
    {
      key: "a4", slug: "tidur-awal-bangun-subuh", category: "Tidur", read_min: 4,
      title: "Tidur Awal, Bangun Subuh: Ritme Harian Seorang Muslim",
      excerpt: "Orang dewasa dianjurkan tidur minimal 7 jam. Sunnah tidur setelah Isya membuat target itu jauh lebih mudah dicapai.",
      body: `Kurang tidur sering jadi "penyakit tersembunyi" orang yang ingin sehat. Latihan sudah rutin, makan sudah dijaga, tapi tidur larut malam merusak semuanya.

## Rekomendasi para ahli tidur
Pernyataan konsensus American Academy of Sleep Medicine dan Sleep Research Society (2015) menyimpulkan orang dewasa sebaiknya tidur 7 jam atau lebih per malam secara teratur. Tidur kurang dari 7 jam secara rutin dikaitkan dengan kenaikan berat badan dan obesitas, diabetes, hipertensi, penyakit jantung, depresi, serta menurunnya daya tahan tubuh.

## Sunnah yang membantu
- Rasulullah ﷺ tidak menyukai tidur sebelum Isya dan begadang mengobrol setelahnya. Bila tidur pukul 21.30 dan bangun pukul 04.00, Anda sudah mendapat 6,5 jam — tambahkan qailulah (tidur siang singkat) untuk melengkapinya.
- Berwudhu sebelum tidur, berbaring di sisi kanan, dan membaca doa sebelum tidur, sebagaimana diajarkan Nabi ﷺ kepada Al-Bara' bin 'Azib.
- Nabi ﷺ mendoakan keberkahan bagi umatnya di waktu pagi — waktu yang ideal untuk berjalan kaki dan berolahraga ringan.

## Tips praktis
- Matikan layar 30–60 menit sebelum tidur.
- Hindari makan berat dan kafein menjelang tidur.
- Gunakan video "Relaksasi sebelum tidur" di menu Rutinitas Ba'da Isya.`,
      dalil: [
        { teks: "Nabi ﷺ tidak menyukai tidur sebelum Isya dan berbincang-bincang setelahnya.", rujukan: "HR. Bukhari no. 568; Muslim no. 647", url: "https://sunnah.com/bukhari:568" },
        { teks: "Jika engkau hendak tidur, berwudhulah seperti wudhu untuk sholat, lalu berbaringlah di sisi kananmu…", rujukan: "HR. Bukhari no. 247; Muslim no. 2710", url: "https://sunnah.com/bukhari:247" },
        { teks: "Ya Allah, berkahilah umatku pada waktu paginya.", rujukan: "HR. Abu Dawud no. 2606; Tirmidzi no. 1212", url: "https://sunnah.com/abudawud:2606" }
      ],
      sources: [
        { judul: "Watson NF dkk. Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement of the AASM and SRS. Sleep 38(6):843–844", penerbit: "Sleep Research Society", tahun: 2015, url: "https://doi.org/10.5665/sleep.4716" }
      ]
    },
    {
      key: "a5", slug: "jalan-kaki-ke-masjid", category: "Aktivitas", read_min: 4,
      title: "Jalan Kaki ke Masjid: Langkah Kecil yang Dihitung",
      excerpt: "Meta-analisis 15 kohort internasional menunjukkan makin banyak langkah harian, makin rendah risiko kematian — hingga titik tertentu sesuai usia.",
      body: `Setiap langkah menuju masjid dicatat sebagai kebaikan: satu langkah menghapus kesalahan, langkah lainnya mengangkat derajat. Ternyata langkah-langkah itu juga bernilai bagi kesehatan.

## Berapa langkah yang cukup?
Meta-analisis di The Lancet Public Health (2022) yang menggabungkan 15 kohort internasional menemukan risiko kematian menurun seiring bertambahnya langkah harian:
- Usia 60 tahun ke atas: manfaat terus bertambah hingga sekitar 6.000–8.000 langkah per hari.
- Usia di bawah 60 tahun: hingga sekitar 8.000–10.000 langkah per hari.

Kabar baiknya, target ini tidak harus dicapai sekaligus.

## Cara mengumpulkan langkah ala QAWIY
- Jalan kaki ke masjid untuk sholat berjamaah (bagi ikhwan) — 5 kali sehari bisa menyumbang ribuan langkah.
- Jalan cepat 20–30 menit di waktu Dhuha.
- Parkir lebih jauh, naik tangga, dan jalan 5 menit setiap selesai duduk satu jam.

Catat langkah harian Anda di checklist sunnah pada dashboard.`,
      dalil: [
        { teks: "Barang siapa bersuci di rumahnya lalu berjalan ke salah satu rumah Allah untuk menunaikan kewajiban, maka satu langkahnya menghapus kesalahan dan langkah lainnya mengangkat derajat.", rujukan: "HR. Muslim no. 666", url: "https://sunnah.com/muslim:666" }
      ],
      sources: [
        { judul: "Paluch AE dkk. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health 7(3):e219–e228", penerbit: "Elsevier", tahun: 2022, url: "https://doi.org/10.1016/S2468-2667(21)00302-9" }
      ]
    },
    {
      key: "a6", slug: "latihan-beban-dan-protein", category: "Latihan", read_min: 5,
      title: "Latihan Beban & Protein: Membangun Tubuh yang Kuat",
      excerpt: "Latihan beban 2x sepekan adalah rekomendasi WHO. Untuk hasil otot, asupan protein total sekitar 1,6 g/kg/hari sudah memadai bagi kebanyakan orang.",
      body: `Banyak yang mengira latihan beban hanya untuk binaragawan. Padahal WHO menganjurkan latihan penguatan otot minimal dua hari per pekan untuk semua orang dewasa — termasuk muslimah.

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
Penderita penyakit ginjal atau kondisi medis tertentu perlu berkonsultasi sebelum menaikkan asupan protein.`,
      dalil: [
        { teks: "Wahai manusia, makanlah dari (makanan) yang halal lagi baik yang terdapat di bumi.", rujukan: "QS. Al-Baqarah [2]: 168", url: "https://quran.com/2/168" },
        { teks: "Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah.", rujukan: "HR. Muslim no. 2664", url: "https://sunnah.com/muslim:2664" }
      ],
      sources: [
        { judul: "Morton RW dkk. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med 52(6):376–384", penerbit: "BMJ", tahun: 2018, url: "https://doi.org/10.1136/bjsports-2017-097608" },
        { judul: "WHO Guidelines on Physical Activity and Sedentary Behaviour", penerbit: "World Health Organization", tahun: 2020, url: "https://www.who.int/publications/i/item/9789240015128" }
      ]
    },
    {
      key: "a7", slug: "batas-gula-garam-lemak", category: "Pola Makan", read_min: 3,
      title: "Gula, Garam, Lemak: Batas Harian dan Prinsip Tidak Berlebihan",
      excerpt: "Kemenkes menganjurkan batas per orang per hari: gula 50 g (4 sdm), garam 5 g (1 sdt), lemak 67 g (5 sdm minyak).",
      body: `Larangan berlebih-lebihan dalam makan dan minum punya terjemahan yang sangat konkret di dunia gizi: batasi gula, garam, dan lemak.

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
- Saat berbuka, cukup beberapa butir kurma, bukan es teh manis jumbo plus takjil bergula.`,
      dalil: [
        { teks: "Makan dan minumlah, tetapi jangan berlebih-lebihan.", rujukan: "QS. Al-A'raf [7]: 31", url: "https://quran.com/7/31" },
        { teks: "Janganlah kamu jatuhkan (diri sendiri) ke dalam kebinasaan dengan tangan sendiri.", rujukan: "QS. Al-Baqarah [2]: 195", url: "https://quran.com/2/195" }
      ],
      sources: [
        { judul: "Cegah Meningkatnya Diabetes, Jangan Berlebihan Konsumsi Gula, Garam, Lemak", penerbit: "Kementerian Kesehatan RI", tahun: 2024, url: "https://www.kemkes.go.id/id/cegah-meningkatnya-diabetes-jangan-berlebihan-konsumsi-gula-garam-lemak" },
        { judul: "Permenkes No. 30 Tahun 2013 jo. Permenkes No. 63 Tahun 2015 tentang pencantuman informasi kandungan gula, garam, dan lemak", penerbit: "Kementerian Kesehatan RI", tahun: 2015, url: "" }
      ]
    }
  ];

  return { settings, modules, lessons, videos, articles };
})();
