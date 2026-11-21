// Membuat supabase/seed.sql dari assets/js/seed.js
// Jalankan: node scripts/build-seed.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const src = fs.readFileSync(path.join(__dirname, "../assets/js/seed.js"), "utf8");
const window = {};
new Function("window", src)(window);
const S = window.QAWIY_SEED;

const uuid = (key) => {
  const h = crypto.createHash("md5").update("qawiy:" + key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const q = (v) => (v === null || v === undefined || v === "" ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
const j = (v) => "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";
const b = (v) => (v ? "true" : "false");
const arr = (a) => (a && a.length ? `'{${a.join(",")}}'::int[]` : "null");

let out = `-- Konten awal QAWIY (dibuat otomatis dari assets/js/seed.js)\n-- Jalankan SETELAH schema.sql. Aman diulang (on conflict do update).\n\n`;

out += `insert into public.settings (id, data) values (1, ${j(S.settings)})\n  on conflict (id) do update set data = excluded.data;\n\n`;

S.modules.forEach((m) => {
  out += `insert into public.modules (id,title,subtitle,track,sort,tag) values (${q(uuid(m.key))},${q(m.title)},${q(m.subtitle)},${q(m.track)},${m.sort},${q(m.tag)})\n  on conflict (id) do update set title=excluded.title, subtitle=excluded.subtitle, track=excluded.track, sort=excluded.sort, tag=excluded.tag;\n`;
});
out += "\n";
S.lessons.forEach((l) => {
  out += `insert into public.lessons (id,module_id,title,description,dalil,video_url,duration,sort,is_free) values (${q(uuid(l.key))},${q(uuid(l.module))},${q(l.title)},${q(l.description)},${q(l.dalil)},${q(l.video_url)},${q(l.duration)},${l.sort},${b(l.is_free)})\n  on conflict (id) do update set title=excluded.title, description=excluded.description, dalil=excluded.dalil, sort=excluded.sort;\n`;
});
out += "\n";
S.videos.forEach((v) => {
  out += `insert into public.videos (id,kind,title,description,trainer,time_slot,days,audience,level,video_url,duration,is_free,sort) values (${q(uuid(v.key))},${q(v.kind)},${q(v.title)},${q(v.description)},${q(v.trainer)},${q(v.time_slot)},${arr(v.days)},${q(v.audience)},${q(v.level)},${q(v.video_url)},${q(v.duration)},${b(v.is_free)},${v.sort})\n  on conflict (id) do nothing;\n`;
});
out += "\n";
S.articles.forEach((a, i) => {
  out += `insert into public.articles (id,slug,title,category,excerpt,body,dalil,sources,read_min,created_at) values (${q(uuid(a.key))},${q(a.slug)},${q(a.title)},${q(a.category)},${q(a.excerpt)},${q(a.body)},${j(a.dalil)},${j(a.sources)},${a.read_min},now() + interval '${i} seconds')\n  on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, dalil=excluded.dalil, sources=excluded.sources;\n`;
});

fs.writeFileSync(path.join(__dirname, "../supabase/seed.sql"), out);
console.log("seed.sql dibuat:", out.length, "byte");
