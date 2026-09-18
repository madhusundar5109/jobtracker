-- JobTrack schema for Supabase (Postgres).
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Each entity uses a flexible jsonb "payload" column so the app's fields can
-- evolve without a migration every time; user_id + RLS keep everyone's data
-- private to their own account.

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array['jobs','applications','outreach','contacts','interviews','resumes','companies','templates']
  loop
    execute format($f$
      create table if not exists %I (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('create index if not exists %I on %I (user_id);', t || '_user_id_idx', t);

    execute format('drop trigger if exists set_updated_at on %I;', t);
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at();', t);

    execute format('alter table %I enable row level security;', t);

    execute format('drop policy if exists "Users manage their own rows" on %I;', t);
    execute format($f$
      create policy "Users manage their own rows" on %I
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- Enable Realtime (so phone + laptop stay in sync) for every table above.
-- If this errors because the publication already includes a table, that's fine.
do $$
declare
  t text;
begin
  foreach t in array array['jobs','applications','outreach','contacts','interviews','resumes','companies','templates']
  loop
    begin
      execute format('alter publication supabase_realtime add table %I;', t);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;
