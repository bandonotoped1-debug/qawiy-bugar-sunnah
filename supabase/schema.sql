-- =====================================================================
-- QOWIY — Bugar ala Sunnah
-- Skema database Supabase (jalankan sekali di SQL Editor Supabase)
-- Aman dijalankan ulang: memakai IF NOT EXISTS / OR REPLACE.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. PROFIL MEMBER (otomatis dibuat saat user daftar)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  whatsapp    text,
  gender      text check (gender in ('ikhwan','akhwat')),
  role        text not null default 'member' check (role in ('member','admin')),
  quiz        jsonb,
  created_at  timestamptz not null default now()
);

-- Email yang otomatis menjadi admin saat mendaftar di aplikasi
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, whatsapp, gender, quiz, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'whatsapp',
    nullif(new.raw_user_meta_data->>'gender',''),
    case when new.raw_user_meta_data ? 'quiz' then new.raw_user_meta_data->'quiz' else null end,
    case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. FUNGSI BANTU (dipakai aturan keamanan / RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- 3. LANGGANAN
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plan          text not null,
  plan_name     text,
  amount        integer not null default 0,
  status        text not null default 'pending' check (status in ('pending','active','expired','rejected')),
  note          text,
  created_at    timestamptz not null default now(),
  activated_at  timestamptz,
  expires_at    timestamptz
);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

create or replace function public.has_active_subscription()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid() and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------
-- 4. KONTEN: MODUL & LESSON (Peta Program)
-- ---------------------------------------------------------------------
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  track       text not null default 'start',  -- start | fondasi | turun | kuat | ekstra
  sort        integer not null default 0,
  tag         text,                            -- label kecil, mis. "WEEK 1"
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  module_id     uuid not null references public.modules(id) on delete cascade,
  title         text not null,
  description   text,
  dalil         text,
  video_url     text,          -- link YouTube/Vimeo/MP4 publik (opsional)
  storage_path  text,          -- file di bucket "media" (opsional)
  duration      text,
  sort          integer not null default 0,
  is_free       boolean not null default false,
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists lessons_module_idx on public.lessons(module_id);

-- ---------------------------------------------------------------------
-- 5. VIDEO RUTINITAS HARIAN & MOTIVASI TRAINER
-- ---------------------------------------------------------------------
create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('routine','motivation')),
  title         text not null,
  description   text,
  trainer       text,
  time_slot     text check (time_slot in ('subuh','dhuha','ashar','isya')),
  days          int[] ,        -- 0=Ahad … 6=Sabtu; null = setiap hari
  audience      text not null default 'semua' check (audience in ('semua','ikhwan','akhwat')),
  level         text default 'pemula',
  video_url     text,
  storage_path  text,
  thumb_url     text,
  duration      text,
  is_free       boolean not null default false,
  published     boolean not null default true,
  sort          integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists videos_kind_idx on public.videos(kind);

-- ---------------------------------------------------------------------
-- 6. ARTIKEL KESEHATAN (dengan dalil & sumber ilmiah)
-- ---------------------------------------------------------------------
create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  category    text,
  excerpt     text,
  body        text,           -- format markdown sederhana
  dalil       jsonb not null default '[]'::jsonb,    -- [{teks, rujukan, url}]
  sources     jsonb not null default '[]'::jsonb,    -- [{judul, penerbit, tahun, url}]
  read_min    integer default 4,
  cover_url   text,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. PROGRES, HABIT SUNNAH, LEAD KUIS, PENGATURAN
-- ---------------------------------------------------------------------
create table if not exists public.progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.habits (
  user_id   uuid not null references auth.users(id) on delete cascade,
  day       date not null,
  items     jsonb not null default '{}'::jsonb,
  primary key (user_id, day)
);

create table if not exists public.quiz_leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text,
  whatsapp    text,
  answers     jsonb not null,
  result      jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.settings (
  id    integer primary key default 1 check (id = 1),
  data  jsonb not null default '{}'::jsonb
);
insert into public.settings (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.modules       enable row level security;
alter table public.lessons       enable row level security;
alter table public.videos        enable row level security;
alter table public.articles      enable row level security;
alter table public.progress      enable row level security;
alter table public.habits        enable row level security;
alter table public.quiz_leads    enable row level security;
alter table public.settings      enable row level security;

-- profiles
drop policy if exists "profil: baca sendiri/admin" on public.profiles;
create policy "profil: baca sendiri/admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profil: ubah sendiri" on public.profiles;
create policy "profil: ubah sendiri" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid());

-- member tidak boleh menaikkan role-nya sendiri
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() kosong = dijalankan dari SQL Editor / service role → diizinkan
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Tidak diizinkan mengubah role';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_role_change();
drop policy if exists "profil: admin ubah" on public.profiles;
create policy "profil: admin ubah" on public.profiles for update using (public.is_admin());

-- subscriptions
drop policy if exists "langganan: baca sendiri/admin" on public.subscriptions;
create policy "langganan: baca sendiri/admin" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "langganan: ajukan sendiri" on public.subscriptions;
create policy "langganan: ajukan sendiri" on public.subscriptions for insert
  with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "langganan: admin kelola" on public.subscriptions;
create policy "langganan: admin kelola" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- modules (peta program terlihat oleh semua, isi lesson dikunci)
drop policy if exists "modul: baca" on public.modules;
create policy "modul: baca" on public.modules for select using (published or public.is_admin());
drop policy if exists "modul: admin" on public.modules;
create policy "modul: admin" on public.modules for all using (public.is_admin()) with check (public.is_admin());

-- lessons
drop policy if exists "lesson: baca" on public.lessons;
create policy "lesson: baca" on public.lessons for select
  using (public.is_admin() or (published and (is_free or public.has_active_subscription())));
drop policy if exists "lesson: admin" on public.lessons;
create policy "lesson: admin" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

-- videos
drop policy if exists "video: baca" on public.videos;
create policy "video: baca" on public.videos for select
  using (public.is_admin() or (published and (is_free or public.has_active_subscription())));
drop policy if exists "video: admin" on public.videos;
create policy "video: admin" on public.videos for all using (public.is_admin()) with check (public.is_admin());

-- articles (publik — untuk edukasi & menarik calon member)
drop policy if exists "artikel: baca" on public.articles;
create policy "artikel: baca" on public.articles for select using (published or public.is_admin());
drop policy if exists "artikel: admin" on public.articles;
create policy "artikel: admin" on public.articles for all using (public.is_admin()) with check (public.is_admin());

-- progress & habits (milik sendiri)
drop policy if exists "progres: sendiri" on public.progress;
create policy "progres: sendiri" on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "progres: admin baca" on public.progress;
create policy "progres: admin baca" on public.progress for select using (public.is_admin());
drop policy if exists "habit: sendiri" on public.habits;
create policy "habit: sendiri" on public.habits for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- quiz leads (siapa pun boleh kirim, hanya admin yang baca)
drop policy if exists "lead: kirim" on public.quiz_leads;
create policy "lead: kirim" on public.quiz_leads for insert with check (true);
drop policy if exists "lead: admin" on public.quiz_leads;
create policy "lead: admin" on public.quiz_leads for select using (public.is_admin());
drop policy if exists "lead: admin hapus" on public.quiz_leads;
create policy "lead: admin hapus" on public.quiz_leads for delete using (public.is_admin());

-- settings
drop policy if exists "setting: baca" on public.settings;
create policy "setting: baca" on public.settings for select using (true);
drop policy if exists "setting: admin" on public.settings;
create policy "setting: admin" on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 8b. RPC publik: jumlah lesson per modul & daftar video (tanpa link)
--     → agar calon member bisa melihat isi program dalam keadaan terkunci
-- ---------------------------------------------------------------------
create or replace function public.lesson_counts()
returns table (module_id uuid, total integer)
language sql stable security definer set search_path = public as $$
  select module_id, count(*)::int from public.lessons where published group by module_id;
$$;

create or replace function public.video_teasers(p_kind text)
returns table (id uuid, title text, duration text, time_slot text, trainer text, is_free boolean)
language sql stable security definer set search_path = public as $$
  select id, title, duration, time_slot, trainer, is_free
  from public.videos where published and kind = p_kind order by sort;
$$;

grant execute on function public.lesson_counts() to anon, authenticated;
grant execute on function public.video_teasers(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. STORAGE: bucket "media" (video, privat) & "public-assets" (gambar)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, null)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

drop policy if exists "media: member aktif baca" on storage.objects;
create policy "media: member aktif baca" on storage.objects for select
  using (bucket_id = 'media' and (public.is_admin() or public.has_active_subscription()));
drop policy if exists "media: admin tulis" on storage.objects;
create policy "media: admin tulis" on storage.objects for insert
  with check (bucket_id in ('media','public-assets') and public.is_admin());
drop policy if exists "media: admin ubah" on storage.objects;
create policy "media: admin ubah" on storage.objects for update
  using (bucket_id in ('media','public-assets') and public.is_admin());
drop policy if exists "media: admin hapus" on storage.objects;
create policy "media: admin hapus" on storage.objects for delete
  using (bucket_id in ('media','public-assets') and public.is_admin());
drop policy if exists "public-assets: baca" on storage.objects;
create policy "public-assets: baca" on storage.objects for select using (bucket_id = 'public-assets');

-- ---------------------------------------------------------------------
-- 10. HAK AKSES API (keamanan tetap dijaga RLS di atas)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
revoke all on public.admin_emails from anon, authenticated;

-- ---------------------------------------------------------------------
-- 11. ADMIN
--   a) Email di admin_emails otomatis jadi admin saat mendaftar di aplikasi:
--        insert into public.admin_emails values ('email-anda@gmail.com') on conflict do nothing;
--   b) Akun yang sudah terdaftar:
--        update public.profiles set role = 'admin' where email = 'email-anda@gmail.com';
-- ---------------------------------------------------------------------
