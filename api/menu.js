// =====================================================================
// POST /api/menu — rekomendasi menu berbasis AI (Vercel Serverless Function)
//
// Alur: verifikasi login Supabase → cek kuota & langganan aktif (RPC
// ai_take_quota) → AI memilih KOMBINASI bahan dari database makanan
// (1 sumber protein per hidangan) dan memberi nama hidangan → aplikasi
// menghitung gram & makro sendiri dari database (angka gizi tidak dikarang AI).
//
// Variabel lingkungan (Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY   kunci API Anthropic (Claude)      — atau —
//   OPENROUTER_API_KEY  kunci API OpenRouter
//   AI_MODEL            opsional, mis. "claude-haiku-5-5" (default)
//   SUPABASE_URL / SUPABASE_ANON_KEY  opsional (default: nilai di config.js)
// =====================================================================
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://fmikdgeevcvuchcrwuwc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_anFN9KWuBIKkwG8aOYkG8Q_hRi8IBcl";

let FOODS = null;
function foods() {
  if (!FOODS) FOODS = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "foods.json"), "utf8")).foods;
  return FOODS;
}

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = []; for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c)));
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch (e) { return {}; }
}

async function callAI(system, user) {
  const model = process.env.AI_MODEL || "claude-haiku-5-5";
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 1500, system, messages: [{ role: "user", content: user }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "AI error " + r.status);
    return (j.content || []).map((c) => c.text || "").join("");
  }
  if (process.env.OPENROUTER_API_KEY) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.AI_MODEL || "anthropic/claude-haiku-5-5", max_tokens: 1500, messages: [{ role: "system", content: system }, { role: "user", content: user }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "AI error " + r.status);
    return j.choices[0].message.content || "";
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Gunakan POST" });
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY)
    return send(res, 503, { error: "Fitur AI belum diaktifkan admin (kunci API belum dipasang).", code: "ai_disabled" });

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return send(res, 401, { error: "Silakan masuk dulu." });

  // 1) verifikasi user
  const u = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + token } });
  if (!u.ok) return send(res, 401, { error: "Sesi login tidak valid. Silakan masuk ulang." });

  // 2) kuota harian + langganan aktif (diperiksa di database)
  const q = await fetch(SUPABASE_URL + "/rest/v1/rpc/ai_take_quota", {
    method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify({ p_limit: 15 })
  });
  const allowed = q.ok ? await q.json() : false;
  if (allowed !== true) return send(res, 429, { error: "Kuota rekomendasi AI hari ini habis, atau langganan belum aktif." });

  // 3) susun permintaan
  const body = await readBody(req);
  const t = body.target || {};
  const fasting = !!body.fasting;
  const avoid = Array.isArray(body.avoid) ? body.avoid.filter((x) => typeof x === "string").slice(0, 20) : [];
  const note = String(body.note || "").slice(0, 200);
  const list = foods().filter((f) => !avoid.includes(f.id));
  const cats = {};
  list.forEach((f) => { (cats[f.cat] = cats[f.cat] || []).push(`${f.id} (${f.name})`); });
  // slot makan dikirim aplikasi (sesuai pilihan 2–6 kali makan); divalidasi di sini
  const PARTS = ["karbo", "protein", "sayur", "lemak", "buah"];
  const IDS = /^(sarapan|siang|malam|selingan|selingan_pagi|selingan_malam|sahur|berbuka)$/;
  let slotList = Array.isArray(body.slots) ? body.slots.slice(0, 6).filter((x) => x && IDS.test(x.id) && Array.isArray(x.parts)).map((x) => ({ id: x.id, parts: x.parts.filter((p) => PARTS.includes(p)), kurma: !!(x.fixed && x.fixed.buah === "kurma") })) : [];
  if (!slotList.length) slotList = fasting
    ? [{ id: "sahur", parts: ["karbo", "protein", "sayur", "lemak"] }, { id: "berbuka", parts: ["buah"], kurma: true }, { id: "malam", parts: ["karbo", "protein", "sayur", "lemak"] }, { id: "selingan", parts: ["buah"] }]
    : [{ id: "sarapan", parts: ["karbo", "protein", "sayur"] }, { id: "siang", parts: ["karbo", "protein", "sayur", "lemak"] }, { id: "malam", parts: ["karbo", "protein", "sayur", "lemak"] }, { id: "selingan", parts: ["buah", "lemak"] }];
  const slots = slotList.map((x) => `${x.id}: ${x.parts.join(", ")}${x.kurma ? " (buah wajib kurma)" : ""}`);

  const system = `Kamu ahli gizi Muslim Indonesia. Susun menu SATU HARI yang halal, sederhana, mudah dimasak di rumah Indonesia, dan sesuai adab makan sunnah (tidak berlebihan).
ATURAN WAJIB:
- Gunakan HANYA id bahan dari daftar. Jangan mengarang bahan lain.
- Setiap hidangan utama hanya SATU sumber protein. Protein tiap waktu makan berbeda.
- Jangan menulis angka gram/kalori — porsi dihitung aplikasi.
- Pilih kombinasi yang membantu mencapai target makro (protein tinggi → protein rendah lemak; karbo rendah → pokok berserat seperti ubi/oat/nasi merah; serat tinggi → sayur & buah berserat).
- Nama hidangan singkat dalam bahasa Indonesia (mis. "Nasi merah, pepes ikan nila, tumis bayam").
- Balas HANYA JSON valid tanpa teks lain.`;
  const user = `Target harian: ${Math.round(t.kcal || 0)} kkal; protein ${Math.round(t.p || 0)} g; karbohidrat ${Math.round(t.k || 0)} g; serat ${Math.round(t.s || 0)} g; lemak ${Math.round(t.l || 0)} g.
Mode: ${fasting ? "hari puasa" : "hari biasa"}; makan ${slotList.length} kali sehari. ${note ? "Catatan pengguna: " + note : ""}
Slot & bagian: ${slots.join(" | ")}
Daftar bahan per kategori:
${Object.entries(cats).map(([c, a]) => `- ${c}: ${a.join(", ")}`).join("\n")}
Isi SEMUA slot di atas, urut, hanya dengan bagian yang tercantum pada slot itu.
Format JSON: {"judul":"...","meals":[{"slot":"${slotList[0].id}","dish":"...","karbo":"id","protein":"id","sayur":"id","lemak":"id","buah":"id"}, ...],"tips":"satu kalimat"}`;

  let text;
  try { text = await callAI(system, user); }
  catch (e) { return send(res, 502, { error: "Layanan AI gagal: " + e.message }); }

  let out;
  try { out = JSON.parse((text.match(/\{[\s\S]*\}/) || ["{}"])[0]); } catch (e) { out = null; }
  if (!out || !Array.isArray(out.meals)) return send(res, 502, { error: "Jawaban AI tidak terbaca. Coba lagi." });

  // 4) validasi id & aturan 1 protein per hidangan
  const ok = (id, cat) => list.some((f) => f.id === id && f.cat === cat);
  const meals = out.meals.slice(0, 6).map((m) => {
    const c = { slot: String(m.slot || ""), dish: String(m.dish || "").slice(0, 90) };
    ["karbo", "protein", "sayur", "lemak", "buah"].forEach((k) => { if (ok(m[k], k)) c[k] = m[k]; });
    return c;
  });
  return send(res, 200, { judul: String(out.judul || "Menu rekomendasi AI").slice(0, 80), tips: String(out.tips || "").slice(0, 240), meals });
};
