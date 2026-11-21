/* =====================================================================
   Devices — koneksi Bluetooth dari browser (Web Bluetooth)
   - Jam pintar / sabuk dada: Heart Rate Service standar (0x180D)
   - Timbangan: Weight Scale (0x181D) & Body Composition (0x181B) standar
   - Xiaomi Mi Scale / Mi Body Composition Scale 2: data dari siaran
     (advertisement) — eksperimental, butuh dukungan watchAdvertisements()
   Didukung: Chrome/Edge di Android, Windows, macOS, ChromeOS.
   iPhone/iPad: Safari belum mendukung → gunakan browser Bluefy.
   ===================================================================== */
window.Devices = (function () {
  const supported = () => typeof navigator !== "undefined" && !!navigator.bluetooth;
  const canWatchAds = () => supported() && typeof BluetoothDevice !== "undefined" && "watchAdvertisements" in BluetoothDevice.prototype;

  /* ---------- Detak jantung (0x2A37) ---------- */
  function parseHeartRate(dv) {
    const flags = dv.getUint8(0);
    const hr = flags & 0x01 ? dv.getUint16(1, true) : dv.getUint8(1);
    let off = flags & 0x01 ? 3 : 2;
    const contact = flags & 0x04 ? !!(flags & 0x02) : null;
    if (flags & 0x08) off += 2; // energy expended
    const rr = [];
    if (flags & 0x10) for (; off + 1 < dv.byteLength; off += 2) rr.push(dv.getUint16(off, true) / 1024);
    return { hr, contact, rr };
  }
  async function connectHeartRate(onData, onDisconnect) {
    const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ["heart_rate"] }], optionalServices: ["battery_service"] });
    device.addEventListener("gattserverdisconnected", () => onDisconnect && onDisconnect());
    const server = await device.gatt.connect();
    const svc = await server.getPrimaryService("heart_rate");
    const ch = await svc.getCharacteristic("heart_rate_measurement");
    ch.addEventListener("characteristicvaluechanged", (e) => onData(parseHeartRate(e.target.value)));
    await ch.startNotifications();
    let battery = null;
    try { const b = await server.getPrimaryService("battery_service"); battery = (await (await b.getCharacteristic("battery_level")).readValue()).getUint8(0); } catch (e) {}
    return { name: device.name || "Perangkat detak jantung", battery, disconnect: () => device.gatt.connected && device.gatt.disconnect() };
  }

  /* ---------- Timbangan standar ---------- */
  function parseWeight(dv) { // 0x2A9D
    const flags = dv.getUint8(0), imperial = flags & 0x01;
    const raw = dv.getUint16(1, true);
    const kg = imperial ? raw * 0.01 * 0.45359237 : raw * 0.005;
    return { weight: +kg.toFixed(2) };
  }
  function parseBodyComp(dv) { // 0x2A9C
    const flags = dv.getUint16(0, true), imperial = flags & 0x0001;
    let o = 2; const out = { fat: dv.getUint16(o, true) / 10 }; o += 2;
    if (flags & 0x0002) o += 7; if (flags & 0x0004) o += 1; if (flags & 0x0008) o += 2;
    if (flags & 0x0010) { out.muscle_pct = dv.getUint16(o, true) / 10; o += 2; }
    if (flags & 0x0020) o += 2; if (flags & 0x0040) o += 2; if (flags & 0x0080) o += 2; if (flags & 0x0100) o += 2; if (flags & 0x0200) o += 2;
    if (flags & 0x0400 && o + 1 < dv.byteLength) { const r = dv.getUint16(o, true); out.weight = +(imperial ? r * 0.01 * 0.45359237 : r * 0.005).toFixed(2); }
    if (out.fat === 0xffff / 10) delete out.fat;
    return out;
  }
  async function connectScale(onData, onStatus) {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ["weight_scale"] }, { services: ["body_composition"] }, { namePrefix: "MIBFS" }, { namePrefix: "MI SCALE" }, { namePrefix: "MI_SCALE" }],
      optionalServices: ["weight_scale", "body_composition", "battery_service"]
    });
    const name = device.name || "Timbangan";
    // Jalur 1: GATT standar
    try {
      onStatus && onStatus("Menghubungkan ke " + name + "…");
      const server = await device.gatt.connect();
      let hooked = false;
      try { const s = await server.getPrimaryService("weight_scale"); const c = await s.getCharacteristic("weight_measurement"); c.addEventListener("characteristicvaluechanged", (e) => onData(Object.assign({ stable: true }, parseWeight(e.target.value)))); await c.startNotifications(); hooked = true; } catch (e) {}
      try { const s = await server.getPrimaryService("body_composition"); const c = await s.getCharacteristic("body_composition_measurement"); c.addEventListener("characteristicvaluechanged", (e) => onData(Object.assign({ stable: true }, parseBodyComp(e.target.value)))); await c.startNotifications(); hooked = true; } catch (e) {}
      if (hooked) { onStatus && onStatus("Terhubung. Naik ke timbangan…"); return { name, mode: "gatt", disconnect: () => device.gatt.connected && device.gatt.disconnect() }; }
      try { device.gatt.disconnect(); } catch (e) {}
    } catch (e) { /* lanjut ke mode siaran */ }
    // Jalur 2: siaran Xiaomi (eksperimental)
    if (!canWatchAds()) throw new Error("Timbangan ini tidak memakai protokol Bluetooth standar. Untuk Xiaomi Mi Scale, browser harus mendukung mode siaran (Chrome: aktifkan chrome://flags/#enable-experimental-web-platform-features). Atau isi berat secara manual.");
    device.addEventListener("advertisementreceived", (ev) => {
      ev.serviceData.forEach((dv, uuid) => {
        const u = String(uuid).toLowerCase();
        if (u.startsWith("0000181b") && dv.byteLength >= 13) { // Mi Body Composition Scale 2
          const c1 = dv.getUint8(1); const w = dv.getUint16(11, true) / 200; const imp = dv.getUint16(9, true);
          onData({ weight: +w.toFixed(2), stable: !!(c1 & 0x20), removed: !!(c1 & 0x80), impedance: imp || null });
        } else if (u.startsWith("0000181d") && dv.byteLength >= 3) { // Mi Scale generasi 1
          const c = dv.getUint8(0); const w = dv.getUint16(1, true) / 200;
          onData({ weight: +w.toFixed(2), stable: !!(c & 0x20), removed: !!(c & 0x80) });
        }
      });
    });
    await device.watchAdvertisements();
    onStatus && onStatus("Mendengarkan siaran " + name + ". Naik ke timbangan…");
    return { name, mode: "advert", disconnect: () => { try { device.unwatchAdvertisements && device.unwatchAdvertisements(); } catch (e) {} } };
  }

  /* Zona detak jantung (persen dari detak maksimal ≈ 220 − usia) */
  function zone(hr, age) {
    const max = 220 - (+age || 30), pct = (hr / max) * 100;
    if (pct < 50) return { n: 0, t: "Istirahat", c: "#6fb3e8" };
    if (pct < 60) return { n: 1, t: "Sangat ringan", c: "#17a361" };
    if (pct < 70) return { n: 2, t: "Ringan — bakar lemak", c: "#7cc243" };
    if (pct < 80) return { n: 3, t: "Sedang — aerobik", c: "#e3b04b" };
    if (pct < 90) return { n: 4, t: "Berat", c: "#e8873c" };
    return { n: 5, t: "Maksimal", c: "#c8473f" };
  }
  return { supported, canWatchAds, connectHeartRate, connectScale, zone, parseHeartRate, parseWeight, parseBodyComp };
})();
