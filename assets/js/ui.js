/* Helper tampilan yang dipakai aplikasi member & admin */
window.UI = (function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function md(src) {
    const lines = esc(src || "").split(/\r?\n/);
    let html = "", list = false, para = [];
    const inline = (t) => t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
    const flush = () => { if (para.length) { html += "<p>" + inline(para.join(" ")) + "</p>"; para = []; } };
    lines.forEach((ln) => {
      const t = ln.trim();
      if (/^- /.test(t)) { flush(); if (!list) { html += "<ul>"; list = true; } html += "<li>" + inline(t.slice(2)) + "</li>"; return; }
      if (list) { html += "</ul>"; list = false; }
      if (/^## /.test(t)) { flush(); html += "<h2>" + inline(t.slice(3)) + "</h2>"; return; }
      if (!t) { flush(); return; }
      para.push(t);
    });
    flush(); if (list) html += "</ul>";
    return html;
  }

  let tt;
  function toast(msg, ms) {
    const el = document.getElementById("toast"); if (!el) return alert(msg);
    el.textContent = msg; el.classList.add("show"); clearTimeout(tt);
    tt = setTimeout(() => el.classList.remove("show"), ms || 2600);
  }

  function modal(html, onMount, cls) {
    const bg = document.createElement("div"); bg.className = "modal-bg";
    bg.innerHTML = '<div class="modal ' + (cls || "") + '">' + html + "</div>";
    const close = () => bg.remove();
    bg.addEventListener("click", (e) => { if ((e.target === bg && !bg.querySelector("form")) || e.target.closest("[data-close]")) close(); });
    document.body.appendChild(bg);
    onMount && onMount(bg.firstChild, close);
    return close;
  }

  async function playerHTML(item) {
    const url = await window.Store.mediaUrl(item);
    if (!url) return '<div class="player"><div class="empty"><div style="font-size:34px">🎬</div><div class="label mt8">Video belum diunggah</div><div class="mt8" style="font-size:14px">Admin dapat mengunggah video ini dari Panel Admin.</div></div></div>';
    const e = window.Store.embed(url);
    if (e.type === "iframe") return '<div class="player"><iframe src="' + esc(e.src) + '" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>';
    return '<div class="player"><video src="' + esc(e.src) + '" controls playsinline preload="metadata" controlsList="nodownload"></video></div>';
  }


  const ICONS = {
    sunrise: '<path d="M3 18h18M6 18a6 6 0 0 1 12 0"/><path d="M12 5v3M5.6 9.6l1.8 1.8M18.4 9.6l-1.8 1.8M8 21h8"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2.2-6.5L15 17v4M9 11l3-3.5 3 2 2.5 3M12.2 14.5L11 8.5 7.5 10.5 6.5 14"/>',
    bowl: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z"/><path d="M8 20h8M9 7c0-1.5 1.5-1.5 1.5-3M13 7c0-1.5 1.5-1.5 1.5-3"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    date: '<path d="M12 3c3.5 2 5 5.5 5 9s-2 8-5 9c-3-1-5-5-5-9s1.5-7 5-9Z"/><path d="M12 7v10"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/><path d="M17 4l.6 1.4L19 6l-1.4.6L17 8l-.6-1.4L15 6l1.4-.6Z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5M9 7.5h7"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5Z"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5a3 3 0 0 1 0 6M17.5 14.5A5 5 0 0 1 20.5 20"/>',
    star: '<path d="M12 3l2.5 3.5L18.5 6l-.5 4 3 3-3.5 1.5.5 4-4-.5L12 21l-2.5-3-4 .5.5-4L2.5 13l3-3-.5-4 4 .5Z"/>'
  };
  const icon = (n, size) => '<svg class="ic" width="' + (size || 26) + '" height="' + (size || 26) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || "") + "</svg>";

  const waLink = (num, text) => "https://wa.me/" + String(num || "").replace(/\D/g, "").replace(/^0/, "62") + (text ? "?text=" + encodeURIComponent(text) : "");
  const SLOTS = { subuh: "Ba'da Subuh", dhuha: "Pagi / Dhuha", ashar: "Ba'da Ashar", isya: "Ba'da Isya" };
  const DAYS = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-");

  return { esc, rp, $, $$, md, toast, modal, playerHTML, waLink, SLOTS, DAYS, fmtDate, icon };
})();
