/* =====================================================================
   QOWIY — Panel Admin
   Upload video rutinitas & motivasi, kelola kelas, artikel, member,
   langganan, lead kuis, dan pengaturan situs.
   ===================================================================== */
(async function () {
  const { esc, rp, $, $$, toast, modal, SLOTS, DAYS, fmtDate, waLink } = UI;
  await Store.init();
  const root = $("#admin");
  const A = Store.admin, C = Store.coach;
  let S = await Store.settings();
  let ROLE = "admin", ME = null;
  const SPEC = { turun: "Turun berat", kuat: "Kekuatan & otot", bugar: "Bugar untuk ibadah", sunnah: "Gaya hidup sunnah", rumah: "Latihan di rumah", gym: "Latihan di gym" };
  const UP = (file, opts, onP) => (ROLE === "coach" ? C.upload(file, opts, onP) : A.upload(file, opts, onP));
  const saveSettings = async (patch) => { S = await Store.settings(); await Store.saveSettings(Object.assign({}, S, patch)); S = await Store.settings(); };
  const origin = location.origin + (location.pathname.replace(/\/[^/]*$/, "/") || "/");
  let tab = (location.hash || "#ringkasan").slice(1) || "ringkasan";
  if (Store.mode === "demo") $("#demoBanner").classList.remove("hidden");

  /* ---------------------------- auth ---------------------------- */
  async function gate() {
    const me = (await Store.session()) ? await Store.me() : null;
    if (me && (me.role === "admin" || me.role === "coach")) {
      ROLE = me.role; ME = me; $("#logoutBtn").classList.remove("hidden");
      const sub = $(".brand-sub"); if (sub) sub.textContent = ROLE === "coach" ? "Panel Pelatih" : "Panel Admin";
      document.title = (ROLE === "coach" ? "Panel Pelatih" : "Panel Admin") + " — " + (S.brand || "QOWIY");
      return me;
    }
    const wantCoach = /pelatih/.test(location.pathname);
    root.innerHTML = `<section class="wrap quiz"><form class="card" id="lf">
      <span class="label muted">${wantCoach ? "Panel pelatih" : "Panel admin"}</span><h2 style="margin:6px 0 14px">${wantCoach ? "Masuk sebagai pelatih" : "Masuk sebagai admin"}</h2>
      ${me ? `<div class="notice" style="margin-bottom:14px">Akun <b>${esc(me.email)}</b> belum terdaftar sebagai ${wantCoach ? "pelatih" : "admin"}. ${wantCoach ? `Daftar dulu di <a href="index.html#/daftar-pelatih">halaman pendaftaran pelatih</a> dan tunggu persetujuan admin.` : `Jadikan admin lewat SQL: <code>update profiles set role='admin' where email='${esc(me.email)}';</code>`}</div>` : ""}
      <label class="field"><span>Email</span><input name="email" type="email" required></label>
      <label class="field"><span>Password</span><input name="password" type="password" required></label>
      <div class="err" id="lerr"></div><button class="btn acc block">Masuk</button>
      ${Store.mode === "demo" ? `<p class="muted center" style="font-size:13px">Demo admin: admin@qowiy.id / admin123 · Demo pelatih: coach@qowiy.id / coach123</p>` : wantCoach ? `<p class="muted center" style="font-size:13px">Belum punya akun? Setelah pendaftaranmu disetujui, <a href="index.html#/daftar">buat akun</a> memakai email yang sama dengan formulir pendaftaran.</p>` : `<p class="muted center" style="font-size:13px">Belum punya akun admin? <a href="index.html#/daftar">Daftar di aplikasi</a> memakai email yang terdaftar sebagai admin, konfirmasi email, lalu masuk di sini.</p>`}
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
  const ADMIN_TABS = [
    ["ringkasan", "📊", "Ringkasan"], ["pelatih", "🧑‍🏫", "Pelatih"], ["member", "👥", "Member & Langganan"], ["transaksi", "💳", "Transaksi & Komisi"],
    ["rutinitas", "🕌", "Video Rutinitas"], ["motivasi", "🎙️", "Motivasi Trainer"],
    ["kelas", "🎬", "Kelas & Lesson"], ["artikel", "📚", "Artikel"],
    ["leads", "📝", "Hasil Kuis"], ["pengaturan", "⚙️", "Pengaturan"]
  ];
  const COACH_TABS = [["ringkasan", "📊", "Ringkasan"], ["binaan", "👥", "Member Binaan"], ["materi", "🎬", "Materi Saya"], ["penghasilan", "💰", "Penghasilan & Referral"], ["profil", "🪪", "Profil Pelatih"]];
  let pendingCount = 0, pendingCoach = 0;
  function shell() {
    const TABS = ROLE === "coach" ? COACH_TABS : ADMIN_TABS;
    if (!TABS.some((t) => t[0] === tab)) tab = "ringkasan";
    const badge = (k) => (k === "member" && pendingCount ? pendingCount : k === "pelatih" && pendingCoach ? pendingCoach : 0);
    root.innerHTML = `<section class="wrap adm">
      <aside class="adm-side">${TABS.map(([k, i, t]) => `<button data-t="${k}" class="${tab === k ? "on" : ""}"><span>${i}</span>${t}${badge(k) ? `<span class="count">${badge(k)}</span>` : ""}</button>`).join("")}</aside>
      <div id="pane"><div class="loading">Memuat…</div></div></section>`;
    $$(".adm-side button").forEach((b) => (b.onclick = () => { tab = b.dataset.t; location.hash = tab; shell(); }));
    const fn = ROLE === "coach"
      ? ({ ringkasan: paneCoachSummary, binaan: paneCoachMembers, materi: paneCoachMaterials, penghasilan: paneCoachEarnings, profil: paneCoachProfile }[tab] || paneCoachSummary)
      : ({ ringkasan: paneSummary, pelatih: paneCoaches, transaksi: paneTransactions, rutinitas: () => paneVideos("routine"), motivasi: () => paneVideos("motivation"), kelas: paneClasses, artikel: paneArticles, member: paneMembers, leads: paneLeads, pengaturan: paneSettings }[tab] || paneSummary);
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
      const r = await UP(f, { isPublic: false }, (p) => ($("i", pr).style.width = Math.round(p * 100) + "%"));
      row.storage_path = r.path; row.video_url = "";
    }
  }
  function imageField(name, val, label) {
    return `<div class="field"><span>${label}</span><div class="row"><input class="input" name="${name}" value="${esc(val || "")}" placeholder="URL gambar (opsional)"><label class="btn sm light" style="white-space:nowrap">Upload<input type="file" accept="image/*" data-img="${name}" hidden></label></div></div>`;
  }
  /* Dokumen lesson: unggah file (PDF/Word/PPT) atau tempel link (Google Drive/Docs) */
  function docField(row) {
    const has = !!row.doc_path, url = row.doc_url || "";
    return `<div class="field"><span>Modul dokumen (opsional)</span><div class="media-box" data-doc>
      <div class="seg"><label><input type="radio" name="dsrc" value="none" ${!has && !url ? "checked" : ""}><span>Tanpa dokumen</span></label><label><input type="radio" name="dsrc" value="file" ${has ? "checked" : ""}><span>⬆ Upload dokumen</span></label><label><input type="radio" name="dsrc" value="link" ${!has && url ? "checked" : ""}><span>🔗 Link dokumen</span></label></div>
      <div data-dsrc="file">${has ? `<div class="pill acc" style="margin-bottom:8px">Tersimpan: ${esc(row.doc_path.split("/").pop().slice(0, 50))}</div>` : ""}<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" data-dfile><div class="prog mt8 hidden" data-dprog><i></i></div><small class="muted">PDF tampil langsung di halaman lesson. Format lain dibuka/diunduh lewat tombol.</small></div>
      <div data-dsrc="link"><input class="input" data-durl placeholder="https://drive.google.com/file/d/… atau https://docs.google.com/…" value="${esc(url)}"></div>
      <div data-dsrc="file link"><input class="input" data-dname placeholder="Nama dokumen yang tampil ke member (opsional)" value="${esc(row.doc_name || "")}"></div>
    </div></div>`;
  }
  function wireDoc(scope) {
    const box = $("[data-doc]", scope); if (!box) return;
    const sync = () => { const v = $("input[name=dsrc]:checked", box).value; $$("[data-dsrc]", box).forEach((d) => d.classList.toggle("hidden", !d.dataset.dsrc.split(" ").includes(v))); };
    $$("input[name=dsrc]", box).forEach((r) => (r.onchange = sync)); sync();
  }
  async function readDoc(scope, row) {
    const box = $("[data-doc]", scope); if (!box) return;
    const mode = $("input[name=dsrc]:checked", box).value;
    row.doc_name = $("[data-dname]", box).value.trim() || null;
    if (mode === "none") { row.doc_path = null; row.doc_url = null; row.doc_name = null; return; }
    if (mode === "link") { row.doc_url = $("[data-durl]", box).value.trim() || null; row.doc_path = null; return; }
    const f = $("[data-dfile]", box).files[0];
    if (f) {
      const pr = $("[data-dprog]", box); pr.classList.remove("hidden");
      const r = await UP(f, { isPublic: false }, (p) => ($("i", pr).style.width = Math.round(p * 100) + "%"));
      row.doc_path = r.path; row.doc_url = null; if (!row.doc_name) row.doc_name = f.name;
    }
  }
  function wireImages(scope) {
    $$("[data-img]", scope).forEach((inp) => (inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return; toast("Mengunggah gambar…");
      try { const r = await UP(f, { isPublic: true }); $(`[name="${inp.dataset.img}"]`, scope).value = r.url; toast("Gambar terunggah"); } catch (e) { toast(e.message); }
    }));
  }

  /* ---------------------------- RINGKASAN ---------------------------- */
  async function paneSummary() {
    const [members, leads, vids, arts, coaches, apps, earns] = await Promise.all([A.list("members"), A.list("quiz_leads"), A.list("videos"), A.list("articles"), A.list("coaches").catch(() => []), A.list("coach_applications").catch(() => []), A.list("coach_earnings").catch(() => [])]);
    pendingCoach = apps.filter((a) => a.status === "pending").length;
    const subs = members.flatMap((m) => m.subscriptions.map((s) => Object.assign({ member: m }, s)));
    const pend = subs.filter((s) => s.status === "pending"); pendingCount = pend.length;
    const active = members.filter((m) => Store.hasActive(m.subscriptions)).length;
    const revenue = subs.filter((s) => s.status === "active").reduce((a, s) => a + (s.amount || 0), 0);
    pane(`${head("Ringkasan", Store.mode === "demo" ? "Mode demo" : "Database online · Supabase")}
      <div class="grid g4">${[["Member", members.length], ["Langganan aktif", active], ["Menunggu verifikasi", pend.length], ["Pendapatan terverifikasi", rp(revenue)], ["Pelatih aktif", coaches.filter((c) => c.active).length], ["Calon pelatih menunggu", pendingCoach], ["Komisi pelatih tertunda", rp(earns.filter((e) => e.status === "tertunda").reduce((a, e) => a + e.amount, 0))], ["Member tanpa pelatih", members.filter((m) => m.role === "member" && !m.coach_id).length], ["Hasil kuis (lead)", leads.length], ["Video rutinitas", vids.filter((v) => v.kind === "routine").length], ["Video motivasi", vids.filter((v) => v.kind === "motivation").length], ["Artikel", arts.length]]
        .map(([t, v]) => `<div class="kpi"><span class="label muted">${t}</span><b>${v}</b></div>`).join("")}</div>
      <div class="card section">${head("Perlu diverifikasi", "Klik aktifkan setelah cek bukti bayar di WhatsApp")}
        ${pend.length ? `<div class="tbl-wrap"><table class="tbl"><tr><th>Member</th><th>Paket</th><th>Nominal</th><th>Tanggal</th><th></th></tr>${pend.map((s) => `<tr><td><b>${esc(s.member.full_name || "-")}</b><br><span class="muted">${esc(s.member.email)}</span></td><td>${esc(s.plan_name)}</td><td>${rp(s.amount)}</td><td>${fmtDate(s.created_at)}</td>
          <td class="row"><button class="btn sm acc" data-act="${s.id}">Aktifkan</button><button class="btn sm danger" data-rej="${s.id}">Tolak</button></td></tr>`).join("")}</table></div>` : '<p class="muted">Tidak ada pembayaran yang menunggu. 🎉</p>'}
      </div>
      ${pendingCoach ? `<div class="card section row wrap-it"><div style="flex:1"><b>${pendingCoach} calon pelatih</b> menunggu seleksi.</div><button class="btn sm acc" id="goCoach">Buka seleksi pelatih →</button></div>` : ""}`);
    if ($("#goCoach")) $("#goCoach").onclick = () => { sessionStorage.setItem("pt", "pendaftar"); tab = "pelatih"; location.hash = tab; shell(); };
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
    const [mods0, lessons0] = await Promise.all([A.list("modules"), A.list("lessons")]);
    const mods = mods0.filter((m) => !m.coach_id), lessons = lessons0.filter((l) => !l.coach_id);
    pane(`${head("Kelas & lesson", "Program resmi · modul = kotak di Peta Program; lesson = video/dokumen di dalamnya", `<button class="btn acc sm" id="addM">+ Modul</button>`)}
      ${Object.entries(TRACKS).map(([t, tl]) => `<div class="card" style="margin-bottom:16px"><span class="label muted">${tl}</span>
        ${mods.filter((m) => m.track === t).sort((a, b) => a.sort - b.sort).map((m) => `<div class="mod-block mt8">
          <div class="row wrap-it"><b>${esc(m.tag || "")}</b><span>${esc(m.title)} — <span class="muted">${esc(m.subtitle || "")}</span></span>${m.published === false ? '<span class="pill cream">Draft</span>' : ""}<span class="spacer"></span>
            <button class="btn sm light" data-em="${m.id}">Edit modul</button><button class="btn sm acc" data-al="${m.id}">+ Lesson</button><button class="btn sm danger" data-dm="${m.id}">Hapus</button></div>
          <table class="tbl mt8">${lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.sort - b.sort).map((l) => `<tr><td style="width:36px">${l.sort}</td><td><b>${esc(l.title)}</b> ${l.is_free ? '<span class="pill gold">Gratis</span>' : ""}</td>
            <td>${l.storage_path ? '<span class="pill acc">Video file</span>' : l.video_url ? '<span class="pill cream">Video link</span>' : l.doc_path || l.doc_url ? "" : '<span class="pill red">Belum ada isi</span>'} ${l.doc_path || l.doc_url ? '<span class="pill gold">Dokumen</span>' : ""}</td>
            <td class="row" style="justify-content:flex-end"><button class="btn sm light" data-el="${l.id}">Edit</button><button class="btn sm danger" data-dl="${l.id}">Hapus</button></td></tr>`).join("") || '<tr><td class="muted">Belum ada lesson.</td></tr>'}</table></div>`).join("") || '<p class="muted">Belum ada modul.</p>'}
      </div>`).join("")}`);
    $("#addM").onclick = () => editModule({ track: "start", sort: 1, published: true });
    $$("[data-em]").forEach((b) => (b.onclick = () => editModule(mods.find((m) => m.id === b.dataset.em))));
    $$("[data-dm]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus modul beserta semua lesson di dalamnya?")) return; await A.remove("modules", b.dataset.dm); paneClasses(); }));
    $$("[data-al]").forEach((b) => (b.onclick = () => editLesson({ module_id: b.dataset.al, sort: lessons.filter((l) => l.module_id === b.dataset.al).length + 1, published: true }, mods, paneClasses)));
    $$("[data-el]").forEach((b) => (b.onclick = () => editLesson(lessons.find((l) => l.id === b.dataset.el), mods, paneClasses)));
    $$("[data-dl]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus lesson ini?")) return; await A.remove("lessons", b.dataset.dl); paneClasses(); }));
  }
  function editModule(row, after) {
    if (ROLE === "coach") return editCoachModule(row, after);
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
  function editLesson(row, mods, after) {
    const save = ROLE === "coach" ? C.upsert : A.upsert;
    modal(`<form id="lf2"><h2 style="margin-top:0">${row.id ? "Edit" : "Tambah"} lesson</h2>
      <label class="field"><span>Modul</span><select name="module_id">${mods.map((m) => `<option value="${m.id}" ${row.module_id === m.id ? "selected" : ""}>${esc((m.tag || "") + " · " + m.title)}</option>`).join("")}</select></label>
      <label class="field"><span>Judul lesson</span><input name="title" required value="${esc(row.title || "")}"></label>
      ${mediaField(row, { label: "Video (opsional bila lesson berupa dokumen)" })}
      ${docField(row)}
      <label class="field"><span>Deskripsi / catatan materi</span><textarea name="description">${esc(row.description || "")}</textarea></label>
      <label class="field"><span>Dalil terkait (opsional, sertakan nomor riwayat)</span><textarea name="dalil" style="min-height:70px">${esc(row.dalil || "")}</textarea></label>
      <div class="grid g3" style="gap:10px"><label class="field"><span>Durasi</span><input name="duration" value="${esc(row.duration || "")}"></label><label class="field"><span>Urutan</span><input name="sort" type="number" value="${row.sort || 1}"></label>
        <div class="field"><span>Opsi</span><label class="check"><input type="checkbox" name="published" ${row.published !== false ? "checked" : ""}> Tayang</label><label class="check"><input type="checkbox" name="is_free" ${row.is_free ? "checked" : ""}> Gratis (preview)</label></div></div>
      <div class="err" id="lerr2"></div>
      <div class="row"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc" id="lsave">Simpan</button></div></form>`,
    (m, close) => { wireMedia(m); wireDoc(m); $("#lf2", m).onsubmit = async (e) => { e.preventDefault(); const f = e.target; $("#lsave", m).disabled = true;
      try { const r = Object.assign({}, row, { module_id: f.module_id.value, title: f.title.value, description: f.description.value, dalil: f.dalil.value, duration: f.duration.value, sort: +f.sort.value || 0, published: f.published.checked, is_free: f.is_free.checked });
        await readMedia(m, r); await readDoc(m, r); await save("lessons", r); toast("Lesson tersimpan"); close(); (after || paneClasses)(); }
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
    const [members, coaches] = await Promise.all([A.list("members"), A.list("coaches").catch(() => [])]);
    const cName = (id) => { const c = coaches.find((x) => x.id === id); return c ? c.display_name : ""; };
    const filt = sessionStorage.getItem("mf") || "semua";
    const status = (m) => (Store.hasActive(m.subscriptions) ? "aktif" : m.subscriptions.some((s) => s.status === "pending") ? "pending" : "belum");
    const list = members.filter((m) => filt === "semua" || status(m) === filt);
    pane(`${head("Member & langganan", members.length + " member")}
      <div class="slot-tabs">${["semua", "pending", "aktif", "belum"].map((f) => `<button data-f="${f}" class="${filt === f ? "on" : ""}">${f}</button>`).join("")}</div>
      <div class="card"><div class="tbl-wrap"><table class="tbl"><tr><th>Member</th><th>Kontak</th><th>Jalur</th><th>Pelatih</th><th>Langganan</th><th>Progres</th><th>Aksi</th></tr>
      ${list.map((m) => { const st = status(m); const pend = m.subscriptions.find((s) => s.status === "pending"); const act = m.subscriptions.find((s) => s.status === "active");
        return `<tr><td><b>${esc(m.full_name || "-")}</b> ${m.role === "admin" ? '<span class="pill gold">admin</span>' : m.role === "coach" ? '<span class="pill acc">pelatih</span>' : ""}<br><span class="muted">${esc(m.email || "")}</span><br><span class="muted" style="font-size:12px">${fmtDate(m.created_at)}</span></td>
          <td>${m.whatsapp ? `<a href="${waLink(m.whatsapp)}" target="_blank">${esc(m.whatsapp)}</a>` : "-"}<br><span class="muted">${esc(m.gender || "")}</span></td>
          <td>${m.quiz && m.quiz.result ? (m.quiz.result.track === "turun" ? "Turun Berat" : "Bugar & Kuat") + `<br><span class="muted">IMT ${m.quiz.result.bmi}</span>` : "-"}</td>
          <td>${m.role === "member" ? `<select class="sel-sm" data-coachsel="${m.id}"><option value="">— belum ada —</option>${coaches.filter((c) => c.active && (!m.gender || c.gender === m.gender)).map((c) => `<option value="${c.id}" ${m.coach_id === c.id ? "selected" : ""}>${esc(c.display_name)}</option>`).join("")}</select>${m.referred_by ? `<br><span class="muted" style="font-size:12px">via referral ${esc(cName(m.referred_by))}</span>` : ""}` : "-"}</td>
          <td><span class="pill ${st === "aktif" ? "acc" : st === "pending" ? "gold" : "cream"}">${st}</span><br>${esc((act || pend || {}).plan_name || "")}${act && act.expires_at ? `<br><span class="muted" style="font-size:12px">s.d. ${fmtDate(act.expires_at)}</span>` : ""}</td>
          <td>${m.done} lesson</td>
          <td><div class="row wrap-it">${pend ? `<button class="btn sm acc" data-act="${pend.id}" data-plan="${esc(pend.plan)}">Aktifkan</button><button class="btn sm danger" data-rej="${pend.id}">Tolak</button>` : ""}
            ${act ? `<button class="btn sm danger" data-off="${act.id}">Nonaktifkan</button>` : `<button class="btn sm light" data-grant="${m.id}">Beri akses</button>`}
            ${m.role !== "admin" ? `<button class="btn sm ghost" data-adm="${m.id}">Jadikan admin</button>` : ""}</div></td></tr>`; }).join("") || '<tr><td class="muted" colspan="7">Tidak ada data.</td></tr>'}
      </table></div></div>`);
    $$("[data-coachsel]").forEach((sel) => (sel.onchange = async () => { try { await A.setMemberCoach(sel.dataset.coachsel, sel.value || null); toast(sel.value ? "Member dipetakan ke " + cName(sel.value) : "Pelatih dilepas"); } catch (x) { toast(x.message); } }));
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
      try { await saveSettings(d); toast("Pengaturan tersimpan"); } catch (x) { toast(x.message); }
    };
  }

  /* ======================================================================
     ADMIN — PELATIH: seleksi pendaftar, daftar pelatih & pemetaan, syarat
     ====================================================================== */
  async function paneCoaches() {
    const sub = sessionStorage.getItem("pt") || "pendaftar";
    const [apps, coaches, members] = await Promise.all([A.list("coach_applications"), A.list("coaches"), A.list("members")]);
    pendingCoach = apps.filter((a) => a.status === "pending").length;
    const tabs = [["pendaftar", "Seleksi pendaftar" + (pendingCoach ? " (" + pendingCoach + ")" : "")], ["daftar", "Daftar pelatih & member"], ["syarat", "Syarat pendaftaran"]];
    let body = "";
    if (sub === "pendaftar") {
      const f = sessionStorage.getItem("paf") || "pending";
      const list = apps.filter((a) => f === "semua" || a.status === f);
      body = `<div class="slot-tabs">${["pending", "approved", "rejected", "semua"].map((x) => `<button data-paf="${x}" class="${f === x ? "on" : ""}">${{ pending: "menunggu", approved: "disetujui", rejected: "ditolak", semua: "semua" }[x]}</button>`).join("")}</div>
        <div class="card"><div class="tbl-wrap"><table class="tbl"><tr><th>Calon pelatih</th><th>Kontak</th><th>Pengalaman</th><th>Ringkasan</th><th>CV</th><th>Status</th><th>Aksi</th></tr>
        ${list.map((a) => `<tr><td><b>${esc(a.full_name)}</b><br><span class="pill ${a.gender === "akhwat" ? "gold" : "acc"}">${esc(a.gender)}</span> <span class="muted" style="font-size:12px">${esc(a.city || "")}</span><br><span class="muted" style="font-size:12px">${fmtDate(a.created_at)}</span></td>
          <td>${esc(a.email)}<br><a href="${waLink(a.whatsapp, "Assalamu'alaikum " + a.full_name + ", kami dari admin " + S.brand + " terkait pendaftaran pelatih.")}" target="_blank">${esc(a.whatsapp)}</a></td>
          <td>${a.experience_months != null ? a.experience_months + " bulan" : "-"}${+a.experience_months < 3 ? ' <span class="pill red">&lt; 3 bln</span>' : ""}<br><span class="muted" style="font-size:12px">${a.certified ? "Bersertifikat" : "Belum bersertifikat"}</span></td>
          <td style="max-width:260px;font-size:13px">${esc((a.bio || "").slice(0, 180))}${(a.bio || "").length > 180 ? "…" : ""}<br><span class="muted" style="font-size:12px">${(a.agreements || []).length}/${(S.coach_requirements || []).length} syarat dicentang</span></td>
          <td>${a.cv_path ? `<button class="btn sm light" data-cv="${esc(a.cv_path)}">Lihat CV</button>` : '<span class="muted">-</span>'}</td>
          <td><span class="pill ${a.status === "approved" ? "acc" : a.status === "pending" ? "gold" : "red"}">${{ pending: "menunggu", approved: "disetujui", rejected: "ditolak" }[a.status]}</span>${a.admin_note ? `<br><span class="muted" style="font-size:12px">${esc(a.admin_note)}</span>` : ""}</td>
          <td><div class="row wrap-it">${a.status !== "approved" ? `<button class="btn sm acc" data-appr="${a.id}">Setujui</button>` : ""}${a.status === "pending" ? `<button class="btn sm danger" data-rjct="${a.id}">Tolak</button>` : ""}</div></td></tr>`).join("") || '<tr><td colspan="7" class="muted">Tidak ada pendaftar.</td></tr>'}
        </table></div></div>`;
    }
    if (sub === "daftar") {
      body = `<div class="card"><div class="tbl-wrap"><table class="tbl"><tr><th>Pelatih</th><th>Kode referral</th><th>Member binaan</th><th>Dari referral</th><th>Status</th><th>Aksi</th></tr>
        ${coaches.map((c) => { const mine = members.filter((m) => m.coach_id === c.id), refd = members.filter((m) => m.referred_by === c.id);
          return `<tr><td><b>${esc(c.display_name)}</b><br><span class="pill ${c.gender === "akhwat" ? "gold" : "acc"}">${esc(c.gender)}</span> <span class="muted" style="font-size:12px">${esc(c.city || "")}</span></td>
          <td><code>${esc(c.referral_code)}</code></td>
          <td>${mine.length} member<br><span class="muted" style="font-size:12px">${mine.filter((m) => Store.hasActive(m.subscriptions)).length} aktif</span></td><td>${refd.length}</td>
          <td>${c.active ? '<span class="pill acc">aktif</span>' : '<span class="pill red">nonaktif</span>'} ${c.accepting === false ? '<span class="pill cream">penuh</span>' : ""}</td>
          <td><div class="row wrap-it"><button class="btn sm light" data-cmem="${c.id}">Lihat member</button><button class="btn sm ghost" data-cedit="${c.id}">Edit</button>
            <button class="btn sm ${c.active ? "danger" : "acc"}" data-cact="${c.id}" data-on="${c.active ? 0 : 1}">${c.active ? "Nonaktifkan" : "Aktifkan"}</button></div></td></tr>`; }).join("") || '<tr><td colspan="6" class="muted">Belum ada pelatih. Setujui pendaftar di tab Seleksi.</td></tr>'}
        </table></div></div>
        <div class="card section"><span class="label muted">Member tanpa pelatih</span>
          <p class="muted" style="font-size:14px">${members.filter((m) => m.role === "member" && !m.coach_id).length} member belum dipetakan. Atur pelatihnya di tab <b>Member & Langganan</b> (kolom Pelatih).</p></div>`;
    }
    if (sub === "syarat") {
      const reqs = S.coach_requirements || [];
      body = `<form class="card" id="reqF"><span class="label muted">Syarat yang tampil di halaman Daftar Khusus Pelatih</span>
        <div id="reqRows" class="mt16">${reqs.map((r) => `<div class="row req-row" style="margin-bottom:8px"><input class="input" value="${esc(r)}"><button type="button" class="x" style="height:44px;width:44px">✕</button></div>`).join("")}</div>
        <button type="button" class="btn sm light" id="addReq">+ Syarat</button>
        <div class="row mt16"><a class="btn sm ghost" href="index.html#/daftar-pelatih" target="_blank">Lihat halaman pendaftaran ↗</a><span class="spacer"></span><button class="btn acc">Simpan syarat</button></div></form>`;
    }
    pane(`${head("Pelatih", coaches.filter((c) => c.active).length + " aktif · " + pendingCoach + " menunggu seleksi")}
      <div class="slot-tabs">${tabs.map(([k, t]) => `<button data-pt="${k}" class="${sub === k ? "on" : ""}">${t}</button>`).join("")}</div>${body}`);
    $$("[data-pt]").forEach((b) => (b.onclick = () => { sessionStorage.setItem("pt", b.dataset.pt); paneCoaches(); }));
    $$("[data-paf]").forEach((b) => (b.onclick = () => { sessionStorage.setItem("paf", b.dataset.paf); paneCoaches(); }));
    $$("[data-cv]").forEach((b) => (b.onclick = async () => { const w = window.open("", "_blank"); const u = await A.cvUrl(b.dataset.cv); if (u) w.location = u; else { w.close(); toast("CV tidak dapat dibuka"); } }));
    $$("[data-appr]").forEach((b) => (b.onclick = async () => {
      const a = apps.find((x) => x.id === b.dataset.appr); if (!confirm("Setujui " + a.full_name + " sebagai pelatih " + a.gender + "?")) return;
      try {
        const r = await A.approveCoach(a.id);
        const msg = r.linked
          ? `Assalamu'alaikum ${a.full_name}, alhamdulillah pendaftaran pelatih ${S.brand} Anda disetujui. Silakan masuk ke Panel Pelatih: ${origin}pelatih.html${r.referral_code ? "\nKode referral Anda: " + r.referral_code : ""}`
          : `Assalamu'alaikum ${a.full_name}, alhamdulillah pendaftaran pelatih ${S.brand} Anda disetujui. Silakan buat akun memakai email ${a.email} di ${origin}#/daftar — setelah itu Panel Pelatih langsung terbuka di ${origin}pelatih.html`;
        modal(`<h2 style="margin-top:0">Pelatih disetujui ✓</h2><p>${r.linked ? `Akun <b>${esc(a.email)}</b> sekarang berstatus pelatih${r.referral_code ? " dengan kode referral <b>" + esc(r.referral_code) + "</b>" : ""}.` : `<b>${esc(a.full_name)}</b> belum punya akun. Begitu ia mendaftar dengan email <b>${esc(a.email)}</b>, akunnya otomatis menjadi pelatih.`}</p>
          <div class="row"><button class="btn ghost" data-close>Tutup</button><span class="spacer"></span><a class="btn acc" target="_blank" href="${waLink(a.whatsapp, msg)}">Kabari via WhatsApp</a></div>`);
        paneCoaches();
      } catch (x) { toast(x.message); }
    }));
    $$("[data-rjct]").forEach((b) => (b.onclick = () => { const a = apps.find((x) => x.id === b.dataset.rjct);
      modal(`<form id="rjF"><h2 style="margin-top:0">Tolak pendaftaran</h2><p class="muted">${esc(a.full_name)} · ${esc(a.email)}</p><label class="field"><span>Catatan untuk pendaftar (opsional)</span><textarea name="note" placeholder="mis. Pengalaman latihan belum mencapai 3 bulan"></textarea></label>
        <div class="row"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn danger">Tolak</button></div></form>`,
      (m, close) => ($("#rjF", m).onsubmit = async (e) => { e.preventDefault(); await A.rejectCoach(a.id, e.target.note.value.trim()); close(); toast("Pendaftaran ditolak"); paneCoaches(); })); }));
    $$("[data-cact]").forEach((b) => (b.onclick = async () => { const on = b.dataset.on === "1"; if (!on && !confirm("Nonaktifkan pelatih ini? Ia tidak bisa membuka Panel Pelatih dan tidak tampil untuk dipilih member.")) return; await A.setCoachActive(b.dataset.cact, on); toast(on ? "Pelatih diaktifkan" : "Pelatih dinonaktifkan"); paneCoaches(); }));
    $$("[data-cedit]").forEach((b) => (b.onclick = () => { const c = coaches.find((x) => x.id === b.dataset.cedit);
      modal(`<form id="ceF"><h2 style="margin-top:0">Edit pelatih</h2>
        <div class="grid g2" style="gap:10px"><label class="field"><span>Nama tampil</span><input name="display_name" value="${esc(c.display_name)}" required></label><label class="field"><span>Kode referral</span><input name="referral_code" value="${esc(c.referral_code)}" required></label></div>
        <div class="grid g2" style="gap:10px"><label class="field"><span>Kategori</span><select name="gender"><option value="ikhwan" ${c.gender === "ikhwan" ? "selected" : ""}>ikhwan</option><option value="akhwat" ${c.gender === "akhwat" ? "selected" : ""}>akhwat</option></select></label><label class="field"><span>Kota</span><input name="city" value="${esc(c.city || "")}"></label></div>
        <label class="check"><input type="checkbox" name="accepting" ${c.accepting !== false ? "checked" : ""}> Menerima member baru</label>
        <div class="err" id="ceErr"></div><div class="row mt16"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc">Simpan</button></div></form>`,
      (m, close) => ($("#ceF", m).onsubmit = async (e) => { e.preventDefault(); const f = e.target;
        try { await A.upsert("coaches", Object.assign({}, c, { display_name: f.display_name.value.trim(), referral_code: f.referral_code.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""), gender: f.gender.value, city: f.city.value.trim(), accepting: f.accepting.checked })); close(); toast("Tersimpan"); paneCoaches(); }
        catch (x) { $("#ceErr", m).textContent = /duplicate|unique/i.test(x.message) ? "Kode referral sudah dipakai pelatih lain." : x.message; } })); }));
    $$("[data-cmem]").forEach((b) => (b.onclick = async () => { const c = coaches.find((x) => x.id === b.dataset.cmem); const rows = await A.coachMembers(c.id);
      modal(`<h2 style="margin-top:0">Member ${esc(c.display_name)}</h2>${membersTable(rows, false)}<div class="row mt16"><span class="spacer"></span><button class="btn ghost" data-close>Tutup</button></div>`, null, "wide"); }));
    if ($("#reqF")) {
      const bindX = () => $$("#reqRows .x").forEach((x) => (x.onclick = () => x.closest(".req-row").remove())); bindX();
      $("#addReq").onclick = () => { $("#reqRows").insertAdjacentHTML("beforeend", `<div class="row req-row" style="margin-bottom:8px"><input class="input" placeholder="Syarat baru"><button type="button" class="x" style="height:44px;width:44px">✕</button></div>`); bindX(); };
      $("#reqF").onsubmit = async (e) => { e.preventDefault(); const list = $$("#reqRows input").map((i) => i.value.trim()).filter(Boolean); try { await saveSettings({ coach_requirements: list }); toast("Syarat tersimpan"); } catch (x) { toast(x.message); } };
    }
  }

  /* Tabel monitoring member (dipakai admin & pelatih) */
  function membersTable(rows, actions) {
    const mine = rows.filter((r) => r.is_mine);
    const wchg = (r) => (r.last_weight != null && r.first_weight != null && r.last_weight !== r.first_weight ? ` <span class="muted">(${r.last_weight - r.first_weight > 0 ? "+" : ""}${(+r.last_weight - +r.first_weight).toFixed(1)})</span>` : "");
    const ago = (d) => { if (!d) return '<span class="pill red">belum</span>'; const n = Math.round((new Date(Store.today()) - new Date(d)) / 864e5); return n <= 0 ? "hari ini" : n === 1 ? "kemarin" : n + " hari lalu"; };
    return `<div class="tbl-wrap"><table class="tbl"><tr><th>Member</th><th>Langganan</th><th>Checklist sunnah 7 hari</th><th>Check-in terakhir</th><th>Lesson</th><th>Berat (kg)</th>${actions ? "<th></th>" : ""}</tr>
      ${mine.map((r) => `<tr class="${r.habit_days7 <= 1 ? "warn-row" : ""}"><td><b>${esc(r.full_name || "-")}</b>${r.via_referral ? ' <span class="pill cream">referral</span>' : ""}<br><span class="muted" style="font-size:12px">${esc(r.email || "")} · sejak ${fmtDate(r.created_at)}</span></td>
        <td><span class="pill ${r.sub_status === "aktif" ? "acc" : r.sub_status === "pending" ? "gold" : "cream"}">${r.sub_status}</span><br><span class="muted" style="font-size:12px">${esc(r.sub_plan || "")}</span></td>
        <td><div class="hb"><i style="width:${Math.round(((r.habit_days7 || 0) / 7) * 100)}%"></i></div><span style="font-size:12.5px">${r.habit_days7 || 0}/7 hari ≥5 centang · rata-rata ${r.habit_avg7 != null ? String(r.habit_avg7).replace(".", ",") : "0"}/9</span></td>
        <td>${ago(r.last_checkin)}</td><td>${r.lessons_done || 0}</td><td>${r.last_weight != null ? String(r.last_weight).replace(".", ",") + wchg(r) : "-"}</td>
        ${actions ? `<td><div class="row wrap-it"><button class="btn sm light" data-mdet="${r.id}">Detail</button>${r.whatsapp ? `<a class="btn sm acc" target="_blank" href="${waLink(r.whatsapp, "Assalamu'alaikum " + (r.full_name || "").split(" ")[0] + ", ")}">WA</a>` : ""}</div></td>` : ""}</tr>`).join("") || `<tr><td colspan="7" class="muted">Belum ada member binaan.</td></tr>`}
    </table></div>`;
  }

  /* ======================================================================
     ADMIN — TRANSAKSI, BAGI HASIL & KOMISI REFERRAL
     ====================================================================== */
  async function paneTransactions() {
    S = await Store.settings();
    const [members, coaches, earns] = await Promise.all([A.list("members"), A.list("coaches"), A.list("coach_earnings")]);
    const cName = (id) => (coaches.find((c) => c.id === id) || {}).display_name || "-";
    const subs = members.flatMap((m) => m.subscriptions.map((s) => Object.assign({ member: m }, s))).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const months = [...new Set(subs.map((s) => (s.activated_at || s.created_at || "").slice(0, 7)).filter(Boolean))].sort().reverse();
    const fm = sessionStorage.getItem("tm") || "", fs = sessionStorage.getItem("ts") || "semua";
    const inMonth = (d) => !fm || (d || "").slice(0, 7) === fm;
    const list = subs.filter((s) => (fs === "semua" || s.status === fs) && inMonth(s.activated_at || s.created_at));
    const paid = subs.filter((s) => s.status === "active" || s.status === "expired").filter((s) => inMonth(s.activated_at || s.created_at));
    const gross = paid.reduce((a, s) => a + (s.amount || 0), 0);
    const E = earns.filter((e) => e.status !== "batal" && inMonth(e.created_at));
    const comm = E.reduce((a, e) => a + e.amount, 0), pend = E.filter((e) => e.status === "tertunda").reduce((a, e) => a + e.amount, 0);
    const byCoach = coaches.map((c) => { const es = earns.filter((e) => e.coach_id === c.id && e.status !== "batal" && inMonth(e.created_at)); return { c, bh: es.filter((e) => e.kind === "bagi_hasil").reduce((a, e) => a + e.amount, 0), rf: es.filter((e) => e.kind === "referral").reduce((a, e) => a + e.amount, 0), pend: es.filter((e) => e.status === "tertunda"), paid: es.filter((e) => e.status === "dibayar").reduce((a, e) => a + e.amount, 0) }; }).filter((x) => x.bh || x.rf || x.pend.length);
    pane(`${head("Transaksi & komisi", fm ? "Bulan " + fm : "Semua periode", `<button class="btn sm light" id="tcsv">Unduh CSV</button>`)}
      <div class="row wrap-it" style="margin-bottom:14px"><select class="sel-sm" id="tMonth"><option value="">Semua bulan</option>${months.map((m) => `<option ${m === fm ? "selected" : ""}>${m}</option>`).join("")}</select>
        <div class="slot-tabs" style="margin:0">${["semua", "pending", "active", "expired", "rejected"].map((x) => `<button data-ts="${x}" class="${fs === x ? "on" : ""}">${{ semua: "semua", pending: "menunggu", active: "aktif", expired: "berakhir", rejected: "ditolak" }[x]}</button>`).join("")}</div></div>
      <div class="grid g4">${[["Pendapatan masuk", rp(gross)], ["Komisi pelatih", rp(comm)], ["Komisi belum dibayar", rp(pend)], ["Pendapatan bersih", rp(gross - comm)]].map(([t, v]) => `<div class="kpi"><span class="label muted">${t}</span><b style="font-size:24px">${v}</b></div>`).join("")}</div>

      <form class="card section" id="commF"><span class="label muted">Aturan bagi hasil & komisi</span>
        <div class="grid g4 mt16" style="gap:10px;align-items:end">
          <label class="field"><span>Bagi hasil pelatih (% dari nominal pembelian member binaan)</span><input name="coach_share_pct" type="number" min="0" max="100" step="0.5" value="${+S.coach_share_pct || 0}"></label>
          <label class="field"><span>Bentuk komisi referral</span><select name="referral_mode"><option value="persen" ${S.referral_mode !== "nominal" ? "selected" : ""}>% dari harga normal paket</option><option value="nominal" ${S.referral_mode === "nominal" ? "selected" : ""}>Nominal tetap (Rp)</option></select></label>
          <label class="field"><span>Besar komisi referral</span><input name="referral_value" type="number" min="0" step="0.5" value="${+S.referral_value || 0}"></label>
          <label class="field"><span>Komisi referral berlaku</span><select name="referral_scope"><option value="pertama" ${S.referral_scope !== "setiap" ? "selected" : ""}>Pembelian pertama saja</option><option value="setiap" ${S.referral_scope === "setiap" ? "selected" : ""}>Setiap pembelian</option></select></label></div>
        <p class="muted" style="font-size:13px;margin:4px 0 12px">Komisi dihitung otomatis saat admin mengaktifkan langganan. Contoh paket ${rp((S.plans[1] || S.plans[0] || {}).price || 0)}: bagi hasil ${rp(Math.round(((S.plans[1] || S.plans[0] || {}).price || 0) * (+S.coach_share_pct || 0) / 100))}, referral ${S.referral_mode === "nominal" ? rp(+S.referral_value || 0) : rp(Math.round(((S.plans[1] || S.plans[0] || {}).price || 0) * (+S.referral_value || 0) / 100))}. Perubahan aturan berlaku untuk transaksi berikutnya.</p>
        <div class="row"><span class="spacer"></span><button class="btn acc sm">Simpan aturan</button></div></form>

      <div class="card section"><span class="label muted">Rekap komisi per pelatih</span>
        <div class="tbl-wrap mt8"><table class="tbl"><tr><th>Pelatih</th><th>Bagi hasil</th><th>Referral</th><th>Sudah dibayar</th><th>Belum dibayar</th><th></th></tr>
        ${byCoach.map((x) => `<tr><td><b>${esc(x.c.display_name)}</b></td><td>${rp(x.bh)}</td><td>${rp(x.rf)}</td><td>${rp(x.paid)}</td><td><b>${rp(x.pend.reduce((a, e) => a + e.amount, 0))}</b></td>
          <td>${x.pend.length ? `<button class="btn sm acc" data-pay="${x.pend.map((e) => e.id).join(",")}">Tandai dibayar</button>` : '<span class="pill acc">lunas</span>'}</td></tr>`).join("") || '<tr><td colspan="6" class="muted">Belum ada komisi.</td></tr>'}</table></div></div>

      <div class="card section"><span class="label muted">Daftar transaksi</span>
        <div class="tbl-wrap mt8"><table class="tbl"><tr><th>Tanggal</th><th>Member</th><th>Paket</th><th>Nominal</th><th>Status</th><th>Pelatih</th><th>Komisi</th></tr>
        ${list.map((s) => { const es = earns.filter((e) => e.subscription_id === s.id && e.status !== "batal");
          return `<tr><td>${fmtDate(s.activated_at || s.created_at)}</td><td><b>${esc(s.member.full_name || "-")}</b><br><span class="muted" style="font-size:12px">${esc(s.member.email || "")}</span></td><td>${esc(s.plan_name || s.plan)}</td><td>${rp(s.amount)}</td>
          <td><span class="pill ${s.status === "active" ? "acc" : s.status === "pending" ? "gold" : "cream"}">${s.status}</span></td>
          <td>${s.member.coach_id ? esc(cName(s.member.coach_id)) : "-"}${s.member.referred_by ? `<br><span class="muted" style="font-size:12px">ref: ${esc(cName(s.member.referred_by))}</span>` : ""}</td>
          <td>${es.map((e) => `<span style="font-size:12.5px">${e.kind === "referral" ? "Referral" : "Bagi hasil"} ${rp(e.amount)} <span class="pill ${e.status === "dibayar" ? "acc" : "cream"}">${e.status}</span></span>`).join("<br>") || "-"}</td></tr>`; }).join("") || '<tr><td colspan="7" class="muted">Tidak ada transaksi.</td></tr>'}</table></div></div>`);
    $("#tMonth").onchange = (e) => { sessionStorage.setItem("tm", e.target.value); paneTransactions(); };
    $$("[data-ts]").forEach((b) => (b.onclick = () => { sessionStorage.setItem("ts", b.dataset.ts); paneTransactions(); }));
    $$("[data-pay]").forEach((b) => (b.onclick = async () => { if (!confirm("Tandai semua komisi tertunda pelatih ini sudah dibayar (sudah ditransfer)?")) return; await A.markPaid(b.dataset.pay.split(","), "dibayar"); toast("Komisi ditandai dibayar"); paneTransactions(); }));
    $("#commF").onsubmit = async (e) => { e.preventDefault(); const f = e.target;
      const share = +f.coach_share_pct.value, val = +f.referral_value.value;
      if (!(share >= 0 && share <= 100)) return toast("Bagi hasil antara 0–100%");
      if (f.referral_mode.value === "persen" && val > 100) return toast("Komisi referral maksimal 100%");
      try { await saveSettings({ coach_share_pct: share, referral_mode: f.referral_mode.value, referral_value: val, referral_scope: f.referral_scope.value }); toast("Aturan komisi tersimpan"); paneTransactions(); } catch (x) { toast(x.message); } };
    $("#tcsv").onclick = () => {
      const cols = ["tanggal", "member", "email", "paket", "nominal", "status", "pelatih", "referral", "bagi_hasil", "komisi_referral"];
      const lines = [cols.join(",")].concat(list.map((s) => { const es = earns.filter((e) => e.subscription_id === s.id); const k = (kind) => es.filter((e) => e.kind === kind).reduce((a, e) => a + e.amount, 0);
        return [(s.activated_at || s.created_at || "").slice(0, 10), s.member.full_name, s.member.email, s.plan_name, s.amount, s.status, s.member.coach_id ? cName(s.member.coach_id) : "", s.member.referred_by ? cName(s.member.referred_by) : "", k("bagi_hasil"), k("referral")].map((v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(","); }));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" })); a.download = "transaksi-" + (fm || "semua") + ".csv"; a.click();
    };
  }

  /* ======================================================================
     PANEL PELATIH
     ====================================================================== */
  const refLink = (code) => origin + "#/r/" + encodeURIComponent(code);
  async function paneCoachSummary() {
    const [prof, rows, earns, mods, lessons] = await Promise.all([C.profile(), C.members(), C.earnings(), C.modules(), C.lessons()]);
    if (!prof) { pane(`<div class="card"><h2 class="mt0">Profil pelatih belum siap</h2><p class="muted">Akunmu berstatus pelatih tetapi profil pelatih belum dibuat. Hubungi admin.</p></div>`); return; }
    const mine = rows.filter((r) => r.is_mine);
    const needs = mine.filter((r) => (r.habit_days7 || 0) <= 1);
    const pend = earns.filter((e) => e.status === "tertunda").reduce((a, e) => a + e.amount, 0), paid = earns.filter((e) => e.status === "dibayar").reduce((a, e) => a + e.amount, 0);
    const link = refLink(prof.referral_code);
    pane(`${head("Assalamu'alaikum, " + esc(prof.display_name), "Pelatih " + esc(prof.gender) + (prof.active ? "" : " · NONAKTIF"))}
      ${!prof.active ? '<div class="notice" style="margin-bottom:14px">Akun pelatihmu sedang dinonaktifkan admin.</div>' : ""}
      <div class="grid g4">${[["Member binaan", mine.length], ["Langganan aktif", mine.filter((r) => r.sub_status === "aktif").length], ["Perlu disapa", needs.length], ["Lesson buatanmu", lessons.length], ["Modul", mods.length], ["Dari referral", rows.filter((r) => r.via_referral).length], ["Penghasilan tertunda", rp(pend)], ["Sudah dibayar", rp(paid)]]
        .map(([t, v]) => `<div class="kpi"><span class="label muted">${t}</span><b style="${String(v).length > 6 ? "font-size:22px" : ""}">${v}</b></div>`).join("")}</div>
      <div class="card section ref-card"><span class="label muted">Kode referral kamu</span>
        <div class="row wrap-it mt8"><b class="ref-code">${esc(prof.referral_code)}</b><span class="spacer"></span><button class="btn sm light" id="cpLink">Salin tautan</button>
          <a class="btn sm acc" target="_blank" href="https://wa.me/?text=${encodeURIComponent("Assalamu'alaikum, yuk ikut program kebugaran Muslim " + S.brand + " bersama saya — latihan mengikuti waktu sholat + checklist sunnah harian. Mulai dari tes 2 menit di sini: " + link)}">Bagikan via WhatsApp</a></div>
        <input class="input mt8" readonly value="${esc(link)}" id="refIn">
        <p class="muted" style="font-size:13px;margin:8px 0 0">Siapa pun yang mendaftar lewat tautan ini tercatat sebagai referral-mu${+S.referral_value ? " — komisi " + (S.referral_mode === "nominal" ? rp(+S.referral_value) : S.referral_value + "% dari harga normal paket") + (S.referral_scope === "setiap" ? " setiap pembelian" : " pada pembelian pertama") : ""}. Member ${esc(prof.gender)} otomatis menjadi binaanmu${+S.coach_share_pct ? ", dan kamu mendapat bagi hasil " + S.coach_share_pct + "% dari setiap pembelian programnya" : ""}.</p></div>
      <div class="card section"><div class="row"><span class="label muted">Perlu disapa minggu ini</span><span class="spacer"></span><button class="btn sm light" id="goMem">Semua member →</button></div>
        ${needs.length ? `<div class="mt8">${needs.slice(0, 6).map((r) => `<div class="row" style="padding:8px 0;border-bottom:1px dashed var(--line)"><b style="flex:1">${esc(r.full_name || "-")}</b><span class="muted" style="font-size:13px">${r.habit_days7 || 0}/7 hari aktif</span>${r.whatsapp ? `<a class="btn sm acc" target="_blank" href="${waLink(r.whatsapp, "Assalamu'alaikum " + (r.full_name || "").split(" ")[0] + ", gimana kabar latihan & checklist sunnah pekan ini? Yuk lanjut pelan-pelan, yang penting istiqamah.")}">Sapa</a>` : ""}</div>`).join("")}</div>` : '<p class="muted">Semua member binaan aktif mengisi checklist. Barakallahu fiikum!</p>'}</div>`);
    $("#cpLink").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Tautan disalin"); } catch (e) { $("#refIn").select(); document.execCommand("copy"); toast("Tautan disalin"); } };
    $("#goMem").onclick = () => { tab = "binaan"; location.hash = tab; shell(); };
  }

  async function paneCoachMembers() {
    const rows = await C.members();
    const refOnly = rows.filter((r) => !r.is_mine);
    pane(`${head("Member binaan", rows.filter((r) => r.is_mine).length + " member · baris kuning = jarang check-in")}
      <div class="card">${membersTable(rows, true)}</div>
      ${refOnly.length ? `<div class="card section"><span class="label muted">Mendaftar lewat kodemu (didampingi pelatih lain)</span><div class="tbl-wrap mt8"><table class="tbl"><tr><th>Nama</th><th>Bergabung</th><th>Langganan</th></tr>${refOnly.map((r) => `<tr><td>${esc(r.full_name || "-")}</td><td>${fmtDate(r.created_at)}</td><td><span class="pill ${r.sub_status === "aktif" ? "acc" : "cream"}">${r.sub_status}</span></td></tr>`).join("")}</table></div></div>` : ""}`);
    $$("[data-mdet]").forEach((b) => (b.onclick = () => memberDetail(b.dataset.mdet)));
  }

  async function memberDetail(id) {
    const d = await C.memberDetail(id); const p = d.profile || {}; const q = p.quiz || {}; const r = q.result || {};
    const H = {}; (d.habits || []).forEach((h) => (H[h.day] = Object.values(h.items || {}).filter(Boolean).length));
    const days = [...Array(28)].map((_, i) => { const t = new Date(); t.setDate(t.getDate() - 27 + i); const k = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); return { k, n: H[k] || 0 }; });
    const W = d.weights || [];
    const spark = (() => { if (W.length < 2) return ""; const vs = W.map((w) => +w.value), mn = Math.min(...vs), mx = Math.max(...vs), rg = mx - mn || 1;
      const pts = vs.map((v, i) => `${(i / (vs.length - 1)) * 300},${70 - ((v - mn) / rg) * 60}`).join(" ");
      return `<svg viewBox="-4 0 308 76" style="width:100%;height:80px"><polyline points="${pts}" fill="none" stroke="#0f5a40" stroke-width="2.5" stroke-linejoin="round"/></svg>`; })();
    const goal = { turun: "Menurunkan berat", kuat: "Kuat & berotot", bugar: "Bugar untuk ibadah", sunnah: "Hidup sunnah" }[q.goal] || "-";
    const lvl = (n) => (n >= 7 ? 4 : n >= 5 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0);
    modal(`<h2 style="margin-top:0">${esc(p.full_name || "-")}</h2>
      <div class="row wrap-it" style="margin:-6px 0 14px"><span class="muted">${esc(p.email || "")}</span>${p.whatsapp ? `<a class="btn sm acc" target="_blank" href="${waLink(p.whatsapp, "Assalamu'alaikum " + (p.full_name || "").split(" ")[0] + ", ")}">Chat WhatsApp</a>` : ""}</div>
      <div class="grid g4" style="gap:10px">${[["Tujuan", goal], ["IMT awal", r.bmi ? String(r.bmi).replace(".", ",") + " · " + (r.bmiCat || "") : "-"], ["Target kalori", r.target ? r.target.toLocaleString("id-ID") + " kkal" : "-"], ["Lesson selesai", (d.progress || []).length]].map(([t, v]) => `<div class="kpi" style="padding:12px"><span class="label muted">${t}</span><b style="font-size:17px">${esc(String(v))}</b></div>`).join("")}</div>
      <div class="mt16"><span class="label muted">Checklist sunnah 4 pekan terakhir</span><div class="hgrid mt8">${days.map((x) => `<i class="l${lvl(x.n)}" title="${x.k}: ${x.n}/9"></i>`).join("")}</div>
        <div class="row" style="font-size:12px;gap:6px;margin-top:6px" ><span class="muted">sedikit</span><i class="hcell l1"></i><i class="hcell l2"></i><i class="hcell l3"></i><i class="hcell l4"></i><span class="muted">penuh</span></div></div>
      <div class="mt16"><span class="label muted">Berat badan</span>${W.length ? `${spark}<div class="muted" style="font-size:13px">${W.length} catatan · awal ${String(W[0].value).replace(".", ",")} kg → terakhir <b>${String(W[W.length - 1].value).replace(".", ",")} kg</b> (${fmtDate(W[W.length - 1].at)})</div>` : '<p class="muted" style="margin:6px 0">Belum ada catatan berat.</p>'}</div>
      <div class="mt16"><span class="label muted">Catatan pelatih untuk member</span>
        <form id="noteF" class="row mt8" style="align-items:flex-start"><textarea class="input" name="body" placeholder="mis. Pekan ini fokus jalan kaki 8.000 langkah ba'da Subuh…" style="min-height:64px" required></textarea><button class="btn acc">Kirim</button></form>
        <div id="noteList" class="mt8">${(d.notes || []).map((n) => `<div class="note-row"><p>${esc(n.body)}</p><span class="muted" style="font-size:12px">${fmtDate(n.at)}</span><button class="x" data-dnote="${n.id}" title="Hapus">✕</button></div>`).join("") || '<p class="muted" style="font-size:13px">Belum ada catatan. Catatan tampil di dashboard member.</p>'}</div></div>
      <div class="row mt16"><span class="spacer"></span><button class="btn ghost" data-close>Tutup</button></div>`,
    (m, close) => {
      $("#noteF", m).onsubmit = async (e) => { e.preventDefault(); try { await C.addNote(id, e.target.body.value.trim()); toast("Catatan terkirim"); close(); memberDetail(id); } catch (x) { toast(x.message); } };
      $$("[data-dnote]", m).forEach((b) => (b.onclick = async () => { await C.deleteNote(b.dataset.dnote); close(); memberDetail(id); }));
    }, "wide");
  }

  async function paneCoachMaterials() {
    const [mods, lessons] = await Promise.all([C.modules(), C.lessons()]);
    pane(`${head("Materi saya", "Hanya terlihat oleh member binaanmu", `<button class="btn acc sm" id="addCM">+ Modul</button>`)}
      <div class="notice" style="margin-bottom:16px">Susun materi secara bertahap: buat <b>modul</b> (mis. "Pekan 1 — Adaptasi"), lalu isi dengan <b>lesson</b> berupa video, dokumen (PDF/Word/PPT), atau keduanya. Member membuka materi secara <b>baca saja</b>. Centang "Gratis" agar lesson bisa dibuka sebelum langganan aktif.</div>
      ${mods.map((m) => `<div class="card mod-block" style="background:var(--cream)"><div class="row wrap-it"><b>${esc(m.tag || "")}</b><span>${esc(m.title)} — <span class="muted">${esc(m.subtitle || "")}</span></span>${m.published === false ? '<span class="pill cream">Draft</span>' : ""}<span class="spacer"></span>
          <button class="btn sm light" data-em="${m.id}">Edit modul</button><button class="btn sm acc" data-al="${m.id}">+ Lesson</button><button class="btn sm danger" data-dm="${m.id}">Hapus</button></div>
        <table class="tbl mt8">${lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.sort - b.sort).map((l) => `<tr><td style="width:36px">${l.sort}</td><td><b>${esc(l.title)}</b> ${l.is_free ? '<span class="pill gold">Gratis</span>' : ""} ${l.published === false ? '<span class="pill cream">Draft</span>' : ""}</td>
          <td>${l.storage_path || l.video_url ? '<span class="pill acc">Video</span>' : ""} ${l.doc_path || l.doc_url ? '<span class="pill gold">Dokumen</span>' : ""} ${!(l.storage_path || l.video_url || l.doc_path || l.doc_url) ? '<span class="pill red">Kosong</span>' : ""}</td>
          <td class="row" style="justify-content:flex-end"><button class="btn sm light" data-el="${l.id}">Edit</button><button class="btn sm danger" data-dl="${l.id}">Hapus</button></td></tr>`).join("") || '<tr><td class="muted">Belum ada lesson.</td></tr>'}</table></div>`).join("") || '<div class="card dashed center"><h3 class="mt0">Belum ada materi</h3><p class="muted">Mulai dengan membuat modul pertama untuk member binaanmu.</p></div>'}`);
    $("#addCM").onclick = () => editCoachModule({ sort: mods.length + 1, published: true, track: "coach" }, paneCoachMaterials);
    $$("[data-em]").forEach((b) => (b.onclick = () => editCoachModule(mods.find((m) => m.id === b.dataset.em), paneCoachMaterials)));
    $$("[data-dm]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus modul beserta semua lesson di dalamnya?")) return; await C.remove("modules", b.dataset.dm); paneCoachMaterials(); }));
    $$("[data-al]").forEach((b) => (b.onclick = () => editLesson({ module_id: b.dataset.al, sort: lessons.filter((l) => l.module_id === b.dataset.al).length + 1, published: true }, mods, paneCoachMaterials)));
    $$("[data-el]").forEach((b) => (b.onclick = () => editLesson(lessons.find((l) => l.id === b.dataset.el), mods, paneCoachMaterials)));
    $$("[data-dl]").forEach((b) => (b.onclick = async () => { if (!confirm("Hapus lesson ini?")) return; await C.remove("lessons", b.dataset.dl); paneCoachMaterials(); }));
  }
  function editCoachModule(row, after) {
    modal(`<form id="cmf"><h2 style="margin-top:0">${row.id ? "Edit" : "Tambah"} modul</h2>
      <div class="grid g2" style="gap:10px"><label class="field"><span>Label (mis. PEKAN 1)</span><input name="tag" value="${esc(row.tag || "")}"></label><label class="field"><span>Judul</span><input name="title" required value="${esc(row.title || "")}"></label></div>
      <label class="field"><span>Subjudul / tujuan modul</span><input name="subtitle" value="${esc(row.subtitle || "")}"></label>
      <div class="grid g2" style="gap:10px"><label class="field"><span>Urutan</span><input name="sort" type="number" value="${row.sort || 1}"></label><div class="field"><span>Status</span><label class="check"><input type="checkbox" name="published" ${row.published !== false ? "checked" : ""}> Tayang untuk member</label></div></div>
      <div class="row mt16"><button type="button" class="btn ghost" data-close>Batal</button><span class="spacer"></span><button class="btn acc">Simpan</button></div></form>`,
    (m, close) => ($("#cmf", m).onsubmit = async (e) => { e.preventDefault(); const f = e.target;
      try { await C.upsert("modules", Object.assign({}, row, { tag: f.tag.value, title: f.title.value, subtitle: f.subtitle.value, track: "coach", sort: +f.sort.value || 0, published: f.published.checked })); close(); (after || paneCoachMaterials)(); } catch (x) { toast(x.message); } }));
  }

  async function paneCoachEarnings() {
    S = await Store.settings();
    const [earns, rows, prof] = await Promise.all([C.earnings(), C.members(), C.profile()]);
    const nm = (id) => (rows.find((r) => r.id === id) || {}).full_name || "Member";
    const sum = (f) => earns.filter(f).reduce((a, e) => a + e.amount, 0);
    pane(`${head("Penghasilan & referral", "Dihitung otomatis saat pembayaran member diverifikasi admin")}
      <div class="grid g4">${[["Bagi hasil", rp(sum((e) => e.kind === "bagi_hasil" && e.status !== "batal"))], ["Komisi referral", rp(sum((e) => e.kind === "referral" && e.status !== "batal"))], ["Belum dibayar", rp(sum((e) => e.status === "tertunda"))], ["Sudah dibayar", rp(sum((e) => e.status === "dibayar"))]].map(([t, v]) => `<div class="kpi"><span class="label muted">${t}</span><b style="font-size:24px">${v}</b></div>`).join("")}</div>
      <div class="card section"><span class="label muted">Aturan saat ini</span><ul style="margin:10px 0 0;padding-left:18px;font-size:14.5px">
        <li>Bagi hasil <b>${+S.coach_share_pct || 0}%</b> dari nominal setiap pembelian program oleh member binaanmu.</li>
        <li>Komisi referral <b>${S.referral_mode === "nominal" ? rp(+S.referral_value || 0) : (+S.referral_value || 0) + "% dari harga normal paket"}</b> ${S.referral_scope === "setiap" ? "untuk setiap pembelian" : "pada pembelian pertama"} member yang mendaftar lewat kode <b>${esc((prof && prof.referral_code) || "")}</b>.</li>
        <li>Pencairan dilakukan admin. <a target="_blank" href="${waLink(S.whatsapp, "Assalamu'alaikum admin " + S.brand + ", saya " + ((prof && prof.display_name) || "") + " ingin menanyakan pencairan komisi pelatih.")}">Tanya admin</a></li></ul></div>
      <div class="card section"><span class="label muted">Riwayat</span><div class="tbl-wrap mt8"><table class="tbl"><tr><th>Tanggal</th><th>Member</th><th>Jenis</th><th>Dasar</th><th>Tarif</th><th>Jumlah</th><th>Status</th></tr>
        ${earns.map((e) => `<tr><td>${fmtDate(e.created_at)}</td><td>${esc(nm(e.member_id))}</td><td>${e.kind === "referral" ? "Referral" : "Bagi hasil"}</td><td>${rp(e.base_amount)}</td><td>${e.rate != null ? String(e.rate).replace(".", ",") + "%" : "tetap"}</td><td><b>${rp(e.amount)}</b></td><td><span class="pill ${e.status === "dibayar" ? "acc" : e.status === "batal" ? "red" : "gold"}">${e.status}</span>${e.paid_at ? `<br><span class="muted" style="font-size:12px">${fmtDate(e.paid_at)}</span>` : ""}</td></tr>`).join("") || '<tr><td colspan="7" class="muted">Belum ada penghasilan. Bagikan tautan referralmu dari tab Ringkasan.</td></tr>'}</table></div></div>`);
  }

  async function paneCoachProfile() {
    const c = await C.profile(); if (!c) { pane('<div class="card">Profil pelatih tidak ditemukan.</div>'); return; }
    pane(`${head("Profil pelatih", "Tampil saat calon member memilih pelatih")}
      <form class="card" id="cpF">
        <div class="grid g2" style="gap:10px"><label class="field"><span>Nama tampil</span><input name="display_name" required value="${esc(c.display_name)}"></label><label class="field"><span>Kota</span><input name="city" value="${esc(c.city || "")}"></label></div>
        <label class="field"><span>Perkenalan singkat (gaya melatih, pengalaman, cocok untuk siapa)</span><textarea name="bio" style="min-height:110px">${esc(c.bio || "")}</textarea></label>
        <div class="field"><span>Keahlian (dipakai untuk mencocokkan dengan jawaban kuis member)</span><div class="days">${Object.entries(SPEC).map(([k, t]) => `<label><input type="checkbox" name="spec" value="${k}" ${(c.specialties || []).includes(k) ? "checked" : ""}>${t}</label>`).join("")}</div></div>
        ${imageField("photo_url", c.photo_url, "Foto profil (opsional — boleh logo/ilustrasi)")}
        <label class="check"><input type="checkbox" name="accepting" ${c.accepting !== false ? "checked" : ""}> Menerima member baru</label>
        <div class="row wrap-it mt16" style="font-size:13.5px"><span class="pill ${c.gender === "akhwat" ? "gold" : "acc"}">Pelatih ${esc(c.gender)}</span><span class="muted">Kode referral: <b>${esc(c.referral_code)}</b> · kategori & kode hanya bisa diubah admin</span><span class="spacer"></span><button class="btn acc">Simpan profil</button></div>
      </form>`);
    const f = $("#cpF"); wireImages(f);
    f.onsubmit = async (e) => { e.preventDefault();
      try { await C.saveProfile({ display_name: f.display_name.value.trim(), city: f.city.value.trim(), bio: f.bio.value.trim(), specialties: $$("[name=spec]:checked", f).map((x) => x.value), photo_url: f.photo_url.value.trim() || null, accepting: f.accepting.checked }); toast("Profil tersimpan"); } catch (x) { toast(x.message); } };
  }

  /* ---------------------------- boot ---------------------------- */
  async function boot() {
    const me = await gate(); if (!me) return;
    if (ROLE === "admin") {
      try { const members = await A.list("members"); pendingCount = members.flatMap((m) => m.subscriptions).filter((s) => s.status === "pending").length; } catch (e) {}
      try { pendingCoach = (await A.list("coach_applications")).filter((a) => a.status === "pending").length; } catch (e) {}
    }
    shell();
  }
  boot();
})();
