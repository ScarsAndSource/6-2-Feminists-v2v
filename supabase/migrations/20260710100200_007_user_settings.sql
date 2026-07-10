create table user_settings (
  user_id uuid primary key default auth.uid() references auth.users(id),
  next_appointment_at date,
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "select_own_settings" on user_settings for select
  to authenticated using (auth.uid() = user_id);

create policy "insert_own_settings" on user_settings for insert
  to authenticated with check (auth.uid() = user_id);

create policy "update_own_settings" on user_settings for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
