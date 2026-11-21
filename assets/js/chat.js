/* =====================================================================
   Chat — widget "Asisten QOWIY"
   - Memakai /api/chat (AI) bila aktif; bila tidak, menjawab dari FAQ.
   - Bila perlu jawaban manusia → tombol lanjut ke WhatsApp admin
     (pesan sudah terisi ringkasan pertanyaan).
   ===================================================================== */
(function () {
  const { esc, waLink } = window.UI;
  const KEY = "qowiy_chat";
  let S = null, busy = false, aiOff = false;
  let msgs = []; try { msgs = JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (e) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch (e) {} };

  const root = document.createElement("div");
  root.className = "chatw";
  root.innerHTML = `
    <button class="chat-fab" aria-label="Buka chat asisten"><img src="assets/img/logo-mark.png" alt=""><span>Tanya kami</span></button>
    <section class="chat-panel" role="dialog" aria-label="Asisten QOWIY" hidden>
      <header><img src="assets/img/logo-mark.png" alt=""><div><b>Asisten QOWIY</b><small>Jawaban instan · admin siap via WhatsApp</small></div><button class="chat-x" aria-label="Tutup">×</button></header>
      <div class="chat-body" aria-live="polite"></div>
      <div class="chat-quick"></div>
      <form class="chat-form"><input maxlength="600" placeholder="Tulis pertanyaan…" aria-label="Pertanyaan"><button aria-label="Kirim">➤</button></form>
      <a class="chat-wa" target="_blank" rel="noopener">Chat langsung dengan admin di WhatsApp</a>
    </section>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const QUICK = ["Bagaimana cara mulai?", "Berapa harga paketnya?", "Cara bayar & aktivasi", "Bisa hubungkan jam pintar?", "Cara atur makro makan"];

  function waHref(extra) {
    const lastQ = [...msgs].reverse().find((m) => m.role === "user");
    const txt = `Assalamu'alaikum admin ${(S && S.brand) || "QOWIY"}, saya ingin bertanya${lastQ ? ":\n\n\"" + lastQ.content.slice(0, 400) + "\"" : "."}${extra ? "\n\n" + extra : ""}`;
    return waLink((S && S.whatsapp) || "", txt);
  }
  function render() {
    const body = $(".chat-body");
    const hello = `<div class="cm bot">Assalamu'alaikum! Saya asisten QOWIY. Tanyakan soal program, paket, rencana makan, atau perangkat. Untuk urusan pembayaran & akun, saya sambungkan ke admin.</div>`;
    body.innerHTML = hello + msgs.map((m) => `<div class="cm ${m.role === "user" ? "me" : "bot"}">${esc(m.content).replace(/\n/g, "<br>")}${m.handoff ? `<a class="cm-wa" target="_blank" rel="noopener" href="${waHref()}">Lanjutkan ke WhatsApp admin →</a>` : ""}</div>`).join("") + (busy ? `<div class="cm bot typing"><i></i><i></i><i></i></div>` : "");
    body.scrollTop = body.scrollHeight;
    $(".chat-quick").innerHTML = msgs.length ? "" : QUICK.map((q) => `<button type="button">${q}</button>`).join("");
    root.querySelectorAll(".chat-quick button").forEach((b) => (b.onclick = () => ask(b.textContent)));
    $(".chat-wa").href = waHref();
  }

  function faq(q) {
    const t = q.toLowerCase(), plans = ((S && S.plans) || []).map((p) => `• ${p.name}: Rp${Number(p.price).toLocaleString("id-ID")} (${p.period})`).join("\n");
    if (/harga|paket|biaya|berapa|langganan/.test(t)) return { reply: `Paket saat ini:\n${plans}\n\nDetailnya ada di halaman Langganan.` };
    if (/bayar|transfer|qris|konfirmasi|aktif|refund|akses/.test(t)) return { reply: "Caranya: pilih paket → bayar via QRIS/transfer → klik “Saya sudah bayar” untuk konfirmasi ke WhatsApp admin → akses dibuka setelah diverifikasi.", handoff: true };
    if (/mulai|daftar|cara|gimana|bagaimana/.test(t) && !/makro|jam|timbang/.test(t)) return { reply: "Mulai dari Tes Kebugaran gratis (12 pertanyaan, ±2 menit). Kamu langsung dapat IMT, target kalori, jalur program, dan rencana makan hari pertama. Setelah itu pilih paket di halaman Langganan." };
    if (/jam|watch|bluetooth|timbang|scale|xiaomi|apple|garmin/.test(t)) return { reply: "Bisa. Di menu Perangkat, hubungkan jam/sensor detak jantung dan timbangan Bluetooth (Chrome di Android/PC; di iPhone pakai browser Bluefy). Apple Watch perlu aplikasi penyiar detak jantung, dan sebagian jam Xiaomi generasi baru tidak membuka datanya — data bisa dicatat manual." };
    if (/makro|protein|karbo|serat|lemak|menu|makan|diet/.test(t)) return { reply: "Di Rencana Makan, atur persen protein, karbo, dan serat — lemak otomatis mengisi sisanya. Setiap hidangan memakai 1 sumber protein, porsinya dihitung dalam gram. Ada menu otomatis 7 hari, menu puasa, rekomendasi AI, dan susun menu sendiri." };
    if (/akhwat|wanita|muslimah|perempuan/.test(t)) return { reply: "Ada video khusus akhwat yang bisa dilakukan di rumah dengan pakaian syar'i, dan trainer akhwat untuk paket coaching." };
    if (/puasa|ramadan|sahur|buka/.test(t)) return { reply: "Ada Ramadan Mode & menu hari puasa: sahur, berbuka dengan kurma (sunnah), lalu makan malam. Penderita diabetes atau penyakit kronis sebaiknya konsultasi dokter sebelum puasa sunnah." };
    if (/sakit|hamil|diabetes|hipertensi|cedera|obat|dokter/.test(t)) return { reply: "Untuk kondisi kesehatan khusus, sebaiknya konsultasi dengan dokter atau ahli gizi dulu. Program kami bersifat edukasi umum.", handoff: true };
    return { reply: "Pertanyaan ini lebih tepat dijawab langsung oleh admin kami.", handoff: true };
  }

  async function ask(text) {
    text = (text || "").trim(); if (!text || busy) return;
    msgs.push({ role: "user", content: text }); busy = true; render(); save();
    let out = null;
    if (!aiOff && window.Store && Store.mode === "supabase") {
      try {
        let token = ""; try { const { data } = await Store.client().auth.getSession(); token = (data.session && data.session.access_token) || ""; } catch (e) {}
        const r = await fetch("/api/chat", { method: "POST", headers: Object.assign({ "content-type": "application/json" }, token ? { Authorization: "Bearer " + token } : {}), body: JSON.stringify({ messages: msgs.map(({ role, content }) => ({ role, content })), page: location.hash }) });
        const j = await r.json().catch(() => ({}));
        if (r.status === 503 && j.code === "ai_disabled") aiOff = true;
        else if (j.reply) out = { reply: j.reply, handoff: !!j.handoff };
      } catch (e) {}
    }
    if (!out) out = faq(text);
    msgs.push({ role: "assistant", content: out.reply, handoff: !!out.handoff }); busy = false; render(); save();
  }

  $(".chat-fab").onclick = async () => { const p = $(".chat-panel"); p.hidden = !p.hidden; root.classList.toggle("open", !p.hidden); if (!p.hidden) { if (!S) { try { S = await Store.settings(); } catch (e) {} } render(); $(".chat-form input").focus(); } };
  $(".chat-x").onclick = () => { $(".chat-panel").hidden = true; root.classList.remove("open"); };
  $(".chat-form").onsubmit = (e) => { e.preventDefault(); const i = $(".chat-form input"); const v = i.value; i.value = ""; ask(v); };
})();
