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
  const DKEY = "qowiy_demo_v1", SKEY = "qowiy_demo_session";
  function demoSeed() {
    const s = clone(SEED);
    return {
      settings: s.settings,
      modules: s.modules.map((m) => ({ id: m.key, title: m.title, subtitle: m.subtitle, track: m.track, sort: m.sort, tag: m.tag, published: true })),
      lessons: s.lessons.map((l) => ({ id: l.key, module_id: l.module, title: l.title, description: l.description, dalil: l.dalil, video_url: l.video_url, storage_path: null, duration: l.duration, sort: l.sort, is_free: !!l.is_free, published: true })),
      videos: s.videos.map((v) => Object.assign({}, v, { id: v.key, published: true, storage_path: null, thumb_url: "" })),
      articles: s.articles.map((a) => Object.assign({}, a, { id: a.key, published: true, created_at: new Date().toISOString() })),
      users: [{ id: "admin-demo", email: "admin@qowiy.id", password: "admin123", full_name: "Admin QOWIY", role: "admin", whatsapp: "", gender: null, quiz: null, created_at: new Date().toISOString() }],
      subscriptions: [], progress: [], habits: {}, quiz_leads: []
    };
  }
  function dload() { try { const d = JSON.parse(localStorage.getItem(DKEY)); if (d && d.modules) return d; } catch (e) {} const d = demoSeed(); dsave(d); return d; }
  function dsave(d) { localStorage.setItem(DKEY, JSON.stringify(d)); }
  function dme() { const id = localStorage.getItem(SKEY); if (!id) return null; return dload().users.find((u) => u.id === id) || null; }
  function dActive(userId) { const d = dload(); return d.subscriptions.some((s) => s.user_id === userId && s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date())); }
  function dVisible(row, me) { return row.published && (row.is_free || (me && (me.role === "admin" || dActive(me.id)))); }

  const Demo = {
    mode: "demo",
    async session() { const u = dme(); return u ? { user: { id: u.id, email: u.email } } : null; },
    async signUp({ email, password, full_name, whatsapp, gender, quiz }) {
      const d = dload(); email = (email || "").trim().toLowerCase();
      if (d.users.some((u) => u.email === email)) throw new Error("Email sudah terdaftar. Silakan masuk.");
      if ((password || "").length < 6) throw new Error("Password minimal 6 karakter.");
      const u = { id: uid(), email, password, full_name, whatsapp, gender: gender || null, role: "member", quiz: quiz || null, created_at: new Date().toISOString() };
      d.users.push(u); dsave(d); localStorage.setItem(SKEY, u.id); return { user: u };
    },
    async signIn(email, password) {
      const u = dload().users.find((x) => x.email === (email || "").trim().toLowerCase() && x.password === password);
      if (!u) throw new Error("Email atau password salah.");
      localStorage.setItem(SKEY, u.id); return { user: u };
    },
    async signOut() { localStorage.removeItem(SKEY); },
    async resetPassword() { throw new Error("Mode demo: reset password tidak tersedia. Gunakan akun baru."); },
    async me() { const u = dme(); if (!u) return null; const { password, ...rest } = u; return rest; },
    async updateMe(patch) { const d = dload(); const u = d.users.find((x) => x.id === localStorage.getItem(SKEY)); if (!u) throw new Error("Belum masuk"); delete patch.role; Object.assign(u, patch); dsave(d); return u; },
    async settings() { return mergeSettings(dload().settings); },
    async saveSettings(data) { const d = dload(); d.settings = data; dsave(d); },
    async mySubs() { const u = dme(); if (!u) return []; return dload().subscriptions.filter((s) => s.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async requestSub(plan) {
      const u = dme(); if (!u) throw new Error("Silakan masuk dulu");
      const d = dload(); const row = { id: uid(), user_id: u.id, plan: plan.id, plan_name: plan.name, amount: plan.price, status: "pending", created_at: new Date().toISOString(), activated_at: null, expires_at: null };
      d.subscriptions.push(row); dsave(d); return row;
    },
    async demoActivate(subId) { const d = dload(); const s = d.subscriptions.find((x) => x.id === subId); if (s) { s.status = "active"; s.activated_at = new Date().toISOString(); dsave(d); } },
    async modules() { return dload().modules.filter((m) => m.published).sort(bySort); },
    async lessons() { const me = dme(); return dload().lessons.filter((l) => dVisible(l, me)).sort(bySort); },
    async lessonCounts() { const c = {}; dload().lessons.filter((l) => l.published).forEach((l) => (c[l.module_id] = (c[l.module_id] || 0) + 1)); return c; },
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
    async mediaUrl(item) {
      if (!item) return null;
      if (item.storage_path && item.storage_path.startsWith("idb:")) {
        if (blobUrlCache[item.storage_path]) return blobUrlCache[item.storage_path];
        const blob = await idb.get(item.storage_path); if (!blob) return null;
        return (blobUrlCache[item.storage_path] = URL.createObjectURL(blob));
      }
      return item.video_url || null;
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
        dsave(d);
      },
      async members() {
        const d = dload();
        return d.users.map((u) => { const { password, ...rest } = u; return Object.assign(rest, { subscriptions: d.subscriptions.filter((s) => s.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)), done: d.progress.filter((p) => p.user_id === u.id).length }); })
          .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      },
      async setSubStatus(id, status, expires_at) { const d = dload(); const s = d.subscriptions.find((x) => x.id === id); if (!s) return; s.status = status; if (status === "active") s.activated_at = new Date().toISOString(); if (expires_at !== undefined) s.expires_at = expires_at; dsave(d); },
      async grantSub(userId, plan, expires_at) { const d = dload(); d.subscriptions.push({ id: uid(), user_id: userId, plan: plan.id, plan_name: plan.name, amount: 0, status: "active", note: "Diberikan admin", created_at: new Date().toISOString(), activated_at: new Date().toISOString(), expires_at: expires_at || null }); dsave(d); },
      async setRole(userId, role) { const d = dload(); const u = d.users.find((x) => x.id === userId); if (u) { u.role = role; dsave(d); } },
      async upload(file, { isPublic } = {}, onProgress) {
        if (isPublic) { const url = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); }); onProgress && onProgress(1); return { url }; }
        const key = "idb:" + uid() + "-" + file.name.replace(/[^\w.\-]/g, "_");
        let p = 0; const t = setInterval(() => { p = Math.min(0.9, p + 0.15); onProgress && onProgress(p); }, 120);
        await idb.put(key, file); clearInterval(t); onProgress && onProgress(1);
        return { path: key };
      },
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
    async signUp({ email, password, full_name, whatsapp, gender, quiz }) {
      const r = await sb.auth.signUp({ email, password, options: { data: { full_name, whatsapp, gender, quiz }, emailRedirectTo: location.origin + location.pathname + "#/dashboard" } });
      const data = must(r); return { user: data.user, needsConfirm: !data.session };
    },
    async signIn(email, password) { return must(await sb.auth.signInWithPassword({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async resetPassword(email) { must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + "#/akun" })); },
    async updatePassword(pw) { must(await sb.auth.updateUser({ password: pw })); },
    async me() { const s = await Supa.session(); if (!s) return null; const r = await sb.from("profiles").select("*").eq("id", s.user.id).maybeSingle(); return must(r) || { id: s.user.id, email: s.user.email, role: "member" }; },
    async updateMe(patch) { const s = await Supa.session(); delete patch.role; return must(await sb.from("profiles").update(patch).eq("id", s.user.id).select().single()); },
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
    async mediaUrl(item) {
      if (!item) return null;
      if (item.storage_path) { const r = await sb.storage.from(CFG.MEDIA_BUCKET || "media").createSignedUrl(item.storage_path, 60 * 60 * 3); if (!r.error) return r.data.signedUrl; }
      return item.video_url || null;
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
        if (row && row.storage_path) await sb.storage.from(CFG.MEDIA_BUCKET || "media").remove([row.storage_path]);
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
      /* Upload via XHR agar ada progress bar. */
      async upload(file, { isPublic } = {}, onProgress) {
        const bucket = isPublic ? (CFG.PUBLIC_BUCKET || "public-assets") : (CFG.MEDIA_BUCKET || "media");
        const { data } = await sb.auth.getSession(); const token = data.session && data.session.access_token;
        const path = new Date().toISOString().slice(0, 7) + "/" + uid() + "-" + file.name.replace(/[^\w.\-]/g, "_");
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
