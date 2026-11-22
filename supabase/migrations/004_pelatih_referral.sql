-- =====================================================================
-- QOWIY — Migrasi 004: Role Pelatih, Pendaftaran Pelatih, Referral,
--                      Bagi Hasil & Komisi, Materi Pelatih (video + dokumen)
-- Jalankan sekali di Supabase → SQL Editor. Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ROLE & KOLOM BARU
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member','coach','admin'));
alter table public.profiles add column if not exists coach_id    uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
create index if not exists profiles_coach_idx on public.profiles(coach_id);
create index if not exists profiles_ref_idx on public.profiles(referred_by);

-- Modul & lesson milik pelatih (coach_id kosong = program resmi admin)
alter table public.modules add column if not exists coach_id uuid references public.profiles(id) on delete cascade;
alter table public.lessons add column if not exists coach_id uuid references public.profiles(id) on delete cascade;
alter table public.lessons add column if not exists doc_path text;   -- dokumen di bucket "media"
alter table public.lessons add column if not exists doc_url  text;   -- atau link dokumen (Google Drive, dll.)
alter table public.lessons add column if not exists doc_name text;
create index if not exists modules_coach_idx on public.modules(coach_id);
create index if not exists lessons_coach_idx on public.lessons(coach_id);

-- ---------------------------------------------------------------------
-- 2. TABEL PELATIH
-- ---------------------------------------------------------------------
create table if not exists public.coaches (
  id             uuid primary key references public.profiles(id) on delete cascade,
  display_name   text not null,
  gender         text not null check (gender in ('ikhwan','akhwat')),
  bio            text,
  specialties    text[] not null default '{}',   -- turun | kuat | bugar | sunnah | rumah | gym
  photo_url      text,
  city           text,
  referral_code  text unique not null,
  active         boolean not null default true,  -- diatur admin
  accepting      boolean not null default true,  -- pelatih menerima member baru
  created_at     timestamptz not null default now()
);

create table if not exists public.coach_applications (
  id                 uuid primary key default gen_random_uuid(),
  full_name          text not null,
  gender             text not null check (gender in ('ikhwan','akhwat')),
  email              text not null,
  whatsapp           text not null,
  city               text,
  experience_months  integer,
  certified          boolean not null default false,
  bio                text,
  cv_path            text,                         -- file CV di bucket "cv"
  agreements         jsonb not null default '[]'::jsonb,  -- syarat yang dicentang pendaftar
  status             text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note         text,
  created_at         timestamptz not null default now(),
  reviewed_at        timestamptz
);
create unique index if not exists coach_app_pending_email on public.coach_applications (lower(email)) where status = 'pending';

create table if not exists public.coach_earnings (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  member_id        uuid references public.profiles(id) on delete set null,
  subscription_id  uuid references public.subscriptions(id) on delete set null,
  kind             text not null check (kind in ('bagi_hasil','referral')),
  base_amount      integer not null default 0,
  rate             numeric,          -- persen yang dipakai (null bila nominal tetap)
  amount           integer not null default 0,
  status           text not null default 'tertunda' check (status in ('tertunda','dibayar','batal')),
  created_at       timestamptz not null default now(),
  paid_at          timestamptz,
  unique (subscription_id, kind)
);
create index if not exists coach_earnings_coach_idx on public.coach_earnings(coach_id);

create table if not exists public.coach_notes (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  member_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists coach_notes_member_idx on public.coach_notes(member_id);

-- ---------------------------------------------------------------------
-- 3. PENGATURAN BAWAAN (syarat pelatih & komisi) — tidak menimpa yang sudah ada
-- ---------------------------------------------------------------------
update public.settings set data = jsonb_build_object(
  'coach_requirements', jsonb_build_array(
    'Sudah memiliki pengalaman latihan fitness minimal 3 bulan (bersertifikat maupun belum).',
    'Bermanhaj Salafus Shalih — berpegang teguh pada Al-Qur''an dan Sunnah.',
    'Menutup aurat sesuai syariat.',
    'Konsisten menjalankan sunnah-sunnah dan ibadah harian.'),
  'coach_share_pct', 30,
  'referral_mode', 'persen',
  'referral_value', 10,
  'referral_scope', 'pertama'
) || data where id = 1;

-- ---------------------------------------------------------------------
-- 4. FUNGSI BANTU
-- ---------------------------------------------------------------------
create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach');
$$;

create or replace function public.my_coach_id()
returns uuid language sql stable security definer set search_path = public as $$
  select coach_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_my_member(p_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = p_member and coach_id = auth.uid());
$$;

create or replace function public.gen_referral_code(p_name text)
returns text language plpgsql volatile security definer set search_path = public as $$
declare base text; code text; i int := 0;
begin
  base := upper(left(regexp_replace(split_part(coalesce(p_name,''), ' ', 1), '[^A-Za-z]', '', 'g'), 8));
  if length(base) < 3 then base := 'COACH'; end if;
  loop
    code := base || (10 + floor(random() * 90))::int::text;
    if i > 20 then code := base || (100 + floor(random() * 900))::int::text; end if;
    exit when not exists (select 1 from public.coaches where referral_code = code);
    i := i + 1;
  end loop;
  return code;
end $$;

-- Jadikan sebuah akun pelatih (dipakai saat admin menyetujui / saat pendaftar membuat akun)
create or replace function public.make_coach(p_user uuid, p_name text, p_gender text, p_bio text, p_city text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set role = 'coach' where id = p_user and role <> 'admin';
  insert into public.coaches (id, display_name, gender, bio, city, referral_code)
  values (p_user, coalesce(nullif(p_name,''), 'Pelatih'), coalesce(p_gender, 'ikhwan'), p_bio, p_city, public.gen_referral_code(p_name))
  on conflict (id) do update set active = true;
end $$;
revoke execute on function public.make_coach(uuid, text, text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. PENDAFTARAN AKUN BARU: admin / pelatih yang disetujui / member + referral
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_gender text := nullif(new.raw_user_meta_data->>'gender','');
  v_ref    uuid;
  v_coach  uuid;
  v_role   text := 'member';
  v_app    public.coach_applications;
begin
  if exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then
    v_role := 'admin';
  else
    select * into v_app from public.coach_applications
      where lower(email) = lower(new.email) and status = 'approved' order by reviewed_at desc nulls last limit 1;
    if found then v_role := 'coach'; end if;
  end if;

  if v_role = 'member' then
    -- kode referral pelatih (dari tautan undangan)
    select c.id into v_ref from public.coaches c
      where c.active and c.referral_code = upper(nullif(trim(new.raw_user_meta_data->>'ref'), '')) limit 1;
    -- pelatih pilihan dari kuis (harus aktif & sesuai ikhwan/akhwat)
    begin
      select c.id into v_coach from public.coaches c
        where c.active and c.accepting and c.id = nullif(new.raw_user_meta_data->>'coach_id','')::uuid
          and (v_gender is null or c.gender = v_gender);
    exception when others then v_coach := null;
    end;
    if v_coach is null and v_ref is not null then
      select c.id into v_coach from public.coaches c where c.id = v_ref and (v_gender is null or c.gender = v_gender);
    end if;
  end if;

  insert into public.profiles (id, email, full_name, whatsapp, gender, quiz, role, coach_id, referred_by)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(nullif(new.raw_user_meta_data->>'whatsapp',''), case when v_role = 'coach' then v_app.whatsapp end),
    coalesce(v_gender, case when v_role = 'coach' then v_app.gender end),
    case when new.raw_user_meta_data ? 'quiz' and jsonb_typeof(new.raw_user_meta_data->'quiz') = 'object' then new.raw_user_meta_data->'quiz' else null end,
    v_role, v_coach, v_ref
  )
  on conflict (id) do nothing;

  if v_role = 'coach' then
    perform public.make_coach(new.id, v_app.full_name, v_app.gender, v_app.bio, v_app.city);
  end if;
  return new;
end $$;

-- Lindungi kolom penting profil: role, referred_by (hanya admin); coach_id harus pelatih aktif
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.role is distinct from old.role then raise exception 'Tidak diizinkan mengubah role'; end if;
  if new.referred_by is distinct from old.referred_by then raise exception 'Tidak diizinkan mengubah referral'; end if;
  if new.coach_id is distinct from old.coach_id and new.coach_id is not null then
    if not exists (select 1 from public.coaches c where c.id = new.coach_id and c.active and c.accepting
                   and (new.gender is null or c.gender = new.gender)) then
      raise exception 'Pelatih tidak tersedia untuk akun ini';
    end if;
  end if;
  return new;
end $$;

-- Pelatih tidak boleh mengubah kode referral / status aktif / kategori sendiri
create or replace function public.guard_coach_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.referral_code is distinct from old.referral_code or new.active is distinct from old.active
     or new.gender is distinct from old.gender or new.id is distinct from old.id then
    raise exception 'Hanya admin yang dapat mengubah kode referral, status, atau kategori pelatih';
  end if;
  return new;
end $$;
drop trigger if exists coaches_guard on public.coaches;
create trigger coaches_guard before update on public.coaches for each row execute function public.guard_coach_change();

-- ---------------------------------------------------------------------
-- 6. KOMISI OTOMATIS saat langganan diaktifkan
--    bagi_hasil : % dari nominal yang dibayar member binaan pelatih
--    referral   : % dari harga normal paket (atau nominal tetap) untuk pelatih pengundang
-- ---------------------------------------------------------------------
create or replace function public.compute_coach_earnings()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s jsonb; share numeric; rmode text; rval numeric; rscope text;
  v_coach uuid; v_ref uuid; normal integer; prior boolean;
begin
  if new.status <> 'active' or coalesce(new.amount, 0) <= 0 then return null; end if;
  if tg_op = 'UPDATE' and old.status = 'active' then return null; end if;

  select data into s from public.settings where id = 1;
  share  := coalesce(nullif(s->>'coach_share_pct','')::numeric, 0);
  rmode  := coalesce(s->>'referral_mode', 'persen');
  rval   := coalesce(nullif(s->>'referral_value','')::numeric, 0);
  rscope := coalesce(s->>'referral_scope', 'pertama');
  select coach_id, referred_by into v_coach, v_ref from public.profiles where id = new.user_id;

  if v_coach is not null and share > 0 then
    insert into public.coach_earnings (coach_id, member_id, subscription_id, kind, base_amount, rate, amount)
    values (v_coach, new.user_id, new.id, 'bagi_hasil', new.amount, share, round(new.amount * share / 100))
    on conflict (subscription_id, kind) do nothing;
  end if;

  if v_ref is not null and rval > 0 then
    select exists (select 1 from public.subscriptions x where x.user_id = new.user_id and x.id <> new.id
                   and x.status in ('active','expired') and x.amount > 0) into prior;
    if rscope = 'setiap' or not prior then
      select (p->>'price')::int into normal from jsonb_array_elements(coalesce(s->'plans','[]'::jsonb)) p where p->>'id' = new.plan limit 1;
      normal := coalesce(normal, new.amount);
      insert into public.coach_earnings (coach_id, member_id, subscription_id, kind, base_amount, rate, amount)
      values (v_ref, new.user_id, new.id, 'referral', normal,
              case when rmode = 'nominal' then null else rval end,
              case when rmode = 'nominal' then round(rval) else round(normal * rval / 100) end)
      on conflict (subscription_id, kind) do nothing;
    end if;
  end if;
  return null;
end $$;
drop trigger if exists subscriptions_earnings on public.subscriptions;
create trigger subscriptions_earnings after insert or update of status on public.subscriptions
  for each row execute function public.compute_coach_earnings();

-- ---------------------------------------------------------------------
-- 7. RPC
-- ---------------------------------------------------------------------
-- Admin: setujui pendaftar pelatih
create or replace function public.approve_coach_application(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.coach_applications; pid uuid;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  select * into a from public.coach_applications where id = p_id;
  if not found then raise exception 'Pendaftaran tidak ditemukan'; end if;
  update public.coach_applications set status = 'approved', reviewed_at = now() where id = p_id;
  select id into pid from public.profiles where lower(email) = lower(a.email) limit 1;
  if pid is not null then
    perform public.make_coach(pid, a.full_name, a.gender, a.bio, a.city);
    update public.profiles set whatsapp = coalesce(nullif(whatsapp, ''), a.whatsapp), gender = coalesce(gender, a.gender) where id = pid;
  end if;
  return jsonb_build_object('linked', pid is not null, 'referral_code', (select referral_code from public.coaches where id = pid));
end $$;

-- Admin: aktifkan / nonaktifkan pelatih
create or replace function public.set_coach_active(p_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  update public.coaches set active = p_active where id = p_id;
  update public.profiles set role = case when p_active then 'coach' else 'member' end where id = p_id and role <> 'admin';
end $$;

-- Member: data pelatihnya (termasuk nomor WA)
create or replace function public.my_coach()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', c.id, 'display_name', c.display_name, 'gender', c.gender, 'bio', c.bio,
           'specialties', c.specialties, 'photo_url', c.photo_url, 'city', c.city, 'active', c.active,
           'whatsapp', p.whatsapp)
  from public.profiles me join public.coaches c on c.id = me.coach_id join public.profiles p on p.id = c.id
  where me.id = auth.uid();
$$;

-- Pelatih (atau admin untuk pelatih tertentu): daftar member binaan + monitoring ringkas
create or replace function public.coach_members(p_coach uuid default null)
returns table (id uuid, full_name text, email text, whatsapp text, gender text, created_at timestamptz,
               goal text, is_mine boolean, via_referral boolean, sub_status text, sub_plan text, expires_at timestamptz,
               lessons_done integer, habit_days7 integer, habit_avg7 numeric, last_checkin date,
               last_weight numeric, first_weight numeric)
language plpgsql stable security definer set search_path = public as $$
declare target uuid;
begin
  if public.is_admin() and p_coach is not null then target := p_coach;
  elsif public.is_coach() then target := auth.uid();
  else raise exception 'Hanya pelatih'; end if;
  return query
  select p.id, p.full_name,
    case when p.coach_id = target then p.email end,
    case when p.coach_id = target then p.whatsapp end,
    p.gender, p.created_at, p.quiz->>'goal',
    p.coach_id = target, p.referred_by = target,
    (select case when bool_or(s.status = 'active' and (s.expires_at is null or s.expires_at > now())) then 'aktif'
                 when bool_or(s.status = 'pending') then 'pending' else 'belum' end from public.subscriptions s where s.user_id = p.id),
    (select s.plan_name from public.subscriptions s where s.user_id = p.id and s.status = 'active' order by s.activated_at desc nulls last limit 1),
    (select s.expires_at from public.subscriptions s where s.user_id = p.id and s.status = 'active' order by s.activated_at desc nulls last limit 1),
    case when p.coach_id = target then (select count(*)::int from public.progress g where g.user_id = p.id) end,
    case when p.coach_id = target then (select count(*)::int from public.habits h where h.user_id = p.id and h.day > current_date - 7
        and (select count(*) from jsonb_each(h.items) e where e.value = 'true'::jsonb) >= 5) end,
    case when p.coach_id = target then (select round(avg((select count(*) from jsonb_each(h.items) e where e.value = 'true'::jsonb)), 1)
        from public.habits h where h.user_id = p.id and h.day > current_date - 7) end,
    case when p.coach_id = target then (select max(h.day) from public.habits h where h.user_id = p.id) end,
    case when p.coach_id = target then (select l.value from public.health_logs l where l.user_id = p.id and l.kind = 'weight' order by l.measured_at desc limit 1) end,
    case when p.coach_id = target then (select l.value from public.health_logs l where l.user_id = p.id and l.kind = 'weight' order by l.measured_at asc limit 1) end
  from public.profiles p
  where p.coach_id = target or p.referred_by = target
  order by p.created_at desc;
end $$;

-- Pelatih: detail monitoring satu member binaan
create or replace function public.coach_member_detail(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare ok boolean;
begin
  select (public.is_admin() or (public.is_coach() and coach_id = auth.uid())) into ok from public.profiles where id = p_member;
  if not coalesce(ok, false) then raise exception 'Bukan member binaan Anda'; end if;
  return jsonb_build_object(
    'profile', (select jsonb_build_object('id', id, 'full_name', full_name, 'email', email, 'whatsapp', whatsapp, 'gender', gender, 'quiz', quiz, 'nutrition', nutrition) from public.profiles where id = p_member),
    'habits', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'items', items) order by day) from public.habits where user_id = p_member and day > current_date - 30), '[]'::jsonb),
    'weights', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'at', measured_at) order by measured_at) from public.health_logs where user_id = p_member and kind = 'weight' and measured_at > now() - interval '180 days'), '[]'::jsonb),
    'steps', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'at', measured_at) order by measured_at) from public.health_logs where user_id = p_member and kind = 'steps' and measured_at > now() - interval '30 days'), '[]'::jsonb),
    'progress', coalesce((select jsonb_agg(jsonb_build_object('lesson_id', lesson_id, 'at', completed_at) order by completed_at desc) from public.progress where user_id = p_member), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'body', body, 'at', created_at) order by created_at desc) from public.coach_notes where member_id = p_member), '[]'::jsonb)
  );
end $$;

-- Calon pelatih yang sudah punya akun: status pendaftarannya
create or replace function public.my_coach_application()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('status', a.status, 'created_at', a.created_at, 'admin_note', a.admin_note)
  from public.coach_applications a
  where lower(a.email) = lower((select email from public.profiles where id = auth.uid()))
  order by a.created_at desc limit 1;
$$;

grant execute on function public.is_coach(), public.my_coach_id(), public.is_my_member(uuid), public.my_coach(), public.my_coach_application() to anon, authenticated;
grant execute on function public.coach_members(uuid), public.coach_member_detail(uuid), public.approve_coach_application(uuid), public.set_coach_active(uuid, boolean) to authenticated;
revoke execute on function public.gen_referral_code(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.coaches            enable row level security;
alter table public.coach_applications enable row level security;
alter table public.coach_earnings     enable row level security;
alter table public.coach_notes        enable row level security;

-- pelatih: profil publik terlihat semua (untuk dipilih member); ubah sendiri; admin kelola
drop policy if exists "pelatih: baca" on public.coaches;
create policy "pelatih: baca" on public.coaches for select using (active or id = auth.uid() or public.is_admin());
drop policy if exists "pelatih: ubah sendiri" on public.coaches;
create policy "pelatih: ubah sendiri" on public.coaches for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "pelatih: admin" on public.coaches;
create policy "pelatih: admin" on public.coaches for all using (public.is_admin()) with check (public.is_admin());

-- pendaftaran pelatih: siapa pun boleh mengirim (status pending), hanya admin yang membaca & memutuskan
drop policy if exists "daftar pelatih: kirim" on public.coach_applications;
create policy "daftar pelatih: kirim" on public.coach_applications for insert to anon, authenticated
  with check (status = 'pending' and admin_note is null and reviewed_at is null);
drop policy if exists "daftar pelatih: admin" on public.coach_applications;
create policy "daftar pelatih: admin" on public.coach_applications for all using (public.is_admin()) with check (public.is_admin());

-- penghasilan: pelatih baca miliknya, admin kelola
drop policy if exists "penghasilan: pelatih baca" on public.coach_earnings;
create policy "penghasilan: pelatih baca" on public.coach_earnings for select using (coach_id = auth.uid() or public.is_admin());
drop policy if exists "penghasilan: admin" on public.coach_earnings;
create policy "penghasilan: admin" on public.coach_earnings for all using (public.is_admin()) with check (public.is_admin());

-- catatan pelatih: pelatih menulis untuk member binaannya; member membaca catatan untuknya
drop policy if exists "catatan: baca" on public.coach_notes;
create policy "catatan: baca" on public.coach_notes for select using (member_id = auth.uid() or coach_id = auth.uid() or public.is_admin());
drop policy if exists "catatan: pelatih tulis" on public.coach_notes;
create policy "catatan: pelatih tulis" on public.coach_notes for insert
  with check (coach_id = auth.uid() and public.is_coach() and public.is_my_member(member_id));
drop policy if exists "catatan: pelatih hapus" on public.coach_notes;
create policy "catatan: pelatih hapus" on public.coach_notes for delete using (coach_id = auth.uid() or public.is_admin());

-- modul: resmi (coach_id kosong) untuk semua; modul pelatih hanya untuk member binaannya
drop policy if exists "modul: baca" on public.modules;
create policy "modul: baca" on public.modules for select using (
  public.is_admin() or coach_id = auth.uid()
  or (published and (coach_id is null or coach_id = public.my_coach_id())));
drop policy if exists "modul: pelatih" on public.modules;
create policy "modul: pelatih" on public.modules for all
  using (coach_id = auth.uid() and public.is_coach()) with check (coach_id = auth.uid() and public.is_coach());

-- lesson: pelatih bisa membuka semua materi resmi + materi buatannya; member sesuai langganan & pelatihnya
drop policy if exists "lesson: baca" on public.lessons;
create policy "lesson: baca" on public.lessons for select using (
  public.is_admin() or coach_id = auth.uid()
  or (public.is_coach() and coach_id is null)
  or (published and (is_free or public.has_active_subscription()) and (coach_id is null or coach_id = public.my_coach_id())));
drop policy if exists "lesson: pelatih" on public.lessons;
create policy "lesson: pelatih" on public.lessons for all
  using (coach_id = auth.uid() and public.is_coach())
  with check (coach_id = auth.uid() and public.is_coach()
              and exists (select 1 from public.modules m where m.id = module_id and m.coach_id = auth.uid()));

-- video rutinitas & motivasi: pelatih juga bisa menonton
drop policy if exists "video: baca" on public.videos;
create policy "video: baca" on public.videos for select
  using (public.is_admin() or public.is_coach() or (published and (is_free or public.has_active_subscription())));

-- jumlah lesson per modul resmi (peta program publik) — modul pelatih tidak ikut
create or replace function public.lesson_counts()
returns table (module_id uuid, total integer)
language sql stable security definer set search_path = public as $$
  select l.module_id, count(*)::int from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.published and (m.coach_id is null or m.coach_id = public.my_coach_id() or m.coach_id = auth.uid())
  group by l.module_id;
$$;

-- ---------------------------------------------------------------------
-- 9. STORAGE: bucket "cv" (privat) + izin unggah pelatih di "media" & "public-assets"
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cv', 'cv', false, 5242880, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cv: kirim" on storage.objects;
create policy "cv: kirim" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'cv' and (storage.foldername(name))[1] = 'lamaran');
drop policy if exists "cv: admin baca" on storage.objects;
create policy "cv: admin baca" on storage.objects for select using (bucket_id = 'cv' and public.is_admin());
drop policy if exists "cv: admin hapus" on storage.objects;
create policy "cv: admin hapus" on storage.objects for delete using (bucket_id = 'cv' and public.is_admin());

drop policy if exists "media: member aktif baca" on storage.objects;
create policy "media: member aktif baca" on storage.objects for select
  using (bucket_id = 'media' and (public.is_admin() or public.is_coach() or public.has_active_subscription()));

drop policy if exists "media: pelatih tulis" on storage.objects;
create policy "media: pelatih tulis" on storage.objects for insert
  with check (bucket_id in ('media','public-assets') and public.is_coach()
              and (storage.foldername(name))[1] = 'coach' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "media: pelatih ubah" on storage.objects;
create policy "media: pelatih ubah" on storage.objects for update
  using (bucket_id in ('media','public-assets') and public.is_coach()
         and (storage.foldername(name))[1] = 'coach' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "media: pelatih hapus" on storage.objects;
create policy "media: pelatih hapus" on storage.objects for delete
  using (bucket_id in ('media','public-assets') and public.is_coach()
         and (storage.foldername(name))[1] = 'coach' and (storage.foldername(name))[2] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 10. HAK AKSES API
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.coaches, public.coach_earnings, public.coach_notes to authenticated;
grant select on public.coaches to anon;
grant insert on public.coach_applications to anon;
grant select, insert, update, delete on public.coach_applications to authenticated;
