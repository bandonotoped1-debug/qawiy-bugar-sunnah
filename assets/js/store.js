/* =====================================================================
   Store — lapisan data. Dua mode:
   - "supabase": database online (Auth + Postgres + Storage)
   - "demo"    : localStorage + IndexedDB di browser (untuk pratinjau)
   Semua method async dan mengembalikan objek biasa.
   ===================================================================== */
(function () {
  const CFG = window.QOWIY_CONFIG || {};
  const SEED = window.QOWIY_SEED;
  const useSupabase = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);

  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const bySort = (a, b) => (a.sort || 0) - (b.sort || 0);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const mergeSettings = (d) => Object.assign({}, SEED.settings, d || {}, { plans: (d && d.plans && d.plans.length) ? d.plans : SEED.settings.plans });

  /* ------------------------------------------------------------------ */
  /* IndexedDB kecil untuk file video di mode demo                       */
  /* ------------------------------------------------------------------ */
  const idb = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open("qowiy_media", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("files");
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async put(key, blob) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction("files", "readwrite"); t.objectStore("files").put(blob, key); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
    async get(key) { const db = await this.open(); return new Promise((res, rej) => { const q = db.transaction("files").objectStore("files").get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async del(key) { const db = await this.open(); return new Promise((res) => { const t = db.transaction("files", "readwrite"); t.objectStore("files").delete(key); t.oncomplete = res; }); }
  };
  const blobUrlCache = {};

  /* ------------------------------------------------------------------ */
  /* MODE DEMO                                                           */
  /* ------------------------------------------------------------------ */
  const DKEY = "qowiy_demo_v2", SKEY = "qowiy_demo_session";
  const REF_KEY = "qowiy_ref";
  function demoSeed() {
    const s = clone(SEED); const now = new Date().toISOString();
    return {
      settings: s.settings,
      modules: s.modules.map((m) => ({ id: m.key, title: m.title, subtitle: m.subtitle, track: m.track, sort: m.sort, tag: m.tag, published: true, coach_id: null }))
        .concat([{ id: "cm-hamzah-1", coach_id: "coach-hamzah", title: "Program Pribadi Coach Hamzah", subtitle: "Pekan 1 — adaptasi & evaluasi awal", tag: "PEKAN 1", track: "coach", sort: 1, published: true }]),
      lessons: s.lessons.map((l) => ({ id: l.key, module_id: l.module, coach_id: null, title: l.title, description: l.description, dalil: l.dalil, video_url: l.video_url, storage_path: null, doc_path: null, doc_url: null, duration: l.duration, sort: l.sort, is_free: !!l.is_free, published: true }))
        .concat([
          { id: "cl-h-1", module_id: "cm-hamzah-1", coach_id: "coach-hamzah", title: "Evaluasi awal: foto, lingkar perut, berat", description: "Sebelum mulai, catat 3 data awal:\n\n- Berat badan pagi hari setelah buang air\n- Lingkar perut sejajar pusar\n- Foto depan & samping (simpan pribadi)\n\nKirim angkanya lewat WhatsApp ke saya. Kita evaluasi tiap pekan.", video_url: "", storage_path: null, doc_path: null, doc_url: null, duration: "5 menit", sort: 1, is_free: false, published: true },
          { id: "cl-h-2", module_id: "cm-hamzah-1", coach_id: "coach-hamzah", title: "Pedoman aktivitas fisik (dokumen)", description: "Bacaan wajib pekan ini: rekomendasi aktivitas fisik dewasa 150–300 menit per pekan dari WHO.", video_url: "", storage_path: null, doc_path: null, doc_url: "https://www.who.int/publications/i/item/9789240015128", doc_name: "WHO Guidelines on Physical Activity 2020", duration: "", sort: 2, is_free: false, published: true }
        ]),
      videos: s.videos.map((v) => Object.assign({}, v, { id: v.key, published: true, storage_path: null, thumb_url: "" })),
      articles: s.articles.map((a) => Object.assign({}, a, { id: a.key, published: true, created_at: now })),
      users: [
        { id: "admin-demo", email: "admin@qowiy.id", password: "admin123", full_name: "Admin QOWIY", role: "admin", whatsapp: "", gender: null, quiz: null, created_at: now },
        { id: "coach-hamzah", email: "coach@qowiy.id", password: "coach123", full_name: "Hamzah Ar-Rasyid", role: "coach", whatsapp: "6281200000001", gender: "ikhwan", quiz: null, created_at: now },
        { id: "coach-khadijah", email: "coach2@qowiy.id", password: "coach123", full_name: "Khadijah Azzahra", role: "coach", whatsapp: "6281200000002", gender: "akhwat", quiz: null, created_at: now }
      ],
      coaches: [
        { id: "coach-hamzah", display_name: "Coach Hamzah", gender: "ikhwan", bio: "Pelatih kekuatan 4 tahun. Fokus menurunkan lemak perut dan membangun otot untuk ikhwan sibuk — latihan 30–45 menit ba'da Subuh.", specialties: ["turun", "kuat", "gym", "rumah"], photo_url: "", city: "Bandung", referral_code: "HAMZAH25", active: true, accepting: true, created_at: now },
        { id: "coach-khadijah", display_name: "Coach Khadijah", gender: "akhwat", bio: "Pendamping kebugaran akhwat di rumah dengan pakaian syar'i. Latihan berdampak rendah, cocok untuk ibu rumah tangga dan pemula.", specialties: ["turun", "bugar", "rumah", "sunnah"], photo_url: "", city: "Yogyakarta", referral_code: "KHADIJAH25", active: true, accepting: true, created_at: now }
      ],
      coach_applications: [], coach_earnings: [], coach_notes: [],
      subscriptions: [], progress: [], habits: {}, quiz_leads: [], meal_plans: [], health_logs: []
    };
  }
  function dload() { try { const d = JSON.parse(localStorage.getItem(DKEY)); if (d && d.modules) return d; } catch (e) {} const d = demoSeed(); dsave(d); return d; }
  function dsave(d) { localStorage.setItem(DKEY, JSON.stringify(d)); }
  function dme() { const id = localStorage.getItem(SKEY); if (!id) return null; return dload().users.find((u) => u.id === id) || null; }
  function dActive(userId) { const d = dload(); return d.subscriptions.some((s) => s.user_id === userId && s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date())); }
  const isStaff = (me) => me && (me.role === "admin" || me.role === "coach");
  function dModVisible(m, me) {
    if (me && (me.role === "admin" || m.coach_id === me.id)) return true;
    return m.published && (!m.coach_id || (me && m.coach_id === me.coach_id));
  }
  function dVisible(row, me) {
    if (me && (me.role === "admin" || (row.coach_id && row.coach_id === me.id))) return true;
    if (me && me.role === "coach" && !row.coach_id) return true;
    if (row.coach_id && !(me && row.coach_id === me.coach_id)) return false;
    return row.published && (row.is_free || (me && dActive(me.id)));
  }
  const pubCoach = (c) => ({ id: c.id, display_name: c.display_name, gender: c.gender, bio: c.bio, specialties: c.specialties || [], photo_url: c.photo_url, city: c.city, referral_code: c.referral_code, accepting: c.accepting, active: c.active });
  function genCode(d, name) {
    let base = (String(name || "").split(" ")[0] || "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8); if (base.length < 3) base = "COACH";
    let code; do { code = base + (10 + Math.floor(Math.random() * 90)); } while (d.coaches.some((c) => c.referral_code === code)); return code;
  }
  function dMakeCoach(d, u, app) {
    if (u.role !== "admin") u.role = "coach";
    if (!u.whatsapp && app.whatsapp) u.whatsapp = app.whatsapp;
    if (!u.gender) u.gender = app.gender;
    const ex = d.coaches.find((c) => c.id === u.id);
    if (ex) ex.active = true;
    else d.coaches.push({ id: u.id, display_name: app.full_name || u.full_name || "Pelatih", gender: app.gender || "ikhwan", bio: app.bio || "", specialties: [], photo_url: "", city: app.city || "", referral_code: genCode(d, app.full_name || u.full_name), active: true, accepting: true, created_at: new Date().toISOString() });
  }
  /* Komisi otomatis — sama dengan trigger compute_coach_earnings di database */
  function dEarn(d, sub) {
    if (!sub || sub.status !== "active" || !(sub.amount > 0)) return;
    const s = mergeSettings(d.settings); const u = d.users.find((x) => x.id === sub.user_id); if (!u) return;
    const share = +s.coach_share_pct || 0, rval = +s.referral_value || 0, rmode = s.referral_mode || "persen", rscope = s.referral_scope || "pertama";
    const has = (kind) => d.coach_earnings.some((e) => e.subscription_id === sub.id && e.kind === kind);
    const add = (o) => d.coach_earnings.push(Object.assign({ id: uid(), status: "tertunda", created_at: new Date().toISOString(), paid_at: null, member_id: u.id, subscription_id: sub.id }, o));
    if (u.coach_id && share > 0 && !has("bagi_hasil")) add({ coach_id: u.coach_id, kind: "bagi_hasil", base_amount: sub.amount, rate: share, amount: Math.round(sub.amount * share / 100) });
    if (u.referred_by && rval > 0 && !has("referral")) {
      const prior = d.subscriptions.some((x) => x.user_id === u.id && x.id !== sub.id && ["active", "expired"].includes(x.status) && x.amount > 0);
      if (rscope === "setiap" || !prior) {
        const plan = (s.plans || []).find((p) => p.id === sub.plan); const normal = plan ? plan.price : sub.amount;
        add({ coach_id: u.referred_by, kind: "referral", base_amount: normal, rate: rmode === "nominal" ? null : rval, amount: rmode === "nominal" ? Math.round(rval) : Math.round(normal * rval / 100) });
      }
    }
  }
  function dCoachMembers(d, target) {
    const since = new Date(Date.now() - 6 * 864e5); const sinceK = new Date(since.getTime() - since.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return d.users.filter((u) => u.coach_id === target || u.referred_by === target).map((u) => {
      const mine = u.coach_id === target; const subs = d.subscriptions.filter((s) => s.user_id === u.id);
      const act = subs.filter((s) => s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date())).sort((a, b) => (b.activated_at || "").localeCompare(a.activated_at || ""))[0];
      const H = d.habits[u.id] || {}; const wk = Object.keys(H).filter((k) => k >= sinceK).map((k) => Object.values(H[k]).filter(Boolean).length);
      const W = (d.health_logs || []).filter((l) => l.user_id === u.id && l.kind === "weight").sort((a, b) => a.measured_at.localeCompare(b.measured_at));
      return { id: u.id, full_name: u.full_name, email: mine ? u.email : null, whatsapp: mine ? u.whatsapp : null, gender: u.gender, created_at: u.created_at, goal: u.quiz && u.quiz.goal,
        is_mine: mine, via_referral: u.referred_by === target, sub_status: act ? "aktif" : subs.some((s) => s.status === "pending") ? "pending" : "belum", sub_plan: act ? act.plan_name : null, expires_at: act ? act.expires_at : null,
        lessons_done: mine ? d.progress.filter((p) => p.user_id === u.id).length : null, habit_days7: mine ? wk.filter((n) => n >= 5).length : null, habit_avg7: mine && wk.length ? +(wk.reduce((a, b) => a + b, 0) / wk.length).toFixed(1) : null,
        last_checkin: mine ? Object.keys(H).sort().pop() || null : null, last_weight: mine && W.length ? W[W.length - 1].value : null, first_weight: mine && W.length ? W[0].value : null };
    }).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }
  async function idbUrl(path) {
    if (blobUrlCache[path]) return blobUrlCache[path];
    const blob = await idb.get(path); if (!blob) return null;
    return (blobUrlCache[path] = URL.createObjectURL(blob));
  }
  async function idbUpload(file, onProgress) {
    const key = "idb:" + uid() + "-" + file.name.replace(/[^\w.\-]/g, "_");
    let p = 0; const t = setInterval(() => { p = Math.min(0.9, p + 0.15); onProgress && onProgress(p); }, 120);
    await idb.put(key, file); clearInterval(t); onProgress && onProgress(1);
    return { path: key };
  }

  const Demo = {
    mode: "demo",
    async session() { const u = dme(); return u ? { user: { id: u.id, email: u.email } } : null; },
    async signUp({ email, password, full_name, whatsapp, gender, quiz, coach_id, ref }) {
      const d = dload(); email = (email || "").trim().toLowerCase();
      if (d.users.some((u) => u.email === email)) throw new Error("Email sudah terdaftar. Silakan masuk.");
      if ((password || "").length < 6) throw new Error("Password minimal 6 karakter.");
      const u = { id: uid(), email, password, full_name, whatsapp, gender: gender || null, role: "member", quiz: quiz || null, coach_id: null, referred_by: null, created_at: new Date().toISOString() };
      const app = d.coach_applications.filter((a) => a.email.toLowerCase() === email && a.status === "approved").pop();
      if (app) { d.users.push(u); dMakeCoach(d, u, app); }
      else {
        const refC = ref && d.coaches.find((c) => c.active && c.referral_code === String(ref).trim().toUpperCase());
        const pick = coach_id && d.coaches.find((c) => c.id === coach_id && c.active && c.accepting && (!u.gender || c.gender === u.gender));
        u.referred_by = refC ? refC.id : null;
        u.coach_id = pick ? pick.id : refC && (!u.gender || refC.gender === u.gender) ? refC.id : null;
        d.users.push(u);
      }
      dsave(d); localStorage.setItem(SKEY, u.id); return { user: u };
    },
    async signIn(email, password) {
      const u = dload().users.find((x) => x.email === (email || "").trim().toLowerCase() && x.password === password);
      if (!u) throw new Error("Email atau password salah.");
      localStorage.setItem(SKEY, u.id); return { user: u };
    },
    async signOut() { localStorage.removeItem(SKEY); },
    async resetPassword() { throw new Error("Mode demo: reset password tidak tersedia. Gunakan akun baru."); },
    async me() { const u = dme(); if (!u) return null; const { password, ...rest } = u; return rest; },
    async updateMe(patch) { const d = dload(); const u = d.users.find((x) => x.id === localStorage.getItem(SKEY)); if (!u) throw new Error("Belum masuk"); delete patch.role; delete patch.referred_by; delete patch.coach_id; Object.assign(u, patch); dsave(d); return u; },
    async settings() { return mergeSettings(dload().settings); },
    async saveSettings(data) { const d = dload(); d.settings = data; dsave(d); },
    async mySubs() { const u = dme(); if (!u) return []; return dload().subscriptions.filter((s) => s.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async requestSub(plan) {
      const u = dme(); if (!u) throw new Error("Silakan masuk dulu");
      const d = dload(); const row = { id: uid(), user_id: u.id, plan: plan.id, plan_name: plan.name, amount: plan.price, status: "pending", created_at: new Date().toISOString(), activated_at: null, expires_at: null };
      d.subscriptions.push(row); dsave(d); return row;
    },
    async demoActivate(subId) { const d = dload(); const s = d.subscriptions.find((x) => x.id === subId); if (s) { s.status = "active"; s.activated_at = new Date().toISOString(); dEarn(d, s); dsave(d); } },
    async modules() { const me = dme(); return dload().modules.filter((m) => dModVisible(m, me)).sort(bySort); },
    async lessons() { const me = dme(); return dload().lessons.filter((l) => dVisible(l, me)).sort(bySort); },
    async lessonCounts() { const me = dme(); const d = dload(); const vis = new Set(d.modules.filter((m) => dModVisible(m, me)).map((m) => m.id)); const c = {}; d.lessons.filter((l) => l.published && vis.has(l.module_id)).forEach((l) => (c[l.module_id] = (c[l.module_id] || 0) + 1)); return c; },
    async videos(kind) { const me = dme(); return dload().videos.filter((v) => v.kind === kind && dVisible(v, me)).sort(bySort); },
    async videoTeasers(kind) { return dload().videos.filter((v) => v.kind === kind && v.published).sort(bySort).map((v) => ({ id: v.id, title: v.title, duration: v.duration, time_slot: v.time_slot, trainer: v.trainer, is_free: v.is_free })); },
    async articles() { return dload().articles.filter((a) => a.published).sort((a, b) => (a.key || "").localeCompare(b.key || "")); },
    async article(slug) { return dload().articles.find((a) => a.slug === slug && a.published) || null; },
    async progress() { const u = dme(); if (!u) return new Set(); return new Set(dload().progress.filter((p) => p.user_id === u.id).map((p) => p.lesson_id)); },
    async setProgress(lessonId, done) {
      const u = dme(); if (!u) return; const d = dload();
      d.progress = d.progress.filter((p) => !(p.user_id === u.id && p.lesson_id === lessonId));
      if (done) d.progress.push({ user_id: u.id, lesson_id: lessonId, completed_at: new Date().toISOString() });
      dsave(d);
    },
    async habits(day) { const u = dme(); if (!u) return {}; return (dload().habits[u.id] || {})[day] || {}; },
    async saveHabits(day, items) { const u = dme(); if (!u) return; const d = dload(); d.habits[u.id] = d.habits[u.id] || {}; d.habits[u.id][day] = items; dsave(d); },
    async habitsSince(fromDay) { const u = dme(); if (!u) return {}; const all = dload().habits[u.id] || {}; const out = {}; Object.keys(all).forEach((k) => { if (k >= fromDay) out[k] = all[k]; }); return out; },
    async saveLead(lead) { const d = dload(); d.quiz_leads.push(Object.assign({ id: uid(), created_at: new Date().toISOString() }, lead)); dsave(d); },
    async listPlans() { const u = dme(); if (!u) return []; return (dload().meal_plans || []).filter((x) => x.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async savePlan(name, plan) { const u = dme(); if (!u) throw new Error("Silakan masuk dulu"); const d = dload(); d.meal_plans = d.meal_plans || []; const row = { id: uid(), user_id: u.id, name, plan, created_at: new Date().toISOString() }; d.meal_plans.push(row); dsave(d); return row; },
    async deletePlan(id) { const d = dload(); d.meal_plans = (d.meal_plans || []).filter((x) => x.id !== id); dsave(d); },
    async addLog(kind, value, meta, source, measured_at) { const u = dme(); if (!u) throw new Error("Silakan masuk dulu"); const d = dload(); d.health_logs = d.health_logs || []; const row = { id: uid(), user_id: u.id, kind, value: +value, meta: meta || null, source: source || "manual", measured_at: measured_at || new Date().toISOString() }; d.health_logs.push(row); dsave(d); return row; },
    async logs(kind, days) { const u = dme(); if (!u) return []; const from = Date.now() - (days || 90) * 864e5; return (dload().health_logs || []).filter((x) => x.user_id === u.id && (!kind || x.kind === kind) && new Date(x.measured_at).getTime() >= from).sort((a, b) => a.measured_at.localeCompare(b.measured_at)); },
    async deleteLog(id) { const d = dload(); d.health_logs = (d.health_logs || []).filter((x) => x.id !== id); dsave(d); },
    async googleStatus() { return { connected: false, demo: true }; },
    async googleAction() { const e = new Error("Mode demo: Google Health aktif setelah aplikasi online dan kredensial Google dipasang admin."); e.code = "google_disabled"; throw e; },
    async aiMenu() { const e = new Error("Mode demo: rekomendasi AI aktif setelah aplikasi online dan kunci API dipasang."); e.code = "ai_disabled"; throw e; },
    async mediaUrl(item) {
      if (!item) return null;
      if (item.storage_path && item.storage_path.startsWith("idb:")) return idbUrl(item.storage_path);
      return item.video_url || null;
    },
    async docUrl(item) {
      if (!item) return null;
      if (item.doc_path && item.doc_path.startsWith("idb:")) return idbUrl(item.doc_path);
      return item.doc_url || null;
    },
    /* ---------- pelatih (sisi publik & member) ---------- */
    async coaches() { return dload().coaches.filter((c) => c.active).map(pubCoach); },
    async myCoach() { const me = dme(); if (!me || !me.coach_id) return null; const d = dload(); const c = d.coaches.find((x) => x.id === me.coach_id); if (!c) return null; const u = d.users.find((x) => x.id === c.id) || {}; return Object.assign(pubCoach(c), { whatsapp: u.whatsapp }); },
    async setMyCoach(coachId) {
      const d = dload(); const u = d.users.find((x) => x.id === localStorage.getItem(SKEY)); if (!u) throw new Error("Silakan masuk dulu");
      const c = coachId && d.coaches.find((x) => x.id === coachId && x.active && x.accepting && (!u.gender || x.gender === u.gender));
      if (coachId && !c) throw new Error("Pelatih tidak tersedia untuk akun ini"); u.coach_id = coachId || null; dsave(d);
    },
    async myNotes() { const me = dme(); if (!me) return []; return dload().coach_notes.filter((n) => n.member_id === me.id).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async applyCoach(data, file) {
      const d = dload(); const email = (data.email || "").trim().toLowerCase();
      if (d.coach_applications.some((a) => a.email.toLowerCase() === email && a.status === "pending")) throw new Error("Email ini sudah mendaftar dan sedang diseleksi admin.");
      let cv_path = null; if (file) cv_path = (await idbUpload(file)).path;
      d.coach_applications.push(Object.assign({}, data, { id: uid(), email, cv_path, status: "pending", admin_note: null, created_at: new Date().toISOString(), reviewed_at: null })); dsave(d);
    },
    async myApplication() { const me = dme(); if (!me) return null; const a = dload().coach_applications.filter((x) => x.email.toLowerCase() === (me.email || "").toLowerCase()).sort((x, y) => x.created_at.localeCompare(y.created_at)).pop(); return a ? { status: a.status, created_at: a.created_at, admin_note: a.admin_note } : null; },
    /* ---------- panel pelatih ---------- */
    coach: {
      async profile() { const me = dme(); if (!me) return null; const c = dload().coaches.find((x) => x.id === me.id); return c ? clone(c) : null; },
      async saveProfile(patch) { const d = dload(); const me = dme(); const c = d.coaches.find((x) => x.id === me.id); ["display_name", "bio", "specialties", "photo_url", "city", "accepting"].forEach((k) => k in patch && (c[k] = patch[k])); dsave(d); return c; },
      async members() { const me = dme(); return dCoachMembers(dload(), me.id); },
      async memberDetail(id) {
        const d = dload(); const me = dme(); const u = d.users.find((x) => x.id === id);
        if (!u || (u.coach_id !== me.id && me.role !== "admin")) throw new Error("Bukan member binaan Anda");
        const H = d.habits[u.id] || {}; const from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
        return { profile: { id: u.id, full_name: u.full_name, email: u.email, whatsapp: u.whatsapp, gender: u.gender, quiz: u.quiz, nutrition: u.nutrition || null },
          habits: Object.keys(H).filter((k) => k > from).sort().map((k) => ({ day: k, items: H[k] })),
          weights: (d.health_logs || []).filter((l) => l.user_id === u.id && l.kind === "weight").sort((a, b) => a.measured_at.localeCompare(b.measured_at)).map((l) => ({ value: l.value, at: l.measured_at })),
          steps: (d.health_logs || []).filter((l) => l.user_id === u.id && l.kind === "steps").map((l) => ({ value: l.value, at: l.measured_at })),
          progress: d.progress.filter((p) => p.user_id === u.id).map((p) => ({ lesson_id: p.lesson_id, at: p.completed_at })),
          notes: d.coach_notes.filter((n) => n.member_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((n) => ({ id: n.id, body: n.body, at: n.created_at })) };
      },
      async addNote(memberId, body) { const d = dload(); const me = dme(); const u = d.users.find((x) => x.id === memberId); if (!u || u.coach_id !== me.id) throw new Error("Bukan member binaan Anda"); d.coach_notes.push({ id: uid(), coach_id: me.id, member_id: memberId, body, created_at: new Date().toISOString() }); dsave(d); },
      async deleteNote(id) { const d = dload(); d.coach_notes = d.coach_notes.filter((n) => n.id !== id); dsave(d); },
      async modules() { const me = dme(); return dload().modules.filter((m) => m.coach_id === me.id).sort(bySort); },
      async lessons() { const me = dme(); return dload().lessons.filter((l) => l.coach_id === me.id).sort(bySort); },
      async upsert(table, row) { const me = dme(); return Demo.admin.upsert(table, Object.assign({}, row, { coach_id: me.id })); },
      async remove(table, id) { return Demo.admin.remove(table, id); },
      async earnings() { const me = dme(); return dload().coach_earnings.filter((e) => e.coach_id === me.id).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
      async upload(file, opts, onProgress) { return Demo.admin.upload(file, opts, onProgress); }
    },
    /* ---------- admin ---------- */
    admin: {
      async list(table) {
        const d = dload();
        if (table === "members") return Demo.admin.members();
        const rows = clone(d[table] || []);
        return rows.sort((a, b) => (a.sort != null && b.sort != null ? a.sort - b.sort : (b.created_at || "").localeCompare(a.created_at || "")));
      },
      async upsert(table, row) {
        const d = dload(); d[table] = d[table] || [];
        if (!row.id) { row.id = uid(); row.created_at = new Date().toISOString(); d[table].push(row); }
        else { const i = d[table].findIndex((x) => x.id === row.id); if (i >= 0) d[table][i] = Object.assign(d[table][i], row); else d[table].push(row); }
        dsave(d); return row;
      },
      async remove(table, id) {
        const d = dload(); const row = (d[table] || []).find((x) => x.id === id);
        if (row && row.storage_path && row.storage_path.startsWith("idb:")) await idb.del(row.storage_path);
        d[table] = (d[table] || []).filter((x) => x.id !== id);
        if (table === "modules") d.lessons = d.lessons.filter((l) => l.module_id !== id);
        [row && row.doc_path].filter((x) => x && x.startsWith("idb:")).forEach((k) => idb.del(k));
        dsave(d);
      },
      async members() {
        const d = dload();
        return d.users.map((u) => { const { password, ...rest } = u; return Object.assign(rest, { subscriptions: d.subscriptions.filter((s) => s.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)), done: d.progress.filter((p) => p.user_id === u.id).length }); })
          .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      },
      async setSubStatus(id, status, expires_at) { const d = dload(); const s = d.subscriptions.find((x) => x.id === id); if (!s) return; const was = s.status; s.status = status; if (status === "active") s.activated_at = new Date().toISOString(); if (expires_at !== undefined) s.expires_at = expires_at; if (status === "active" && was !== "active") dEarn(d, s); dsave(d); },
      async grantSub(userId, plan, expires_at) { const d = dload(); d.subscriptions.push({ id: uid(), user_id: userId, plan: plan.id, plan_name: plan.name, amount: 0, status: "active", note: "Diberikan admin", created_at: new Date().toISOString(), activated_at: new Date().toISOString(), expires_at: expires_at || null }); dsave(d); },
      async setRole(userId, role) { const d = dload(); const u = d.users.find((x) => x.id === userId); if (u) { u.role = role; dsave(d); } },
      async upload(file, { isPublic } = {}, onProgress) {
        if (isPublic) { const url = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); }); onProgress && onProgress(1); return { url }; }
        return idbUpload(file, onProgress);
      },
      /* pelatih */
      async approveCoach(id) { const d = dload(); const a = d.coach_applications.find((x) => x.id === id); if (!a) throw new Error("Pendaftaran tidak ditemukan"); a.status = "approved"; a.reviewed_at = new Date().toISOString(); const u = d.users.find((x) => x.email.toLowerCase() === a.email.toLowerCase()); if (u) dMakeCoach(d, u, a); dsave(d); const c = u && d.coaches.find((x) => x.id === u.id); return { linked: !!u, referral_code: c ? c.referral_code : null }; },
      async rejectCoach(id, note) { const d = dload(); const a = d.coach_applications.find((x) => x.id === id); if (a) { a.status = "rejected"; a.admin_note = note || null; a.reviewed_at = new Date().toISOString(); dsave(d); } },
      async cvUrl(path) { return path && path.startsWith("idb:") ? idbUrl(path) : null; },
      async setCoachActive(id, active) { const d = dload(); const c = d.coaches.find((x) => x.id === id); if (c) c.active = active; const u = d.users.find((x) => x.id === id); if (u && u.role !== "admin") u.role = active ? "coach" : "member"; dsave(d); },
      async setMemberCoach(userId, coachId) { const d = dload(); const u = d.users.find((x) => x.id === userId); if (u) { u.coach_id = coachId || null; dsave(d); } },
      async coachMembers(coachId) { return dCoachMembers(dload(), coachId); },
      async markPaid(ids, status) { const d = dload(); d.coach_earnings.forEach((e) => { if (ids.includes(e.id)) { e.status = status || "dibayar"; e.paid_at = (status || "dibayar") === "dibayar" ? new Date().toISOString() : null; } }); dsave(d); },
      async resetDemo() { localStorage.removeItem(DKEY); localStorage.removeItem(SKEY); }
    }
  };

  /* ------------------------------------------------------------------ */
  /* MODE SUPABASE                                                       */
  /* ------------------------------------------------------------------ */
  let sb = null;
  const must = (r) => { if (r.error) throw new Error(translateErr(r.error.message)); return r.data; };
  function translateErr(m) {
    if (!m) return "Terjadi kesalahan";
    if (/Invalid login credentials/i.test(m)) return "Email atau password salah.";
    if (/already registered/i.test(m)) return "Email sudah terdaftar. Silakan masuk.";
    if (/Email not confirmed/i.test(m)) return "Email belum dikonfirmasi. Cek kotak masuk email Anda.";
    if (/Password should be/i.test(m)) return "Password minimal 6 karakter.";
    if (/row-level security/i.test(m)) return "Akses ditolak (akun Anda tidak punya izin untuk aksi ini).";
    return m;
  }

  const Supa = {
    mode: "supabase",
    client() { return sb; },
    async session() { const { data } = await sb.auth.getSession(); return data.session ? { user: data.session.user } : null; },
    async signUp({ email, password, full_name, whatsapp, gender, quiz, coach_id, ref }) {
      const meta = { full_name, whatsapp, gender, quiz }; if (coach_id) meta.coach_id = coach_id; if (ref) meta.ref = ref;
      const r = await sb.auth.signUp({ email, password, options: { data: meta, emailRedirectTo: location.origin + location.pathname + "#/dashboard" } });
      const data = must(r); return { user: data.user, needsConfirm: !data.session };
    },
    async signIn(email, password) { return must(await sb.auth.signInWithPassword({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async resetPassword(email) { must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + "#/akun" })); },
    async updatePassword(pw) { must(await sb.auth.updateUser({ password: pw })); },
    async me() { const s = await Supa.session(); if (!s) return null; const r = await sb.from("profiles").select("*").eq("id", s.user.id).maybeSingle(); return must(r) || { id: s.user.id, email: s.user.email, role: "member" }; },
    async updateMe(patch) { const s = await Supa.session(); delete patch.role; delete patch.referred_by; delete patch.coach_id; return must(await sb.from("profiles").update(patch).eq("id", s.user.id).select().single()); },
    async settings() { const r = await sb.from("settings").select("data").eq("id", 1).maybeSingle(); return mergeSettings(r.data && r.data.data); },
    async saveSettings(data) { must(await sb.from("settings").upsert({ id: 1, data })); },
    async mySubs() { const s = await Supa.session(); if (!s) return []; return must(await sb.from("subscriptions").select("*").eq("user_id", s.user.id).order("created_at", { ascending: false })); },
    async requestSub(plan) { const s = await Supa.session(); if (!s) throw new Error("Silakan masuk dulu"); return must(await sb.from("subscriptions").insert({ user_id: s.user.id, plan: plan.id, plan_name: plan.name, amount: plan.price, status: "pending" }).select().single()); },
    async modules() { return must(await sb.from("modules").select("*").order("sort")); },
    async lessons() { return must(await sb.from("lessons").select("*").order("sort")); },
    async lessonCounts() { const r = await sb.rpc("lesson_counts"); if (r.error) return null; const c = {}; (r.data || []).forEach((x) => (c[x.module_id] = x.total)); return c; },
    async videos(kind) { return must(await sb.from("videos").select("*").eq("kind", kind).order("sort")); },
    async videoTeasers(kind) { const r = await sb.rpc("video_teasers", { p_kind: kind }); return r.error ? [] : r.data || []; },
    async articles() { return must(await sb.from("articles").select("id,slug,title,category,excerpt,read_min,cover_url,created_at").eq("published", true).order("created_at", { ascending: true })); },
    async article(slug) { return must(await sb.from("articles").select("*").eq("slug", slug).maybeSingle()); },
    async progress() { const s = await Supa.session(); if (!s) return new Set(); const rows = must(await sb.from("progress").select("lesson_id").eq("user_id", s.user.id)); return new Set(rows.map((r) => r.lesson_id)); },
    async setProgress(lessonId, done) { const s = await Supa.session(); if (!s) return; if (done) must(await sb.from("progress").upsert({ user_id: s.user.id, lesson_id: lessonId })); else must(await sb.from("progress").delete().eq("user_id", s.user.id).eq("lesson_id", lessonId)); },
    async habits(day) { const s = await Supa.session(); if (!s) return {}; const r = must(await sb.from("habits").select("items").eq("user_id", s.user.id).eq("day", day).maybeSingle()); return (r && r.items) || {}; },
    async saveHabits(day, items) { const s = await Supa.session(); if (!s) return; must(await sb.from("habits").upsert({ user_id: s.user.id, day, items })); },
    async habitsSince(fromDay) { const s = await Supa.session(); if (!s) return {}; const rows = must(await sb.from("habits").select("day,items").eq("user_id", s.user.id).gte("day", fromDay)); const o = {}; rows.forEach((r) => (o[r.day] = r.items)); return o; },
    async saveLead(lead) { const r = await sb.from("quiz_leads").insert(lead); if (r.error) console.warn(r.error); },
    async listPlans() { const s = await Supa.session(); if (!s) return []; return must(await sb.from("meal_plans").select("*").eq("user_id", s.user.id).order("created_at", { ascending: false })); },
    async savePlan(name, plan) { const s = await Supa.session(); if (!s) throw new Error("Silakan masuk dulu"); return must(await sb.from("meal_plans").insert({ user_id: s.user.id, name, plan }).select().single()); },
    async deletePlan(id) { must(await sb.from("meal_plans").delete().eq("id", id)); },
    async addLog(kind, value, meta, source, measured_at) { const s = await Supa.session(); if (!s) throw new Error("Silakan masuk dulu"); return must(await sb.from("health_logs").insert({ user_id: s.user.id, kind, value: +value, meta: meta || null, source: source || "manual", measured_at: measured_at || new Date().toISOString() }).select().single()); },
    async logs(kind, days) { const s = await Supa.session(); if (!s) return []; let q = sb.from("health_logs").select("*").eq("user_id", s.user.id).gte("measured_at", new Date(Date.now() - (days || 90) * 864e5).toISOString()).order("measured_at"); if (kind) q = q.eq("kind", kind); return must(await q); },
    async deleteLog(id) { must(await sb.from("health_logs").delete().eq("id", id)); },
    async googleStatus() { const r = await sb.rpc("google_link_status"); return r.error ? { connected: false } : r.data; },
    async googleAction(action) {
      const { data } = await sb.auth.getSession(); const token = data.session && data.session.access_token;
      const r = await fetch("/api/google/" + action, { method: "POST", headers: { "content-type": "application/json", Authorization: "Bearer " + (token || "") }, body: "{}" });
      let j = {}; try { j = await r.json(); } catch (e) {}
      if (!r.ok) { const e = new Error(j.error || "Google Health gagal (" + r.status + ")"); e.code = j.code; throw e; }
      return j;
    },
    async aiMenu(payload) {
      const { data } = await sb.auth.getSession(); const token = data.session && data.session.access_token;
      const r = await fetch("/api/menu", { method: "POST", headers: { "content-type": "application/json", Authorization: "Bearer " + (token || "") }, body: JSON.stringify(payload) });
      let j = {}; try { j = await r.json(); } catch (e) {}
      if (!r.ok) { const e = new Error(j.error || "Rekomendasi AI gagal (" + r.status + ")"); e.code = j.code; throw e; }
      return j;
    },
    async mediaUrl(item) {
      if (!item) return null;
      if (item.storage_path) { const r = await sb.storage.from(CFG.MEDIA_BUCKET || "media").createSignedUrl(item.storage_path, 60 * 60 * 3); if (!r.error) return r.data.signedUrl; }
      return item.video_url || null;
    },
    async docUrl(item) {
      if (!item) return null;
      if (item.doc_path) { const r = await sb.storage.from(CFG.MEDIA_BUCKET || "media").createSignedUrl(item.doc_path, 60 * 60 * 3); if (!r.error) return r.data.signedUrl; }
      return item.doc_url || null;
    },
    /* ---------- pelatih (sisi publik & member) ---------- */
    async coaches() { const r = await sb.from("coaches").select("id,display_name,gender,bio,specialties,photo_url,city,referral_code,accepting,active").eq("active", true).order("created_at"); return r.error ? [] : r.data || []; },
    async myCoach() { const s = await Supa.session(); if (!s) return null; const r = await sb.rpc("my_coach"); return r.error ? null : r.data || null; },
    async setMyCoach(coachId) { const s = await Supa.session(); if (!s) throw new Error("Silakan masuk dulu"); must(await sb.from("profiles").update({ coach_id: coachId || null }).eq("id", s.user.id)); },
    async myNotes() { const s = await Supa.session(); if (!s) return []; const r = await sb.from("coach_notes").select("*").eq("member_id", s.user.id).order("created_at", { ascending: false }).limit(20); return r.error ? [] : r.data; },
    async applyCoach(data, file) {
      let cv_path = null;
      if (file) {
        cv_path = "lamaran/" + new Date().toISOString().slice(0, 7) + "/" + uid() + "-" + file.name.replace(/[^\w.\-]/g, "_");
        const up = await sb.storage.from("cv").upload(cv_path, file, { contentType: file.type || undefined, upsert: false });
        if (up.error) throw new Error(/size|exceed/i.test(up.error.message) ? "Ukuran CV maksimal 5 MB." : /mime|type/i.test(up.error.message) ? "Format CV harus PDF, Word, atau gambar." : "Upload CV gagal: " + up.error.message);
      }
      const r = await sb.from("coach_applications").insert(Object.assign({}, data, { email: (data.email || "").trim().toLowerCase(), cv_path }));
      if (r.error) throw new Error(/coach_app_pending_email|duplicate/i.test(r.error.message) ? "Email ini sudah mendaftar dan sedang diseleksi admin." : translateErr(r.error.message));
    },
    async myApplication() { const s = await Supa.session(); if (!s) return null; const r = await sb.rpc("my_coach_application"); return r.error ? null : r.data || null; },
    /* ---------- panel pelatih ---------- */
    coach: {
      async me() { const s = await Supa.session(); return s && s.user.id; },
      async profile() { const id = await Supa.coach.me(); return must(await sb.from("coaches").select("*").eq("id", id).maybeSingle()); },
      async saveProfile(patch) { const id = await Supa.coach.me(); const p = {}; ["display_name", "bio", "specialties", "photo_url", "city", "accepting"].forEach((k) => k in patch && (p[k] = patch[k])); return must(await sb.from("coaches").update(p).eq("id", id).select().single()); },
      async members() { return must(await sb.rpc("coach_members")); },
      async memberDetail(id) { return must(await sb.rpc("coach_member_detail", { p_member: id })); },
      async addNote(memberId, body) { const id = await Supa.coach.me(); must(await sb.from("coach_notes").insert({ coach_id: id, member_id: memberId, body })); },
      async deleteNote(noteId) { must(await sb.from("coach_notes").delete().eq("id", noteId)); },
      async modules() { const id = await Supa.coach.me(); return must(await sb.from("modules").select("*").eq("coach_id", id).order("sort")); },
      async lessons() { const id = await Supa.coach.me(); return must(await sb.from("lessons").select("*").eq("coach_id", id).order("sort")); },
      async upsert(table, row) { const id = await Supa.coach.me(); return Supa.admin.upsert(table, Object.assign({}, row, { coach_id: id })); },
      async remove(table, rowId) { return Supa.admin.remove(table, rowId); },
      async earnings() { const id = await Supa.coach.me(); return must(await sb.from("coach_earnings").select("*").eq("coach_id", id).order("created_at", { ascending: false })); },
      async upload(file, opts, onProgress) { const id = await Supa.coach.me(); return Supa.admin.upload(file, Object.assign({}, opts, { prefix: "coach/" + id }), onProgress); }
    },
    admin: {
      async list(table) {
        if (table === "members") return Supa.admin.members();
        let q = sb.from(table).select("*");
        q = ["modules", "lessons", "videos"].includes(table) ? q.order("sort") : q.order("created_at", { ascending: false });
        return must(await q);
      },
      async upsert(table, row) { const r = Object.assign({}, row); if (!r.id) delete r.id; delete r.key; return must(await sb.from(table).upsert(r).select().single()); },
      async remove(table, id) {
        const row = must(await sb.from(table).select("*").eq("id", id).maybeSingle());
        must(await sb.from(table).delete().eq("id", id));
        const files = [row && row.storage_path, row && row.doc_path].filter(Boolean);
        if (files.length) await sb.storage.from(CFG.MEDIA_BUCKET || "media").remove(files);
      },
      async members() {
        const [profiles, subs, prog] = await Promise.all([
          sb.from("profiles").select("*").order("created_at", { ascending: false }),
          sb.from("subscriptions").select("*").order("created_at", { ascending: false }),
          sb.from("progress").select("user_id")
        ]);
        const P = must(profiles), S = must(subs), G = prog.data || [];
        return P.map((p) => Object.assign(p, { subscriptions: S.filter((s) => s.user_id === p.id), done: G.filter((g) => g.user_id === p.id).length }));
      },
      async setSubStatus(id, status, expires_at) { const patch = { status }; if (status === "active") patch.activated_at = new Date().toISOString(); if (expires_at !== undefined) patch.expires_at = expires_at; must(await sb.from("subscriptions").update(patch).eq("id", id)); },
      async grantSub(userId, plan, expires_at) { must(await sb.from("subscriptions").insert({ user_id: userId, plan: plan.id, plan_name: plan.name, amount: 0, status: "active", note: "Diberikan admin", activated_at: new Date().toISOString(), expires_at: expires_at || null })); },
      async setRole(userId, role) { must(await sb.from("profiles").update({ role }).eq("id", userId)); },
      /* pelatih */
      async approveCoach(id) { return must(await sb.rpc("approve_coach_application", { p_id: id })); },
      async rejectCoach(id, note) { must(await sb.from("coach_applications").update({ status: "rejected", admin_note: note || null, reviewed_at: new Date().toISOString() }).eq("id", id)); },
      async cvUrl(path) { if (!path) return null; const r = await sb.storage.from("cv").createSignedUrl(path, 60 * 30); return r.error ? null : r.data.signedUrl; },
      async setCoachActive(id, active) { must(await sb.rpc("set_coach_active", { p_id: id, p_active: active })); },
      async setMemberCoach(userId, coachId) { must(await sb.from("profiles").update({ coach_id: coachId || null }).eq("id", userId)); },
      async coachMembers(coachId) { return must(await sb.rpc("coach_members", { p_coach: coachId })); },
      async markPaid(ids, status) { const st = status || "dibayar"; must(await sb.from("coach_earnings").update({ status: st, paid_at: st === "dibayar" ? new Date().toISOString() : null }).in("id", ids)); },
      /* Upload via XHR agar ada progress bar. */
      async upload(file, { isPublic, prefix } = {}, onProgress) {
        const bucket = isPublic ? (CFG.PUBLIC_BUCKET || "public-assets") : (CFG.MEDIA_BUCKET || "media");
        const { data } = await sb.auth.getSession(); const token = data.session && data.session.access_token;
        const path = (prefix ? prefix + "/" : "") + new Date().toISOString().slice(0, 7) + "/" + uid() + "-" + file.name.replace(/[^\w.\-]/g, "_");
        await new Promise((res, rej) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", CFG.SUPABASE_URL.replace(/\/$/, "") + "/storage/v1/object/" + bucket + "/" + path);
          xhr.setRequestHeader("Authorization", "Bearer " + token);
          xhr.setRequestHeader("apikey", CFG.SUPABASE_ANON_KEY);
          xhr.setRequestHeader("x-upsert", "false");
          if (file.type) xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
          xhr.onload = () => (xhr.status < 300 ? res() : rej(new Error("Upload gagal (" + xhr.status + "): " + (xhr.responseText || "").slice(0, 200))));
          xhr.onerror = () => rej(new Error("Upload gagal: koneksi terputus"));
          xhr.send(file);
        });
        if (isPublic) return { url: sb.storage.from(bucket).getPublicUrl(path).data.publicUrl };
        return { path };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  const Store = useSupabase ? Supa : Demo;
  Store.today = today;
  Store.init = async function () {
    if (useSupabase) { sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY); }
    return Store;
  };
  Store.onAuth = function (cb) { if (useSupabase && sb) sb.auth.onAuthStateChange((ev) => cb(ev)); };
  /* Kode referral pelatih dari tautan undangan (?ref=KODE atau #/r/KODE) */
  Store.ref = {
    get() { try { return localStorage.getItem(REF_KEY) || ""; } catch (e) { return ""; } },
    set(code) { try { code ? localStorage.setItem(REF_KEY, String(code).trim().toUpperCase().slice(0, 20)) : localStorage.removeItem(REF_KEY); } catch (e) {} }
  };
  Store.hasActive = (subs) => (subs || []).some((s) => s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date()));

  /* Pengenal jenis link video → elemen pemutar */
  Store.embed = function (url) {
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return { type: "iframe", src: "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0&modestbranding=1" };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { type: "iframe", src: "https://player.vimeo.com/video/" + m[1] };
    m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (m) return { type: "iframe", src: "https://drive.google.com/file/d/" + m[1] + "/preview" };
    return { type: "video", src: url };
  };

  window.Store = Store;
})();
