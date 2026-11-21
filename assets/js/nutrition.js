/* =====================================================================
   Nutrition — target makro (persen energi) & penyusun menu
   - Protein, karbohidrat (tanpa serat), serat diatur dalam %; LEMAK = sisa.
   - Energi: protein 4, karbohidrat 4, serat 2, lemak 9 kkal/g.
   - Setiap hidangan utama: 1 makanan pokok + 1 sumber protein + 1 sayur
     (+ minyak secukupnya). Porsi (gram) dihitung otomatis agar mendekati target.
   ===================================================================== */
window.Nutrition = (function () {
  let DB = null;
  async function load() {
    if (DB) return DB;
    try { DB = await fetch("data/foods.json", { cache: "force-cache" }).then((r) => r.json()); }
    catch (e) { DB = { foods: [], sources: {} }; }
    DB.byId = {}; DB.foods.forEach((f) => (DB.byId[f.id] = f));
    return DB;
  }
  const food = (id) => (DB && DB.byId[id]) || null;
  const byCat = (cat) => (DB ? DB.foods.filter((f) => f.cat === cat) : []);

  const PRESETS = [
    { id: "seimbang", name: "Seimbang", p: 15, k: 52, s: 3, desc: "Mendekati pola gizi seimbang (karbo 45–65%, lemak 20–35%)" },
    { id: "turun", name: "Tinggi protein", p: 30, k: 37, s: 3, desc: "Cocok untuk defisit kalori / turun berat" },
    { id: "otot", name: "Bina otot", p: 25, k: 47, s: 3, desc: "Karbo cukup untuk latihan beban" },
    { id: "rendah_karbo", name: "Rendah karbo", p: 35, k: 20, s: 5, desc: "Karbo rendah, lemak lebih tinggi" }
  ];
  function defaultMacro(goal) {
    const p = PRESETS.find((x) => x.id === (goal === "turun" ? "turun" : goal === "kuat" ? "otot" : "seimbang"));
    return { p: p.p, k: p.k, s: p.s, preset: p.id };
  }

  const KCAL = { p: 4, k: 4, s: 2, l: 9 };
  function targets(kcal, m) {
    const l = Math.max(0, 100 - m.p - m.k - m.s);
    return { kcal, pct: { p: m.p, k: m.k, s: m.s, l },
      g: { p: (kcal * m.p) / 100 / KCAL.p, k: (kcal * m.k) / 100 / KCAL.k, s: (kcal * m.s) / 100 / KCAL.s, l: (kcal * l) / 100 / KCAL.l } };
  }
  function warnings(t) {
    const w = [], fibAI = Math.round((14 * t.kcal) / 1000);
    if (t.pct.p + t.pct.k + t.pct.s > 100) w.push(["err", "Protein + karbo + serat melebihi 100%. Kurangi salah satunya — lemak otomatis mengisi sisanya."]);
    if (t.pct.l < 20) w.push(["warn", `Lemak ${t.pct.l}% berada di bawah rentang anjuran 20–35% energi. Lemak tetap dibutuhkan untuk hormon dan penyerapan vitamin A, D, E, K.`]);
    if (t.pct.l > 35) w.push(["info", `Lemak ${t.pct.l}% di atas rentang anjuran 20–35% energi. Pilih lemak tak jenuh (ikan, alpukat, kacang, minyak zaitun).`]);
    if (t.pct.p > 35) w.push(["warn", `Protein ${t.pct.p}% di atas batas atas rentang anjuran (10–35% energi). Boleh untuk jangka pendek saat defisit; minum air cukup, dan hindari bila ada penyakit ginjal tanpa saran dokter.`]);
    if (t.pct.k < 20) w.push(["info", "Karbohidrat sangat rendah. Energi untuk latihan bisa turun di pekan-pekan awal."]);
    if (t.g.s > 50) w.push(["warn", `Target serat ${Math.round(t.g.s)} g/hari jauh di atas kecukupan (±14 g per 1.000 kkal ≈ ${fibAI} g). Menu dari bahan makanan biasa jarang bisa mencapainya; naikkan serat bertahap agar tidak kembung.`]);
    else if (t.g.s < fibAI * 0.6) w.push(["info", `Target serat ${Math.round(t.g.s)} g/hari di bawah kecukupan ±${fibAI} g. Tambah sayur, buah, atau pilih nasi merah/oat.`]);
    return w;
  }

  /* ---------- slot makan ---------- */
  function slots(fasting) {
    if (fasting) return [
      { id: "sahur", t: "Sahur (akhirkan menjelang Subuh)", share: 0.4, parts: ["karbo", "protein", "sayur", "lemak"] },
      { id: "berbuka", t: "Berbuka (sebelum sholat Maghrib)", share: 0.07, parts: ["buah"], fixed: { buah: "kurma" } },
      { id: "malam", t: "Makan malam (setelah Maghrib)", share: 0.43, parts: ["karbo", "protein", "sayur", "lemak"] },
      { id: "selingan", t: "Selingan (setelah Tarawih)", share: 0.1, parts: ["buah"] }
    ];
    return [
      { id: "sarapan", t: "Sarapan (Ba'da Subuh)", share: 0.25, parts: ["karbo", "protein", "sayur"] },
      { id: "siang", t: "Makan siang (Ba'da Dzuhur)", share: 0.35, parts: ["karbo", "protein", "sayur", "lemak"] },
      { id: "malam", t: "Makan malam (Ba'da Maghrib)", share: 0.3, parts: ["karbo", "protein", "sayur", "lemak"] },
      { id: "selingan", t: "Selingan sore", share: 0.1, parts: ["buah", "lemak"] }
    ];
  }
  const LIMITS = { karbo: [0, 450], protein: [40, 300], sayur: [80, 300], buah: [80, 300], lemak: [0, 60] };
  const limitFor = (f, part) => {
    if (f.id === "minyak") return [0, 15];
    if (f.id === "kurma") return [21, 35];
    if (f.id === "kacang_tanah" || f.id === "almond") return [0, 35];
    if (f.id === "alpukat") return [0, 150];
    if (f.id === "tahu") return [50, 400];
    if (f.id === "oat") return [20, 100];
    return LIMITS[part] || [0, 300];
  };
  const per = (f) => ({ p: f.p / 100, k: (f.kh - f.s) / 100, s: f.s / 100, l: f.l / 100, kcal: f.kcal / 100 });

  /* Cari gram tiap bahan agar makro hidangan mendekati target (penurunan koordinat terbatas). */
  function solve(items, tgt) {
    const rows = ["p", "k", "l", "s", "kcal"];
    const imp = { p: 4, k: 2, l: 2, s: 1, kcal: 3 };
    const W = {}; rows.forEach((r) => (W[r] = imp[r] / Math.pow(Math.max(tgt[r], r === "kcal" ? 50 : 3), 2)));
    const A = items.map((it) => per(it.f));
    const g = items.map((it, i) => {
      const [lo, hi] = it.lim; let x = 100;
      if (it.part === "protein") x = (tgt.p * 0.85) / Math.max(A[i].p, 0.01);
      else if (it.part === "karbo") x = tgt.k / Math.max(A[i].k, 0.01);
      else if (it.part === "lemak") x = 5;
      return Math.min(hi, Math.max(lo, x));
    });
    for (let iter = 0; iter < 400; iter++) {
      for (let j = 0; j < g.length; j++) {
        if (items[j].fixed) continue;
        let num = 0, den = 0;
        rows.forEach((r) => {
          let v = 0; for (let i = 0; i < g.length; i++) v += A[i][r] * g[i];
          num += W[r] * A[j][r] * (v - tgt[r]); den += W[r] * A[j][r] * A[j][r];
        });
        if (den > 0) { const [lo, hi] = items[j].lim; g[j] = Math.min(hi, Math.max(lo, g[j] - num / den)); }
      }
    }
    return g;
  }
  function roundG(f, x) { const step = f.id === "minyak" ? 2.5 : f.id === "kurma" ? 7 : 5; return Math.max(0, Math.round(x / step) * step); }
  function fmtQty(f, grams) {
    if (!f.unit) return "";
    const n = grams / f.unit[1], r = Math.round(n * 2) / 2;
    if (r <= 0) return "";
    const w = Math.floor(r), half = r - w >= 0.5;
    return "≈ " + ((w ? w : "") + (half ? "½" : "") || "½") + " " + f.unit[0];
  }

  function buildMeal(slot, choice, dayT) {
    const tgt = { p: dayT.g.p * slot.share, k: dayT.g.k * slot.share, l: dayT.g.l * slot.share, s: dayT.g.s * slot.share, kcal: dayT.kcal * slot.share };
    const items = slot.parts.map((part) => {
      const id = (slot.fixed && slot.fixed[part]) || choice[part];
      const f = food(id); if (!f) return null;
      return { part, f, lim: limitFor(f, part) };
    }).filter(Boolean);
    const g = solve(items, tgt);
    const out = items.map((it, i) => {
      const grams = roundG(it.f, g[i]); const a = per(it.f);
      return { part: it.part, id: it.f.id, name: it.f.name, grams, qty: fmtQty(it.f, grams),
        kcal: Math.round(a.kcal * grams), p: +(a.p * grams).toFixed(1), k: +(a.k * grams).toFixed(1), s: +(a.s * grams).toFixed(1), l: +(a.l * grams).toFixed(1) };
    }).filter((x) => x.grams > 0);
    const tot = sum(out);
    const main = out.filter((x) => x.part !== "lemak" || x.id !== "minyak").map((x) => x.name.split(" (")[0]);
    return { id: slot.id, t: slot.t, dish: choice.dish || main.join(" · "), items: out, total: tot, target: tgt };
  }
  function sum(list) { const t = { kcal: 0, p: 0, k: 0, s: 0, l: 0 }; list.forEach((x) => Object.keys(t).forEach((k) => (t[k] += x[k] || 0))); Object.keys(t).forEach((k) => (t[k] = k === "kcal" ? Math.round(t[k]) : +t[k].toFixed(1))); return t; }

  /* Pilihan bahan otomatis — 1 sumber protein per hidangan, protein berbeda tiap waktu makan */
  const ROT = {
    protPagi: ["telur", "tempe", "tahu", "ayam", "telur", "tempe", "ikan_nila"],
    protUtama: ["ayam", "ikan_nila", "tempe", "tongkol", "tahu", "udang", "ayam", "ikan_nila"],
    karboPagi: ["oat", "roti_gandum", "ubi", "nasi_merah", "kentang", "oat", "jagung"],
    karboUtama: ["nasi_merah", "nasi_putih", "kentang", "nasi_merah", "ubi", "nasi_putih", "nasi_merah"],
    sayur: ["bayam", "brokoli", "kangkung", "buncis", "wortel", "labu_siam", "kol"],
    buah: ["pepaya", "pisang", "jeruk", "apel", "jambu_biji", "semangka", "pisang"],
    lemakSnack: ["almond", "kacang_tanah", "alpukat"]
  };
  const at = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
  function autoChoices(day, fasting) {
    const sl = slots(fasting), used = new Set();
    return sl.map((s, i) => {
      const c = {};
      if (s.parts.includes("protein")) {
        const list = i === 0 && !fasting ? ROT.protPagi : ROT.protUtama;
        let k = day * 2 + i, p = at(list, k); let guard = 0;
        while (used.has(p) && guard++ < 10) p = at(list, ++k);
        used.add(p); c.protein = p;
      }
      if (s.parts.includes("karbo")) c.karbo = i === 0 && !fasting ? at(ROT.karboPagi, day) : at(ROT.karboUtama, day + i);
      if (s.parts.includes("sayur")) c.sayur = at(ROT.sayur, day * 2 + i);
      if (s.parts.includes("buah")) c.buah = at(ROT.buah, day + i);
      if (s.parts.includes("lemak")) c.lemak = s.id === "selingan" ? at(ROT.lemakSnack, day) : "minyak";
      return c;
    });
  }
  function plan({ kcal, macro, fasting, choices }) {
    const t = targets(kcal, macro);
    const sl = slots(fasting);
    const meals = sl.map((s, i) => buildMeal(s, (choices && choices[i]) || {}, t));
    return { target: t, meals, total: sum(meals.map((m) => m.total)), fasting: !!fasting };
  }
  function autoPlan({ kcal, macro, day = 0, fasting = false }) { return plan({ kcal, macro, fasting, choices: autoChoices(day, fasting) }); }

  return { load, food, byCat, PRESETS, defaultMacro, targets, warnings, slots, plan, autoPlan, autoChoices, fmtQty, get db() { return DB; } };
})();
