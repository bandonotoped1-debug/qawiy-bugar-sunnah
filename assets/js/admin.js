/* =====================================================================
   QOWIY — Panel Admin
   Upload video rutinitas & motivasi, kelola kelas, artikel, member,
   langganan, lead kuis, dan pengaturan situs.
   ===================================================================== */
(async function () {
  const { esc, rp, $, $$, toast, modal, SLOTS, DAYS, fmtDate, waLink } = UI;
  await Store.init();
  const root = $("#admin");
  const A = Store.admin;
  let S = await Store.settings();
  let tab = (location.hash || "#ringkasan").slice(1) || "ringkasan";
  if (Store.mode === "demo") $("#demoBanner").classList.remove("hidden");

  /* ---------------------------- auth ---------------------------- */
  async function gate() {
    const me = (await Store.session()) ? await Store.me() : null;
    if (me && me.role === "admin") { $("#logoutBtn").classList.remove("hidden"); return me; }
    root.innerHTML = `<section class="wrap quiz"><form class="card" id="lf">
      <span class="label muted">Panel admin</span><h2 style="margin:6px 0 14px">Masuk sebagai admin</h2>
      ${me ? `<div class="notice" style="margin-bottom:14px">Akun <b>${esc(me.email)}</b> bukan admin. Jadikan admin lewat SQL: <code>update profiles set role='admin' where email='${esc(me.email)}';</code></div>` : ""}
      <label class="field"><span>Email</span><input name="email" type="email" required></label>
      <label class="field"><span>Password</span><input name="password" type="password" required></label>
      <div class="err" id="lerr"></div><button class="btn acc block">Masuk</button>
      ${Store.mode === "demo" ? `<p class="muted center" style="font-size:13px">Demo: admin@qowiy.id / admin123</p>` : ""}
    </form></section>`;
    $("#lf").onsubmit = async (e) => {
      e.preventDefault();
      try { await Store.signOut(); await Store.signIn(e.target.email.value, e.target.password.value); boot(); }
      catch (x) { $("#lerr").textContent = x.message; }
    };
    return null;
  }
  $("#logoutBtn").onclick = async (e) => { e.preventDefault(); await Store.signOut(); location.reload(); };

  /* ---------------------------- layout ---------------------------- */
  const TABS = [
    ["ringkasan", "📊", "Ringkasan"], ["rutinitas", "🕌", "Video Rutinitas"], ["motivasi", "🎙️", "Motivasi Trainer"],
    ["kelas", "🎬", "Kelas & Lesson"], ["artikel", "📚", "Artikel"], ["member", "👥", "Member & Langganan"],
    ["leads", "📝", "Hasil Kuis"], ["pengaturan", "⚙️", "Pengaturan"]
  ];
  let pendingCount = 0;
  function shell() {
    root.innerHTML = `<section class="wrap adm">
      <aside class="adm-side">${TABS.map(([k, i, t]) => `<button data-t="${k}" class="${tab === k ? "on" : ""}"><span>${i}</span>${t}${k === "member" && pendingCount ? `<span class="count">${pendingCount}</span>` : ""}</button>`).join("")}</aside>
      <div id="pane"><div class="loading">Memuat…</div></div></section>`;
    $$(".adm-side button").forEach((b) => (b.onclick = () => { tab = b.dataset.t; location.hash = tab; shell(); }));
    const fn = { ringkasan: paneSummary, rutinitas: () => paneVideos("routine"), motivasi: () => paneVideos("motivation"), kelas: paneClasses, artikel: paneArticles, member: paneMembers, leads: paneLeads, pengaturan: paneSettings }[tab] || paneSummary;
    fn().catch((e) => { console.error(e); $("#pane").innerHTML = `<div class="card"><b>Gagal memuat:</b> ${esc(e.message)}</div>`; });
  }
  const pane = (html) => ($("#pane").innerHTML = html);
  const head = (title, sub, btn) => `<div class="section-head" style="margin-bottom:16px"><h2>${title}</h2><span class="label muted-d">${sub || ""}</span><span class="spacer"></span>${btn || ""}</div>`;

  /* ---------------------------- media field ---------------------------- */
  function mediaField(row, { accept = "video/*", label = "Video", publicBucket = false } = {}) {
    const hasFile = !!row.storage_path, url = row.video_url || "";
    return `<div class="field"><span>${label}</span><div class="media-box" data-media data-public="${publicBucket ? 1 : 0}">
      <div class="seg"><label><input type="radio" name="msrc" value="file" ${hasFile || !url ? "checked" : ""}><span>⬆ Upload file</span></label><label><input type="radio" name="msrc" value="link" ${!hasFile && url ? "checked" : ""}><span>🔗 Link YouTube / Drive / MP4</span></label></div>
      <div data-src="file">${hasFile ? `<div class="pill acc" style="margin-bottom:8px">File tersimpan: ${esc(row.storage_path.split("/").pop().slice(0, 50))}</div>` : ""}
        <input type="file" accept="${accept}" data-file><div class="prog mt8 hidden" data-prog><i></i></div><small class="muted">Video besar (&gt;50 MB di Supabase gratis) lebih baik diunggah ke YouTube (unlisted) lalu pakai link.</small></div>
      <div data-src="link" class="hidden"><input class="input" data-url placeholder="https://youtu.be/… atau https://drive.google.com/file/d/…" value="${esc(url)}"></div>
    </div></div>`;
  }
  function wireMedia(scope) {
    const box = $("[data-media]", scope); if (!box) return;
    const sync = () => { const v = $("input[name=msrc]:checked", box).value; $$("[data-src]", box).forEach((d) => d.classList.toggle("hidden", d.dataset.src !== v)); };
    $$("input[name=msrc]", box).forEach((r) => (r.onchange = sync)); sync();
  }
  async function readMedia(scope, row) {
    const box = $("[data-media]", scope); if (!box) return;
    const mode = $("input[name=msrc]:checked", box).value;
    if (mode === "link") { row.video_url = $("[data-url]", box).value.trim(); row.storage_path = null; return; }
    const f = $("[data-file]", box).files[0];
    if (f) {
      const pr = $("[data-prog]", box); pr.classList.remove("hidden");
      const r = await A.upload(f, { isPublic: false }, (p) => ($("i", pr).style.width = Math.round(p * 100) + "%"));
      row.storage_path = r.path; row.video_url = "";
    }
  }
  function imageField(name, val, label) {
    return `<div class="field"><span>${label}</span><div class="row"><input class="input" name="${name}" value="${esc(val || "")}" placeholder="URL gambar (opsional)"><label class="btn sm light" style="white-space:nowrap">Upload<input type="file" accept="image/*" data-img="${name}" hidden></label></div></div>`;
  }
  function wireImages(scope) {
    $$("[data-img]", scope).forEach((inp) => (inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return; toast("Mengunggah gambar…");
      try { const r = await A.upload(f, { isPublic: true }); $(`[name="${inp.dataset.img}"]`, scope).value = r.url; toast("Gambar terunggah"); } catch (e) { toast(e.message); }
    }));
  }

  /* ---------------------------- RINGKASAN ---------------------------- */
  async function paneSummary() {
    const [members, leads, vids, arts] = await Promise.all([A.list("members"), A.list("quiz_leads"), A.list("videos"), A.list("articles")]);
    const subs = members.flatMap((m) => m.subscriptions.map((s) => Object.assign({ member: m }, s)));
    const pend = subs.filter((s) => s.status === "pending"); pendingCount = pend.length;
    const active = members.filter((m) => Store.hasActive(m.subscriptions)).length;
    const revenue = subs.filter((s) => s.status === "active").reduce((a, s) => a + (s.amount || 0), 0);
    pane(`${head("Ringkasan", Store.mode === "demo" ? "Mode demo" : "Database online · Supabase")}
      <div class="grid g4">${[["Member", members.length], ["Langganan aktif", active], ["Menunggu verifikasi", pend.length], ["Pendapatan terverifikasi", rp(revenue)], ["Hasil kuis (lead)", leads.length], ["Video rutinitas", vids.filter((v) => v.kind === "routine").length], ["Video motivasi", vids.filter((v) => v.kind === "motivation").length], ["Artikel", arts.length]]
        .map(([t, v]) => `<div class="kpi"><span class="label muted">${t}</span><b>${v}</b></div>`).join("")}</div>
      <div class="card section">${head("Perlu diverifikasi", "Klik aktifkan setelah cek bukti bayar di WhatsApp")}
        ${pend.length ? `<div class="tbl-wrap"><table class="tbl"><tr><th>Member</th><th>Paket</th><th>Nominal</th><th>Tanggal</th><th></th></tr>${pend.map((s) => `<tr><td><b>${esc(s.member.full_name || "-")}</b><br><span class="muted">${esc(s.member.email)}</span></td><td>${esc(s.plan_name)}</td><td>${rp(s.amount)}</td><td>${fmtDate(s.created_at)}</td>
          <td class="row"><button class="btn sm acc" data-act="${s.id}">Aktifkan</button><button class="btn sm danger" data-rej="${s.id}">Tolak</button></td></tr>`).join("")}</table></div>` : '<p class="muted">Tidak ada pembayaran yang menunggu. 🎉</p>'}
      </div>`);
    wireSubActions(paneSummary);
    $$(".adm-side .count").forEach((c) => (c.textContent = pendingCount));
  }
  function wireSubActions(after) {
    $$("[data-act]").forEach((b) => (b.onclick = async () => {
      const subId = b.dataset.act; let expires;
      const plan = S.plans.find((p) => p.name === b.closest("tr").children[1].textContent);
      if (plan && plan.months) { const d = new Date(); d.setMonth(d.getMonth() + plan.months); expires = d.toISOString(); }
      await A.setSubStatus(subId, "active", expires); toast("Langganan diaktifkan"); after();
    }));
    $$("[data-rej]").forEach((b) => (b.onclick = async () => { await A.setSubStatus(b.dataset.rej, "rejected"); toast("Ditolak"); after(); }));
  }

  /* ---------------------------- VIDEO ---------------------------- */
  async function paneVideos(kind) {
    const rows = (await A.list("videos")).filter((v) => v.kind === kind);
    const isR = kind === "routine";
    pane(`${head(isR ? "Video rutinitas harian" : "Video motivasi trainer", isR ? "Dikelompokkan per waktu sholat" : "Tampil di dashboard member", `<button class="btn acc sm" id="addV">+ Upload video</button>`)}
      <div class="card"><div class="tbl-wrap"><table class="tbl"><tr><th>Judul</th>${isR ? "<th>Waktu</th><th>Hari</th>" : ""}<th>Untuk</th><th>Sumber</th><th>Status</th><th></th></tr>
      ${rows.map((v) => `<tr><td><b>${esc(v.title)}</b><br><span class="muted">${esc(v.trainer || "")} ${v.duration ? "· " + esc(v.duration) : ""}</span></td>
        ${isR ? `<td>${SLOTS[v.time_slot] || "-"}</td><td>${v.days && v.days.length ? v.days.map((d) => DAYS[d].slice(0, 3)).join(", ") : "Setiap hari"}</td>` : ""}
        <td>${esc(v.audience || "semua")}</td><td>${v.storage_path ? '<span class="pill acc">File</span>' : v.video_url ? '<span class="pill cream">Link</span>' : '<span class="pill red">Kosong</span>'}</td>
        <td>${v.published ? '<span class="pill acc">Tayang</span>' : '<span class="pill cream">Draft</span>'} ${v.is_free ? '<span class="pill gold">Gratis</span>' : ""}</td>
        <td class="row"><button class="btn sm light" data-edit="${v.id}">Edit</button><button class="btn sm danger" data-del="${v.id}">Hapus</button></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Belum ada video.</td></tr>`}
      </table></div></div>`);
    $("#addV").onclick = () => editVideo({ kind, published: true, audience: "semua", trainer: "", sort: rows.length + 1 }, kind);
    $$("[data-edit]").forEach((b) => (b.onclick = () => editVideo(rows.find((r) => r.id === b.dataset.edit), kind)));
    $$("[data-del]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus video ini? File videonya juga ikut dihapus.")) return; await A.remove("videos", b.dataset.del); toast("Dihapus"); paneVideos(kind); }));
  }
  function editVideo(row, kind) {
    const isR = kind === "routine";
    modal(`<form id="vf"><h2 style="margin-top:0">${row.id ? "Edit" : "Upload"} video ${isR ? "rutinitas" : "motivasi"}</h2>
      <label class="field"><span>Judul</span><input name="title" required value="${esc(row.title || "")}"></label>
      ${mediaField(row)}
      <label class="field"><span>Deskripsi</span><textarea name="description">${esc(row.description || "")}</textarea></label>
      <div class="grid g3" style="gap:10px">
        <label class="field"><span>Trainer</span><input name="trainer" value="${esc(row.trainer || "")}"></label>
        <label class="field"><span>Durasi</span><input name="duration" placeholder="mis. 20 menit" value="${esc(row.duration || "")}"></label>
        <label class="field"><span>Level</span><select name="level">${["pemula", "menengah", "lanjutan"].map((l) => `<option ${row.level === l ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
      ${isR ? `<label class="field"><span>Waktu (mengikuti sholat)</span><select name="time_slot">${Object.entries(SLOTS).map(([k, t]) => `<option value="${k}" ${row.time_slot === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <div class="field"><span>Hari tayang (kosong = setiap hari)</span><div class="days">${DAYS.map((d, i) => `<label><input type="checkbox" name="days" value="${i}" ${(row.days || []).includes(i) ? "checked" : ""}>${d}</label>`).join("")}</div></div>` : ""}
      <div class="grid g3" style="gap:10px">
        <label class="field"><span>Untuk</span><select name="audience">${["semua", "ikhwan", "akhwat"].map((a) => `<option ${row.audience === a ? "selected" : ""}>${a}</option>`).join("")}</select></label>
        <label class="field"><span>Urutan</span><input name="sort" type="number" value="${row.sort || 0}"></label>
        <div class="field"><span>Opsi</span><label class="check"><input type="checkbox" name="published" ${row.published !== false ? "checked" : ""}> Tayang</label><label class="check"><input type="checkbox" name="is_free" ${row.is_free ? "checked" : ""}> Gratis (tanpa langganan)</label></div></div>
      ${imageField("thumb_url", row.thumb_url, "Thumbnail")}
      <div class="err" id="verr"></div>
      <div class="row"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc" id="vsave">Simpan</button></div></form>`,
    (m, close) => {
      wireMedia(m); wireImages(m);
      $("#vf", m).onsubmit = async (e) => {
        e.preventDefault(); const f = e.target; $("#vsave", m).disabled = true; $("#verr", m).textContent = "";
        try {
          const r = Object.assign({}, row, { kind, title: f.title.value.trim(), description: f.description.value, trainer: f.trainer.value, duration: f.duration.value, level: f.level.value, audience: f.audience.value, sort: +f.sort.value || 0, published: f.published.checked, is_free: f.is_free.checked, thumb_url: f.thumb_url.value });
          if (isR) { r.time_slot = f.time_slot.value; const d = $$("[name=days]:checked", f).map((x) => +x.value); r.days = d.length ? d : null; }
          await readMedia(m, r);
          await A.upsert("videos", r); toast("Video tersimpan"); close(); paneVideos(kind);
        } catch (x) { $("#verr", m).textContent = x.message; $("#vsave", m).disabled = false; }
      };
    }, "wide");
  }

  /* ---------------------------- KELAS ---------------------------- */
  const TRACKS = { start: "Mulai (baris tengah)", turun: "Jalur A — Turun Berat (baris atas)", kuat: "Jalur B — Bugar & Kuat (baris bawah)", ekstra: "Ekstra (Ramadan, Stuck, dll.)" };
  async function paneClasses() {
    const [mods, lessons] = await Promise.all([A.list("modules"), A.list("lessons")]);
    pane(`${head("Kelas & lesson", "Modul = kotak di Peta Program; lesson = video di dalamnya", `<button class="btn acc sm" id="addM">+ Modul</button>`)}
      ${Object.entries(TRACKS).map(([t, tl]) => `<div class="card" style="margin-bottom:16px"><span class="label muted">${tl}</span>
        ${mods.filter((m) => m.track === t).sort((a, b) => a.sort - b.sort).map((m) => `<div class="mod-block mt8">
          <div class="row wrap-it"><b>${esc(m.tag || "")}</b><span>${esc(m.title)} — <span class="muted">${esc(m.subtitle || "")}</span></span>${m.published === false ? '<span class="pill cream">Draft</span>' : ""}<span class="spacer"></span>
            <button class="btn sm light" data-em="${m.id}">Edit modul</button><button class="btn sm acc" data-al="${m.id}">+ Lesson</button><button class="btn sm danger" data-dm="${m.id}">Hapus</button></div>
          <table class="tbl mt8">${lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.sort - b.sort).map((l) => `<tr><td style="width:36px">${l.sort}</td><td><b>${esc(l.title)}</b> ${l.is_free ? '<span class="pill gold">Gratis</span>' : ""}</td>
            <td>${l.storage_path ? '<span class="pill acc">File</span>' : l.video_url ? '<span class="pill cream">Link</span>' : '<span class="pill red">Belum ada video</span>'}</td>
            <td class="row" style="justify-content:flex-end"><button class="btn sm light" data-el="${l.id}">Edit</button><button class="btn sm danger" data-dl="${l.id}">Hapus</button></td></tr>`).join("") || '<tr><td class="muted">Belum ada lesson.</td></tr>'}</table></div>`).join("") || '<p class="muted">Belum ada modul.</p>'}
      </div>`).join("")}`);
    $("#addM").onclick = () => editModule({ track: "start", sort: 1, published: true });
    $$("[data-em]").forEach((b) => (b.onclick = () => editModule(mods.find((m) => m.id === b.dataset.em))));
    $$("[data-dm]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus modul beserta semua lesson di dalamnya?")) return; await A.remove("modules", b.dataset.dm); paneClasses(); }));
    $$("[data-al]").forEach((b) => (b.onclick = () => editLesson({ module_id: b.dataset.al, sort: lessons.filter((l) => l.module_id === b.dataset.al).length + 1, published: true }, mods)));
    $$("[data-el]").forEach((b) => (b.onclick = () => editLesson(lessons.find((l) => l.id === b.dataset.el), mods)));
    $$("[data-dl]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus lesson ini?")) return; await A.remove("lessons", b.dataset.dl); paneClasses(); }));
  }
  function editModule(row) {
    modal(`<form id="mf"><h2 style="margin-top:0">${row.id ? "Edit" : "Tambah"} modul</h2>
      <div class="grid g2" style="gap:10px"><label class="field"><span>Label kotak (mis. WEEK 1)</span><input name="tag" value="${esc(row.tag || "")}"></label><label class="field"><span>Judul</span><input name="title" required value="${esc(row.title || "")}"></label></div>
      <label class="field"><span>Subjudul</span><input name="subtitle" value="${esc(row.subtitle || "")}"></label>
      <div class="grid g2" style="gap:10px"><label class="field"><span>Posisi di peta</span><select name="track">${Object.entries(TRACKS).map(([k, t]) => `<option value="${k}" ${row.track === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="field"><span>Urutan (kiri → kanan)</span><input name="sort" type="number" value="${row.sort || 1}"></label></div>
      <label class="check"><input type="checkbox" name="published" ${row.published !== false ? "checked" : ""}> Tayang</label>
      <div class="row mt16"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc">Simpan</button></div></form>`,
    (m, close) => ($("#mf", m).onsubmit = async (e) => { e.preventDefault(); const f = e.target;
      try { await A.upsert("modules", Object.assign({}, row, { tag: f.tag.value, title: f.title.value, subtitle: f.subtitle.value, track: f.track.value, sort: +f.sort.value || 0, published: f.published.checked })); close(); paneClasses(); } catch (x) { toast(x.message); } }));
  }
  function editLesson(row, mods) {
    modal(`<form id="lf2"><h2 style="margin-top:0">${row.id ? "Edit" : "Tambah"} lesson</h2>
      <label class="field"><span>Modul</span><select name="module_id">${mods.map((m) => `<option value="${m.id}" ${row.module_id === m.id ? "selected" : ""}>${esc((m.tag || "") + " · " + m.title)}</option>`).join("")}</select></label>
      <label class="field"><span>Judul lesson</span><input name="title" required value="${esc(row.title || "")}"></label>
      ${mediaField(row)}
      <label class="field"><span>Deskripsi / catatan materi</span><textarea name="description">${esc(row.description || "")}</textarea></label>
      <label class="field"><span>Dalil terkait (opsional, sertakan nomor riwayat)</span><textarea name="dalil" style="min-height:70px">${esc(row.dalil || "")}</textarea></label>
      <div class="grid g3" style="gap:10px"><label class="field"><span>Durasi</span><input name="duration" value="${esc(row.duration || "")}"></label><label class="field"><span>Urutan</span><input name="sort" type="number" value="${row.sort || 1}"></label>
        <div class="field"><span>Opsi</span><label class="check"><input type="checkbox" name="published" ${row.published !== false ? "checked" : ""}> Tayang</label><label class="check"><input type="checkbox" name="is_free" ${row.is_free ? "checked" : ""}> Gratis (preview)</label></div></div>
      <div class="err" id="lerr2"></div>
      <div class="row"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc" id="lsave">Simpan</button></div></form>`,
    (m, close) => { wireMedia(m); $("#lf2", m).onsubmit = async (e) => { e.preventDefault(); const f = e.target; $("#lsave", m).disabled = true;
      try { const r = Object.assign({}, row, { module_id: f.module_id.value, title: f.title.value, description: f.description.value, dalil: f.dalil.value, duration: f.duration.value, sort: +f.sort.value || 0, published: f.published.checked, is_free: f.is_free.checked });
        await readMedia(m, r); await A.upsert("lessons", r); toast("Lesson tersimpan"); close(); paneClasses(); }
      catch (x) { $("#lerr2", m).textContent = x.message; $("#lsave", m).disabled = false; } }; }, "wide");
  }

  /* ---------------------------- ARTIKEL ---------------------------- */
  async function paneArticles() {
    const rows = await A.list("articles");
    pane(`${head("Artikel kesehatan", "Wajib cantumkan dalil (dengan nomor riwayat) & sumber ilmiah", `<button class="btn acc sm" id="addA">+ Artikel</button>`)}
      <div class="card"><div class="tbl-wrap"><table class="tbl"><tr><th>Judul</th><th>Kategori</th><th>Dalil</th><th>Sumber</th><th>Status</th><th></th></tr>
      ${rows.map((a) => `<tr><td><b>${esc(a.title)}</b><br><a class="muted" href="index.html#/artikel/${esc(a.slug)}" target="_blank">/${esc(a.slug)}</a></td><td>${esc(a.category || "")}</td><td>${(a.dalil || []).length}</td><td>${(a.sources || []).length ? (a.sources || []).length : '<span class="pill red">0</span>'}</td>
        <td>${a.published ? '<span class="pill acc">Terbit</span>' : '<span class="pill cream">Draft</span>'}</td><td class="row"><button class="btn sm light" data-ea="${a.id}">Edit</button><button class="btn sm danger" data-da="${a.id}">Hapus</button></td></tr>`).join("") || '<tr><td class="muted" colspan="6">Belum ada artikel.</td></tr>'}</table></div></div>`);
    $("#addA").onclick = () => editArticle({ published: true, dalil: [], sources: [], read_min: 4 });
    $$("[data-ea]").forEach((b) => (b.onclick = () => editArticle(rows.find((r) => r.id === b.dataset.ea))));
    $$("[data-da]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus artikel?")) return; await A.remove("articles", b.dataset.da); paneArticles(); }));
  }
  function editArticle(row) {
    const dRow = (d) => `<div class="r"><input placeholder="Makna / teks dalil" value="${esc(d.teks || "")}" data-k="teks"><input placeholder="Rujukan, mis. HR. Muslim no. 2664" value="${esc(d.rujukan || "")}" data-k="rujukan"><button type="button" class="x">✕</button><input placeholder="URL (sunnah.com / quran.com)" value="${esc(d.url || "")}" data-k="url" style="grid-column:1/3"></div>`;
    const sRow = (s) => `<div class="r four"><input placeholder="Judul sumber / penulis & jurnal" value="${esc(s.judul || "")}" data-k="judul"><input placeholder="Penerbit" value="${esc(s.penerbit || "")}" data-k="penerbit"><input placeholder="Tahun" value="${esc(s.tahun || "")}" data-k="tahun"><input placeholder="URL / DOI" value="${esc(s.url || "")}" data-k="url"><button type="button" class="x">✕</button></div>`;
    modal(`<form id="af"><h2 style="margin-top:0">${row.id ? "Edit" : "Tulis"} artikel</h2>
      <label class="field"><span>Judul</span><input name="title" required value="${esc(row.title || "")}"></label>
      <div class="grid g3" style="gap:10px"><label class="field"><span>Slug URL</span><input name="slug" value="${esc(row.slug || "")}" placeholder="otomatis dari judul"></label><label class="field"><span>Kategori</span><input name="category" list="cats" value="${esc(row.category || "")}"><datalist id="cats"><option>Dasar</option><option>Pola Makan</option><option>Puasa</option><option>Tidur</option><option>Aktivitas</option><option>Latihan</option></datalist></label><label class="field"><span>Menit baca</span><input name="read_min" type="number" value="${row.read_min || 4}"></label></div>
      <label class="field"><span>Ringkasan</span><textarea name="excerpt" style="min-height:60px">${esc(row.excerpt || "")}</textarea></label>
      <label class="field"><span>Isi artikel (paragraf dipisah baris kosong · "## " untuk subjudul · "- " untuk poin)</span><textarea name="body" style="min-height:260px">${esc(row.body || "")}</textarea></label>
      ${imageField("cover_url", row.cover_url, "Gambar sampul")}
      <div class="field"><span>Dalil (Al-Qur'an / hadits beserta nomor)</span><div class="rows-ed" id="dRows">${(row.dalil || []).map(dRow).join("")}</div><button type="button" class="btn sm light" id="addD">+ Dalil</button></div>
      <div class="field"><span>Sumber ilmiah (jurnal, WHO, Kemenkes)</span><div class="rows-ed" id="sRows">${(row.sources || []).map(sRow).join("")}</div><button type="button" class="btn sm light" id="addS">+ Sumber</button></div>
      <label class="check"><input type="checkbox" name="published" ${row.published !== false ? "checked" : ""}> Terbitkan</label>
      <div class="err" id="aerr"></div>
      <div class="row mt16"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc">Simpan</button></div></form>`,
    (m, close) => {
      wireImages(m);
      const bindX = () => $$(".x", m).forEach((x) => (x.onclick = () => x.closest(".r").remove()));
      $("#addD", m).onclick = () => { $("#dRows", m).insertAdjacentHTML("beforeend", dRow({})); bindX(); };
      $("#addS", m).onclick = () => { $("#sRows", m).insertAdjacentHTML("beforeend", sRow({})); bindX(); };
      bindX();
      const rowsOf = (id) => $$(`#${id} .r`, m).map((r) => { const o = {}; $$("input", r).forEach((i) => (o[i.dataset.k] = i.value.trim())); return o; }).filter((o) => Object.values(o).some(Boolean));
      $("#af", m).onsubmit = async (e) => {
        e.preventDefault(); const f = e.target;
        const slug = (f.slug.value || f.title.value).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
        const sources = rowsOf("sRows");
        if (f.published.checked && !sources.length && !confirm("Artikel belum punya sumber ilmiah. Tetap terbitkan?")) return;
        try { await A.upsert("articles", Object.assign({}, row, { title: f.title.value, slug, category: f.category.value, read_min: +f.read_min.value || 4, excerpt: f.excerpt.value, body: f.body.value, cover_url: f.cover_url.value, dalil: rowsOf("dRows"), sources, published: f.published.checked })); toast("Artikel tersimpan"); close(); paneArticles(); }
        catch (x) { $("#aerr", m).textContent = x.message; }
      };
    }, "wide");
  }

  /* ---------------------------- MEMBER ---------------------------- */
  async function paneMembers() {
    const members = await A.list("members");
    const filt = sessionStorage.getItem("mf") || "semua";
    const status = (m) => (Store.hasActive(m.subscriptions) ? "aktif" : m.subscriptions.some((s) => s.status === "pending") ? "pending" : "belum");
    const list = members.filter((m) => filt === "semua" || status(m) === filt);
    pane(`${head("Member & langganan", members.length + " member")}
      <div class="slot-tabs">${["semua", "pending", "aktif", "belum"].map((f) => `<button data-f="${f}" class="${filt === f ? "on" : ""}">${f}</button>`).join("")}</div>
      <div class="card"><div class="tbl-wrap"><table class="tbl"><tr><th>Member</th><th>Kontak</th><th>Jalur</th><th>Langganan</th><th>Progres</th><th>Aksi</th></tr>
      ${list.map((m) => { const st = status(m); const pend = m.subscriptions.find((s) => s.status === "pending"); const act = m.subscriptions.find((s) => s.status === "active");
        return `<tr><td><b>${esc(m.full_name || "-")}</b> ${m.role === "admin" ? '<span class="pill gold">admin</span>' : ""}<br><span class="muted">${esc(m.email || "")}</span><br><span class="muted" style="font-size:12px">${fmtDate(m.created_at)}</span></td>
          <td>${m.whatsapp ? `<a href="${waLink(m.whatsapp)}" target="_blank">${esc(m.whatsapp)}</a>` : "-"}<br><span class="muted">${esc(m.gender || "")}</span></td>
          <td>${m.quiz && m.quiz.result ? (m.quiz.result.track === "turun" ? "Turun Berat" : "Bugar & Kuat") + `<br><span class="muted">IMT ${m.quiz.result.bmi}</span>` : "-"}</td>
          <td><span class="pill ${st === "aktif" ? "acc" : st === "pending" ? "gold" : "cream"}">${st}</span><br>${esc((act || pend || {}).plan_name || "")}${act && act.expires_at ? `<br><span class="muted" style="font-size:12px">s.d. ${fmtDate(act.expires_at)}</span>` : ""}</td>
          <td>${m.done} lesson</td>
          <td><div class="row wrap-it">${pend ? `<button class="btn sm acc" data-act="${pend.id}" data-plan="${esc(pend.plan)}">Aktifkan</button><button class="btn sm danger" data-rej="${pend.id}">Tolak</button>` : ""}
            ${act ? `<button class="btn sm danger" data-off="${act.id}">Nonaktifkan</button>` : `<button class="btn sm light" data-grant="${m.id}">Beri akses</button>`}
            ${m.role !== "admin" ? `<button class="btn sm ghost" data-adm="${m.id}">Jadikan admin</button>` : ""}</div></td></tr>`; }).join("") || '<tr><td class="muted" colspan="6">Tidak ada data.</td></tr>'}
      </table></div></div>`);
    $$("[data-f]").forEach((b) => (b.onclick = () => { sessionStorage.setItem("mf", b.dataset.f); paneMembers(); }));
    $$("[data-act]").forEach((b) => (b.onclick = async () => { const plan = S.plans.find((p) => p.id === b.dataset.plan); let exp; if (plan && plan.months) { const d = new Date(); d.setMonth(d.getMonth() + plan.months); exp = d.toISOString(); } await A.setSubStatus(b.dataset.act, "active", exp); toast("Diaktifkan"); paneMembers(); }));
    $$("[data-rej]").forEach((b) => (b.onclick = async () => { await A.setSubStatus(b.dataset.rej, "rejected"); paneMembers(); }));
    $$("[data-off]").forEach((b) => (b.onclick = async () => { if (!confirm("Nonaktifkan langganan member ini?")) return; await A.setSubStatus(b.dataset.off, "expired", new Date().toISOString()); paneMembers(); }));
    $$("[data-adm]").forEach((b) => (b.onclick = async () => { if (!confirm("Jadikan member ini admin? Ia bisa mengubah semua konten.")) return; try { await A.setRole(b.dataset.adm, "admin"); paneMembers(); } catch (x) { toast(x.message); } }));
    $$("[data-grant]").forEach((b) => (b.onclick = () => modal(`<form id="gf"><h2 style="margin-top:0">Beri akses manual</h2>
      <label class="field"><span>Paket</span><select name="plan">${S.plans.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Berlaku sampai (kosong = selamanya)</span><input type="date" name="exp"></label>
      <div class="row"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc">Aktifkan</button></div></form>`,
      (m, close) => ($("#gf", m).onsubmit = async (e) => { e.preventDefault(); const p = S.plans.find((x) => x.id === e.target.plan.value); await A.grantSub(b.dataset.grant, p, e.target.exp.value ? new Date(e.target.exp.value + "T23:59:59").toISOString() : null); close(); toast("Akses diberikan"); paneMembers(); }))));
  }

  /* ---------------------------- LEADS ---------------------------- */
  async function paneLeads() {
    const rows = await A.list("quiz_leads");
    const goal = { turun: "Turun berat", kuat: "Kuat & berotot", bugar: "Bugar ibadah", sunnah: "Hidup sunnah" };
    pane(`${head("Hasil kuis (calon member)", rows.length + " lead", `<button class="btn sm light" id="csv">Unduh CSV</button>`)}
      <div class="card"><div class="tbl-wrap"><table class="tbl"><tr><th>Nama</th><th>Kontak</th><th>Gender</th><th>Tujuan</th><th>IMT</th><th>Kesehatan</th><th>Tanggal</th><th></th></tr>
      ${rows.map((r) => { const a = r.answers || {}; const res = r.result || {}; return `<tr><td><b>${esc(r.name || a.name || "-")}</b></td><td>${esc(r.email || "")}<br>${esc(r.whatsapp || "")}</td><td>${esc(a.gender || "")}</td><td>${esc(goal[a.goal] || "")}</td><td>${res.bmi || "-"} <span class="muted">${esc(res.bmiCat || "")}</span></td><td>${esc(a.health || "")}</td><td>${fmtDate(r.created_at)}</td>
        <td>${r.whatsapp ? `<a class="btn sm acc" target="_blank" href="${waLink(r.whatsapp, `Assalamu'alaikum ${r.name || ""}, terima kasih sudah mengikuti tes kebugaran ${S.brand}. Hasilmu: IMT ${res.bmi || ""} (${res.bmiCat || ""}). Mau kami bantu mulai programnya?`)}">Follow up WA</a>` : ""}</td></tr>`; }).join("") || '<tr><td class="muted" colspan="8">Belum ada yang mengisi kuis.</td></tr>'}</table></div></div>`);
    $("#csv").onclick = () => {
      const cols = ["created_at", "name", "email", "whatsapp", "gender", "age", "height", "weight", "goal", "activity", "place", "slot", "health", "bmi", "track"];
      const lines = [cols.join(",")].concat(rows.map((r) => { const a = r.answers || {}, res = r.result || {}; return [r.created_at, r.name, r.email, r.whatsapp, a.gender, a.age, a.height, a.weight, a.goal, a.activity, a.place, a.slot, a.health, res.bmi, res.track].map((v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(","); }));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" })); a.download = "hasil-kuis.csv"; a.click();
    };
  }

  /* ---------------------------- PENGATURAN ---------------------------- */
  async function paneSettings() {
    S = await Store.settings();
    const planRow = (p, i) => `<div class="mod-block" data-plan="${i}"><div class="grid g3" style="gap:10px">
      <label class="field"><span>ID (huruf kecil)</span><input data-k="id" value="${esc(p.id)}"></label><label class="field"><span>Nama paket</span><input data-k="name" value="${esc(p.name)}"></label><label class="field"><span>Badge</span><input data-k="badge" value="${esc(p.badge || "")}" placeholder="PALING LARIS"></label>
      <label class="field"><span>Harga (Rp)</span><input data-k="price" type="number" value="${p.price}"></label><label class="field"><span>Harga coret (Rp)</span><input data-k="strike" type="number" value="${p.strike || 0}"></label><label class="field"><span>Periode</span><input data-k="period" value="${esc(p.period || "")}"></label></div>
      <label class="field"><span>Deskripsi singkat</span><input data-k="desc" value="${esc(p.desc || "")}"></label>
      <div class="grid g2" style="gap:10px"><label class="field"><span>Fitur (satu per baris)</span><textarea data-k="features">${esc((p.features || []).join("\n"))}</textarea></label>
      <label class="field"><span>Durasi akses (bulan, 0 = selamanya)</span><input data-k="months" type="number" value="${p.months || 0}"></label></div>
      <button type="button" class="btn sm danger" data-rmplan>Hapus paket</button></div>`;
    pane(`${head("Pengaturan", "Brand, pembayaran & paket")}
      <form id="sf" class="grid" style="gap:18px">
        <div class="card"><span class="label muted">Brand & beranda</span>
          <div class="grid g2 mt16" style="gap:10px"><label class="field"><span>Nama brand</span><input name="brand" value="${esc(S.brand)}"></label><label class="field"><span>Tagline</span><input name="tagline" value="${esc(S.tagline)}"></label></div>
          <label class="field"><span>Judul hero</span><input name="hero_title" value="${esc(S.hero_title || "")}"></label>
          <label class="field"><span>Subjudul hero</span><textarea name="hero_sub" style="min-height:70px">${esc(S.hero_sub || "")}</textarea></label></div>
        <div class="card"><span class="label muted">Kontak & pembayaran</span>
          <div class="grid g2 mt16" style="gap:10px"><label class="field"><span>WhatsApp admin (628…)</span><input name="whatsapp" value="${esc(S.whatsapp || "")}"></label><label class="field"><span>Link grup komunitas</span><input name="community_link" value="${esc(S.community_link || "")}" placeholder="https://chat.whatsapp.com/…"></label></div>
          <label class="field"><span>Link pembayaran online (opsional: Mayar, Scalev, Xendit, dll.)</span><input name="payment_link" value="${esc(S.payment_link || "")}"></label>
          <label class="field"><span>Info rekening / instruksi transfer</span><input name="bank_info" value="${esc(S.bank_info || "")}"></label>
          ${imageField("qris_url", S.qris_url, "Gambar QRIS")}</div>
        <div class="card"><span class="label muted">Paket langganan</span><div id="plans" class="mt16">${S.plans.map(planRow).join("")}</div><button type="button" class="btn sm light" id="addPlan">+ Paket</button></div>
        <div class="row"><span class="spacer"></span><button class="btn acc">Simpan pengaturan</button></div>
        ${Store.mode === "demo" ? `<div class="card dashed"><b>Reset data demo</b><p class="muted">Hapus semua data demo di browser ini dan kembali ke konten awal.</p><button type="button" class="btn sm danger" id="reset">Reset demo</button></div>` : ""}
      </form>`);
    const sf = $("#sf"); wireImages(sf);
    const bindRm = () => $$("[data-rmplan]", sf).forEach((b) => (b.onclick = () => b.closest("[data-plan]").remove()));
    bindRm();
    $("#addPlan").onclick = () => { $("#plans").insertAdjacentHTML("beforeend", planRow({ id: "paket" + Date.now().toString().slice(-4), name: "Paket baru", price: 0, features: [] }, Date.now())); bindRm(); };
    if ($("#reset")) $("#reset").onclick = async () => { if (confirm("Reset semua data demo?")) { await A.resetDemo(); location.reload(); } };
    sf.onsubmit = async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(["brand", "tagline", "hero_title", "hero_sub", "whatsapp", "community_link", "payment_link", "bank_info", "qris_url"].map((k) => [k, sf[k].value.trim()]));
      d.plans = $$("[data-plan]", sf).map((b) => { const o = {}; $$("[data-k]", b).forEach((i) => (o[i.dataset.k] = i.value)); return { id: o.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""), name: o.name, badge: o.badge, price: +o.price || 0, strike: +o.strike || 0, period: o.period, desc: o.desc, features: o.features.split("\n").map((s) => s.trim()).filter(Boolean), months: +o.months || 0 }; });
      try { await Store.saveSettings(d); S = await Store.settings(); toast("Pengaturan tersimpan"); } catch (x) { toast(x.message); }
    };
  }

  /* ---------------------------- boot ---------------------------- */
  async function boot() {
    const me = await gate(); if (!me) return;
    try { const members = await A.list("members"); pendingCount = members.flatMap((m) => m.subscriptions).filter((s) => s.status === "pending").length; } catch (e) {}
    shell();
  }
  boot();
})();
