-- =====================================================================
-- Migrasi 003 — sambungan Google Health (token disimpan hanya untuk server)
-- =====================================================================
create table if not exists public.google_links (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  refresh_token  text not null,
  scope          text,
  connected_at   timestamptz not null default now(),
  last_sync_at   timestamptz
);
alter table public.google_links enable row level security;
-- sengaja TANPA policy: hanya server (service role) yang bisa membaca token
revoke all on public.google_links from anon, authenticated;

create or replace function public.google_link_status()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('connected', true, 'connected_at', connected_at, 'last_sync_at', last_sync_at)
                   from public.google_links where user_id = auth.uid()), jsonb_build_object('connected', false));
$$;
grant execute on function public.google_link_status() to authenticated;

-- izinkan sumber data google_health di log (kolom source bebas teks, tidak perlu perubahan)
