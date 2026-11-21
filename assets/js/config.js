/* =====================================================================
   KONFIGURASI — isi dengan data proyek Supabase Anda.
   Supabase Dashboard → Project Settings → API Keys:
     - Project URL                         → SUPABASE_URL
     - Publishable key (atau anon public)  → SUPABASE_ANON_KEY  (aman ditaruh di frontend,
       keamanan data dijaga oleh Row Level Security di schema.sql)
   Jika dibiarkan kosong, aplikasi berjalan dalam MODE DEMO (data disimpan
   di browser masing-masing pengunjung, tidak online).
   ===================================================================== */
window.QOWIY_CONFIG = {
  SUPABASE_URL: "https://fmikdgeevcvuchcrwuwc.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_anFN9KWuBIKkwG8aOYkG8Q_hRi8IBcl",
  // Bucket penyimpanan video (lihat schema.sql)
  MEDIA_BUCKET: "media",
  PUBLIC_BUCKET: "public-assets"
};
