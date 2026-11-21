// =====================================================================
// Google Health API — sambungan akun Google Health member (OAuth 2.0)
//   POST /api/google/start       → URL izin Google (butuh login QOWIY)
//   GET  /api/google/callback    → tukar kode, simpan refresh token
//   POST /api/google/sync        → tarik langkah, berat, lemak tubuh, detak istirahat
//   POST /api/google/disconnect  → cabut izin & hapus token
//
// Variabel lingkungan (Vercel):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   OAuth client (tipe Web) di Google Cloud
//   SUPABASE_SERVICE_ROLE_KEY                kunci rahasia Supabase (hanya di server)
//   GOOGLE_REDIRECT_URI  opsional, default https://<host>/api/google/callback
// Data yang tersedia: perangkat Fitbit & Pixel Watch serta entri manual di
// aplikasi Google Health (lihat developers.google.com/health).
// =====================================================================
const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://fmikdgeevcvuchcrwuwc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_anFN9KWuBIKkwG8aOYkG8Q_hRi8IBcl";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CID = process.env.GOOGLE_CLIENT_ID, CSECRET = process.env.GOOGLE_CLIENT_SECRET;
const API = "https://health.googleapis.com/v4/users/me/dataTypes/";
const SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly"
];

const send = (res, code, body) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };
const redirect = (res, url) => { res.statusCode = 302; res.setHeader("Location", url); res.end(); };
const origin = (req) => "https://" + (req.headers["x-forwarded-host"] || req.headers.host);
const redirectUri = (req) => process.env.GOOGLE_REDIRECT_URI || origin(req) + "/api/google/callback";
const b64u = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sign = (s) => crypto.createHmac("sha256", CSECRET).update(s).digest("hex").slice(0, 32);

async function currentUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + token } });
  return r.ok ? r.json() : null;
}
const admin = (path, opts) => fetch(SUPABASE_URL + "/rest/v1/" + path, Object.assign({}, opts, { headers: Object.assign({ apikey: SERVICE, Authorization: "Bearer " + SERVICE, "content-type": "application/json" }, (opts && opts.headers) || {}) }));

async function accessToken(refresh) {
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: refresh, grant_type: "refresh_token" }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.error || "Gagal memperbarui izin Google");
  return j.access_token;
}
const civil = (d) => ({ date: { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() } });
const ymd = (o) => o && o.date ? `${o.date.year}-${String(o.date.month).padStart(2, "0")}-${String(o.date.day).padStart(2, "0")}` : null;
function firstNumber(obj, prefer) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of prefer) if (obj[k] != null && !isNaN(+obj[k])) return +obj[k];
  for (const [k, v] of Object.entries(obj)) if (!/time|date|offset|interval/i.test(k) && v != null && typeof v !== "object" && !isNaN(+v)) return +v;
  return null;
}

async function sync(user, link) {
  const at = await accessToken(link.refresh_token);
  const H = { Authorization: "Bearer " + at, Accept: "application/json", "content-type": "application/json" };
  const now = new Date(), d14 = new Date(now.getTime() - 14 * 864e5), d90 = new Date(now.getTime() - 90 * 864e5);
  const rows = [], errors = [];
  const push = (kind, value, when, meta) => { if (value != null && isFinite(value)) rows.push({ user_id: user.id, kind, value, meta: meta || null, source: "google_health", measured_at: when }); };

  // Langkah per hari (14 hari)
  try {
    const r = await fetch(API + "steps/dataPoints:dailyRollUp", { method: "POST", headers: H, body: JSON.stringify({ range: { start: civil(d14), end: civil(new Date(now.getTime() + 864e5)) }, windowSizeDays: 1 }) });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
    (j.rollupDataPoints || []).forEach((p) => { const day = ymd(p.civilStartTime); if (day && p.steps) push("steps", +p.steps.countSum || 0, day + "T12:00:00+07:00"); });
  } catch (e) { errors.push("langkah: " + e.message); }

  // Berat badan & lemak tubuh (90 hari)
  for (const [type, filterKey, kind] of [["weight", "weight", "weight"], ["body-fat", "body_fat", "body_fat"]]) {
    try {
      const q = new URLSearchParams({ pageSize: "500", filter: `${filterKey}.sample_time.physical_time >= "${d90.toISOString()}"` });
      const r = await fetch(API + type + "/dataPoints?" + q, { headers: H });
      const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
      (j.dataPoints || []).forEach((p) => {
        const o = p.weight || p.bodyFat; if (!o) return;
        const when = (o.sampleTime && o.sampleTime.physicalTime) || now.toISOString();
        if (kind === "weight") push("weight", o.weightGrams != null ? +(o.weightGrams / 1000).toFixed(2) : null, when);
        else push("body_fat", firstNumber(o, ["percentage", "percent", "bodyFatPercentage"]), when);
      });
    } catch (e) { errors.push(kind + ": " + e.message); }
  }

  // Detak jantung istirahat harian (14 hari)
  try {
    const q = new URLSearchParams({ pageSize: "100", filter: `daily_resting_heart_rate.date >= "${ymd(civil(d14))}"` });
    const r = await fetch(API + "daily-resting-heart-rate/dataPoints?" + q, { headers: H });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
    (j.dataPoints || []).forEach((p) => { const o = p.dailyRestingHeartRate; if (!o) return; const day = ymd(o) || (o.date && ymd({ date: o.date })); push("heart_rate", firstNumber(o, ["beatsPerMinute", "bpm", "value"]), (day || now.toISOString().slice(0, 10)) + "T06:00:00+07:00", { resting: true }); });
  } catch (e) { errors.push("detak jantung: " + e.message); }

  // Ganti data Google Health lama di rentang ini, lalu simpan yang baru
  await admin(`health_logs?user_id=eq.${user.id}&source=eq.google_health&measured_at=gte.${encodeURIComponent(d90.toISOString())}`, { method: "DELETE" });
  if (rows.length) { const ins = await admin("health_logs", { method: "POST", body: JSON.stringify(rows), headers: { Prefer: "return=minimal" } }); if (!ins.ok) errors.push("simpan: " + (await ins.text()).slice(0, 120)); }
  await admin(`google_links?user_id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ last_sync_at: new Date().toISOString() }) });
  const count = (k) => rows.filter((r) => r.kind === k).length;
  return { steps: count("steps"), weight: count("weight"), body_fat: count("body_fat"), heart_rate: count("heart_rate"), errors };
}

module.exports = async (req, res) => {
  const action = (req.query && req.query.action) || new URL(req.url, "http://x").searchParams.get("action");
  if (!CID || !CSECRET || !SERVICE) return send(res, 503, { error: "Koneksi Google Health belum diaktifkan admin.", code: "google_disabled" });

  if (action === "callback") {
    const u = new URL(req.url, "http://x"), code = u.searchParams.get("code"), state = u.searchParams.get("state") || "";
    const back = (s) => redirect(res, origin(req) + "/#/perangkat?google=" + s);
    if (u.searchParams.get("error")) return back("batal");
    let userId = null;
    try { const [id, ts, sig] = Buffer.from(state.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString().split("."); if (sig === sign(id + "." + ts) && Date.now() - +ts < 15 * 60e3) userId = id; } catch (e) {}
    if (!userId || !code) return back("gagal");
    const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: CID, client_secret: CSECRET, redirect_uri: redirectUri(req), grant_type: "authorization_code" }) });
    const j = await r.json();
    if (!r.ok || !j.refresh_token) return back("gagal");
    await admin("google_links", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: userId, refresh_token: j.refresh_token, scope: j.scope || "", connected_at: new Date().toISOString() }) });
    return back("ok");
  }

  if (req.method !== "POST") return send(res, 405, { error: "Gunakan POST" });
  const user = await currentUser(req);
  if (!user) return send(res, 401, { error: "Silakan masuk dulu." });

  if (action === "start") {
    const ts = String(Date.now()), state = b64u(user.id + "." + ts + "." + sign(user.id + "." + ts));
    const url = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({ client_id: CID, redirect_uri: redirectUri(req), response_type: "code", scope: SCOPES.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true", state });
    return send(res, 200, { url });
  }
  const lr = await admin(`google_links?user_id=eq.${user.id}&select=*`, { method: "GET" });
  const link = lr.ok ? (await lr.json())[0] : null;
  if (action === "sync") {
    if (!link) return send(res, 400, { error: "Akun Google Health belum terhubung." });
    try { return send(res, 200, await sync(user, link)); } catch (e) { return send(res, 502, { error: e.message }); }
  }
  if (action === "disconnect") {
    if (link) { try { await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(link.refresh_token), { method: "POST" }); } catch (e) {} }
    await admin(`google_links?user_id=eq.${user.id}`, { method: "DELETE" });
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: "Aksi tidak dikenal" });
};
