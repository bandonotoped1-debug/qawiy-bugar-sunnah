/* =====================================================================
   Health — kalkulator kesehatan & generator rencana makan
   - Kalori/BMR: Mifflin-St Jeor, Revised Harris-Benedict, Katch-McArdle
   - IMT: klasifikasi Kemenkes RI; berat ideal (rentang IMT 18,5–25 & Broca)
   - Lemak tubuh: metode U.S. Navy; kategori ACE
   - Rencana makan: Daftar Bahan Makanan Penukar (DBMP) Kemenkes
   ===================================================================== */
window.Health = (function () {
  const ACT = [
    { v: 1, t: "BMR saja", d: "Energi saat istirahat total, tanpa aktivitas" },
    { v: 1.2, t: "Jarang bergerak", d: "Sedikit atau tanpa olahraga" },
    { v: 1.375, t: "Ringan", d: "Olahraga 1–3 kali/pekan" },
    { v: 1.465, t: "Sedang", d: "Olahraga 4–5 kali/pekan" },
    { v: 1.55, t: "Aktif", d: "Olahraga harian, atau olahraga intens 3–4 kali/pekan" },
    { v: 1.725, t: "Sangat aktif", d: "Olahraga intens 6–7 kali/pekan" },
    { v: 1.9, t: "Ekstra aktif", d: "Olahraga sangat intens setiap hari, atau pekerjaan fisik berat" }
  ];
  const KCAL_PER_KG = 7700; // ±7.700 kkal ≈ 1 kg jaringan lemak tubuh

  function bmr({ gender, age, height, weight, formula, bodyfat }) {
    const male = gender !== "akhwat", W = +weight, H = +height, A = +age;
    if (formula === "katch" && bodyfat > 0) return 370 + 21.6 * (1 - bodyfat / 100) * W;
    if (formula === "harris") return male ? 13.397 * W + 4.799 * H - 5.677 * A + 88.362 : 9.247 * W + 3.098 * H - 4.33 * A + 447.593;
    return 10 * W + 6.25 * H - 5 * A + (male ? 5 : -161);
  }
  function bmi(height, weight) { return +weight / Math.pow(+height / 100, 2); }
  function bmiCat(v) {
    if (v < 17) return { t: "Kurus (berat)", c: "#4a90d9" };
    if (v < 18.5) return { t: "Kurus (ringan)", c: "#6fb3e8" };
    if (v <= 25) return { t: "Normal", c: "#17a361" };
    if (v <= 27) return { t: "Gemuk (ringan)", c: "#e3b04b" };
    return { t: "Obesitas", c: "#d9534f" };
  }
  function idealWeight(height, gender) {
    const h = +height, m = h / 100;
    const broca = (h - 100) - ((gender === "akhwat" && h < 150) || (gender !== "akhwat" && h < 160) ? 0 : (h - 100) * 0.1);
    return { min: 18.5 * m * m, max: 25 * m * m, broca };
  }
  function bodyFatNavy({ gender, height, neck, waist, hip }) {
    const H = +height, N = +neck, Wa = +waist, Hi = +hip;
    if (gender === "akhwat") { if (!(Wa + Hi - N > 0)) return null; return 495 / (1.29579 - 0.35004 * Math.log10(Wa + Hi - N) + 0.221 * Math.log10(H)) - 450; }
    if (!(Wa - N > 0)) return null;
    return 495 / (1.0324 - 0.19077 * Math.log10(Wa - N) + 0.15456 * Math.log10(H)) - 450;
  }
  function fatCat(bf, gender) {
    const t = gender === "akhwat" ? [13, 20, 24, 31] : [5, 13, 17, 24];
    if (bf <= t[0]) return "Lemak esensial"; if (bf <= t[1]) return "Atlet"; if (bf <= t[2]) return "Bugar"; if (bf <= t[3]) return "Rata-rata"; return "Obesitas";
  }
  // Defisit 500–600 kkal/hari ≈ 0,5 kg/pekan adalah anjuran utama (NHS/NICE
  // CG189); defisit >1.000 kkal/hari tidak dianjurkan (Harvard/Cleveland
  // Clinic) — maka opsi "ekstrem" dibatasi ±0,9 kg/pekan (±990 kkal), bukan
  // 1 kg penuh, dan tidak pernah dijanjikan sebagai laju normal.
  function goals(tdee) {
    const d = (kg) => Math.round((kg * KCAL_PER_KG) / 7);
    return [
      { k: "jaga", t: "Pertahankan berat", kg: 0, kcal: tdee },
      { k: "turun1", t: "Turun ringan", kg: -0.25, kcal: tdee - d(0.25) },
      { k: "turun2", t: "Turun berat badan (dianjurkan)", kg: -0.5, kcal: tdee - d(0.5) },
      { k: "turun3", t: "Turun ekstrem (batas maksimal)", kg: -0.9, kcal: tdee - d(0.9) },
      { k: "naik1", t: "Naik ringan", kg: 0.25, kcal: tdee + d(0.25) },
      { k: "naik2", t: "Naik berat badan", kg: 0.5, kcal: tdee + d(0.5) },
      { k: "naik3", t: "Naik cepat", kg: 1, kcal: tdee + d(1) }
    ];
  }
  function zigzag(daily) {
    const week = daily * 7;
    const s1hi = Math.round(daily * 1.17), s1lo = Math.round((week - 2 * s1hi) / 5);
    const s1 = [s1hi, s1lo, s1lo, s1lo, s1lo, s1lo, s1hi];
    const f2 = [1.1, 0.9, 1.0, 0.85, 1.05, 0.95, 1.15]; const sum2 = f2.reduce((a, b) => a + b, 0);
    const s2 = f2.map((f) => Math.round((f / sum2) * week));
    return { s1, s2 };
  }
  // MET dari Compendium of Physical Activities (Ainsworth dkk., 2011)
  const EXERCISES = [
    ["Jalan kaki santai (±5 km/jam)", 3.5], ["Jalan cepat (±6,4 km/jam)", 5.0], ["Jogging (±8 km/jam)", 8.0], ["Bersepeda santai (16–19 km/jam)", 6.8],
    ["Berenang santai", 6.0], ["Latihan beban (umum)", 3.5], ["Senam aerobik low impact", 5.0], ["Lompat tali (sedang)", 11.8],
    ["Bulu tangkis (rekreasi)", 5.5], ["Sepak bola / futsal (santai)", 7.0], ["Memanah", 4.3], ["Berkuda (umum)", 5.5]
  ];

  /* -------------------- Rencana makan (DBMP Kemenkes) -------------------- */
  const EX = {
    kh: { kcal: 175, p: 4, l: 0, k: 40, label: "Makanan pokok" },
    hr: { kcal: 50, p: 7, l: 2, k: 0, label: "Lauk hewani" },
    hs: { kcal: 75, p: 7, l: 5, k: 0, label: "Lauk hewani" },
    nb: { kcal: 75, p: 5, l: 3, k: 7, label: "Lauk nabati" },
    sy: { kcal: 25, p: 1, l: 0, k: 5, label: "Sayur" },
    bh: { kcal: 50, p: 0, l: 0, k: 12, label: "Buah" },
    mk: { kcal: 45, p: 0, l: 5, k: 0, label: "Minyak" }
  };
  const FOODS = {
    kh: [["Nasi putih", "¾ gelas", 100], ["Nasi merah", "¾ gelas", 100], ["Kentang rebus", "2 buah sedang", 210], ["Ubi jalar", "1 buah sedang", 135], ["Roti tawar", "3 iris", 70], ["Havermut (oat)", "5½ sdm", 45], ["Jagung rebus", "3 buah sedang", 125], ["Singkong rebus", "1 potong", 120]],
    hr: [["Ikan segar (bakar/pepes)", "1 potong sedang", 40], ["Ayam tanpa kulit", "1 potong sedang", 40], ["Ikan kembung/tongkol", "1 potong sedang", 40], ["Udang segar", "5 ekor sedang", 35]],
    hs: [["Telur ayam (rebus/dadar)", "1 butir", 55], ["Daging sapi", "1 potong sedang", 35]],
    nb: [["Tempe", "2 potong sedang", 50], ["Tahu", "2 potong sedang", 100], ["Tempe bacem/kukus", "2 potong sedang", 50], ["Tahu kukus/pepes", "2 potong sedang", 100]],
    sy: [["Sayur bayam", "1 mangkok", 100], ["Tumis kangkung", "1 mangkok", 100], ["Sayur sop (wortel, buncis)", "1 mangkok", 100], ["Sayur asem", "1 mangkok", 100], ["Labu siam", "1 mangkok", 100], ["Sawi hijau", "1 mangkok", 100], ["Kacang panjang", "1 mangkok", 100]],
    bh: [["Pisang ambon", "1 buah sedang", 50], ["Pepaya", "1 potong besar", 110], ["Jeruk manis", "2 buah sedang", 110], ["Semangka", "2 potong sedang", 180], ["Apel", "½ buah sedang", 75], ["Melon", "1 potong besar", 190]],
    mk: [["Minyak untuk menumis/menggoreng", "1 sdt", 5]]
  };
  const KURMA = ["Kurma", "3 butir", 15];

  function exchanges(target, proteinG) {
    let sy = 3, bh = 3, mk = 3, nb = 2, hr = 2, hs = 1, kh = 3;
    if (target >= 2200) { sy = 4; mk = 4; nb = 3; }
    if (target >= 2800) { mk = 5; bh = 4; }
    for (let i = 0; i < 4; i++) {
      const pNow = 4 * kh + 7 * (hr + hs) + 5 * nb + sy;
      const need = Math.max(0, proteinG - pNow);
      const addH = Math.round(need / 7);
      hr = Math.min(6, Math.max(2, hr + addH)); if (hr >= 6 && need > 7) nb = Math.min(3, nb + 1);
      const rest = target - (50 * hr + 75 * hs + 75 * nb + 25 * sy + 50 * bh + 45 * mk);
      kh = Math.max(2, Math.round((rest / 175) * 2) / 2);
    }
    return { kh, hr, hs, nb, sy, bh, mk };
  }

  function pick(list, seed) { return list[((seed % list.length) + list.length) % list.length]; }
  function qty(food, n) {
    if (n === 1) return food[1];
    const m = food[1].match(/^(\d*)([½¾]?)\s+(.*)$/);
    if (!m) return n + " × " + food[1];
    const base = (+m[1] || 0) + (m[2] === "½" ? 0.5 : m[2] === "¾" ? 0.75 : 0);
    const unit = m[3], raw = base * n;
    const step = /sdm|ekor/.test(unit) ? 1 : /buah|potong|butir|iris|biji/.test(unit) ? 0.5 : 0.25;
    return fmtNum(Math.max(step, Math.round(raw / step) * step)) + " " + unit;
  }
  function fmtNum(x) { const w = Math.floor(x), f = +(x - w).toFixed(2); const fr = f === 0.5 ? "½" : f === 0.25 ? "¼" : f === 0.75 ? "¾" : f ? String(f).slice(1) : ""; return (w ? w : "") + fr || "0"; }

  /* day: 0..6, fasting: boolean */
  function mealPlan({ target, protein, gender, day = 0, fasting = false }) {
    const floor = gender === "akhwat" ? 1200 : 1500;
    const kcal = Math.max(floor, Math.round(target));
    const e = exchanges(kcal, Math.min(protein || 60, (0.25 * kcal) / 4));
    const d = day;
    // pembagian porsi per waktu makan
    const split = (n, parts, step) => { step = step || 0.5; const out = parts.map((p) => Math.round((n * p) / step) * step); let diff = +(n - out.reduce((a, b) => a + b, 0)).toFixed(2); out[out.length - 1] = +(out[out.length - 1] + diff).toFixed(2); return out; };
    let meals;
    if (!fasting) {
      const kh = split(e.kh, [0.3, 0, 0.4, 0, 0.3]), hr = split(e.hr, [0.25, 0, 0.4, 0, 0.35], 1), nb = split(e.nb, [0, 0, 0.5, 0, 0.5], 1), sy = split(e.sy, [0.25, 0, 0.4, 0, 0.35]), mk = split(e.mk, [0.3, 0, 0.4, 0, 0.3]);
      const bh = [0, Math.ceil(e.bh / 2), 0, Math.floor(e.bh / 2), 0];
      meals = [["Sarapan (Ba'da Subuh)", 0], ["Selingan pagi", 1], ["Makan siang (Ba'da Dzuhur)", 2], ["Selingan sore", 3], ["Makan malam (Ba'da Maghrib)", 4]].map(([t, i]) => ({ t, ex: { kh: kh[i], hr: hr[i], hs: i === 0 ? e.hs : 0, nb: nb[i], sy: sy[i], bh: bh[i], mk: mk[i] } }));
    } else {
      const kh = split(e.kh, [0.45, 0, 0.55]), hr = split(e.hr, [0.45, 0, 0.55], 1), nb = split(e.nb, [0.5, 0, 0.5], 1), sy = split(e.sy, [0.5, 0, 0.5]), mk = split(e.mk, [0.5, 0, 0.5]);
      meals = [
        { t: "Sahur (akhirkan menjelang Subuh)", ex: { kh: kh[0], hr: hr[0], hs: e.hs, nb: nb[0], sy: sy[0], bh: 1, mk: mk[0] } },
        { t: "Berbuka (sebelum sholat Maghrib)", ex: { bh: 1, kurma: 1 } },
        { t: "Makan malam (setelah Maghrib)", ex: { kh: kh[2], hr: hr[2], hs: 0, nb: nb[2], sy: sy[2], bh: Math.max(0, e.bh - 2), mk: mk[2] } }
      ];
    }
    const MAX = { kh: 2, hr: 2, hs: 1, nb: 2, sy: 2, bh: 2, mk: 99 };
    const RICE = FOODS.kh.slice(0, 2), ALT = [FOODS.kh[2], FOODS.kh[3], FOODS.kh[6], FOODS.kh[7]];
    const tot = { kcal: 0, p: 0, l: 0, k: 0 };
    meals.forEach((m, mi) => {
      m.items = [];
      const breakfast = mi === 0 && !fasting;
      Object.entries(m.ex).forEach(([g, n]) => {
        if (!n) return;
        if (g === "kurma") { m.items.push({ name: KURMA[0], qty: KURMA[1], g: "bh", n: 1, kcal: 50, grams: 15 }); add(tot, "bh", 1); return; }
        let rest = n, k = 0;
        while (rest > 0.01) {
          const chunk = Math.min(g === "kh" && !breakfast ? 2.5 : MAX[g], rest);
          let food;
          if (g === "mk") food = FOODS.mk[0];
          else if (g === "kh") food = k === 0 ? (breakfast ? pick(FOODS.kh, d + 2) : pick(RICE, d + mi)) : pick(ALT, d + mi + k);
          else food = pick(FOODS[g], d * 2 + mi * 3 + k);
          m.items.push({ name: food[0], qty: qty(food, chunk), g, n: chunk, kcal: Math.round(EX[g].kcal * chunk), grams: Math.round(food[2] * chunk) });
          add(tot, g, chunk); rest = +(rest - chunk).toFixed(2); k++;
        }
      });
      m.kcal = m.items.reduce((a, b) => a + b.kcal, 0);
    });
    Object.keys(tot).forEach((k) => (tot[k] = Math.round(tot[k])));
    return { target: kcal, raised: kcal !== Math.round(target), exchanges: e, meals, total: tot };
  }
  function add(tot, g, n) { const x = EX[g]; tot.kcal += x.kcal * n; tot.p += x.p * n; tot.l += x.l * n; tot.k += x.k * n; }

  return { ACT, bmr, bmi, bmiCat, idealWeight, bodyFatNavy, fatCat, goals, zigzag, EXERCISES, mealPlan, EX, FOODS, KCAL_PER_KG };
})();
