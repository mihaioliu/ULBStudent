-- SUPABASE_PRODUCTION_SETUP.sql
-- Idempotent production setup for ULBStudent
-- Safe to run multiple times.

begin;

-- 1) Ensure admin role support in utilizatori
alter table public.utilizatori
  add column if not exists role text default 'student';

alter table public.utilizatori
  add column if not exists user_id uuid;

create index if not exists idx_utilizatori_email_lower on public.utilizatori (lower(email));
create index if not exists idx_utilizatori_user_id on public.utilizatori (user_id);

-- Mark known admin by email.
update public.utilizatori
set role = 'admin'
where lower(email) = 'admin@ulbstudent.ro';

-- If admin auth user exists but profile row is missing, create one.
insert into public.utilizatori (user_id, email, nume_complet, an_studiu, specializare, role)
select au.id, lower(au.email), 'Administrator Platforma', 0, 'Administrare Platforma', 'admin'
from auth.users au
where lower(au.email) = 'admin@ulbstudent.ro'
  and not exists (
    select 1
    from public.utilizatori u
    where lower(u.email) = 'admin@ulbstudent.ro'
       or u.user_id = au.id
  );

-- 2) Helpful votes for professor reviews
create table if not exists public.recenzii_utile (
  id bigint generated always as identity primary key,
  review_id bigint not null references public.recenzii_profesori(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (review_id, user_id)
);

alter table public.recenzii_utile enable row level security;

-- Recreate to avoid duplicate/conflicting policy sets.
drop policy if exists rls_read on public.recenzii_utile;
drop policy if exists rls_insert on public.recenzii_utile;
drop policy if exists rls_delete on public.recenzii_utile;
drop policy if exists "Allow read all helpful votes" on public.recenzii_utile;
drop policy if exists "Allow insert own helpful votes" on public.recenzii_utile;
drop policy if exists "Allow delete own helpful votes" on public.recenzii_utile;

create policy rls_read on public.recenzii_utile
  for select using (true);

create policy rls_insert on public.recenzii_utile
  for insert with check (auth.uid() = user_id);

create policy rls_delete on public.recenzii_utile
  for delete using (auth.uid() = user_id);

-- 3) Bug reports table (supports both naming styles used in app fallbacks)
create table if not exists public.raportari (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  type text,
  tip text,
  page text,
  pagina text,
  severity text,
  severitate text,
  description text,
  descriere text,
  status text default 'nou',
  created_at timestamp with time zone default now()
);

-- Ensure existing tables are upgraded to expected schema.
alter table public.raportari add column if not exists user_id uuid;
alter table public.raportari add column if not exists email text;
alter table public.raportari add column if not exists type text;
alter table public.raportari add column if not exists tip text;
alter table public.raportari add column if not exists page text;
alter table public.raportari add column if not exists pagina text;
alter table public.raportari add column if not exists severity text;
alter table public.raportari add column if not exists severitate text;
alter table public.raportari add column if not exists description text;
alter table public.raportari add column if not exists descriere text;
alter table public.raportari add column if not exists status text default 'nou';
alter table public.raportari add column if not exists created_at timestamp with time zone default now();

alter table public.raportari enable row level security;

-- 4) Notifications table (supports both naming styles used in app fallbacks)
create table if not exists public.notificari (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  type text,
  tip text,
  title text,
  titlu text,
  message text,
  descriere text,
  status text default 'nou',
  created_at timestamp with time zone default now()
);

-- Ensure existing tables are upgraded to expected schema.
alter table public.notificari add column if not exists user_id uuid;
alter table public.notificari add column if not exists email text;
alter table public.notificari add column if not exists type text;
alter table public.notificari add column if not exists tip text;
alter table public.notificari add column if not exists title text;
alter table public.notificari add column if not exists titlu text;
alter table public.notificari add column if not exists message text;
alter table public.notificari add column if not exists descriere text;
alter table public.notificari add column if not exists status text default 'nou';
alter table public.notificari add column if not exists created_at timestamp with time zone default now();

alter table public.notificari enable row level security;

-- 5) Admin helper used in policies
create or replace function public.current_is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.utilizatori u
    where u.user_id = auth.uid()
      and lower(coalesce(u.role, 'student')) = 'admin'
  );
$$;

-- 6) Documents table and RLS/storage policies for professor uploads
create table if not exists public.documente (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  profesor_id uuid,
  professor_id uuid,
  nume_profesor text,
  professor_name text,
  email text,
  author_email text,
  title text,
  titlu text,
  description text,
  descriere text,
  subject text,
  materie text,
  type text,
  tip_document text,
  file_url text,
  url_fisier text,
  file_name text,
  storage_bucket text,
  storage_path text,
  department text,
  departament text,
  year text,
  status text default 'activ',
  created_at timestamp with time zone default now()
);

alter table public.documente add column if not exists user_id uuid;
alter table public.documente add column if not exists profesor_id uuid;
alter table public.documente add column if not exists professor_id uuid;
alter table public.documente add column if not exists nume_profesor text;
alter table public.documente add column if not exists professor_name text;
alter table public.documente add column if not exists email text;
alter table public.documente add column if not exists author_email text;
alter table public.documente add column if not exists title text;
alter table public.documente add column if not exists titlu text;
alter table public.documente add column if not exists description text;
alter table public.documente add column if not exists descriere text;
alter table public.documente add column if not exists subject text;
alter table public.documente add column if not exists materie text;
alter table public.documente add column if not exists type text;
alter table public.documente add column if not exists tip_document text;
alter table public.documente add column if not exists file_url text;
alter table public.documente add column if not exists url_fisier text;
alter table public.documente add column if not exists file_name text;
alter table public.documente add column if not exists storage_bucket text;
alter table public.documente add column if not exists storage_path text;
alter table public.documente add column if not exists department text;
alter table public.documente add column if not exists departament text;
alter table public.documente add column if not exists year text;
alter table public.documente add column if not exists status text default 'activ';
alter table public.documente add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_documente_user_id on public.documente(user_id);
create index if not exists idx_documente_created_at on public.documente(created_at desc);

alter table public.documente enable row level security;

drop policy if exists rls_read on public.documente;
drop policy if exists rls_insert on public.documente;
drop policy if exists rls_update on public.documente;
drop policy if exists rls_delete on public.documente;
drop policy if exists "Public read documents" on public.documente;
drop policy if exists "Authenticated insert documents" on public.documente;
drop policy if exists "Owner update documents" on public.documente;
drop policy if exists "Owner delete documents" on public.documente;

create policy rls_read on public.documente
  for select using (true);

create policy rls_insert on public.documente
  for insert with check (
    public.current_is_admin()
    or auth.uid() = user_id
    or user_id is null
  );

create policy rls_update on public.documente
  for update using (
    public.current_is_admin()
    or auth.uid() = user_id
  )
  with check (
    public.current_is_admin()
    or auth.uid() = user_id
  );

create policy rls_delete on public.documente
  for delete using (
    public.current_is_admin()
    or auth.uid() = user_id
  );

insert into storage.buckets (id, name, public, file_size_limit)
values ('documente', 'documente', true, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Public read documente bucket" on storage.objects;
drop policy if exists "Authenticated upload documente bucket" on storage.objects;
drop policy if exists "Owner update documente bucket" on storage.objects;
drop policy if exists "Owner delete documente bucket" on storage.objects;

create policy "Public read documente bucket"
on storage.objects
for select
using (bucket_id = 'documente');

create policy "Authenticated upload documente bucket"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documente');

create policy "Owner update documente bucket"
on storage.objects
for update
to authenticated
using (bucket_id = 'documente' and owner = auth.uid())
with check (bucket_id = 'documente' and owner = auth.uid());

create policy "Owner delete documente bucket"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documente' and owner = auth.uid());

-- 7) RLS policies for raportari
-- Drop old/duplicate policies to keep behavior predictable.
drop policy if exists rls_read on public.raportari;
drop policy if exists rls_insert on public.raportari;
drop policy if exists rls_update on public.raportari;
drop policy if exists rls_delete on public.raportari;
drop policy if exists "Public Read" on public.raportari;
drop policy if exists "Auth Insert" on public.raportari;
drop policy if exists "Owner Update" on public.raportari;
drop policy if exists "Owner Delete" on public.raportari;

create policy rls_read on public.raportari
  for select using (true);

create policy rls_insert on public.raportari
  for insert with check (true);

create policy rls_update on public.raportari
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.raportari
  for delete using (auth.uid() = user_id or public.current_is_admin());

-- 8) RLS policies for notificari
drop policy if exists rls_read on public.notificari;
drop policy if exists rls_insert on public.notificari;
drop policy if exists rls_update on public.notificari;
drop policy if exists rls_delete on public.notificari;
drop policy if exists "Public Read" on public.notificari;
drop policy if exists "Auth Insert" on public.notificari;
drop policy if exists "Owner Update" on public.notificari;
drop policy if exists "Owner Delete" on public.notificari;

create policy rls_read on public.notificari
  for select using (true);

create policy rls_insert on public.notificari
  for insert with check (true);

create policy rls_update on public.notificari
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.notificari
  for delete using (auth.uid() = user_id or public.current_is_admin());

commit;

-- Optional verification queries (run separately):
-- select email, role, user_id from public.utilizatori where lower(email) = 'admin@ulbstudent.ro';
-- select tablename, policyname from pg_policies where schemaname='public' and tablename in ('raportari','notificari','recenzii_utile');
