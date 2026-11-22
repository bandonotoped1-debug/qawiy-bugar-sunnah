-- Gabungan migrasi 002 + 003 — tempel semuanya di Supabase SQL Editor lalu klik Run (aman dijalankan ulang)

-- =====================================================================
-- Migrasi 002 — pengaturan makro, menu tersimpan, data perangkat,
-- kuota rekomendasi AI & chatbot. Aman dijalankan ulang.
-- =====================================================================

-- Pengaturan makro (persen protein/karbo/serat, kkal) per member
alter table public.profiles add column if not exists nutrition jsonb;

-- Menu tersimpan (dari AI atau susun sendiri)
create table if not exists public.meal_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  plan        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists meal_plans_user_idx on public.meal_plans(user_id, created_at desc);
alter table public.meal_plans enable row level security;
drop policy if exists "menu: milik sendiri" on public.meal_plans;
create policy "menu: milik sendiri" on public.meal_plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Data tubuh: berat (Bluetooth/manual), detak jantung, langkah, lemak tubuh
create table if not exists public.health_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('weight','heart_rate','steps','body_fat')),
  value        numeric not null,
  meta         jsonb,
  source       text,
  measured_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists health_logs_user_idx on public.health_logs(user_id, kind, measured_at desc);
alter table public.health_logs enable row level security;
drop policy if exists "log: milik sendiri" on public.health_logs;
create policy "log: milik sendiri" on public.health_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "log: admin baca" on public.health_logs;
create policy "log: admin baca" on public.health_logs for select using (public.is_admin());

-- Kuota rekomendasi menu AI (per member aktif per hari)
create table if not exists public.ai_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null default current_date,
  count    integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;

create or replace function public.ai_take_quota(p_limit integer default 15)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then return false; end if;
  if not (public.has_active_subscription() or public.is_admin()) then return false; end if;
  insert into public.ai_usage (user_id, day, count) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into n;
  return n <= p_limit;
end $$;

-- Kuota chatbot (per akun atau per IP ter-hash, per hari)
create table if not exists public.chat_usage (
  key    text not null,
  day    date not null default current_date,
  count  integer not null default 0,
  primary key (key, day)
);
alter table public.chat_usage enable row level security;

create or replace function public.chat_take_quota(p_key text, p_limit integer default 25)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if p_key is null or length(p_key) < 8 then return false; end if;
  insert into public.chat_usage (key, day, count) values (p_key, current_date, 1)
  on conflict (key, day) do update set count = public.chat_usage.count + 1
  returning count into n;
  return n <= least(p_limit, 100);
end $$;

grant select, insert, update, delete on public.meal_plans, public.health_logs to authenticated;
revoke all on public.ai_usage, public.chat_usage from anon, authenticated;
grant execute on function public.ai_take_quota(integer) to authenticated;
grant execute on function public.chat_take_quota(text, integer) to anon, authenticated;

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
