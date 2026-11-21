// =====================================================================
// POST /api/chat — chatbot AI QOWIY (Vercel Serverless Function)
// Body: { messages: [{role:"user"|"assistant", content}], page }
// Balasan: { reply, handoff }  — handoff=true → tampilkan tombol WhatsApp admin
// Memakai kunci yang sama dengan /api/menu (ANTHROPIC_API_KEY atau OPENROUTER_API_KEY).
// Kuota harian per pengguna/IP disimpan di Supabase (RPC chat_take_quota).
// =====================================================================
const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://fmikdgeevcvuchcrwuwc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_anFN9KWuBIKkwG8aOYkG8Q_hRi8IBcl";

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
async function sbFetch(path, opts, token) {
  return fetch(SUPABASE_URL + path, Object.assign({}, opts, { headers: Object.assign({ apikey: SUPABASE_KEY, Authorization: "Bearer " + (token || SUPABASE_KEY), "content-type": "application/json" }, (opts && opts.headers) || {}) }));
}

async function callAI(system, messages) {
  const model = process.env.AI_MODEL || "claude-haiku-5-5";
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 700, system, messages })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || "AI error " + r.status);
    return (j.content || []).map((c) => c.text || "").join("");
  }
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.AI_MODEL || "anthropic/claude-haiku-5-5", max_tokens: 700, messages: [{ role: "system", content: system }].concat(messages) })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || "AI error " + r.status);
  return j.choices[0].message.content || "";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Gunakan POST" });
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) return send(res, 503, { error: "AI belum diaktifkan", code: "ai_disabled" });

  const body = await readBody(req);
  const msgs = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10).map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return send(res, 400, { error: "Pesan kosong" });
  while (msgs.length && msgs[0].role !== "user") msgs.shift();

  // kuota: per akun jika login, selain itu per IP (di-hash)
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  let key = null, limit = 25;
  if (token) {
    const u = await sbFetch("/auth/v1/user", { method: "GET" }, token);
    if (u.ok) { const uj = await u.json(); key = "u:" + uj.id; limit = 80; }
  }
  if (!key) {
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    key = "ip:" + crypto.createHash("sha256").update(ip + (process.env.CHAT_SALT || "qowiy")).digest("hex").slice(0, 32);
  }
  const q = await sbFetch("/rest/v1/rpc/chat_take_quota", { method: "POST", body: JSON.stringify({ p_key: key, p_limit: limit }) });
  const allowed = q.ok ? await q.json() : true;
  if (allowed === false) return send(res, 429, { reply: "Batas chat hari ini sudah tercapai. Silakan lanjutkan pertanyaan Anda ke admin lewat WhatsApp.", handoff: true });

  // info paket terbaru dari pengaturan admin
  let plans = "";
  try {
    const s = await sbFetch("/rest/v1/settings?id=eq.1&select=data", { method: "GET" });
    const d = ((await s.json())[0] || {}).data || {};
    plans = (d.plans || []).map((p) => `- ${p.name}: Rp${Number(p.price || 0).toLocaleString("id-ID")} (${p.period || ""}) — ${(p.features || []).slice(0, 4).join("; ")}`).join("\n");
  } catch (e) {}

  const system = `Kamu "Asisten QOWIY", asisten chat aplikasi QOWIY — Aplikasi Kebugaran Muslim (program kebugaran 12–16 pekan sesuai Al-Qur'an & Sunnah).
Gaya: bahasa Indonesia yang santun dan hangat, boleh salam Islami, jawaban SINGKAT (maks. ±120 kata), poin-poin bila perlu.
Yang kamu ketahui tentang aplikasi:
- Alur: tes kebugaran 12 pertanyaan (gratis) → hasil (IMT, kalori, rencana makan hari 1) → pilih paket → bayar QRIS/transfer → konfirmasi via WhatsApp → admin mengaktifkan akses.
- Fitur member: kelas video (jalur Turun Berat / Bugar & Kuat, Ramadan Mode, pecah plateau), video rutinitas mengikuti waktu sholat (ikhwan & akhwat terpisah), motivasi trainer, checklist sunnah harian, rencana makan (atur % protein/karbo/serat, lemak = sisa; menu otomatis, rekomendasi AI, susun sendiri), kalkulator kalori/BMR/IMT/lemak tubuh (gratis), artikel berdalil & bersumber ilmiah, koneksi Bluetooth ke jam pintar (detak jantung) dan timbangan (Chrome Android/PC; iPhone pakai browser Bluefy).
- Paket saat ini:
${plans || "(lihat halaman Langganan)"}
Aturan:
- Jangan mengarang fakta, harga, atau dalil. Bila menyebut dalil, hanya yang kamu yakin beserta rujukannya; bila ragu, jangan sebut.
- Bukan dokter: untuk keluhan medis, kehamilan, penyakit kronis, cedera → sarankan tenaga kesehatan.
- Jika pertanyaan tentang pembayaran/konfirmasi transfer, akun bermasalah, refund, jadwal coaching, kerja sama, keluhan, atau kamu tidak yakin jawabannya, atau pengguna minta bicara dengan admin → jawab singkat lalu akhiri balasan dengan penanda [[WA]] (pengguna akan diarahkan ke WhatsApp admin).
- Jangan pernah meminta password, nomor kartu, atau data sensitif.`;

  let text;
  try { text = await callAI(system, msgs); }
  catch (e) { return send(res, 502, { reply: "Maaf, asisten sedang gangguan. Silakan hubungi admin lewat WhatsApp.", handoff: true }); }
  const handoff = /\[\[WA\]\]/.test(text);
  return send(res, 200, { reply: text.replace(/\[\[WA\]\]/g, "").trim(), handoff });
};
