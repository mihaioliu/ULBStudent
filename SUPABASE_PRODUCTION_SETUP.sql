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

-- 2) Professor reviews table (supports mixed naming used by app fallbacks)
create table if not exists public.recenzii_profesori (
  id bigint generated always as identity primary key,
  id_profesor bigint,
  profesor_id uuid,
  professor_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  rating numeric(2,1) not null check (rating >= 1 and rating <= 5),
  comentariu text,
  comment text,
  review_text text,
  title text,
  professor_name text,
  materie text,
  subject text,
  email text,
  created_at timestamp with time zone default now()
);

alter table public.recenzii_profesori add column if not exists id_profesor bigint;
alter table public.recenzii_profesori add column if not exists profesor_id uuid;
alter table public.recenzii_profesori add column if not exists professor_id uuid;
alter table public.recenzii_profesori add column if not exists user_id uuid;
alter table public.recenzii_profesori add column if not exists rating numeric(2,1);
alter table public.recenzii_profesori add column if not exists comentariu text;
alter table public.recenzii_profesori add column if not exists comment text;
alter table public.recenzii_profesori add column if not exists review_text text;
alter table public.recenzii_profesori add column if not exists title text;
alter table public.recenzii_profesori add column if not exists professor_name text;
alter table public.recenzii_profesori add column if not exists materie text;
alter table public.recenzii_profesori add column if not exists subject text;
alter table public.recenzii_profesori add column if not exists email text;
alter table public.recenzii_profesori add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_recenzii_profesori_created_at on public.recenzii_profesori(created_at desc);
create index if not exists idx_recenzii_profesori_id_profesor on public.recenzii_profesori(id_profesor);
create index if not exists idx_recenzii_profesori_profesor_id on public.recenzii_profesori(profesor_id);
create index if not exists idx_recenzii_profesori_professor_id on public.recenzii_profesori(professor_id);

alter table public.recenzii_profesori enable row level security;

drop policy if exists rls_read on public.recenzii_profesori;
drop policy if exists rls_insert on public.recenzii_profesori;
drop policy if exists rls_update on public.recenzii_profesori;
drop policy if exists rls_delete on public.recenzii_profesori;

create policy rls_read on public.recenzii_profesori
  for select using (true);

create policy rls_insert on public.recenzii_profesori
  for insert with check (auth.role() = 'authenticated');

create policy rls_update on public.recenzii_profesori
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy rls_delete on public.recenzii_profesori
  for delete using (auth.uid() = user_id);

-- 3) Helpful votes for professor reviews
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

-- 4) Bug reports table (supports both naming styles used in app fallbacks)
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

-- 5) Notifications table (supports both naming styles used in app fallbacks)
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

-- 6) Admin helper used in policies
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

-- 7) Documents table and RLS/storage policies for professor uploads
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

-- 8) RLS policies for raportari
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

-- 9) RLS policies for notificari
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

-- 10) Core community tables + RLS (questions/posts/comments)
create table if not exists public.questions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  upvotes integer default 0,
  created_at timestamp with time zone default now()
);

alter table public.questions add column if not exists user_id uuid;
alter table public.questions add column if not exists title text;
alter table public.questions add column if not exists description text;
alter table public.questions add column if not exists upvotes integer default 0;
alter table public.questions add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_questions_user_id on public.questions(user_id);
create index if not exists idx_questions_created_at on public.questions(created_at desc);

alter table public.questions enable row level security;

drop policy if exists rls_read on public.questions;
drop policy if exists rls_insert on public.questions;
drop policy if exists rls_update on public.questions;
drop policy if exists rls_delete on public.questions;

create policy rls_read on public.questions
  for select using (true);

create policy rls_insert on public.questions
  for insert with check (auth.uid() = user_id);

create policy rls_update on public.questions
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.questions
  for delete using (auth.uid() = user_id or public.current_is_admin());

create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  content text not null,
  votes integer default 0,
  created_at timestamp with time zone default now()
);

alter table public.posts add column if not exists user_id uuid;
alter table public.posts add column if not exists title text;
alter table public.posts add column if not exists content text;
alter table public.posts add column if not exists votes integer default 0;
alter table public.posts add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);

alter table public.posts enable row level security;

drop policy if exists rls_read on public.posts;
drop policy if exists rls_insert on public.posts;
drop policy if exists rls_update on public.posts;
drop policy if exists rls_delete on public.posts;

create policy rls_read on public.posts
  for select using (true);

create policy rls_insert on public.posts
  for insert with check (auth.uid() = user_id);

create policy rls_update on public.posts
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.posts
  for delete using (auth.uid() = user_id or public.current_is_admin());

create table if not exists public.postari_forum (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  content text not null,
  votes integer default 0,
  created_at timestamp with time zone default now()
);

alter table public.postari_forum add column if not exists user_id uuid;
alter table public.postari_forum add column if not exists title text;
alter table public.postari_forum add column if not exists content text;
alter table public.postari_forum add column if not exists votes integer default 0;
alter table public.postari_forum add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_postari_forum_user_id on public.postari_forum(user_id);
create index if not exists idx_postari_forum_created_at on public.postari_forum(created_at desc);

alter table public.postari_forum enable row level security;

drop policy if exists rls_read on public.postari_forum;
drop policy if exists rls_insert on public.postari_forum;
drop policy if exists rls_update on public.postari_forum;
drop policy if exists rls_delete on public.postari_forum;

create policy rls_read on public.postari_forum
  for select using (true);

create policy rls_insert on public.postari_forum
  for insert with check (auth.uid() = user_id);

create policy rls_update on public.postari_forum
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.postari_forum
  for delete using (auth.uid() = user_id or public.current_is_admin());

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint,
  id_post bigint,
  user_id uuid references auth.users(id) on delete set null,
  name text,
  nume text,
  email text,
  content text,
  comentariu text,
  created_at timestamp with time zone default now()
);

alter table public.comments add column if not exists post_id bigint;
alter table public.comments add column if not exists id_post bigint;
alter table public.comments add column if not exists user_id uuid;
alter table public.comments add column if not exists name text;
alter table public.comments add column if not exists nume text;
alter table public.comments add column if not exists email text;
alter table public.comments add column if not exists content text;
alter table public.comments add column if not exists comentariu text;
alter table public.comments add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_id_post on public.comments(id_post);
create index if not exists idx_comments_created_at on public.comments(created_at desc);

alter table public.comments enable row level security;

drop policy if exists rls_read on public.comments;
drop policy if exists rls_insert on public.comments;
drop policy if exists rls_update on public.comments;
drop policy if exists rls_delete on public.comments;

create policy rls_read on public.comments
  for select using (true);

create policy rls_insert on public.comments
  for insert with check (auth.uid() = user_id or user_id is null);

create policy rls_update on public.comments
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.comments
  for delete using (auth.uid() = user_id or public.current_is_admin());

create table if not exists public.comentarii (
  id bigint generated always as identity primary key,
  post_id bigint,
  id_post bigint,
  user_id uuid references auth.users(id) on delete set null,
  name text,
  nume text,
  email text,
  content text,
  comentariu text,
  created_at timestamp with time zone default now()
);

alter table public.comentarii add column if not exists post_id bigint;
alter table public.comentarii add column if not exists id_post bigint;
alter table public.comentarii add column if not exists user_id uuid;
alter table public.comentarii add column if not exists name text;
alter table public.comentarii add column if not exists nume text;
alter table public.comentarii add column if not exists email text;
alter table public.comentarii add column if not exists content text;
alter table public.comentarii add column if not exists comentariu text;
alter table public.comentarii add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_comentarii_post_id on public.comentarii(post_id);
create index if not exists idx_comentarii_id_post on public.comentarii(id_post);
create index if not exists idx_comentarii_created_at on public.comentarii(created_at desc);

alter table public.comentarii enable row level security;

drop policy if exists rls_read on public.comentarii;
drop policy if exists rls_insert on public.comentarii;
drop policy if exists rls_update on public.comentarii;
drop policy if exists rls_delete on public.comentarii;

create policy rls_read on public.comentarii
  for select using (true);

create policy rls_insert on public.comentarii
  for insert with check (auth.uid() = user_id or user_id is null);

create policy rls_update on public.comentarii
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.comentarii
  for delete using (auth.uid() = user_id or public.current_is_admin());

create table if not exists public.voturi (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id bigint,
  question_id bigint,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint chk_voturi_target check (
    (post_id is not null and question_id is null)
    or (post_id is null and question_id is not null)
  )
);

create unique index if not exists ux_voturi_user_post on public.voturi(user_id, post_id) where post_id is not null;
create unique index if not exists ux_voturi_user_question on public.voturi(user_id, question_id) where question_id is not null;
create index if not exists idx_voturi_post_id on public.voturi(post_id);
create index if not exists idx_voturi_question_id on public.voturi(question_id);

alter table public.voturi enable row level security;

drop policy if exists rls_read on public.voturi;
drop policy if exists rls_insert on public.voturi;
drop policy if exists rls_update on public.voturi;
drop policy if exists rls_delete on public.voturi;

create policy rls_read on public.voturi
  for select using (true);

create policy rls_insert on public.voturi
  for insert with check (auth.uid() = user_id);

create policy rls_update on public.voturi
  for update using (auth.uid() = user_id or public.current_is_admin())
  with check (auth.uid() = user_id or public.current_is_admin());

create policy rls_delete on public.voturi
  for delete using (auth.uid() = user_id or public.current_is_admin());

commit;

-- Optional verification queries (run separately):
-- select email, role, user_id from public.utilizatori where lower(email) = 'admin@ulbstudent.ro';
-- select tablename, policyname from pg_policies where schemaname='public' and tablename in ('raportari','notificari','recenzii_utile');
