-- ULBStudent poll schema migration
-- Safe add-on: creates real poll storage without dropping existing tables.
-- Run this after SUPABASE_PRODUCTION_SETUP.sql.

begin;

create extension if not exists pgcrypto;

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id bigint references public.posts(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  question text not null check (length(trim(question)) >= 3),
  allow_multiple_answers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null check (length(trim(option_text)) > 0),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  selected_option_ids uuid[] not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id),
  constraint chk_poll_votes_has_selection check (cardinality(selected_option_ids) > 0)
);

create unique index if not exists ux_poll_options_poll_position on public.poll_options(poll_id, position);
create index if not exists idx_polls_post_id on public.polls(post_id);
create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_poll_votes_poll_id on public.poll_votes(poll_id);
create index if not exists idx_poll_votes_voter_id on public.poll_votes(voter_id);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "Public can read polls" on public.polls;
create policy "Public can read polls"
  on public.polls
  for select
  using (true);

drop policy if exists "Authenticated users can create polls" on public.polls;
create policy "Authenticated users can create polls"
  on public.polls
  for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors can update their polls" on public.polls;
create policy "Authors can update their polls"
  on public.polls
  for update
  using (auth.uid() = author_id or public.current_is_admin())
  with check (auth.uid() = author_id or public.current_is_admin());

drop policy if exists "Authors can delete their polls" on public.polls;
create policy "Authors can delete their polls"
  on public.polls
  for delete
  using (auth.uid() = author_id or public.current_is_admin());

drop policy if exists "Public can read poll options" on public.poll_options;
create policy "Public can read poll options"
  on public.poll_options
  for select
  using (true);

drop policy if exists "Authenticated users can manage poll options they own" on public.poll_options;
create policy "Authenticated users can manage poll options they own"
  on public.poll_options
  for all
  using (
    exists (
      select 1
      from public.polls p
      where p.id = poll_options.poll_id
        and (p.author_id = auth.uid() or public.current_is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.polls p
      where p.id = poll_options.poll_id
        and (p.author_id = auth.uid() or public.current_is_admin())
    )
  );

drop policy if exists "Authenticated users can vote" on public.poll_votes;
create policy "Authenticated users can vote"
  on public.poll_votes
  for insert
  with check (auth.uid() = voter_id);

drop policy if exists "Users can read poll votes" on public.poll_votes;
create policy "Users can read poll votes"
  on public.poll_votes
  for select
  using (true);

drop policy if exists "Users can delete their poll votes" on public.poll_votes;
create policy "Users can delete their poll votes"
  on public.poll_votes
  for delete
  using (auth.uid() = voter_id or public.current_is_admin());

create or replace function public.set_poll_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_poll_updated_at on public.polls;
create trigger trg_set_poll_updated_at
before update on public.polls
for each row
execute function public.set_poll_updated_at();

create or replace function public.validate_poll_vote()
returns trigger
language plpgsql
as $$
declare
  allow_multiple boolean;
  selected_count integer;
  distinct_selected_count integer;
  matching_options_count integer;
begin
  select p.allow_multiple_answers
    into allow_multiple
    from public.polls p
    where p.id = new.poll_id;

  if allow_multiple is null then
    raise exception 'Sondajul nu există.';
  end if;

  selected_count := cardinality(new.selected_option_ids);

  if selected_count is null or selected_count < 1 then
    raise exception 'Alege cel puțin o opțiune.';
  end if;

  select count(distinct option_id)
    into distinct_selected_count
    from unnest(new.selected_option_ids) as option_id;

  if distinct_selected_count <> selected_count then
    raise exception 'Opțiunile duplicate nu sunt permise.';
  end if;

  if allow_multiple = false and selected_count <> 1 then
    raise exception 'Acest sondaj permite un singur răspuns.';
  end if;

  select count(*)
    into matching_options_count
    from public.poll_options po
    where po.poll_id = new.poll_id
      and po.id = any(new.selected_option_ids);

  if matching_options_count <> selected_count then
    raise exception 'Una dintre opțiuni nu aparține sondajului.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_poll_vote on public.poll_votes;
create trigger trg_validate_poll_vote
before insert or update on public.poll_votes
for each row
execute function public.validate_poll_vote();

commit;
