create table custom_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  label text not null,
  source_note text not null,
  created_at timestamptz not null default now(),
  unique(user_id, label)
);

alter table custom_tags enable row level security;

create policy "select_own_custom_tags" on custom_tags for select
  to authenticated using (auth.uid() = user_id);

create policy "insert_own_custom_tags" on custom_tags for insert
  to authenticated with check (auth.uid() = user_id);
