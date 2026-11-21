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

  const waLink = (num, text) => "https://wa.me/" + String(num || "").replace(/\D/g, "").replace(/^0/, "62") + (text ? "?text=" + encodeURIComponent(text) : "");
  const SLOTS = { subuh: "Ba'da Subuh", dhuha: "Pagi / Dhuha", ashar: "Ba'da Ashar", isya: "Ba'da Isya" };
  const DAYS = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-");

  return { esc, rp, $, $$, md, toast, modal, playerHTML, waLink, SLOTS, DAYS, fmtDate };
})();
