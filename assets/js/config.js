/* =====================================================================
   KONFIGURASI — isi dengan data proyek Supabase Anda.
   Supabase Dashboard → Project Settings → API:
     - Project URL           → SUPABASE_URL
     - anon / public API key → SUPABASE_ANON_KEY  (aman ditaruh di frontend,
       keamanan data dijaga oleh Row Level Security di schema.sql)
   Jika dibiarkan kosong, aplikasi berjalan dalam MODE DEMO (data disimpan
   di browser masing-masing pengunjung, tidak online).
   ===================================================================== */
window.QAWIY_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  // Bucket penyimpanan video (lihat schema.sql)
  MEDIA_BUCKET: "media",
  PUBLIC_BUCKET: "public-assets"
};
