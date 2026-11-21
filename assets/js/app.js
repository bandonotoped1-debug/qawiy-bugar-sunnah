/* =====================================================================
   QOWIY — aplikasi member (SPA berbasis hash route)
   ===================================================================== */
(async function () {
  const { esc, rp, $, $$, md, toast, playerHTML, waLink, SLOTS, DAYS, fmtDate, icon } = UI;
  await Store.init();
  const app = $("#app");
  let S = await Store.settings();
  const state = { me: null, subs: [], active: false };

  if (Store.mode === "demo") $("#demoBanner").classList.remove("hidden");
  $("#year").textContent = new Date().getFullYear();
  function applyBrand() {
    ["#brandName", "#footBrand", "#footBrand2"].forEach((s) => ($(s).textContent = S.brand || "QOWIY"));
    $("#footTag").textContent = S.tagline || "";
    $("#footWa").href = waLink(S.whatsapp, "Assalamu'alaikum admin " + (S.brand || "QOWIY") + ", saya mau bertanya tentang programnya.");
    document.title = (S.brand || "QOWIY") + " — Aplikasi Kebugaran Muslim";
  }
  applyBrand();
  $("#burger").onclick = () => $("#nav").classList.toggle("open");

  async function refreshUser() {
    state.me = (await Store.session()) ? await Store.me() : null;
    state.subs = state.me ? await Store.mySubs() : [];
    state.active = Store.hasActive(state.subs) || (state.me && state.me.role === "admin");
    renderNav();
  }
  function renderNav() {
    const r = location.hash.split("/")[1] || "";
    const items = [["", "Beranda"], ["langganan", "Langganan"], ["kalkulator", "Kalkulator"], ["artikel", "Artikel"]];
    if (state.me) items.push(["dashboard", "Dashboard"], ["akun", "Akun"]);
    else items.push(["masuk", "Masuk"]);
    if (state.me && state.me.role === "admin") items.push(["admin", "Admin"]);
    $("#nav").innerHTML = items.map(([k, t]) => k === "admin" ? `<a href="admin.html">${t}</a>` : `<a href="#/${k}" class="${r === k ? "active" : ""}">${t}</a>`).join("");
  }

  /* ------------------------------------------------------------------ */
  /* KUIS                                                                */
  /* ------------------------------------------------------------------ */
  const QKEY = "qowiy_quiz";
  const quiz = () => { try { return JSON.parse(localStorage.getItem(QKEY)) || {}; } catch (e) { return {}; } };
  const saveQuiz = (q) => localStorage.setItem(QKEY, JSON.stringify(q));

  const QUESTIONS = [
    { id: "name", type: "text", title: "Assalamu'alaikum! Siapa nama panggilanmu?", sub: "Supaya program terasa personal.", placeholder: "mis. Ahmad / Aisyah" },
    { id: "gender", type: "single", title: "Kamu ikhwan atau akhwat?", sub: "Video & trainer menyesuaikan — ikhwan dengan trainer ikhwan, akhwat dengan trainer akhwat.",
      options: [["ikhwan", "🧔", "Ikhwan", "Laki-laki"], ["akhwat", "🧕", "Akhwat", "Perempuan"]] },
    { id: "body", type: "body", title: "Usia, tinggi, dan berat badanmu?", sub: "Untuk menghitung IMT & kebutuhan kalori harian (rumus Mifflin-St Jeor)." },
    { id: "goal", type: "single", title: "Apa tujuan utamamu?", options: [
      ["turun", "📉", "Menurunkan berat & lemak perut", "Celana makin longgar, napas tidak ngos-ngosan"],
      ["kuat", "💪", "Lebih kuat & berotot", "Tubuh kokoh, stamina naik"],
      ["bugar", "⚡", "Bugar & berenergi untuk ibadah", "Kuat berdiri lama saat sholat malam"],
      ["sunnah", "🌙", "Hidup sehat ala sunnah", "Pola makan, tidur, dan aktivitas yang tertata"]] },
    { id: "activity", type: "single", title: "Seberapa aktif kamu sekarang?", options: [
      ["1.2", "🪑", "Jarang bergerak", "Lebih banyak duduk, jarang olahraga"],
      ["1.375", "🚶", "Ringan", "Jalan kaki / olahraga ringan 1–3x sepekan"],
      ["1.55", "🏃", "Sedang", "Olahraga 3–5x sepekan"],
      ["1.725", "🏋️", "Aktif", "Olahraga hampir setiap hari"]] },
    { id: "place", type: "single", title: "Di mana kamu akan berlatih?", options: [
      ["rumah", "🏠", "Di rumah tanpa alat", ""], ["alat", "🏠", "Di rumah dengan alat sederhana", "Dumbbell, resistance band"], ["gym", "🏢", "Di gym", ""]] },
    { id: "slot", type: "single", title: "Kapan waktu luang paling memungkinkan?", sub: "Jadwal latihanmu akan menempel pada waktu sholat ini.", options: [
      ["subuh", "🌅", "Ba'da Subuh", ""], ["dhuha", "☀️", "Pagi / Dhuha", ""], ["ashar", "🌇", "Ba'da Ashar", ""], ["isya", "🌙", "Ba'da Isya", ""]] },
    { id: "meals", type: "single", title: "Biasanya kamu makan berapa kali sehari?", sub: "Rencana makan akan dibagi sesuai kebiasaanmu — boleh diubah kapan saja.", options: [
      ["2", "🍽️", "2 kali", "Makan siang & malam"], ["3", "🍽️", "3 kali", "Sarapan, siang, malam"], ["4", "🍽️", "4 kali", "3 kali makan + 1 selingan"], ["5", "🍽️", "5 kali", "3 kali makan + 2 selingan"], ["6", "🍽️", "6 kali", "Porsi kecil tapi sering"]] },
    { id: "challenges", type: "multi", title: "Apa tantangan terbesarmu?", sub: "Boleh pilih lebih dari satu.", options: [
      ["konsisten", "🔁", "Sulit konsisten", ""], ["makan", "🍽️", "Makan berlebihan / sering ngemil", ""], ["tidur", "😴", "Sering tidur larut", ""],
      ["bingung", "🧭", "Tidak tahu harus mulai dari mana", ""], ["waktu", "⏳", "Waktu sempit", ""]] },
    { id: "sunnah", type: "multi", title: "Sunnah mana yang ingin kamu hidupkan?", sub: "Akan masuk ke checklist harianmu.", options: [
      ["puasa", "🌙", "Puasa Senin–Kamis", ""], ["sepertiga", "🥣", "Makan secukupnya (sepertiga perut)", ""], ["tidur", "🛏️", "Tidur awal, bangun Subuh", ""],
      ["jalan", "🕌", "Jalan kaki ke masjid", ""], ["olahraga", "🏹", "Olahraga rutin", ""]] },
    { id: "health", type: "single", title: "Ada kondisi kesehatan khusus?", sub: "Jujur ya — ini demi keamananmu.", options: [
      ["tidak", "✅", "Tidak ada", ""], ["hamil", "🤰", "Sedang hamil / menyusui", ""], ["kronis", "🩺", "Diabetes, hipertensi, atau penyakit jantung", ""], ["cedera", "🦴", "Cedera sendi / punggung", ""]] },
    { id: "contact", type: "contact", title: "Ke mana hasil analisismu kami kirim?", sub: "Kami simpan hasil tesmu agar bisa langsung dipakai saat mendaftar." }
  ];

  function computeResult(q) {
    const age = +q.age, h = +q.height, w = +q.weight;
    const bmi = w / Math.pow(h / 100, 2);
    let bmiCat = "Normal";
    if (bmi < 18.5) bmiCat = "Kurus"; else if (bmi > 27) bmiCat = "Obesitas"; else if (bmi > 25) bmiCat = "Kelebihan berat badan";
    const bmr = 10 * w + 6.25 * h - 5 * age + (q.gender === "akhwat" ? -161 : 5);
    const tdee = bmr * (+q.activity || 1.2);
    const track = q.goal === "turun" || (q.goal !== "kuat" && bmi > 25) ? "turun" : "kuat";
    let target = tdee;
    if (track === "turun") target = Math.max(tdee * 0.8, bmr);
    else if (q.goal === "kuat") target = tdee * 1.07;
    const refW = bmi > 27 ? 25 * Math.pow(h / 100, 2) : w;
    const protein = Math.round(1.6 * refW);
    const steps = age >= 60 ? "6.000–8.000" : "8.000–10.000";
    const pola = (+q.activity <= 1.375) ? "3x/pekan (full body)" : (+q.activity <= 1.55 ? "4x/pekan (upper–lower)" : "5x/pekan (split)");
    const medical = q.health === "hamil" || q.health === "kronis";
    return { bmi: +bmi.toFixed(1), bmiCat, bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target / 10) * 10, protein, steps, track, pola, medical };
  }

  function viewLanding() {
    const q = quiz();
    const DAY = [
      ["sunrise", "Subuh", "Bangun sebelum adzan, sholat, lalu peregangan 10 menit."],
      ["walk", "Dhuha", "Jalan cepat 20–30 menit sambil dzikir pagi."],
      ["bowl", "Dzuhur", "Makan siang sepertiga perut — separuh piring sayur & buah."],
      ["dumbbell", "Ashar", "Latihan beban 25–30 menit sesuai pola pekananmu."],
      ["date", "Maghrib", "Makan malam secukupnya, tanpa minuman manis."],
      ["moon", "Isya", "Relaksasi 8 menit, wudhu, tidur sebelum pukul 22.00."]
    ];
    const FACTS = [
      ["150–300", "menit aktivitas sedang per pekan untuk orang dewasa", "WHO, 2020"],
      ["⅓", "perut untuk makanan, ⅓ minuman, ⅓ napas", "HR. Tirmidzi no. 2380"],
      ["≤ 50 g", "gula per orang per hari", "Kemenkes RI"],
      ["7+ jam", "tidur malam secara teratur", "AASM & SRS, 2015"]
    ];
    const FEAT = [
      ["play", "Kelas video bertahap", "Jalur Turun Berat atau Bugar & Kuat, lengkap dengan Ramadan Mode dan strategi pecah plateau."],
      ["users", "Ikhwan & akhwat terpisah", "Video rutinitas dan trainer menyesuaikan — akhwat bisa berlatih di rumah dengan pakaian syar'i."],
      ["bowl", "Rencana makan dari angkamu", "Menu 7 hari + menu sahur-berbuka, takaran rumah tangga ala Kemenkes."],
      ["check", "Checklist sunnah harian", "Subuh tepat waktu, langkah harian, porsi, puasa sunnah, jam tidur — tercatat otomatis."],
      ["book", "Artikel yang bisa dicek", "Ayat & hadits dengan nomor riwayat, jurnal ilmiah, WHO, dan Kemenkes."],
      ["calc", "Kalkulator kesehatan", "Kalori, BMR, IMT, dan lemak tubuh — gratis tanpa login."]
    ];
    app.innerHTML = `
      <section class="wrap landing-hero">
        <div>
          <span class="pill acc">Program 12–16 pekan · Muslim & Muslimah</span>
          <h1>${esc(S.hero_title || "Badan kuat, ibadah makin semangat.").replace(/kuat/i, "<em>kuat</em>")}</h1>
          <p class="lead">${esc(S.hero_sub || "")}</p>
          <div class="row wrap-it mt24">
            <a class="btn acc" href="#/kuis">${q.done ? "Ulangi tes kebugaran" : "Mulai tes kebugaran — 2 menit"} →</a>
            ${q.done ? '<a class="btn ghost" href="#/hasil">Lihat hasil tesku</a>' : '<a class="btn ghost" href="#/langganan">Lihat paket</a>'}
          </div>
          <p class="hint mt16">12 pertanyaan singkat · gratis · langsung dapat rencana makan hari pertama</p>
        </div>
        <figure class="emblem">
          <img src="assets/img/logo-full.webp" alt="QOWIY — Aplikasi Kebugaran Muslim" width="168" height="168">
          <div class="arab">وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا</div>
          <blockquote>“Makan dan minumlah, tetapi jangan berlebih-lebihan.”</blockquote>
          <figcaption>QS. Al-A'raf [7]: 31</figcaption>
          <span class="divider"><i></i></span>
          <blockquote class="sm">“Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah.”</blockquote>
          <figcaption>HR. Muslim no. 2664</figcaption>
        </figure>
      </section>

      <section class="band cream">
        <div class="wrap">
          <div class="band-head"><h2>Sehari yang tertata, mengikuti adzan</h2><p>Tidak perlu jam khusus untuk olahraga. Waktu sholat sudah menjadi pengingat alami — kami tinggal mengisinya dengan kebiasaan sehat.</p></div>
          <ol class="dayline">${DAY.map(([ic, t, d]) => `<li><span class="node-ic">${icon(ic, 24)}</span><b>${t}</b><p>${d}</p></li>`).join("")}</ol>
        </div>
      </section>

      <section class="wrap facts">
        <div class="facts-head"><span class="kicker">Pegangan kami</span><h2>Dalil dan data, bukan kira-kira.</h2><p class="muted-d">Setiap anjuran di dalam program punya rujukan yang bisa kamu periksa sendiri.</p><a class="link-gold" href="#/artikel">Baca artikel kesehatan →</a></div>
        <div class="facts-grid">${FACTS.map(([n, t, src]) => `<div class="fact"><b>${n}</b><span>${t}</span><small>${src}</small></div>`).join("")}</div>
      </section>

      <section class="wrap split">
        <form class="bmi-mini" id="bmiMini" onsubmit="return false">
          <span class="kicker dark">Cek cepat</span>
          <h3>Berapa IMT-mu?</h3>
          <div class="grid g2" style="gap:10px"><label class="field"><span>Tinggi (cm)</span><input name="h" type="number" inputmode="numeric" value="${esc(q.height || 165)}"></label><label class="field"><span>Berat (kg)</span><input name="w" type="number" inputmode="decimal" value="${esc(q.weight || 65)}"></label></div>
          <div class="bmi-out" id="bmiOut"></div>
          <a class="btn block mt16" href="#/kalkulator/kalori">Hitung kebutuhan kalori lengkap →</a>
        </form>
        <div class="feat">
          <span class="kicker">Isi program</span>
          <h2>Semua yang kamu butuhkan dalam satu aplikasi.</h2>
          <ul>${FEAT.map(([ic, t, d]) => `<li><span class="feat-ic">${icon(ic, 22)}</span><div><b>${t}</b><p>${d}</p></div></li>`).join("")}</ul>
        </div>
      </section>

      <section class="wrap">
        <div class="cta-band">
          <img src="assets/img/logo-mark.png" alt="" width="84" height="84">
          <div><h2>Mulai dari tes 2 menit.</h2><p>Jawab 12 pertanyaan, dapatkan jalur program, target kalori, dan rencana makan hari pertama — gratis.</p></div>
          <a class="btn acc" href="#/kuis">Mulai sekarang →</a>
        </div>
      </section>`;
    const calc = () => {
      const f = $("#bmiMini"), h = +f.h.value, w = +f.w.value;
      if (!(h > 100 && w > 25)) { $("#bmiOut").innerHTML = '<p class="muted">Isi tinggi & berat.</p>'; return; }
      const v = Health.bmi(h, w), c = Health.bmiCat(v), iw = Health.idealWeight(h);
      const pos = Math.max(0, Math.min(100, ((v - 15) / 20) * 100));
      $("#bmiOut").innerHTML = `<div class="row" style="align-items:baseline;gap:12px"><b class="bmi-num" style="color:${c.c}">${v.toFixed(1).replace(".", ",")}</b><span><b>${c.t}</b><br><span class="muted" style="font-size:13.5px">Rentang sehat: ${iw.min.toFixed(1).replace(".", ",")}–${iw.max.toFixed(1).replace(".", ",")} kg</span></span></div>
        <div class="bmi-bar"><i style="left:${pos}%"></i></div><div class="row" style="justify-content:space-between;font-size:11px" class="muted"><span>15</span><span>18,5</span><span>25</span><span>27</span><span>35</span></div>`;
    };
    $("#bmiMini").oninput = calc; calc();
  }

  function viewQuiz(step) {
    const q = quiz(); step = Math.max(0, Math.min(QUESTIONS.length - 1, +step || 0));
    const Q = QUESTIONS[step];
    const pct = Math.round((step / QUESTIONS.length) * 100);
    let body = "";
    if (Q.type === "text") body = `<div class="field mt24"><input id="qin" value="${esc(q[Q.id] || "")}" placeholder="${esc(Q.placeholder)}" autofocus></div>`;
    if (Q.type === "single" || Q.type === "multi") {
      const val = q[Q.id] || (Q.type === "multi" ? [] : "");
      body = `<div class="opts">${Q.options.map(([v, ic, t, s]) => `<button class="opt ${(Q.type === "multi" ? val.includes(v) : val === v) ? "on" : ""}" data-v="${v}"><span class="ic">${ic}</span><span>${t}${s ? `<small>${s}</small>` : ""}</span></button>`).join("")}</div>`;
    }
    if (Q.type === "body") body = `<div class="grid g3 mt24">
        <label class="field"><span>Usia (tahun)</span><input id="qage" type="number" inputmode="numeric" min="13" max="90" value="${esc(q.age || "")}"></label>
        <label class="field"><span>Tinggi (cm)</span><input id="qh" type="number" inputmode="numeric" min="120" max="220" value="${esc(q.height || "")}"></label>
        <label class="field"><span>Berat (kg)</span><input id="qw" type="number" inputmode="decimal" min="30" max="250" value="${esc(q.weight || "")}"></label></div>`;
    if (Q.type === "contact") body = `<div class="mt24">
        <label class="field"><span>Email</span><input id="qemail" type="email" value="${esc(q.email || "")}" placeholder="nama@email.com"></label>
        <label class="field"><span>No. WhatsApp</span><input id="qwa" type="tel" value="${esc(q.whatsapp || "")}" placeholder="08xxxxxxxxxx"></label>
        <p class="muted" style="font-size:13px">Data hanya dipakai untuk mengirim hasil & info program. Tidak dibagikan ke pihak lain.</p></div>`;

    app.innerHTML = `<section class="wrap quiz"><div class="card">
      <div class="qprog"><span class="label">${step + 1}/${QUESTIONS.length}</span><div class="bar"><i style="width:${pct}%"></i></div></div>
      <h1 class="qtitle">${esc(Q.title)}</h1>${Q.sub ? `<p class="muted mt0">${esc(Q.sub)}</p>` : ""}
      ${body}
      <div class="err" id="qerr"></div>
      <div class="qnav">
        ${step > 0 ? `<a class="btn ghost" href="#/kuis/${step - 1}">← Kembali</a>` : `<a class="btn ghost" href="#/">Batal</a>`}
        <button class="btn acc" id="qnext">${step === QUESTIONS.length - 1 ? "Lihat hasil analisis" : "Lanjut"} →</button>
      </div></div></section>`;

    const next = async () => {
      const err = (m) => ($("#qerr").textContent = m);
      if (Q.type === "text") { const v = $("#qin").value.trim(); if (!v) return err("Isi nama panggilanmu dulu ya."); q[Q.id] = v; }
      if (Q.type === "single" && !q[Q.id]) return err("Pilih salah satu.");
      if (Q.type === "multi" && !(q[Q.id] || []).length) return err("Pilih minimal satu.");
      if (Q.type === "body") {
        const a = +$("#qage").value, hh = +$("#qh").value, ww = +$("#qw").value;
        if (!(a >= 13 && a <= 90)) return err("Usia antara 13–90 tahun.");
        if (!(hh >= 120 && hh <= 220)) return err("Tinggi antara 120–220 cm.");
        if (!(ww >= 30 && ww <= 250)) return err("Berat antara 30–250 kg.");
        Object.assign(q, { age: a, height: hh, weight: ww });
      }
      if (Q.type === "contact") {
        const em = $("#qemail").value.trim(), wa = $("#qwa").value.trim();
        if (!/^\S+@\S+\.\S+$/.test(em)) return err("Email belum valid.");
        if (wa.replace(/\D/g, "").length < 9) return err("Nomor WhatsApp belum valid.");
        Object.assign(q, { email: em, whatsapp: wa, done: true });
        q.result = computeResult(q); saveQuiz(q);
        $("#qnext").disabled = true;
        await Store.saveLead({ name: q.name, email: em, whatsapp: wa, answers: Object.assign({}, q, { result: undefined }), result: q.result });
        location.hash = "#/hasil"; return;
      }
      saveQuiz(q); location.hash = "#/kuis/" + (step + 1);
    };
    $$(".opt", app).forEach((b) => b.onclick = () => {
      const v = b.dataset.v;
      if (Q.type === "single") { q[Q.id] = v; saveQuiz(q); $$(".opt", app).forEach((x) => x.classList.toggle("on", x === b)); setTimeout(next, 180); }
      else { const arr = q[Q.id] || []; q[Q.id] = arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat(v); saveQuiz(q); b.classList.toggle("on"); }
    });
    $("#qnext").onclick = next;
    app.querySelectorAll("input").forEach((i) => i.addEventListener("keydown", (e) => e.key === "Enter" && next()));
  }

  function viewResult() {
    const q = quiz();
    if (!q.done) { location.hash = "#/kuis"; return; }
    const r = q.result || computeResult(q);
    const goalTxt = { turun: "menurunkan berat & lemak", kuat: "lebih kuat & berotot", bugar: "bugar untuk ibadah", sunnah: "hidup sehat ala sunnah" }[q.goal];
    const trackTxt = r.track === "turun" ? "Jalur A — Turun Berat" : "Jalur B — Bugar & Kuat";
    const plan = [
      ["subuh", "Ba'da Subuh", "Peregangan & mobilitas 10 menit + dzikir pagi"],
      ["dhuha", "Pagi / Dhuha", `Jalan cepat 20–30 menit — target ${r.steps} langkah/hari`],
      ["ashar", "Ba'da Ashar", `Latihan ${q.place === "gym" ? "di gym" : "di rumah"} — pola ${r.pola}`],
      ["isya", "Ba'da Isya", "Relaksasi 8 menit, wudhu, tidur sebelum 22.00"]
    ];
    if (q.slot && q.slot !== "ashar") { const i = plan.findIndex((p) => p[0] === q.slot); plan[i] = [q.slot, plan[i][1], `Sesi latihan utama — pola ${r.pola}`]; plan[2] = ["ashar", "Ba'da Ashar", "Jalan santai 10–15 menit / naik-turun tangga"]; }
    const sun = { puasa: "Puasa Senin–Kamis", sepertiga: "Makan sepertiga perut", tidur: "Tidur awal, bangun Subuh", jalan: "Jalan kaki ke masjid", olahraga: "Olahraga rutin" };
    app.innerHTML = `<section class="wrap">
      <div class="result-hero">
        <span class="label">Hasil tes kebugaran · ${esc(q.gender === "akhwat" ? "Akhwat" : "Ikhwan")}</span>
        <h1>${esc(q.name)}, ini peta awalmu.</h1>
        <p style="max-width:640px;font-size:17px">Tujuanmu <b>${goalTxt}</b>. Berdasarkan jawabanmu, program yang paling cocok adalah <b>${trackTxt}</b> dengan jadwal yang menempel pada waktu <b>${SLOTS[q.slot] || "sholat"}</b>.</p>
        <div class="grid g4 mt24">
          <div class="metric"><span class="label muted-d">IMT</span><b>${r.bmi}</b><span class="muted-d" style="font-size:13px">${r.bmiCat} (klasifikasi Kemenkes)</span></div>
          <div class="metric"><span class="label muted-d">Kebutuhan harian</span><b>${r.tdee.toLocaleString("id-ID")} <small>kkal</small></b><span class="muted-d" style="font-size:13px">Perkiraan TDEE</span></div>
          <div class="metric"><span class="label muted-d">Target makan</span><b>${r.medical ? "—" : r.target.toLocaleString("id-ID")} <small>${r.medical ? "" : "kkal"}</small></b><span class="muted-d" style="font-size:13px">${r.medical ? "Tentukan bersama dokter" : r.track === "turun" ? "Defisit ±20%, tidak di bawah BMR" : q.goal === "kuat" ? "Surplus ringan ±7%" : "Pemeliharaan"}</span></div>
          <div class="metric"><span class="label muted-d">Protein</span><b>${r.medical ? "—" : r.protein} <small>${r.medical ? "" : "g/hari"}</small></b><span class="muted-d" style="font-size:13px">±1,6 g/kg (Morton dkk., 2018)</span></div>
        </div>
      </div>
      ${q.health && q.health !== "tidak" ? `<div class="notice mt16"><b>Catatan kesehatan:</b> ${q.health === "cedera" ? "Pilih gerakan berdampak rendah dan hentikan bila nyeri. Sebaiknya konsultasi fisioterapis." : "Konsultasikan target kalori, puasa sunnah, dan intensitas latihan dengan dokter sebelum memulai. Angka di atas hanya perkiraan umum."}</div>` : ""}
      <div class="grid g2 section">
        <div class="card"><span class="label muted">Rencana harian (contoh)</span>
          ${plan.map(([k, t, d]) => `<div class="habit" style="cursor:default"><span class="box" style="border-color:var(--acc)"></span><div><b>${t}</b><small>${d}</small></div></div>`).join("")}
        </div>
        <div class="card"><span class="label muted">Sunnah yang akan kamu hidupkan</span>
          <div class="tag-row mt16">${(q.sunnah || []).map((s) => `<span class="pill acc">${sun[s]}</span>`).join("")}</div>
          <p class="mt16">Tantanganmu: ${(q.challenges || []).map((c) => ({ konsisten: "sulit konsisten", makan: "makan berlebihan", tidur: "tidur larut", bingung: "bingung mulai", waktu: "waktu sempit" }[c])).join(", ")}. Di dalam program, setiap tantangan ini punya video & checklist khusus.</p>
          <div class="dalil"><p>“Amal yang paling dicintai Allah adalah yang paling kontinu walaupun sedikit.”</p><a href="https://sunnah.com/bukhari:6464" target="_blank" rel="noopener">HR. Bukhari no. 6464</a></div>
        </div>
      </div>
      <div class="section"><div class="section-head"><h2>Rencana makan yang direkomendasikan</h2><span class="label muted-d">Hari 1 · ${r.medical ? "perlu tenaga kesehatan" : r.target.toLocaleString("id-ID") + " kkal"} · 1 protein per hidangan · porsi dalam gram</span></div>
        ${r.medical ? `<div class="card"><p class="muted" style="margin:0">Karena kondisi kesehatanmu, rencana makan sebaiknya disusun bersama dokter/ahli gizi. Prinsip umum: sepertiga perut, Isi Piringku, batasi gula-garam-lemak.</p></div>` : `<div id="resPlan"><div class="loading">Menyusun menu…</div></div>`}
        ${r.medical ? "" : `<div class="row wrap-it mt16"><a class="btn light" href="#/rencana-makan/hari1">Atur makro & buka rencana makan lengkap →</a><span class="muted-d" style="font-size:14px">Menu 7 hari bervariasi + menu sahur & berbuka tersedia untuk member.</span></div>`}
      </div>
      <div class="panel section center">
        <span class="label muted-d">Langkah berikutnya</span>
        <h2 class="display mt8" style="font-size:clamp(26px,4vw,40px)">Buka programmu sekarang</h2>
        <p class="muted-d">Semua video kelas, rutinitas harian, dan checklist sunnah sudah disiapkan untuk ${trackTxt}.</p>
        <a class="btn acc mt16" href="#/langganan">Pilih paket langganan →</a>
      </div></section>`;
    if (!r.medical) N.load().then(() => { const el = $("#resPlan"); if (!el) return; const P = loadPrefs(r, q); el.innerHTML = mealCardsHTML(N.autoPlan({ kcal: P.kcal, macro: P, day: 0, meals: P.meals })); });
  }

  /* ------------------------------------------------------------------ */
  /* LANGGANAN, DAFTAR, MASUK, BAYAR                                     */
  /* ------------------------------------------------------------------ */
  function viewPricing() {
    const cur = state.subs.find((s) => s.status === "active");
    const pending = state.subs.find((s) => s.status === "pending");
    app.innerHTML = `<section class="wrap">
      <div class="center" style="padding:50px 0 26px">
        <span class="pill acc">Bayar sekali, akses langsung dibuka setelah verifikasi</span>
        <h1 class="display mt16" style="font-size:clamp(32px,5.5vw,56px)">Mulai perjalanan sehatmu</h1>
        <p class="muted-d" style="max-width:620px;margin:10px auto 0">Program 12–16 pekan, satu fase nyambung ke fase berikutnya. Semua paket berisi materi yang sama-sama berlandaskan Al-Qur'an, Sunnah, dan ilmu gizi & olahraga.</p>
      </div>
      ${cur ? `<div class="card" style="margin-bottom:20px"><span class="label muted">Langganan kamu</span><h3 class="mt8" style="margin-bottom:4px">${esc(cur.plan_name)} · aktif sejak ${fmtDate(cur.activated_at)}</h3><a class="btn sm mt8" href="#/dashboard">Buka Dashboard →</a></div>` : ""}
      ${pending ? `<div class="notice" style="margin-bottom:20px">Pembayaran paket <b>${esc(pending.plan_name)}</b> sedang menunggu verifikasi admin. <a href="#/bayar/${esc(pending.plan)}">Lihat instruksi</a></div>` : ""}
      <div class="plans">${S.plans.map((p) => `
        <div class="plan ${p.badge === "PALING LARIS" ? "featured" : ""}">
          ${p.badge ? `<span class="pill ${p.badge === "PALING LARIS" ? "acc" : "gold"} badge">${esc(p.badge)}</span>` : ""}
          <h3>${esc(p.name)}</h3><p class="muted mt0" style="margin:0">${esc(p.desc || "")}</p>
          <div class="price">${p.strike ? `<s>${rp(p.strike)}</s>` : ""}${rp(p.price)}</div>
          <span class="label muted">${esc(p.period || "")}</span>
          <ul>${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          <div class="spacer"></div>
          ${cur && cur.plan === p.id ? `<a class="btn block" href="#/dashboard">✓ Paket kamu — buka dashboard</a>` : `<a class="btn ${p.badge === "PALING LARIS" ? "acc" : ""} block" href="#/bayar/${esc(p.id)}">${cur ? "Upgrade" : "Pilih paket"} →</a>`}
        </div>`).join("")}
      </div>

      <div class="section grid g2" style="align-items:start"><div><div class="section-head"><h2>Alur 12 pekan</h2></div><p class="muted-d">Setiap fase membangun kebiasaan untuk fase berikutnya — pelan, terukur, dan istiqamah.</p></div>
        <div class="timeline">${[["Pekan 1", "Adaptasi", "Atur pola makan sepertiga perut, mulai jalan kaki harian & latihan ringan."], ["Pekan 2–4", "Rutinitas", "Latihan menempel waktu sholat, checklist sunnah jadi kebiasaan."], ["Pekan 5–8", "Progresif", "Beban & langkah naik bertahap. Perut mulai mengecil."], ["Pekan 9–12", "Pemantapan", "Hasil terlihat; transisi ke pola pemeliharaan agar tidak naik lagi."]]
          .map(([a, b, c]) => `<div class="tl"><div class="dotc"><i></i><s></s></div><div class="phase"><span class="label">${a}</span><h4>${b}</h4><p class="muted" style="margin:0;font-size:14.5px">${c}</p></div></div>`).join("")}</div></div>

      <div class="section"><div class="section-head"><h2>Isi program</h2></div>
        <div class="grid g3">${[["🎬", "Kelas video bertahap", "Peta program jalur Turun Berat atau Bugar & Kuat, plus Ramadan Mode & pecah plateau."], ["🕌", "Rutinitas harian", "Video sesuai waktu Ba'da Subuh, Dhuha, Ba'da Ashar, Ba'da Isya — dipisah ikhwan & akhwat."], ["🎙️", "Motivasi trainer", "Pengingat niat & strategi konsisten dari trainer setiap pekan."], ["✅", "Checklist sunnah", "Pantau sholat Subuh, langkah, porsi makan, puasa sunnah, dan jam tidur."], ["🧮", "Kalkulator kalori", "Hitung angkamu sendiri, bukan angka orang lain."], ["📚", "Artikel bersumber", "Dalil lengkap dengan nomor hadits + jurnal ilmiah, WHO, dan Kemenkes."]]
          .map(([i, t, d]) => `<div class="card"><div style="font-size:26px">${i}</div><h3 style="margin:8px 0 4px;font-size:18px">${t}</h3><p class="muted" style="margin:0;font-size:14.5px">${d}</p></div>`).join("")}</div></div>

      <div class="section faq"><div class="section-head"><h2>FAQ</h2></div>
        ${[["Saya belum pernah olahraga, bisa ikut?", "Bisa. Pekan pertama adalah fase adaptasi dengan gerakan dasar tanpa alat."], ["Apakah akhwat bisa berlatih di rumah?", "Bisa. Ada video khusus akhwat berdampak rendah yang bisa dilakukan di rumah dengan pakaian syar'i."], ["Bagaimana kalau sedang puasa / Ramadan?", "Ada modul Ramadan Mode: pilihan waktu latihan, hidrasi Maghrib–Subuh, dan menu berbuka-sahur."], ["Saya punya diabetes / hipertensi / sedang hamil?", "Konsultasikan dengan dokter terlebih dahulu. Program ini bersifat edukasi umum dan tidak menggantikan nasihat medis."], ["Bagaimana cara pembayaran?", "Transfer/QRIS lalu konfirmasi via WhatsApp. Admin mengaktifkan akses setelah pembayaran diverifikasi."]]
          .map(([qq, a]) => `<details><summary>${qq}</summary><p class="muted" style="margin:10px 0 0">${a}</p></details>`).join("")}
      </div></section>`;
  }

  function viewAuth(kind, param) {
    const q = quiz(); const planId = param || "";
    const isUp = kind === "daftar";
    app.innerHTML = `<section class="wrap" style="max-width:980px">
      <div class="grid g2 mt40" style="align-items:start">
        <div>
          <span class="label muted-d">${isUp ? "Daftar akun" : "Masuk"}</span>
          <h1 class="display mt8" style="font-size:clamp(30px,5vw,48px)">${isUp ? "Satu akun untuk seluruh program." : "Masuk dulu, lanjut ke program."}</h1>
          <ul class="muted-d" style="line-height:2">
            <li>Semua kelas terbuka setelah langganan aktif</li><li>Progres & checklist sunnah tersimpan otomatis</li><li>Hasil tes kebugaranmu langsung terhubung</li></ul>
        </div>
        <form class="card" id="authForm">
          ${isUp ? `<label class="field"><span>Nama lengkap</span><input name="full_name" required value="${esc(q.name || "")}"></label>
          <label class="field"><span>No. WhatsApp</span><input name="whatsapp" required value="${esc(q.whatsapp || "")}"></label>
          <label class="field"><span>Ikhwan / Akhwat</span><select name="gender"><option value="ikhwan" ${q.gender === "ikhwan" ? "selected" : ""}>Ikhwan</option><option value="akhwat" ${q.gender === "akhwat" ? "selected" : ""}>Akhwat</option></select></label>` : ""}
          <label class="field"><span>Email</span><input name="email" type="email" required value="${esc(isUp ? q.email || "" : "")}"></label>
          <label class="field"><span>Password</span><input name="password" type="password" required minlength="6"></label>
          <div class="err" id="aerr"></div>
          <button class="btn acc block">${isUp ? "Daftar & lanjutkan" : "Masuk"}</button>
          <p class="center mt16" style="font-size:14px">${isUp ? `Sudah punya akun? <a href="#/masuk/${esc(planId)}">Masuk</a>` : `Belum punya akun? <a href="#/daftar/${esc(planId)}">Daftar dulu</a> · <a href="#/lupa">Lupa password?</a>`}</p>
          ${!isUp && Store.mode === "demo" ? `<p class="muted center" style="font-size:12.5px">Demo admin: admin@qowiy.id / admin123</p>` : ""}
        </form>
      </div></section>`;
    $("#authForm").onsubmit = async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const btn = e.target.querySelector("button"); btn.disabled = true; $("#aerr").textContent = "";
      try {
        if (isUp) {
          const r = await Store.signUp(Object.assign(f, { quiz: q.done ? q : null }));
          if (r.needsConfirm) { app.innerHTML = `<section class="wrap quiz"><div class="card center"><div style="font-size:40px">📩</div><h2>Cek email kamu</h2><p class="muted">Kami mengirim link konfirmasi ke <b>${esc(f.email)}</b>. Klik link tersebut, lalu masuk untuk melanjutkan pembayaran.</p><a class="btn mt16" href="#/masuk/${esc(planId)}">Ke halaman masuk</a></div></section>`; return; }
        } else await Store.signIn(f.email, f.password);
        await refreshUser();
        if (q.done && state.me && !state.me.quiz) { try { await Store.updateMe({ quiz: q }); } catch (x) {} }
        location.hash = planId ? "#/bayar/" + planId : "#/dashboard";
      } catch (err) { $("#aerr").textContent = err.message; btn.disabled = false; }
    };
  }

  function viewForgot() {
    app.innerHTML = `<section class="wrap quiz"><form class="card" id="ff"><h2 class="mt0">Lupa password</h2><p class="muted">Masukkan email akunmu. Kami kirim link untuk membuat password baru.</p>
      <label class="field"><span>Email</span><input name="email" type="email" required></label><div class="err" id="ferr"></div><button class="btn acc block">Kirim link</button></form></section>`;
    $("#ff").onsubmit = async (e) => { e.preventDefault(); try { await Store.resetPassword(e.target.email.value); toast("Link reset terkirim. Cek email kamu."); } catch (x) { $("#ferr").textContent = x.message; } };
  }

  async function viewPay(planId) {
    const p = S.plans.find((x) => x.id === planId);
    if (!p) { location.hash = "#/langganan"; return; }
    if (!state.me) { location.hash = "#/daftar/" + planId; return; }
    const current = state.subs.find((s) => s.status === "active");
    let pending = state.subs.find((s) => s.status === "pending" && s.plan === p.id);
    const curPlan = current && S.plans.find((x) => x.id === current.plan);
    const due = curPlan && p.period === curPlan.period && p.price > curPlan.price ? p.price - curPlan.price : p.price;
    const msg = `Assalamu'alaikum admin ${S.brand}, saya sudah transfer untuk paket *${p.name}* sebesar ${rp(due)}.\nNama: ${state.me.full_name || ""}\nEmail: ${state.me.email}\nBerikut bukti transfernya:`;
    app.innerHTML = `<section class="wrap" style="max-width:920px">
      <div class="grid g2 mt40" style="align-items:start">
        <div class="card">
          <span class="label muted">Ringkasan pesanan</span>
          <h2 style="margin:8px 0 2px">${esc(p.name)}</h2><p class="muted mt0">${esc(p.desc || "")}</p>
          <div class="price mt16">${rp(due)}</div><span class="label muted">${esc(p.period)}</span>
          ${due !== p.price ? `<p class="muted" style="font-size:14px">Harga ${rp(p.price)} dikurangi paket ${esc(curPlan.name)} yang sudah kamu bayar.</p>` : ""}
          <ul class="mt16" style="padding-left:18px">${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        </div>
        <div class="card">
          <span class="label muted">Cara bayar</span>
          ${S.payment_link ? `<a class="btn acc block mt16" href="${esc(S.payment_link)}" target="_blank" rel="noopener">Bayar online (QRIS / VA / e-wallet) →</a><p class="center muted" style="font-size:13px">atau transfer manual:</p>` : ""}
          ${S.qris_url ? `<img src="${esc(S.qris_url)}" alt="QRIS" style="width:100%;max-width:280px;margin:14px auto;border-radius:12px;border:1px solid var(--line)">` : ""}
          <div class="notice mt16">${esc(S.bank_info || "")}<br>Nominal: <b>${rp(due)}</b></div>
          <ol style="padding-left:18px;font-size:14.5px" class="mt16"><li>Bayar sesuai nominal.</li><li>Klik tombol di bawah untuk konfirmasi & kirim bukti ke WhatsApp admin.</li><li>Akses terbuka otomatis setelah admin memverifikasi.</li></ol>
          <div id="payState">${pending ? `<div class="pill gold">Menunggu verifikasi admin</div>` : ""}</div>
          <button class="btn acc block mt16" id="confirmPay">Saya sudah bayar — konfirmasi via WhatsApp</button>
          ${Store.mode === "demo" ? `<button class="btn ghost block mt8" id="demoPay">Simulasikan pembayaran diterima (demo)</button>` : ""}
        </div>
      </div></section>`;
    $("#confirmPay").onclick = async () => {
      try {
        if (!pending) pending = await Store.requestSub(Object.assign({}, p, { price: due }));
        await refreshUser();
        $("#payState").innerHTML = `<div class="pill gold">Menunggu verifikasi admin</div>`;
        window.open(waLink(S.whatsapp, msg), "_blank");
      } catch (x) { toast(x.message); }
    };
    if ($("#demoPay")) $("#demoPay").onclick = async () => {
      if (!pending) pending = await Store.requestSub(Object.assign({}, p, { price: due }));
      await Store.demoActivate(pending.id); await refreshUser(); toast("Langganan aktif! (demo)"); location.hash = "#/dashboard";
    };
  }

  /* ------------------------------------------------------------------ */
  /* DASHBOARD                                                           */
  /* ------------------------------------------------------------------ */
  const HABITS = [
    ["subuh", "Sholat Subuh tepat waktu", "Bangun sebelum adzan, ikhwan berjamaah di masjid"],
    ["dzikir", "Dzikir pagi & petang", "Menenangkan hati sebelum beraktivitas"],
    ["gerak", "Latihan / bergerak ≥ 30 menit", "Video rutinitas hari ini"],
    ["langkah", "Jalan kaki 8.000+ langkah", "Termasuk langkah ke masjid"],
    ["sepertiga", "Makan secukupnya", "Berhenti sebelum kenyang — sepertiga perut"],
    ["air", "Minum air cukup, sambil duduk", "Bernapas tiga kali di luar gelas"],
    ["manis", "Tanpa minuman manis", "Gula ≤ 50 g/hari (Kemenkes)"],
    ["puasa", "Puasa sunnah", "Senin–Kamis / Ayyamul Bidh — bila mampu"],
    ["tidur", "Tidur sebelum 22.00", "Wudhu, sisi kanan, doa sebelum tidur"]
  ];
  const dayStr = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function myTrack() { const q = (state.me && state.me.quiz) || quiz(); return (q && q.result && q.result.track) || "turun"; }
  function orderModules(mods) {
    const t = myTrack(); const order = { start: 0, [t]: 1, [t === "turun" ? "kuat" : "turun"]: 3, ekstra: 2 };
    return mods.slice().sort((a, b) => (order[a.track] ?? 4) - (order[b.track] ?? 4) || a.sort - b.sort);
  }

  function mapHTML(mods, lessons, counts, done) {
    const byTrack = (t) => mods.filter((m) => m.track === t).sort((a, b) => a.sort - b.sort);
    const start = byTrack("start"), turun = byTrack("turun"), kuat = byTrack("kuat"), ekstra = byTrack("ekstra");
    const nT = Math.max(turun.length, kuat.length, ekstra.length + 1, 1);
    const stat = (m) => {
      const total = counts ? counts[m.id] || 0 : lessons.filter((l) => l.module_id === m.id).length;
      const ls = lessons.filter((l) => l.module_id === m.id); const d = ls.filter((l) => done.has(l.id)).length;
      return { total, d, pct: total ? Math.round((d / total) * 100) : 0, locked: !ls.length && total > 0 };
    };
    const node = (m, cls, col, row) => {
      const s = stat(m);
      const href = s.locked ? "#/langganan" : `#/modul/${m.id}`;
      return `<a class="node ${cls} ${s.locked ? "locked" : ""} ${s.total && s.d === s.total ? "done" : ""}" data-id="${m.id}" style="grid-column:${col};grid-row:${row}" href="${href}">
        <h4>${esc(cls.includes("dark") ? m.title : m.tag || m.title)}</h4><p>${esc(m.subtitle || "")}</p>
        <div class="bar"><i style="width:${s.pct}%"></i></div>
        <div class="meta"><span>${s.pct}%</span><span>${s.d}/${s.total} lesson</span></div></a>`;
    };
    let grid = "";
    start.forEach((m, i) => (grid += node(m, i === 0 ? "dark" : "", i + 1, 2)));
    const base = start.length + 2;
    turun.forEach((m, i) => (grid += node(m, i === 0 ? "dark" : "", base + i, 1)));
    kuat.forEach((m, i) => (grid += node(m, i === 0 ? "dark" : "", base + i, 3)));
    ekstra.forEach((m, i) => (grid += node(m, i === 0 ? "hot" : "gold", base + 2 + i, 2)));
    const cols = `repeat(${start.length}, minmax(118px,1fr)) 14px repeat(${nT}, minmax(118px,1fr))`;
    const list = [["Mulai", start], ["Jalur A — Turun Berat", turun], ["Jalur B — Bugar & Kuat", kuat], ["Ekstra", ekstra]]
      .filter(([, a]) => a.length).map(([t, a]) => `<div class="track"><span class="label muted-d">${t}</span>${a.map((m) => node(m, "", "auto", "auto")).join("")}</div>`).join("");
    return `<div class="map-scroll"><div class="map" id="map" style="grid-template-columns:${cols};grid-template-rows:auto auto auto;row-gap:34px;min-width:${(start.length + nT) * 132}px">${grid}<svg id="mapSvg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible"></svg></div></div><div class="map-list">${list}</div>`;
  }
  function drawConnectors(mods) {
    const map = $("#map"), svg = $("#mapSvg"); if (!map || !svg || !map.offsetParent) return;
    const box = map.getBoundingClientRect();
    const R = (id) => { const el = map.querySelector(`[data-id="${id}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left - box.left, r: r.right - box.left, t: r.top - box.top, b: r.bottom - box.top, cy: r.top - box.top + r.height / 2, cx: r.left - box.left + r.width / 2 }; };
    const by = (t) => mods.filter((m) => m.track === t).sort((a, b) => a.sort - b.sort).map((m) => R(m.id)).filter(Boolean);
    const start = by("start"), turun = by("turun"), kuat = by("kuat"), ekstra = by("ekstra");
    let p = "";
    const line = (x1, y1, x2, y2, dash) => (p += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${dash ? "#d4a93c" : "rgba(212,169,60,.45)"}" stroke-width="1.5" fill="none" ${dash ? 'stroke-dasharray="4 5"' : ""}/>`);
    for (let i = 1; i < start.length; i++) line(start[i - 1].r, start[i - 1].cy, start[i].l, start[i].cy);
    [turun, kuat].forEach((row) => { for (let i = 1; i < row.length; i++) line(row[i - 1].r, row[i - 1].cy, row[i].l, row[i].cy); });
    const last = start[start.length - 1];
    if (last && (turun[0] || kuat[0])) {
      const bx = (turun[0] || kuat[0]).l - 16; line(last.r, last.cy, bx, last.cy);
      const ys = [turun[0], kuat[0]].filter(Boolean).map((n) => n.cy); line(bx, Math.min(...ys, last.cy), bx, Math.max(...ys, last.cy));
      [turun[0], kuat[0]].filter(Boolean).forEach((n) => line(bx, n.cy, n.l, n.cy));
    }
    ekstra.forEach((e) => {
      if (turun[0]) line(e.cx, e.t, e.cx, Math.max(...turun.map((n) => n.b)), true);
      if (kuat[0]) line(e.cx, e.b, e.cx, Math.min(...kuat.map((n) => n.t)), true);
    });
    svg.innerHTML = p;
  }

  function videoCard(v, locked) {
    return `<a class="vcard" href="${locked ? "#/langganan" : "#/video/" + v.id}">
      <div class="vthumb">${v.thumb_url ? `<img src="${esc(v.thumb_url)}" alt="">` : ""}<span class="play"></span>${locked ? '<span class="lock">🔒</span>' : ""}</div>
      <div class="vbody"><div class="row wrap-it">${v.time_slot ? `<span class="pill acc">${SLOTS[v.time_slot]}</span>` : ""}${v.duration ? `<span class="pill">${esc(v.duration)}</span>` : ""}${v.audience && v.audience !== "semua" ? `<span class="pill gold">${esc(v.audience)}</span>` : ""}</div>
      <h4>${esc(v.title)}</h4><span class="muted-d" style="font-size:13px">${esc(v.trainer || "")}</span></div></a>`;
  }
  function filterAudience(list) { const g = state.me && state.me.gender; return list.filter((v) => !v.audience || v.audience === "semua" || !g || v.audience === g); }

  async function viewDashboard() {
    if (!state.me) { location.hash = "#/masuk"; return; }
    const [mods, lessons, done, counts, routines, motiv, arts, todayH] = await Promise.all([
      Store.modules(), Store.lessons(), Store.progress(), Store.lessonCounts(),
      state.active ? Store.videos("routine") : Store.videoTeasers("routine"),
      state.active ? Store.videos("motivation") : Store.videoTeasers("motivation"),
      Store.articles(), Store.habits(Store.today())
    ]);
    const ord = orderModules(mods);
    const totalLessons = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : lessons.length;
    const doneCount = lessons.filter((l) => done.has(l.id)).length;
    const modsDone = mods.filter((m) => { const ls = lessons.filter((l) => l.module_id === m.id); return ls.length && ls.every((l) => done.has(l.id)); }).length;
    let next = null; for (const m of ord) { const l = lessons.filter((x) => x.module_id === m.id).sort((a, b) => a.sort - b.sort).find((x) => !done.has(x.id)); if (l) { next = { m, l }; break; } }
    const nextMod = next && lessons.filter((l) => l.module_id === next.m.id);
    const pending = state.subs.find((s) => s.status === "pending");
    const status = state.active ? "AKTIF" : pending ? "MENUNGGU" : "BELUM";
    const activeSub = state.subs.find((s) => s.status === "active");
    const wd = new Date().getDay();
    const todayRoutines = filterAudience(routines).filter((v) => !v.days || !v.days.length || v.days.includes(wd));

    // habit week
    const from = new Date(); from.setDate(from.getDate() - 6);
    const week = await Store.habitsSince(dayStr(from));
    const days7 = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const k = dayStr(d); const it = k === Store.today() ? todayH : week[k] || {}; return { k, n: Object.values(it).filter(Boolean).length, lbl: DAYS[d.getDay()].slice(0, 3) }; });
    let streak = 0; for (let i = days7.length - 1; i >= 0; i--) { if (days7[i].n >= 5) streak++; else if (i !== days7.length - 1) break; }

    app.innerHTML = `<section class="wrap">
      <div class="hero">
        <div class="top"><span class="label">Ruang latihanmu</span><span class="label">${esc(state.me.email || "")}</span></div>
        <div class="hero-grid">
          <div><span class="label">${activeSub ? esc(activeSub.plan_name) + " · aktif" : pending ? "Pembayaran menunggu verifikasi" : "Belum berlangganan"}</span>
            <h1>Assalamu'alaikum, ${esc((state.me.full_name || "Sahabat").split(" ")[0])}.</h1>
            <p style="margin:0;max-width:460px">Progres tersimpan otomatis. Lanjutkan lesson terakhir, kerjakan rutinitas hari ini, dan centang sunnah harianmu.</p></div>
          <div class="row" style="gap:16px;justify-content:flex-end;flex-wrap:wrap">
            <div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10"/><circle cx="60" cy="60" r="52" fill="none" stroke="#d4a93c" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(2 * Math.PI * 52).toFixed(1)}" stroke-dashoffset="${((1 - (totalLessons ? doneCount / totalLessons : 0)) * 2 * Math.PI * 52).toFixed(1)}"/></svg><b>${totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0}%</b><small>program</small></div>
            <div class="stats" style="grid-template-columns:1fr;gap:8px;min-width:190px">
              <div class="stat"><b>${doneCount}<em> / ${totalLessons}</em></b><span>Lesson selesai · ${modsDone}/${mods.length} modul</span></div>
              <div class="stat"><b style="font-size:18px">${status === "AKTIF" ? "✓ Aktif" : status === "MENUNGGU" ? "⏳ Menunggu" : "Belum aktif"}</b><span>Status langganan</span></div>
            </div>
          </div>
        </div>
        ${state.active && next ? `<div class="continue"><div style="flex:1"><span class="label muted">Lanjutkan — ${esc(next.m.tag || next.m.title)}</span><h3 style="margin:4px 0">${esc(next.l.title)}</h3>
          <span class="muted" style="font-size:13px">${nextMod.filter((l) => done.has(l.id)).length}/${nextMod.length} lesson selesai</span></div><a class="btn" href="#/lesson/${next.l.id}">Lanjutkan →</a></div>` : ""}
        ${!state.active ? `<div class="continue"><div style="flex:1"><span class="label muted">${pending ? "Menunggu verifikasi" : "Akses terkunci"}</span><h3 style="margin:4px 0">${pending ? "Pembayaran " + esc(pending.plan_name) + " sedang dicek admin" : "Pilih paket untuk membuka semua kelas"}</h3></div><a class="btn" href="${pending ? "#/bayar/" + esc(pending.plan) : "#/langganan"}">${pending ? "Lihat instruksi" : "Lihat paket"} →</a></div>` : ""}
      </div>

      <div class="section"><div class="section-head"><h2>Rutinitas hari ini</h2><span class="label muted-d">${DAYS[wd]} · mengikuti waktu sholat</span><span class="spacer"></span><a class="btn sm light" href="#/rutinitas">Semua rutinitas →</a></div>
        ${todayRoutines.length ? `<div class="grid g4">${todayRoutines.slice(0, 4).map((v) => videoCard(v, !state.active && !v.is_free)).join("")}</div>` : `<p class="muted-d">Belum ada video rutinitas untuk hari ini.</p>`}
      </div>

      <div class="panel section"><div class="section-head"><h2>Perjalanan program</h2><span class="label" style="color:var(--gold)">Jalurmu: ${myTrack() === "turun" ? "Turun Berat" : "Bugar & Kuat"} · centang otomatis tersimpan</span></div>
        ${mapHTML(mods, lessons, counts, done)}
      </div>

      <div class="grid g2 section" style="align-items:start">
        <div class="card"><div class="row"><span class="label muted">Checklist sunnah · ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span><span class="spacer"></span><span class="pill acc">🔥 ${streak} hari</span></div>
          <div id="habits" class="mt8">${HABITS.map(([k, t, s]) => `<label class="habit"><input type="checkbox" data-k="${k}" ${todayH[k] ? "checked" : ""}><span class="box"></span><div><b>${t}</b><small>${s}</small></div></label>`).join("")}</div>
          <div class="week mt16">${days7.map((d) => `<div><i><b style="height:${Math.round((d.n / HABITS.length) * 100)}%"></b></i>${d.lbl}</div>`).join("")}</div>
          <p class="muted" style="font-size:12.5px;margin-bottom:0">Streak dihitung bila ≥ 5 checklist tercentang dalam sehari.</p>
        </div>
        <div class="grid" style="gap:18px">
          <div class="card"><span class="label muted">Motivasi trainer</span>
            <div class="grid mt16" style="gap:10px">${filterAudience(motiv).slice(0, 3).map((v) => `<a class="row" style="text-decoration:none;padding:10px;border-radius:12px;background:var(--cream-2)" href="${!state.active && !v.is_free ? "#/langganan" : "#/video/" + v.id}"><span class="pill acc">▶</span><div style="flex:1"><b style="font-size:15px">${esc(v.title)}</b><div class="muted" style="font-size:12.5px">${esc(v.trainer || "")} ${v.duration ? "· " + esc(v.duration) : ""}</div></div>${!state.active && !v.is_free ? "🔒" : ""}</a>`).join("") || '<p class="muted">Belum ada video motivasi.</p>'}</div>
            <a class="btn sm mt16" href="#/motivasi">Semua motivasi →</a></div>
          <div class="card dashed"><span class="label muted">Rencana makan</span><h3 style="margin:6px 0">Menu sesuai makro pilihanmu</h3><p class="muted" style="margin:0 0 12px;font-size:14.5px">Atur % protein, karbo, serat — lemak mengisi sisanya. Menu otomatis, rekomendasi AI, atau susun sendiri.</p><div class="row wrap-it"><a class="btn sm acc" href="#/rencana-makan/hari${(new Date().getDay() || 7)}">Lihat menu hari ini →</a><a class="btn sm ghost" href="#/rencana-makan/susun">Susun menu sendiri</a></div></div>
          <div class="card"><span class="label muted">Data tubuh</span><h3 style="margin:6px 0" id="dashW">Berat badan</h3><p class="muted" style="margin:0 0 12px;font-size:14.5px">Hubungkan jam pintar & timbangan Bluetooth, atau catat manual.</p><a class="btn sm" href="#/perangkat">Perangkat & grafik →</a></div>
        </div>
      </div>

      <div class="section"><div class="section-head"><h2>Artikel kesehatan</h2><span class="label muted-d">Dalil + sumber ilmiah</span><span class="spacer"></span><a class="btn sm light" href="#/artikel">Semua artikel →</a></div>
        <div class="grid g3">${arts.slice(0, 3).map(articleCard).join("")}</div></div>

      <div class="grid g2 section">
        <div class="card dashed"><span class="label muted">Halaqah komunitas</span><h3 style="margin:6px 0">Diskusi harian & tanya trainer</h3>
          <p class="muted" style="font-size:14.5px">Grup terbuka untuk paket <b>Mandiri + Halaqah</b> dan <b>Coaching</b>. Ikhwan & akhwat dipisah.</p>
          ${activeSub && activeSub.plan !== "mandiri" ? (S.community_link ? `<a class="btn sm acc" href="${esc(S.community_link)}" target="_blank" rel="noopener">Masuk grup →</a>` : `<span class="pill gold">Link grup segera dikirim admin</span>`) : `<a class="btn sm ghost" href="#/langganan">${activeSub ? "Upgrade paket" : "Lihat paket"} →</a>`}</div>
        <form class="card" id="waForm"><span class="label muted">Kontak kamu</span><h3 style="margin:6px 0">No. WhatsApp</h3>
          <label class="field"><input name="whatsapp" value="${esc(state.me.whatsapp || "")}" placeholder="08xxxxxxxxxx" required></label><button class="btn block ghost">Simpan</button></form>
      </div>
      <div class="card section row wrap-it" style="background:var(--cream-2)"><div style="flex:1;min-width:240px"><h2 class="display" style="font-size:24px">Butuh bantuan?</h2><p class="muted" style="margin:6px 0 0">Tim kami siap membantu soal akses, pembayaran, atau program latihanmu.</p></div>
        <a class="btn acc" target="_blank" rel="noopener" href="${waLink(S.whatsapp, "Assalamu'alaikum admin " + S.brand + ", saya " + (state.me.full_name || "") + " mau bertanya:")}">Tanya admin via WhatsApp</a></div>
    </section>`;

    drawConnectors(mods);
    Store.logs("weight", 365).then((w) => { const el = $("#dashW"); if (el && w.length) el.textContent = "Berat terakhir: " + num1(w[w.length - 1].value) + " kg" + (w.length > 1 ? " (" + (w[w.length - 1].value - w[0].value > 0 ? "+" : "") + num1(w[w.length - 1].value - w[0].value) + " kg)" : ""); }).catch(() => {});
    window.onresize = () => drawConnectors(mods);
    $$("#habits input").forEach((c) => (c.onchange = async () => {
      const items = {}; $$("#habits input").forEach((x) => (items[x.dataset.k] = x.checked));
      try { await Store.saveHabits(Store.today(), items); toast(c.checked ? "Alhamdulillah, tercatat ✓" : "Dibatalkan"); } catch (e) { toast(e.message); }
    }));
    $("#waForm").onsubmit = async (e) => { e.preventDefault(); try { await Store.updateMe({ whatsapp: e.target.whatsapp.value }); toast("Nomor tersimpan"); } catch (x) { toast(x.message); } };
  }

  /* ------------------------------------------------------------------ */
  /* LESSON, MODUL, VIDEO                                                */
  /* ------------------------------------------------------------------ */
  async function viewModule(id) {
    const lessons = (await Store.lessons()).filter((l) => l.module_id === id).sort((a, b) => a.sort - b.sort);
    if (!lessons.length) { location.hash = state.me ? "#/langganan" : "#/masuk"; return; }
    const done = await Store.progress();
    const l = lessons.find((x) => !done.has(x.id)) || lessons[0];
    location.replace("#/lesson/" + l.id);
  }

  async function viewLesson(id) {
    if (!state.me) { location.hash = "#/masuk"; return; }
    const [mods, lessons, done] = await Promise.all([Store.modules(), Store.lessons(), Store.progress()]);
    const l = lessons.find((x) => x.id === id);
    if (!l) { app.innerHTML = `<section class="wrap"><div class="lockwall mt40"><h2>Lesson terkunci</h2><p class="muted-d">Aktifkan langganan untuk membuka lesson ini.</p><a class="btn acc" href="#/langganan">Lihat paket</a></div></section>`; return; }
    const mod = mods.find((m) => m.id === l.module_id);
    const ord = orderModules(mods);
    const flat = ord.flatMap((m) => lessons.filter((x) => x.module_id === m.id).sort((a, b) => a.sort - b.sort));
    const idx = flat.findIndex((x) => x.id === id), prev = flat[idx - 1], nxt = flat[idx + 1];
    const modLessons = lessons.filter((x) => x.module_id === l.module_id);
    const pct = Math.round((modLessons.filter((x) => done.has(x.id)).length / modLessons.length) * 100);
    app.innerHTML = `<section class="wrap">
      <div class="card row mt24" style="padding:14px 18px"><a class="btn sm ghost" href="#/dashboard">←</a><b>${esc(mod ? (mod.tag || mod.title) + " — " + mod.subtitle : "")}</b></div>
      <div class="lesson">
        <aside class="lesson-side"><b>${pct}% selesai</b><div class="bar mt8"><i style="width:${pct}%"></i></div>
          ${ord.filter((m) => lessons.some((x) => x.module_id === m.id)).map((m) => `<div class="mod">${esc(m.tag || m.title)}</div>` + lessons.filter((x) => x.module_id === m.id).sort((a, b) => a.sort - b.sort).map((x) => `<a href="#/lesson/${x.id}" class="${x.id === id ? "on" : ""}"><span class="tick ${done.has(x.id) ? "ok" : ""}">${done.has(x.id) ? "✓" : ""}</span><span>${esc(x.title)}${x.duration ? `<br><small class="muted">${esc(x.duration)}</small>` : ""}</span></a>`).join("")).join("")}
        </aside>
        <div>
          <div id="player"><div class="player"><div class="empty">Memuat video…</div></div></div>
          <div class="row wrap-it mt16">
            ${prev ? `<a class="btn sm light" href="#/lesson/${prev.id}">← Sebelumnya</a>` : ""}
            <span class="spacer"></span>
            <button class="btn sm ${done.has(id) ? "light" : "acc"}" id="markBtn">${done.has(id) ? "✓ Selesai (batalkan)" : "Tandai selesai ✓"}</button>
            ${nxt ? `<a class="btn sm light" href="#/lesson/${nxt.id}">Berikutnya →</a>` : ""}
          </div>
          <div class="card mt16"><h1 style="margin:0 0 8px;font-size:26px">${esc(l.title)}</h1><div class="prose">${md(l.description)}</div>
            ${l.dalil ? `<div class="dalil"><p>${esc(l.dalil)}</p></div>` : ""}</div>
        </div>
      </div></section>`;
    $("#player").innerHTML = await playerHTML(l);
    $("#markBtn").onclick = async () => { await Store.setProgress(id, !done.has(id)); if (!done.has(id) && nxt) { toast("Lesson selesai. Lanjut!"); location.hash = "#/lesson/" + nxt.id; } else render(); };
  }

  async function viewVideo(id) {
    if (!state.me) { location.hash = "#/masuk"; return; }
    const all = (await Store.videos("routine")).concat(await Store.videos("motivation"));
    const v = all.find((x) => x.id === id);
    if (!v) { location.hash = "#/langganan"; return; }
    const related = all.filter((x) => x.kind === v.kind && x.id !== v.id).slice(0, 3);
    app.innerHTML = `<section class="wrap" style="max-width:980px"><div class="mt24"><a class="btn sm light" href="#/${v.kind === "routine" ? "rutinitas" : "motivasi"}">← ${v.kind === "routine" ? "Rutinitas" : "Motivasi"}</a></div>
      <div class="mt16" id="player"></div>
      <div class="card mt16"><div class="row wrap-it">${v.time_slot ? `<span class="pill acc">${SLOTS[v.time_slot]}</span>` : ""}${v.duration ? `<span class="pill cream">${esc(v.duration)}</span>` : ""}${v.level ? `<span class="pill cream">${esc(v.level)}</span>` : ""}</div>
        <h1 style="margin:12px 0 4px;font-size:26px">${esc(v.title)}</h1><div class="muted">${esc(v.trainer || "")}</div><div class="prose mt16">${md(v.description)}</div></div>
      ${related.length ? `<div class="section"><div class="section-head"><h2>Video lainnya</h2></div><div class="grid g3">${related.map((x) => videoCard(x, false)).join("")}</div></div>` : ""}</section>`;
    $("#player").innerHTML = await playerHTML(v);
  }

  async function viewVideoList(kind) {
    if (!state.me) { location.hash = "#/masuk"; return; }
    const list = filterAudience(state.active ? await Store.videos(kind) : await Store.videoTeasers(kind));
    const isR = kind === "routine";
    app.innerHTML = `<section class="wrap"><div class="section-head mt40"><h2>${isR ? "Rutinitas harian" : "Motivasi trainer"}</h2><span class="label muted-d">${isR ? "Disusun mengikuti waktu sholat" : "Pengingat niat & konsistensi"}</span></div>
      ${!state.active ? `<div class="lockwall" style="margin-bottom:20px"><b>Video terkunci.</b> <span class="muted-d">Aktifkan langganan untuk menonton semua video.</span> <a class="btn sm acc" href="#/langganan" style="margin-left:8px">Lihat paket</a></div>` : ""}
      ${isR ? `<div class="slot-tabs" id="tabs"><button class="on" data-s="">Semua</button>${Object.entries(SLOTS).map(([k, t]) => `<button data-s="${k}">${t}</button>`).join("")}<button data-s="today">Hari ini</button></div>` : ""}
      <div class="grid g3" id="vlist"></div></section>`;
    const draw = (s) => {
      const wd = new Date().getDay();
      const f = list.filter((v) => !s || (s === "today" ? !v.days || !v.days.length || v.days.includes(wd) : v.time_slot === s));
      $("#vlist").innerHTML = f.map((v) => videoCard(v, !state.active && !v.is_free)).join("") || '<p class="muted-d">Belum ada video.</p>';
    };
    draw("");
    $$("#tabs button").forEach((b) => (b.onclick = () => { $$("#tabs button").forEach((x) => x.classList.toggle("on", x === b)); draw(b.dataset.s); }));
  }

  /* ------------------------------------------------------------------ */
  /* ARTIKEL                                                             */
  /* ------------------------------------------------------------------ */
  function articleCard(a) {
    return `<a class="acard" href="#/artikel/${esc(a.slug)}">${a.cover_url ? `<img src="${esc(a.cover_url)}" alt="" style="border-radius:10px;aspect-ratio:16/9;object-fit:cover">` : ""}<div class="row"><span class="pill acc">${esc(a.category || "Artikel")}</span><span class="label muted">${a.read_min || 4} menit</span></div>
      <h3>${esc(a.title)}</h3><p class="muted" style="margin:0;font-size:14.5px">${esc(a.excerpt || "")}</p><span class="label" style="color:var(--acc-2)">Baca →</span></a>`;
  }
  async function viewArticles() {
    const arts = await Store.articles();
    const cats = [...new Set(arts.map((a) => a.category).filter(Boolean))];
    app.innerHTML = `<section class="wrap"><div class="center" style="padding:46px 0 20px"><span class="pill acc">Dalil + sumber ilmiah</span><h1 class="display mt16" style="font-size:clamp(32px,6vw,56px)">Artikel kesehatan</h1>
      <p class="muted-d" style="max-width:640px;margin:10px auto 0">Setiap artikel mencantumkan ayat Al-Qur'an dan hadits beserta nomor riwayatnya, serta rujukan ilmiah (jurnal, WHO, Kemenkes) yang bisa kamu periksa sendiri.</p></div>
      <div class="slot-tabs" id="cats" style="justify-content:center"><button class="on" data-c="">Semua</button>${cats.map((c) => `<button data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <div class="grid g3" id="alist"></div></section>`;
    const draw = (c) => ($("#alist").innerHTML = arts.filter((a) => !c || a.category === c).map(articleCard).join(""));
    draw(""); $$("#cats button").forEach((b) => (b.onclick = () => { $$("#cats button").forEach((x) => x.classList.toggle("on", x === b)); draw(b.dataset.c); }));
  }
  async function viewArticle(slug) {
    const a = await Store.article(slug);
    if (!a) { app.innerHTML = `<section class="wrap"><p class="loading">Artikel tidak ditemukan.</p></section>`; return; }
    document.title = a.title + " — " + S.brand;
    app.innerHTML = `<article class="wrap article"><a class="btn sm light" href="#/artikel">← Semua artikel</a>
      <div class="card mt16"><div class="row"><span class="pill acc">${esc(a.category || "")}</span><span class="label muted">${a.read_min || 4} menit baca</span></div>
        <h1>${esc(a.title)}</h1><p class="muted" style="font-size:18px">${esc(a.excerpt || "")}</p>
        ${a.cover_url ? `<img src="${esc(a.cover_url)}" alt="" style="border-radius:14px;margin:16px 0">` : ""}
        <div class="prose">${md(a.body)}</div>
        ${(a.dalil || []).length ? `<h2 style="margin-top:34px">Dalil</h2>${a.dalil.map((d) => `<div class="dalil"><p>“${esc(d.teks)}”</p>${d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.rujukan)} ↗</a>` : `<span class="label">${esc(d.rujukan)}</span>`}</div>`).join("")}` : ""}
        ${(a.sources || []).length ? `<h2 style="margin-top:30px">Sumber ilmiah</h2>${a.sources.map((s, i) => `<div class="src">[${i + 1}] ${esc(s.judul)}${s.penerbit ? " — " + esc(s.penerbit) : ""}${s.tahun ? " (" + esc(s.tahun) + ")" : ""}${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener">tautan ↗</a>` : ""}</div>`).join("")}` : ""}
        <div class="notice mt24">Artikel ini bersifat edukasi umum dan tidak menggantikan konsultasi dengan dokter atau ahli gizi.</div>
      </div>
      ${!state.active ? `<div class="panel section center"><h2 class="display" style="font-size:28px">Praktikkan dengan program terarah</h2><p class="muted-d">Ikuti tes kebugaran gratis untuk tahu jalur program yang cocok.</p><a class="btn acc" href="#/kuis">Mulai tes 2 menit →</a></div>` : ""}
    </article>`;
  }

  /* ------------------------------------------------------------------ */
  /* KALKULATOR & AKUN                                                   */
  /* ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ */
  /* KALKULATOR KESEHATAN (kalori · BMR · IMT · lemak tubuh)             */
  /* ------------------------------------------------------------------ */
  const H = window.Health;
  const CALC_TABS = [["kalori", "Kalori"], ["bmr", "BMR"], ["imt", "IMT / BMI"], ["lemak", "Lemak tubuh"]];
  const num = (n, d) => Number(n).toLocaleString("id-ID", { maximumFractionDigits: d || 0 });

  function bodyInputs(q, extra) {
    return `<div class="grid g2" style="gap:10px">
      <label class="field"><span>Usia (15–80)</span><input name="age" type="number" min="15" max="80" value="${esc(q.age || 30)}"></label>
      <label class="field"><span>Jenis kelamin</span><select name="gender"><option value="ikhwan">Laki-laki</option><option value="akhwat" ${q.gender === "akhwat" ? "selected" : ""}>Perempuan</option></select></label>
      <label class="field"><span>Tinggi (cm)</span><input name="height" type="number" step="0.1" value="${esc(q.height || 165)}"></label>
      <label class="field"><span>Berat (kg)</span><input name="weight" type="number" step="0.1" value="${esc(q.weight || 65)}"></label></div>${extra || ""}`;
  }

  function viewCalc(tab) {
    tab = CALC_TABS.some(([k]) => k === tab) ? tab : "kalori";
    const q = Object.assign({}, quiz(), (state.me && state.me.quiz) || {});
    const actSel = (v) => `<label class="field"><span>Aktivitas</span><select name="activity">${H.ACT.map((a) => `<option value="${a.v}" ${String(a.v) === String(v || 1.375) ? "selected" : ""}>${a.t} — ${a.d}</option>`).join("")}</select></label>`;
    let form = "", info = "";
    if (tab === "kalori") {
      form = bodyInputs(q, actSel(q.activity) + `<details class="mt8"><summary class="label" style="cursor:pointer">+ Pengaturan</summary><div class="mt16">
        <label class="field"><span>Satuan hasil</span><select name="unit"><option value="kkal">Kalori (kkal)</option><option value="kj">Kilojoule (kJ)</option></select></label>
        <label class="field"><span>Rumus BMR</span><select name="formula"><option value="mifflin">Mifflin-St Jeor</option><option value="harris">Revised Harris-Benedict</option><option value="katch">Katch-McArdle (butuh % lemak)</option></select></label>
        <label class="field"><span>Persentase lemak tubuh (%) — untuk Katch-McArdle</span><input name="bodyfat" type="number" step="0.1" value="20"></label></div></details>`);
      info = `<div class="card mt24"><h3 class="mt0">Definisi aktivitas</h3><p class="muted" style="margin:0">• <b>Olahraga</b>: 15–30 menit aktivitas yang menaikkan denyut jantung. • <b>Olahraga intens</b>: 45–120 menit. • <b>Sangat intens</b>: 2 jam atau lebih.</p></div>
        <div class="card mt16"><h3 class="mt0">Tentang perhitungan ini</h3><div class="prose" style="font-size:15px">
          <p>Kalkulator memperkirakan <b>BMR</b> (energi saat istirahat) lalu mengalikannya dengan faktor aktivitas (1,2–1,9) untuk mendapat <b>TDEE</b>, yaitu kebutuhan energi harian. Target turun/naik berat memakai patokan ±7.700 kkal ≈ 1 kg jaringan lemak, sehingga 0,5 kg/pekan ≈ selisih 550 kkal/hari.</p>
          <ul><li><b>Mifflin-St Jeor</b>: pria 10W + 6,25H − 5A + 5; wanita 10W + 6,25H − 5A − 161</li><li><b>Revised Harris-Benedict</b>: pria 13,397W + 4,799H − 5,677A + 88,362; wanita 9,247W + 3,098H − 4,330A + 447,593</li><li><b>Katch-McArdle</b>: 370 + 21,6 × (1 − lemak%) × W — paling tepat bila % lemak tubuh diketahui</li></ul>
          <p class="muted">W = berat (kg), H = tinggi (cm), A = usia (tahun). Penurunan lebih dari 1 kg/pekan tidak dianjurkan tanpa pengawasan tenaga kesehatan. Asupan di bawah ±1.200 kkal (wanita) atau ±1.500 kkal (pria) sebaiknya dengan pendampingan dokter/ahli gizi.</p>
          <p class="muted" style="font-size:13px">Rujukan: Mifflin MD dkk., Am J Clin Nutr 1990;51:241–7 · Roza AM & Shizgal HM, Am J Clin Nutr 1984;40:168–82 · McArdle WD, Katch FI, Katch VL, <i>Exercise Physiology</i> · Ainsworth BE dkk., Compendium of Physical Activities 2011.</p></div></div>
        <div class="card mt16"><h3 class="mt0">Kandungan gizi makanan per 100 g</h3><p class="muted mt0" style="font-size:14px">Sumber: USDA FoodData Central & TKPI 2017 (Kemenkes RI). Data yang sama dipakai untuk menghitung rencana makan.</p><div id="foodTbl" style="overflow-x:auto"></div></div>
        <div class="card mt16"><h3 class="mt0">Kalori terbakar per 1 jam olahraga</h3><p class="muted mt0" style="font-size:14px">Perkiraan = MET × berat badan (kg) × durasi (jam). MET dari Compendium of Physical Activities.</p><div id="exTbl"></div></div>`;
    }
    if (tab === "bmr") {
      form = bodyInputs(q, `<label class="field"><span>Persentase lemak tubuh (%) — opsional, untuk Katch-McArdle</span><input name="bodyfat" type="number" step="0.1" placeholder="mis. 22"></label>`);
      info = `<div class="card mt24"><h3 class="mt0">Apa itu BMR?</h3><p class="muted" style="margin:0">BMR (<i>Basal Metabolic Rate</i>) adalah energi minimum yang dibutuhkan tubuh untuk fungsi dasar — bernapas, memompa darah, menjaga suhu — saat istirahat total. Sekitar 60–70% energi harian kebanyakan orang dipakai untuk BMR. Gunakan tab <a href="#/kalkulator/kalori">Kalori</a> untuk menghitung kebutuhan harian (TDEE) sesuai aktivitas.</p></div>`;
    }
    if (tab === "imt") {
      form = bodyInputs(q);
      info = `<div class="card mt24"><h3 class="mt0">Klasifikasi IMT (Kemenkes RI)</h3><table style="width:100%;font-size:14.5px;border-collapse:collapse">${[["< 17,0", "Kurus (kekurangan berat tingkat berat)"], ["17,0 – 18,4", "Kurus (kekurangan berat tingkat ringan)"], ["18,5 – 25,0", "Normal"], ["25,1 – 27,0", "Gemuk (kelebihan berat tingkat ringan)"], ["> 27,0", "Obesitas (kelebihan berat tingkat berat)"]].map(([a, b]) => `<tr><td style="padding:7px 4px;border-bottom:1px dashed var(--line);width:120px"><b>${a}</b></td><td style="padding:7px 4px;border-bottom:1px dashed var(--line)">${b}</td></tr>`).join("")}</table>
        <p class="muted" style="font-size:13.5px">IMT = berat (kg) ÷ tinggi² (m). IMT tidak membedakan otot dan lemak, sehingga kurang tepat untuk atlet, ibu hamil, dan lansia — lengkapi dengan lingkar perut atau <a href="#/kalkulator/lemak">persentase lemak tubuh</a>. Sumber: P2PTM Kemenkes RI.</p></div>`;
    }
    if (tab === "lemak") {
      form = bodyInputs(q, `<div class="grid g3" style="gap:10px"><label class="field"><span>Lingkar leher (cm)</span><input name="neck" type="number" step="0.1" value="38"></label><label class="field"><span>Lingkar pinggang (cm)</span><input name="waist" type="number" step="0.1" value="${q.gender === "akhwat" ? 80 : 88}"></label><label class="field"><span>Lingkar pinggul (cm) — wanita</span><input name="hip" type="number" step="0.1" value="96"></label></div>`);
      info = `<div class="card mt24"><h3 class="mt0">Cara mengukur</h3><ul class="muted" style="margin:0;padding-left:18px"><li><b>Leher</b>: tepat di bawah jakun, pita sedikit miring ke bawah ke depan.</li><li><b>Pinggang</b>: pria setinggi pusar; wanita di bagian tersempit.</li><li><b>Pinggul</b> (wanita): bagian terlebar bokong.</li></ul>
        <p class="muted" style="font-size:13.5px">Metode U.S. Navy (Hodgdon & Beckett, 1984). Kategori dari American Council on Exercise (ACE). Hasil adalah perkiraan; alat seperti DEXA lebih akurat.</p></div>`;
    }
    app.innerHTML = `<section class="wrap" style="max-width:1000px">
      <div class="center" style="padding:40px 0 18px"><span class="pill acc">Gratis · tanpa login</span><h1 class="display mt16" style="font-size:clamp(30px,5.5vw,52px)">Kalkulator kesehatan</h1></div>
      <div class="slot-tabs" style="justify-content:center">${CALC_TABS.map(([k, t]) => `<a href="#/kalkulator/${k}"><button class="${tab === k ? "on" : ""}">${t}</button></a>`).join("")}<a href="#/rencana-makan"><button>Rencana makan</button></a></div>
      <div class="grid g2" style="align-items:start"><form class="card" id="cf" onsubmit="return false">${form}</form><div id="cres"></div></div>${info}</section>`;

    const calc = () => {
      const f = Object.fromEntries(new FormData($("#cf")));
      const ok = +f.age >= 15 && +f.age <= 80 && +f.height > 100 && +f.weight > 25;
      if (!ok) { $("#cres").innerHTML = `<div class="card"><p class="muted">Lengkapi usia (15–80), tinggi, dan berat.</p></div>`; return; }
      if (tab === "kalori") {
        const B = H.bmr(f), tdee = B * +f.activity, unit = f.unit === "kj" ? "kJ" : "kkal", cv = (x) => num(f.unit === "kj" ? x * 4.1868 : x);
        const floor = f.gender === "akhwat" ? 1200 : 1500;
        const G = H.goals(tdee);
        $("#cres").innerHTML = `<div class="card"><span class="label muted">Hasil</span><p style="margin:6px 0 14px">Kebutuhan energi harian berdasarkan data Anda (BMR ${cv(B)} ${unit}${f.formula === "katch" ? ", Katch-McArdle" : f.formula === "harris" ? ", Harris-Benedict" : ", Mifflin-St Jeor"}):</p>
          <table style="width:100%;border-collapse:collapse">${G.map((g, i) => `<tr style="${i === 0 ? "background:#e9f6ef" : i === 4 ? "border-top:2px solid var(--line)" : ""}"><td style="padding:10px 8px;border-bottom:1px dashed var(--line)"><b>${g.t}</b>${g.kg ? `<br><span class="muted" style="font-size:13px">${g.kg > 0 ? "+" : ""}${num(g.kg, 2)} kg/pekan</span>` : ""}</td>
            <td style="padding:10px 8px;border-bottom:1px dashed var(--line);text-align:right"><b style="font-family:var(--display);font-size:20px;color:${g.kcal < floor && g.kg < 0 ? "var(--red)" : "var(--ink)"}">${cv(g.kcal)}</b> <span class="muted">${unit}/hari</span><br><span class="muted" style="font-size:13px">${Math.round((g.kcal / tdee) * 100)}%</span></td></tr>`).join("")}</table>
          ${G.some((g) => g.kg < 0 && g.kcal < floor) ? `<div class="notice mt16">Angka berwarna merah berada di bawah ±${num(floor)} kkal/hari. Pola makan serendah itu sebaiknya hanya dengan pendampingan tenaga kesehatan.</div>` : ""}
          <div class="field mt16"><span>Siklus kalori zigzag untuk target</span><select id="zzSel">${G.map((g) => `<option value="${g.k}" ${g.k === "turun2" ? "selected" : ""}>${g.t} (${cv(g.kcal)} ${unit})</option>`).join("")}</select></div><div id="zz"></div>
          <a class="btn acc block mt16" href="#/rencana-makan">Buat rencana makan dari angka ini →</a></div>`;
        const drawZZ = () => { const g = G.find((x) => x.k === $("#zzSel").value); const z = H.zigzag(g.kcal); const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
          $("#zz").innerHTML = `<table style="width:100%;font-size:14px;border-collapse:collapse"><tr><th style="text-align:left;padding:6px 4px" class="label muted">Hari</th><th style="text-align:right" class="label muted">Jadwal 1</th><th style="text-align:right" class="label muted">Jadwal 2</th></tr>${days.map((d, i) => `<tr><td style="padding:6px 4px;border-bottom:1px dashed var(--line)">${d}</td><td style="text-align:right;border-bottom:1px dashed var(--line)">${cv(z.s1[i])}</td><td style="text-align:right;border-bottom:1px dashed var(--line)">${cv(z.s2[i])}</td></tr>`).join("")}</table>
          <p class="muted" style="font-size:12.5px">Total sepekan sama; variasi harian membantu menghindari adaptasi & memudahkan konsistensi (mis. hari puasa sunnah memakai angka terendah).</p>`; };
        $("#zzSel").onchange = drawZZ; drawZZ();
        $("#exTbl").innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:14px"><tr><th style="text-align:left" class="label muted">Aktivitas</th><th class="label muted" style="text-align:right">MET</th><th class="label muted" style="text-align:right">${num(f.weight)} kg</th></tr>${H.EXERCISES.map(([n, m]) => `<tr><td style="padding:7px 4px;border-bottom:1px dashed var(--line)">${n}</td><td style="text-align:right;border-bottom:1px dashed var(--line)">${num(m, 1)}</td><td style="text-align:right;border-bottom:1px dashed var(--line)"><b>${cv(m * f.weight)}</b> ${unit}</td></tr>`).join("")}</table>`;
      }
      if (tab === "bmr") {
        const rows = [["Mifflin-St Jeor", H.bmr(Object.assign({}, f, { formula: "mifflin" })), "Paling banyak dipakai saat ini"], ["Revised Harris-Benedict", H.bmr(Object.assign({}, f, { formula: "harris" })), "Revisi Roza & Shizgal, 1984"]];
        if (+f.bodyfat > 0) rows.push(["Katch-McArdle", H.bmr(Object.assign({}, f, { formula: "katch" })), "Memakai massa bebas lemak"]);
        $("#cres").innerHTML = `<div class="grid" style="gap:12px">${rows.map(([a, b, c], i) => `<div class="metric" style="${i === 0 ? "outline:2px solid var(--acc)" : ""}"><span class="label muted-d">${a}</span><b>${num(b)} <small>kkal/hari</small></b><span class="muted-d" style="font-size:13px">${c} · ${num(b * 4.1868)} kJ</span></div>`).join("")}</div>`;
      }
      if (tab === "imt") {
        const v = H.bmi(f.height, f.weight), c = H.bmiCat(v), iw = H.idealWeight(f.height, f.gender);
        const pos = Math.max(0, Math.min(100, ((v - 15) / (35 - 15)) * 100));
        $("#cres").innerHTML = `<div class="card"><span class="label muted">IMT Anda</span><div style="font-family:var(--display);font-size:56px;line-height:1;color:${c.c}">${num(v, 1)}</div><b>${c.t}</b>
          <div style="position:relative;height:14px;border-radius:99px;margin:22px 0 6px;background:linear-gradient(90deg,#4a90d9 0%,#6fb3e8 17%,#17a361 22%,#17a361 50%,#e3b04b 52%,#e3b04b 60%,#d9534f 62%)"><span style="position:absolute;left:${pos}%;top:-6px;width:4px;height:26px;background:var(--ink);border-radius:2px"></span></div>
          <div class="row" style="justify-content:space-between;font-family:var(--mono);font-size:11px" class="muted"><span>15</span><span>18,5</span><span>25</span><span>27</span><span>35</span></div>
          <div class="grid g2 mt16" style="gap:10px"><div class="metric"><span class="label muted-d">Rentang berat sehat</span><b>${num(iw.min, 1)}–${num(iw.max, 1)} <small>kg</small></b><span class="muted-d" style="font-size:13px">IMT 18,5–25</span></div>
          <div class="metric"><span class="label muted-d">Berat ideal (Broca)</span><b>${num(iw.broca, 1)} <small>kg</small></b><span class="muted-d" style="font-size:13px">(TB − 100) − 10%</span></div></div>
          ${v > 25 ? `<p class="mt16" style="margin-bottom:0">Menurunkan ${num(+f.weight - iw.max, 1)} kg akan membawa IMT ke rentang normal. Dengan laju 0,5 kg/pekan, perkiraannya ±${Math.ceil((+f.weight - iw.max) / 0.5)} pekan.</p>` : ""}</div>`;
      }
      if (tab === "lemak") {
        const bf = H.bodyFatNavy(f);
        if (bf == null || !isFinite(bf) || bf < 2 || bf > 70) { $("#cres").innerHTML = `<div class="card"><p class="muted">Periksa kembali ukuran lingkar badan.</p></div>`; return; }
        const fm = (bf / 100) * f.weight, cat = H.fatCat(bf, f.gender);
        $("#cres").innerHTML = `<div class="card"><span class="label muted">Perkiraan lemak tubuh</span><div style="font-family:var(--display);font-size:56px;line-height:1;color:var(--acc-2)">${num(bf, 1)}%</div><b>${cat}</b>
          <div class="grid g2 mt16" style="gap:10px"><div class="metric"><span class="label muted-d">Massa lemak</span><b>${num(fm, 1)} <small>kg</small></b></div><div class="metric"><span class="label muted-d">Massa bebas lemak</span><b>${num(f.weight - fm, 1)} <small>kg</small></b></div></div>
          <table style="width:100%;font-size:13.5px;margin-top:14px;border-collapse:collapse">${(f.gender === "akhwat" ? [["Lemak esensial", "10–13%"], ["Atlet", "14–20%"], ["Bugar", "21–24%"], ["Rata-rata", "25–31%"], ["Obesitas", "32%+"]] : [["Lemak esensial", "2–5%"], ["Atlet", "6–13%"], ["Bugar", "14–17%"], ["Rata-rata", "18–24%"], ["Obesitas", "25%+"]]).map(([a, b]) => `<tr style="${a === cat ? "background:#e9f6ef;font-weight:700" : ""}"><td style="padding:6px">${a}</td><td style="padding:6px;text-align:right">${b}</td></tr>`).join("")}</table>
          <a class="btn sm mt16" href="#/kalkulator/kalori" id="useBf">Pakai di kalkulator kalori (Katch-McArdle)</a></div>`;
        $("#useBf").onclick = () => sessionStorage.setItem("qowiy_bf", bf.toFixed(1));
      }
    };
    $("#cf").oninput = calc;
    if (tab === "kalori") N.load().then((db) => { const el = $("#foodTbl"); if (!el) return; const cats = { karbo: "Makanan pokok", protein: "Protein", sayur: "Sayur", buah: "Buah", lemak: "Lemak" };
      el.innerHTML = `<table class="ftbl"><tr><th>Bahan</th><th>kkal</th><th>Protein</th><th>Karbo</th><th>Serat</th><th>Lemak</th><th>Sumber</th></tr>${Object.keys(cats).map((c) => `<tr class="cat"><td colspan="7">${cats[c]}</td></tr>` + db.foods.filter((f) => f.cat === c).map((f) => `<tr><td>${esc(f.name)}${f.note ? ` <small class="muted">(${esc(f.note)})</small>` : ""}</td><td>${f.kcal}</td><td>${num(f.p, 1)} g</td><td>${num(f.kh, 1)} g</td><td>${num(f.s, 1)} g</td><td>${num(f.l, 1)} g</td><td><small>${f.src === "tkpi" ? "TKPI" : "USDA"}</small></td></tr>`).join("")).join("")}</table>`; });
    const bf = sessionStorage.getItem("qowiy_bf");
    if (tab === "kalori" && bf) { $("#cf").bodyfat.value = bf; $("#cf").formula.value = "katch"; sessionStorage.removeItem("qowiy_bf"); }
    calc();
  }

  /* ------------------------------------------------------------------ */
  /* RENCANA MAKAN — makro %, menu otomatis, rekomendasi AI, susun sendiri */
  /* ------------------------------------------------------------------ */
  const N = window.Nutrition;
  const CAT_IC = { karbo: "bowl", protein: "dumbbell", sayur: "check", buah: "date", lemak: "star" };
  const PART_LABEL = { karbo: "Makanan pokok", protein: "Protein (1 macam)", sayur: "Sayur", buah: "Buah", lemak: "Lemak / pelengkap" };
  const num1 = (x) => Number(x).toLocaleString("id-ID", { maximumFractionDigits: 1 });

  function planInputs() {
    const q = Object.assign({}, quiz(), (state.me && state.me.quiz) || {});
    if (!q.done && !q.weight) return null;
    return { q, r: q.result || computeResult(q) };
  }
  const MKEY = "qowiy_macro";
  function loadPrefs(r, q) {
    let saved = null;
    try { saved = (state.me && state.me.nutrition) || JSON.parse(localStorage.getItem(MKEY) || "null"); } catch (e) {}
    const base = N.defaultMacro(q.goal === "kuat" ? "kuat" : r.track === "turun" ? "turun" : "seimbang");
    return Object.assign({ kcal: r.target, meals: +q.meals || 4 }, base, saved || {});
  }
  async function savePrefs(p) {
    localStorage.setItem(MKEY, JSON.stringify(p));
    if (state.me) { try { await Store.updateMe({ nutrition: p }); state.me.nutrition = p; } catch (e) { /* kolom belum ada → tetap tersimpan lokal */ } }
  }

  function mealCardsHTML(plan) {
    const t = plan.target, tot = plan.total;
    const bar = (lbl, got, want, unit, color) => { const pct = want ? Math.round((got / want) * 100) : 0;
      return `<div class="mbar"><div class="row"><b>${lbl}</b><span class="spacer"></span><span>${num1(got)} / ${num1(Math.round(want))} ${unit}</span><span class="pill ${pct >= 90 && pct <= 110 ? "acc" : "cream"}">${pct}%</span></div><div class="mtrack"><i style="width:${Math.min(100, pct)}%;background:${color}"></i></div></div>`; };
    return `<div class="meals">${plan.meals.map((m) => `
      <article class="meal">
        <header><span class="label">${esc(m.t)}</span><span class="pill acc">${num(m.total.kcal)} kkal</span></header>
        <h4>${esc(m.dish)}</h4>
        <ul>${m.items.map((it) => `<li><span class="mi">${icon(CAT_IC[it.part] || "bowl", 18)}</span><div><b>${esc(it.name)}</b><small>${it.grams} g ${it.qty ? "· " + esc(it.qty) : ""}</small></div><span class="mm">P ${num1(it.p)} · K ${num1(it.k)} · L ${num1(it.l)}</span></li>`).join("")}</ul>
        <footer>Protein ${num1(m.total.p)} g · Karbo ${num1(m.total.k)} g · Serat ${num1(m.total.s)} g · Lemak ${num1(m.total.l)} g</footer>
      </article>`).join("")}</div>
      <div class="card mt16 totals"><div class="row"><span class="label muted">Total sehari vs target</span></div>
        ${bar("Energi", tot.kcal, t.kcal, "kkal", "linear-gradient(90deg,#0f5a40,#d4a93c)")}${bar("Protein", tot.p, t.g.p, "g", "#0f5a40")}${bar("Karbohidrat", tot.k, t.g.k, "g", "#d4a93c")}${bar("Serat", tot.s, t.g.s, "g", "#7cc243")}${bar("Lemak", tot.l, t.g.l, "g", "#c8873c")}
        <p class="muted" style="font-size:12.5px;margin:10px 0 0">Gram dihitung otomatis dari database gizi per 100 g (USDA FoodData Central & TKPI Kemenkes). Selisih kecil wajar karena porsi dibulatkan per 5 g.</p></div>`;
  }

  async function viewMealPlan(param) {
    await N.load();
    const inp = planInputs();
    if (!inp) { app.innerHTML = `<section class="wrap quiz"><div class="card center"><h2>Isi tes kebugaran dulu</h2><p class="muted">Rencana makan disusun dari usia, berat, tinggi, aktivitas, dan tujuanmu.</p><a class="btn acc" href="#/kuis">Mulai tes 2 menit →</a></div></section>`; return; }
    const { q, r } = inp;
    if (r.medical) { app.innerHTML = `<section class="wrap quiz"><div class="card"><h2 class="mt0">Rencana makan perlu disusun bersama tenaga kesehatan</h2><p class="muted">Kamu menandai kondisi ${q.health === "hamil" ? "hamil/menyusui" : "penyakit kronis"}. Kebutuhan gizimu perlu dihitung dokter atau ahli gizi.</p><a class="btn" href="#/kalkulator">Buka kalkulator</a></div></section>`; return; }
    const mode = param || "hari1";
    const day = /^hari(\d)$/.test(mode) ? Math.min(7, Math.max(1, +mode.slice(4))) - 1 : 0;
    const fasting = mode === "puasa";
    const isAI = mode === "ai", isBuild = mode === "susun";
    const locked = !state.active && mode !== "hari1";
    const P = loadPrefs(r, q);
    const tabs = [...Array(7)].map((_, i) => [`hari${i + 1}`, `Hari ${i + 1}`]).concat([["puasa", "Hari puasa"], ["ai", "Rekomendasi AI"], ["susun", "Susun sendiri"]]);

    app.innerHTML = `<section class="wrap">
      <div class="result-hero" style="padding:28px 30px"><span class="label">Rencana makan · ${esc(q.name || (state.me && state.me.full_name) || "")}</span>
        <h1 style="font-size:clamp(26px,4.2vw,40px)">Atur makro, menu menyesuaikan.</h1>
        <p style="margin:0">Protein, karbohidrat, dan serat kamu atur dalam persen — <b>lemak otomatis mengisi sisanya</b>. Setiap hidangan memakai satu sumber protein dan porsinya dihitung dalam gram.</p></div>

      <div class="macro card mt24" id="macroBox">
        <div class="macro-grid">
          <div>
            <label class="field"><span>Target energi harian (kkal)</span><input id="mKcal" type="number" min="1000" max="5000" step="10" value="${Math.round(P.kcal)}"></label>
            <div class="field"><span>Makan berapa kali sehari?</span><div class="chips" id="mealCount">${N.MEAL_COUNTS.map((n) => `<button type="button" data-meals="${n}" class="${+P.meals === n ? "on" : ""}">${n}×</button>`).join("")}</div></div>
            <span class="field-lbl">Pola makro</span>
            <div class="chips">${N.PRESETS.map((p) => `<button type="button" data-preset="${p.id}" class="${P.preset === p.id ? "on" : ""}" title="${esc(p.desc)}">${esc(p.name)}</button>`).join("")}</div>
            ${[["p", "Protein", 5, 60], ["k", "Karbohidrat", 5, 75], ["s", "Serat", 0, 20]].map(([k, t, lo, hi]) => `<div class="slider"><div class="row"><b>${t}</b><span class="spacer"></span><input class="pct" type="number" data-k="${k}" min="${lo}" max="${hi}" value="${P[k]}"><span>%</span></div><input type="range" data-k="${k}" min="${lo}" max="${hi}" step="1" value="${P[k]}"></div>`).join("")}
            <div class="slider"><div class="row"><b>Lemak</b><span class="spacer"></span><b id="fatPct"></b><span class="muted" style="font-size:12.5px">(sisa otomatis)</span></div></div>
          </div>
          <div>
            <div class="stack" id="mStack"></div>
            <table class="mt" id="mTable"></table>
            <div id="mWarn"></div>
            <div class="row wrap-it mt16"><button class="btn sm acc" id="mSave" type="button">Simpan pengaturan</button><span class="muted" style="font-size:12.5px">Tersimpan di akunmu dan dipakai di semua menu.</span></div>
          </div>
        </div>
      </div>

      <div class="slot-tabs mt24">${tabs.map(([k, t]) => `<a href="#/rencana-makan/${k}"><button class="${mode === k ? "on" : ""}">${t}${!state.active && k !== "hari1" ? " 🔒" : ""}</button></a>`).join("")}</div>
      <div id="planArea"></div>
      <p class="muted-d" style="font-size:12.5px">Rujukan nilai gizi: USDA FoodData Central (SR Legacy) dan Tabel Komposisi Pangan Indonesia 2017 (Kemenkes RI). Rentang makro anjuran: Institute of Medicine (2005). Rencana ini edukasi umum, bukan diet terapi.</p>
    </section>`;

    const cur = () => ({ kcal: +$("#mKcal").value || P.kcal, p: +$('input.pct[data-k="p"]').value, k: +$('input.pct[data-k="k"]').value, s: +$('input.pct[data-k="s"]').value, preset: P.preset, meals: +P.meals || 4 });
    let buildChoices = null, aiResult = null;
    const drawMacro = () => {
      const m = cur(), t = N.targets(m.kcal, m);
      $("#fatPct").textContent = t.pct.l + "%";
      $("#mStack").innerHTML = [["p", "Protein", "#0f5a40"], ["k", "Karbo", "#d4a93c"], ["s", "Serat", "#7cc243"], ["l", "Lemak", "#c8873c"]].map(([k, n, c]) => `<i style="width:${t.pct[k]}%;background:${c}" title="${n} ${t.pct[k]}%"></i>`).join("");
      $("#mTable").innerHTML = `<tr><th></th><th>%</th><th>gram/hari</th><th>kkal</th></tr>` + [["p", "Protein", 4], ["k", "Karbohidrat", 4], ["s", "Serat", 2], ["l", "Lemak", 9]].map(([k, n, f]) => `<tr><td>${n}</td><td>${t.pct[k]}%</td><td><b>${Math.round(t.g[k])} g</b></td><td>${Math.round(t.g[k] * f)}</td></tr>`).join("");
      $("#mWarn").innerHTML = N.warnings(t).map(([lv, msg]) => `<div class="mwarn ${lv}">${esc(msg)}</div>`).join("");
      drawPlan();
    };
    const sync = (k, v) => { $$(`[data-k="${k}"]`).forEach((x) => (x.value = v)); P.preset = "custom"; $$("[data-preset]").forEach((b) => b.classList.remove("on")); drawMacro(); };
    $$("#macroBox input[type=range], #macroBox input.pct").forEach((inp2) => (inp2.oninput = () => sync(inp2.dataset.k, inp2.value)));
    $("#mKcal").oninput = drawMacro;
    $$("[data-meals]").forEach((b) => (b.onclick = () => { P.meals = +b.dataset.meals; $$("[data-meals]").forEach((x) => x.classList.toggle("on", x === b)); buildChoices = null; aiResult = null; drawMacro(); }));
    $$("[data-preset]").forEach((b) => (b.onclick = () => { const p = N.PRESETS.find((x) => x.id === b.dataset.preset); ["p", "k", "s"].forEach((k) => $$(`[data-k="${k}"]`).forEach((x) => (x.value = p[k]))); P.preset = p.id; $$("[data-preset]").forEach((x) => x.classList.toggle("on", x === b)); drawMacro(); }));
    $("#mSave").onclick = async () => { const m = cur(); Object.assign(P, m); await savePrefs(m); toast("Pengaturan makro tersimpan"); };

    function drawPlan() {
      const area = $("#planArea"), m = cur();
      if (locked) { area.innerHTML = `<div class="lockwall"><h2 class="display" style="font-size:24px">Menu 7 hari, menu puasa, rekomendasi AI, dan susun menu sendiri khusus member</h2><p class="muted-d">Hari 1 bisa kamu coba gratis — makro di atas tetap bisa kamu atur.</p><a class="btn acc" href="#/langganan">Lihat paket →</a></div>`; return; }
      if (isAI) {
        if (!aiResult) { area.innerHTML = `<div class="card ai-box"><span class="kicker dark">Rekomendasi AI</span><h3 style="margin:4px 0 8px">Biarkan AI memilih kombinasi menu untuk makro di atas</h3>
          <p class="muted" style="margin-top:0">AI memilih bahan dan memberi nama hidangan; porsi gram tetap dihitung dari database gizi agar angkanya akurat.</p>
          <label class="field"><span>Catatan (opsional)</span><input id="aiNote" maxlength="200" placeholder="mis. tidak suka udang, ingin menu murah, sedang di kos tanpa kompor besar"></label>
          <div class="field"><span>Hindari bahan</span><div class="chips">${N.byCat("protein").concat(N.byCat("karbo")).map((f) => `<label class="chip-check"><input type="checkbox" value="${f.id}"><span>${esc(f.name.split(" (")[0])}</span></label>`).join("")}</div></div>
          <label class="check"><input type="checkbox" id="aiFast"> Menu hari puasa (sahur–berbuka)</label>
          <div class="err" id="aiErr"></div>
          <button class="btn acc mt16" id="aiGo" type="button">Buat rekomendasi AI</button></div>`;
          $("#aiGo").onclick = async () => {
            const btn = $("#aiGo"); btn.disabled = true; btn.textContent = "AI sedang menyusun menu…"; $("#aiErr").textContent = "";
            const t = N.targets(m.kcal, m); const fast = $("#aiFast").checked;
            try {
              const sl = N.slots(fast, m.meals), auto = N.autoChoices(0, fast, m.meals);
              const res = await Store.aiMenu({ target: { kcal: t.kcal, p: t.g.p, k: t.g.k, s: t.g.s, l: t.g.l }, fasting: fast, meals: m.meals, slots: sl.map((x) => ({ id: x.id, t: x.t, parts: x.parts, fixed: x.fixed || null })), note: $("#aiNote").value, avoid: $$(".ai-box .chip-check input:checked").map((x) => x.value) });
              const choices = sl.map((s, i) => { const a = res.meals.find((x) => x.slot === s.id) || res.meals[i] || {}; const c = Object.assign({}, auto[i]); s.parts.forEach((part) => { if (a[part]) c[part] = a[part]; }); if (a.dish) c.dish = a.dish; return c; });
              aiResult = { res, fast, choices, meals: m.meals }; drawPlan();
            } catch (e) {
              $("#aiErr").textContent = e.code === "ai_disabled" ? "Fitur AI belum diaktifkan oleh admin. Sementara itu, gunakan menu otomatis Hari 1–7 atau Susun sendiri." : e.message;
              btn.disabled = false; btn.textContent = "Buat rekomendasi AI";
            }
          };
          return;
        }
        const plan = N.plan({ kcal: m.kcal, macro: m, fasting: aiResult.fast, choices: aiResult.choices, meals: aiResult.meals });
        area.innerHTML = `<div class="card ai-head"><div><span class="kicker dark">Rekomendasi AI</span><h3 style="margin:2px 0">${esc(aiResult.res.judul)}</h3>${aiResult.res.tips ? `<p class="muted" style="margin:0">${esc(aiResult.res.tips)}</p>` : ""}</div><div class="row wrap-it"><button class="btn sm ghost" id="aiAgain" type="button">Buat ulang</button><button class="btn sm acc" id="aiSave" type="button">Simpan menu</button></div></div>` + mealCardsHTML(plan);
        $("#aiAgain").onclick = () => { aiResult = null; drawPlan(); };
        $("#aiSave").onclick = () => savePlanDialog(aiResult.res.judul, { kcal: m.kcal, macro: m, fasting: aiResult.fast, meals: aiResult.meals, choices: aiResult.choices, source: "ai" });
        return;
      }
      if (isBuild) { drawBuilder(area, m); return; }
      area.innerHTML = mealCardsHTML(N.autoPlan({ kcal: m.kcal, macro: m, day, fasting, meals: m.meals }));
    }

    async function drawBuilder(area, m) {
      if (!buildChoices) buildChoices = { fasting: false, choices: N.autoChoices(0, false, m.meals) };
      const fast = !!buildChoices.fasting;
      const sl = N.slots(fast, m.meals);
      const opt = (cat, sel) => N.byCat(cat).map((f) => `<option value="${f.id}" ${f.id === sel ? "selected" : ""}>${esc(f.name)}</option>`).join("");
      const plan = N.plan({ kcal: m.kcal, macro: m, fasting: fast, meals: m.meals, choices: buildChoices.choices });
      const saved = state.me ? await Store.listPlans().catch(() => []) : [];
      area.innerHTML = `<div class="card builder"><div class="row wrap-it"><div><span class="kicker dark">Susun sendiri</span><h3 style="margin:2px 0">Pilih bahan, porsi dihitung otomatis</h3></div><span class="spacer"></span><label class="check"><input type="checkbox" id="bFast" ${fast ? "checked" : ""}> Hari puasa</label></div>
        <div class="bgrid">${sl.map((s, i) => `<div class="bslot"><b>${esc(s.t)}</b>${s.parts.filter((p) => !(s.fixed && s.fixed[p])).map((part) => `<label class="field"><span>${PART_LABEL[part]}</span><select data-slot="${i}" data-part="${part}">${part === "lemak" ? `<option value="">— tanpa —</option>` : ""}${opt(part, buildChoices.choices[i] && buildChoices.choices[i][part])}</select></label>`).join("")}${s.fixed ? `<p class="muted" style="font-size:13px;margin:0">Berbuka dengan kurma (sunnah).</p>` : ""}</div>`).join("")}</div>
        <div class="row wrap-it mt16"><button class="btn sm acc" id="bSave" type="button">Simpan menu ini</button><button class="btn sm ghost" id="bAuto" type="button">Isi otomatis</button></div></div>
        ${mealCardsHTML(plan)}
        <div class="card mt16"><span class="label muted">Menu tersimpan</span>${saved.length ? `<div class="saved">${saved.map((x) => `<div class="row"><div style="flex:1"><b>${esc(x.name)}</b><div class="muted" style="font-size:12.5px">${fmtDate(x.created_at)} · ${(x.plan && x.plan.meals) || 4}× makan · ${x.plan && x.plan.source === "ai" ? "dari AI" : "susun sendiri"}</div></div><button class="btn sm light" data-load="${x.id}" type="button">Buka</button><button class="btn sm danger" data-del="${x.id}" type="button">Hapus</button></div>`).join("")}</div>` : `<p class="muted">Belum ada menu tersimpan.</p>`}</div>`;
      $$("[data-slot]", area).forEach((sel) => (sel.onchange = () => { const i = +sel.dataset.slot; buildChoices.choices[i] = Object.assign({}, buildChoices.choices[i], { [sel.dataset.part]: sel.value, dish: undefined }); drawPlan(); }));
      $("#bFast").onchange = () => { const f = $("#bFast").checked; buildChoices = { fasting: f, choices: N.autoChoices(0, f, m.meals) }; drawPlan(); };
      $("#bAuto").onclick = () => { buildChoices = { fasting: fast, choices: N.autoChoices(Math.floor(Math.random() * 7), fast, m.meals) }; drawPlan(); };
      $("#bSave").onclick = () => savePlanDialog("Menu saya", { kcal: m.kcal, macro: m, fasting: fast, meals: m.meals, choices: buildChoices.choices, source: "user" });
      $$("[data-load]", area).forEach((b) => (b.onclick = () => { const x = saved.find((s) => s.id === b.dataset.load); buildChoices = { fasting: !!x.plan.fasting, choices: x.plan.choices }; P.meals = x.plan.meals || 4; $$("[data-meals]").forEach((e) => e.classList.toggle("on", +e.dataset.meals === +P.meals)); ["p", "k", "s"].forEach((k) => $$(`[data-k="${k}"]`).forEach((e) => (e.value = x.plan.macro[k]))); $("#mKcal").value = x.plan.kcal; drawMacro(); toast("Menu dimuat: " + x.name); }));
      $$("[data-del]", area).forEach((b) => (b.onclick = async () => { await Store.deletePlan(b.dataset.del); toast("Menu dihapus"); drawPlan(); }));
    }

    function savePlanDialog(name, plan) {
      if (!state.me) { toast("Masuk dulu untuk menyimpan menu"); return; }
      UI.modal(`<form id="spf"><h3 style="margin-top:0">Simpan menu</h3><label class="field"><span>Nama menu</span><input name="n" maxlength="80" value="${esc(name)}" required></label><div class="row"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc">Simpan</button></div></form>`,
        (mEl, close) => ($("#spf", mEl).onsubmit = async (e) => { e.preventDefault(); try { await Store.savePlan(e.target.n.value.trim(), plan); close(); toast("Menu tersimpan"); if (isBuild) drawPlan(); } catch (x) { toast(x.message); } }));
    }
    drawMacro();
  }

  /* ------------------------------------------------------------------ */
  /* PERANGKAT — jam pintar & timbangan Bluetooth                         */
  /* ------------------------------------------------------------------ */
  function lineChart(points, unit) {
    if (points.length < 2) return `<p class="muted" style="margin:0">Butuh minimal 2 data untuk grafik.</p>`;
    const W = 640, Hh = 180, pad = 28, xs = points.map((p) => new Date(p.measured_at).getTime()), ys = points.map((p) => +p.value);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
    const X = (x) => pad + ((x - x0) / Math.max(1, x1 - x0)) * (W - pad * 2), Y = (y) => Hh - pad - ((y - y0) / Math.max(0.1, y1 - y0)) * (Hh - pad * 2);
    const d = points.map((p, i) => (i ? "L" : "M") + X(xs[i]).toFixed(1) + " " + Y(ys[i]).toFixed(1)).join(" ");
    return `<svg viewBox="0 0 ${W} ${Hh}" class="chart" role="img" aria-label="Grafik ${unit}"><path d="${d}" fill="none" stroke="#0f5a40" stroke-width="2.5"/>${points.map((p, i) => `<circle cx="${X(xs[i]).toFixed(1)}" cy="${Y(ys[i]).toFixed(1)}" r="3.5" fill="#d4a93c"><title>${fmtDate(p.measured_at)}: ${num1(p.value)} ${unit}</title></circle>`).join("")}
      <text x="${pad}" y="14" font-size="11" fill="#6b6f63">${num1(y1 - 1)} ${unit}</text><text x="${pad}" y="${Hh - 8}" font-size="11" fill="#6b6f63">${num1(y0 + 1)} ${unit}</text></svg>`;
  }

  async function viewDevices() {
    if (!state.me) { location.hash = "#/masuk"; return; }
    const D = window.Devices, ok = D.supported();
    const age = ((state.me.quiz || quiz()) || {}).age || 30;
    app.innerHTML = `<section class="wrap">
      <div class="section-head mt40"><h2>Perangkat & data tubuh</h2><span class="label muted-d">Jam pintar · timbangan · langkah</span></div>
      ${ok ? "" : `<div class="notice" style="margin-bottom:18px"><b>Browser ini belum mendukung Bluetooth.</b> Gunakan <b>Chrome</b> di Android, Windows, atau Mac. Di iPhone/iPad, Safari belum mendukung Web Bluetooth — buka situs ini lewat aplikasi browser <b>Bluefy</b>. Kamu tetap bisa mencatat data secara manual di bawah.</div>`}
      <div class="grid g2" style="align-items:start">
        <div class="card dev">
          <div class="row"><span class="dev-ic">${icon("walk", 22)}</span><div><b>Jam pintar / sensor detak jantung</b><div class="muted" style="font-size:13px">Detak jantung langsung saat latihan</div></div></div>
          <div class="hr-live" id="hrLive"><b id="hrVal">--</b><span>bpm</span><div id="hrZone" class="muted">Belum terhubung</div></div>
          <div class="row wrap-it"><button class="btn sm acc" id="hrBtn" ${ok ? "" : "disabled"} type="button">Hubungkan jam</button><button class="btn sm ghost hidden" id="hrStop" type="button">Selesai & simpan sesi</button></div>
          <div id="hrStats" class="muted mt8" style="font-size:13.5px"></div>
          <details class="mt16"><summary class="label">Perangkat yang bisa terhubung</summary><ul class="compat">
            <li><b>Bisa langsung</b>: sabuk dada & jam yang menyiarkan detak jantung standar Bluetooth — mis. Polar, Garmin (mode "Broadcast HR"), Amazfit, Fitbit/Pixel Watch (fitur "Heart Rate Sharing").</li>
            <li><b>Xiaomi</b>: Mi Band/Smart Band generasi lama dengan opsi "Siaran detak jantung" (aktifkan di aplikasi Mi Fitness/Zepp Life). Banyak jam Xiaomi/Redmi generasi baru <u>tidak</u> membuka data detak jantung ke aplikasi lain.</li>
            <li><b>Apple Watch</b>: tidak menyiarkan detak jantung sendiri. Pasang aplikasi penyiar dari App Store (mis. HeartCast, HR Broadcast), mulai latihan di jam, lalu hubungkan dari sini.</li>
            <li><b>Merek lain (mis. Timeever)</b>: bisa terhubung bila jam mendukung profil detak jantung Bluetooth standar. Jika tidak muncul di daftar, catat manual.</li></ul></details>
        </div>
        <div class="card dev">
          <div class="row"><span class="dev-ic">${icon("check", 22)}</span><div><b>Timbangan Bluetooth</b><div class="muted" style="font-size:13px">Berat badan & lemak tubuh</div></div></div>
          <div class="hr-live"><b id="wVal">--</b><span>kg</span><div id="wStat" class="muted">Belum terhubung</div></div>
          <div class="row wrap-it"><button class="btn sm acc" id="wBtn" ${ok ? "" : "disabled"} type="button">Hubungkan timbangan</button><button class="btn sm ghost hidden" id="wSave" type="button">Simpan berat</button></div>
          <form id="wManual" class="row wrap-it mt16" onsubmit="return false"><input class="input" name="w" type="number" step="0.1" min="25" max="300" placeholder="Berat (kg)" style="max-width:140px"><input class="input" name="f" type="number" step="0.1" min="2" max="70" placeholder="Lemak % (opsional)" style="max-width:170px"><button class="btn sm light">Catat manual</button></form>
          <details class="mt16"><summary class="label">Timbangan yang bisa terhubung</summary><ul class="compat">
            <li><b>Bisa langsung</b>: timbangan dengan profil Bluetooth standar <i>Weight Scale</i> / <i>Body Composition</i>.</li>
            <li><b>Xiaomi Mi Scale / Mi Body Composition Scale 2</b>: mengirim data lewat siaran Bluetooth — eksperimental, butuh Chrome dengan fitur eksperimental aktif.</li>
            <li>Timbangan dengan aplikasi khusus (mis. Fitdays, OKOK) umumnya memakai protokol tertutup — catat beratnya manual.</li></ul></details>
        </div>
      </div>

      <div class="grid g2 section" style="align-items:start">
        <div class="card"><div class="row"><span class="label muted">Tren berat badan (90 hari)</span><span class="spacer"></span><span id="wDelta" class="pill cream"></span></div><div id="wChart" class="mt16"></div><div id="wUpd"></div></div>
        <div class="card"><span class="label muted">Langkah harian</span>
          <form id="sForm" class="row wrap-it mt16" onsubmit="return false"><input class="input" name="s" type="number" min="0" max="100000" placeholder="Langkah hari ini" style="max-width:180px"><button class="btn sm light">Catat</button></form>
          <p class="muted" style="font-size:12.5px">Data langkah dari aplikasi jam (Mi Fitness, Zepp, Apple Health, dll.) belum bisa ditarik langsung oleh situs web — salin angkanya ke sini.</p>
          <div id="sList"></div>
          <span class="label muted mt16" style="display:block">Sesi detak jantung terakhir</span><div id="hList"></div></div>
      </div></section>`;

    const drawLogs = async () => {
      const [w, s, h] = await Promise.all([Store.logs("weight", 90), Store.logs("steps", 14), Store.logs("heart_rate", 60)]);
      $("#wChart").innerHTML = w.length ? lineChart(w, "kg") : `<p class="muted" style="margin:0">Belum ada data berat badan.</p>`;
      if (w.length >= 2) { const dlt = w[w.length - 1].value - w[0].value; $("#wDelta").textContent = (dlt > 0 ? "+" : "") + num1(dlt) + " kg"; }
      $("#sList").innerHTML = s.slice(-7).reverse().map((x) => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)"><span>${fmtDate(x.measured_at)}</span><span class="spacer"></span><b>${Number(x.value).toLocaleString("id-ID")}</b> langkah</div>`).join("") || "";
      $("#hList").innerHTML = h.slice(-5).reverse().map((x) => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)"><span>${fmtDate(x.measured_at)}</span><span class="spacer"></span>rata-rata <b>${Math.round(x.value)}</b> bpm${x.meta && x.meta.max ? ` · maks ${x.meta.max}` : ""}${x.meta && x.meta.minutes ? ` · ${x.meta.minutes} mnt` : ""}</div>`).join("") || `<p class="muted" style="margin:6px 0 0">Belum ada sesi.</p>`;
    };
    const afterWeight = async (kg) => {
      $("#wUpd").innerHTML = `<div class="notice mt16">Berat terbaru <b>${num1(kg)} kg</b>. <button class="btn sm" id="recalc" type="button">Hitung ulang target kalori</button></div>`;
      $("#recalc").onclick = async () => { const qq = Object.assign({}, quiz(), state.me.quiz || {}, { weight: kg }); qq.result = computeResult(qq); saveQuiz(qq); try { await Store.updateMe({ quiz: qq }); state.me.quiz = qq; } catch (e) {} localStorage.removeItem(MKEY); toast("Target diperbarui: " + qq.result.target.toLocaleString("id-ID") + " kkal"); };
    };
    // detak jantung
    let hrConn = null, samples = [], started = 0;
    $("#hrBtn").onclick = async () => {
      try {
        $("#hrZone").textContent = "Memilih perangkat…";
        hrConn = await D.connectHeartRate((d) => {
          if (!d.hr) return; samples.push(d.hr); $("#hrVal").textContent = d.hr;
          const z = D.zone(d.hr, age); $("#hrZone").innerHTML = `<span style="color:${z.c};font-weight:700">Zona ${z.n}: ${z.t}</span>`;
          const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
          $("#hrStats").textContent = `Rata-rata ${Math.round(avg)} · maks ${Math.max(...samples)} · min ${Math.min(...samples)} bpm · ${Math.round((Date.now() - started) / 60000)} menit`;
        }, () => { $("#hrZone").textContent = "Terputus"; });
        samples = []; started = Date.now();
        $("#hrZone").textContent = "Terhubung: " + hrConn.name + (hrConn.battery != null ? " · baterai " + hrConn.battery + "%" : "");
        $("#hrBtn").classList.add("hidden"); $("#hrStop").classList.remove("hidden");
      } catch (e) { $("#hrZone").textContent = e.name === "NotFoundError" ? "Tidak ada perangkat dipilih." : e.message; }
    };
    $("#hrStop").onclick = async () => {
      if (hrConn) hrConn.disconnect();
      if (samples.length) { const avg = samples.reduce((a, b) => a + b, 0) / samples.length; await Store.addLog("heart_rate", Math.round(avg), { max: Math.max(...samples), min: Math.min(...samples), minutes: Math.round((Date.now() - started) / 60000) }, hrConn ? hrConn.name : "bluetooth"); toast("Sesi tersimpan"); drawLogs(); }
      $("#hrStop").classList.add("hidden"); $("#hrBtn").classList.remove("hidden");
    };
    // timbangan
    let last = null, scale = null;
    $("#wBtn").onclick = async () => {
      try {
        scale = await D.connectScale((d) => {
          if (!d.weight || d.removed) return; last = d; $("#wVal").textContent = num1(d.weight);
          $("#wStat").textContent = d.stable ? "Stabil" + (d.fat ? " · lemak " + d.fat + "%" : "") : "Mengukur…";
          if (d.stable) $("#wSave").classList.remove("hidden");
        }, (msg) => ($("#wStat").textContent = msg));
      } catch (e) { $("#wStat").textContent = e.name === "NotFoundError" ? "Tidak ada timbangan dipilih." : e.message; }
    };
    $("#wSave").onclick = async () => {
      if (!last) return;
      await Store.addLog("weight", last.weight, last.fat ? { fat: last.fat } : null, scale ? scale.name : "bluetooth");
      if (last.fat) await Store.addLog("body_fat", last.fat, null, scale ? scale.name : "bluetooth");
      toast("Berat tersimpan"); drawLogs(); afterWeight(last.weight); if (scale) scale.disconnect(); $("#wSave").classList.add("hidden");
    };
    $("#wManual").onsubmit = async (e) => {
      const f = e.target, kg = +f.w.value; if (!(kg > 25)) return toast("Isi berat badan");
      await Store.addLog("weight", kg, f.f.value ? { fat: +f.f.value } : null, "manual");
      if (f.f.value) await Store.addLog("body_fat", +f.f.value, null, "manual");
      f.reset(); toast("Berat tersimpan"); drawLogs(); afterWeight(kg);
    };
    $("#sForm").onsubmit = async (e) => { const v = +e.target.s.value; if (!(v >= 0)) return; await Store.addLog("steps", v, null, "manual"); e.target.reset(); toast("Langkah tersimpan"); drawLogs(); };
    drawLogs().catch((e) => { $("#wChart").innerHTML = `<p class="muted">Gagal memuat data: ${esc(e.message)}</p>`; });
    window.addEventListener("hashchange", () => { try { hrConn && hrConn.disconnect(); scale && scale.disconnect(); } catch (e) {} }, { once: true });
  }

  async function viewAccount() {
    if (!state.me) { location.hash = "#/masuk"; return; }
    const m = state.me;
    app.innerHTML = `<section class="wrap" style="max-width:900px"><div class="section-head mt40"><h2>Akun saya</h2></div>
      <div class="grid g2" style="align-items:start">
        <form class="card" id="pf"><label class="field"><span>Nama</span><input name="full_name" value="${esc(m.full_name || "")}"></label>
          <label class="field"><span>WhatsApp</span><input name="whatsapp" value="${esc(m.whatsapp || "")}"></label>
          <label class="field"><span>Ikhwan / Akhwat</span><select name="gender"><option value="ikhwan" ${m.gender === "ikhwan" ? "selected" : ""}>Ikhwan</option><option value="akhwat" ${m.gender === "akhwat" ? "selected" : ""}>Akhwat</option></select></label>
          <button class="btn acc block">Simpan profil</button>
          ${Store.updatePassword ? `<hr style="border:0;border-top:1px dashed var(--line);margin:20px 0"><label class="field"><span>Password baru</span><input id="npw" type="password" minlength="6"></label><button type="button" class="btn block ghost" id="pwBtn">Ganti password</button>` : ""}
        </form>
        <div class="card"><span class="label muted">Riwayat langganan</span>
          ${state.subs.length ? state.subs.map((s) => `<div class="src"><b>${esc(s.plan_name)}</b> · ${rp(s.amount)}<br><span class="pill ${s.status === "active" ? "acc" : s.status === "pending" ? "gold" : "cream"}">${s.status}</span> <span class="muted" style="font-size:13px">${fmtDate(s.created_at)}${s.expires_at ? " · s.d. " + fmtDate(s.expires_at) : ""}</span></div>`).join("") : '<p class="muted">Belum ada langganan.</p>'}
          <div class="row wrap-it mt16"><a class="btn sm" href="#/langganan">Lihat paket</a><a class="btn sm light" href="#/perangkat">Perangkat & data tubuh</a><a class="btn sm light" href="#/rencana-makan/susun">Menu tersimpan</a></div>
          <hr style="border:0;border-top:1px dashed var(--line);margin:20px 0">
          <button class="btn danger block" id="logout">Keluar</button></div>
      </div></section>`;
    $("#pf").onsubmit = async (e) => { e.preventDefault(); try { await Store.updateMe(Object.fromEntries(new FormData(e.target))); await refreshUser(); toast("Profil tersimpan"); } catch (x) { toast(x.message); } };
    if ($("#pwBtn")) $("#pwBtn").onclick = async () => { try { await Store.updatePassword($("#npw").value); toast("Password diganti"); } catch (x) { toast(x.message); } };
    $("#logout").onclick = async () => { await Store.signOut(); await refreshUser(); location.hash = "#/"; };
  }

  /* ------------------------------------------------------------------ */
  /* ROUTER                                                              */
  /* ------------------------------------------------------------------ */
  let renderId = 0;
  async function render() {
    const my = ++renderId;
    const [, r, p] = (location.hash || "#/").split("/");
    $("#nav").classList.remove("open"); window.onresize = null; window.scrollTo(0, 0);
    app.innerHTML = '<div class="loading">Memuat…</div>';
    document.title = (S.brand || "QOWIY") + " — Aplikasi Kebugaran Muslim";
    renderNav();
    try {
      const routes = {
        "": viewLanding, kuis: () => viewQuiz(p), hasil: viewResult, langganan: viewPricing,
        daftar: () => (state.me ? (location.hash = p ? "#/bayar/" + p : "#/dashboard") : viewAuth("daftar", p)),
        masuk: () => (state.me ? (location.hash = p ? "#/bayar/" + p : "#/dashboard") : viewAuth("masuk", p)),
        lupa: viewForgot, bayar: () => viewPay(p), dashboard: viewDashboard, modul: () => viewModule(p), lesson: () => viewLesson(p),
        video: () => viewVideo(p), rutinitas: () => viewVideoList("routine"), motivasi: () => viewVideoList("motivation"),
        artikel: () => (p ? viewArticle(decodeURIComponent(p)) : viewArticles()), kalkulator: () => viewCalc(p), "rencana-makan": () => viewMealPlan(p), perangkat: viewDevices, akun: viewAccount
      };
      await (routes[r] || viewLanding)();
    } catch (e) {
      console.error(e);
      if (my === renderId) app.innerHTML = `<section class="wrap"><div class="lockwall mt40"><h2>Terjadi kesalahan</h2><p class="muted-d">${esc(e.message)}</p><a class="btn" href="#/">Ke beranda</a></div></section>`;
    }
  }

  window.addEventListener("hashchange", render);
  Store.onAuth(async (ev) => { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") { await refreshUser(); } if (ev === "PASSWORD_RECOVERY") location.hash = "#/akun"; });
  await refreshUser();
  render();
})();
