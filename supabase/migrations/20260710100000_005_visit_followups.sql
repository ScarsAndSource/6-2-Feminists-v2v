create table visit_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  pattern_report_id uuid references pattern_reports(id) on delete set null,
  mentioned_before boolean not null,
  outcome text check (outcome in ('dismissed','tested','treated','no_follow_up')),
  outcome_note text,
  visit_date date,
  created_at timestamptz not null default now()
);

alter table visit_followups enable row level security;

create policy "select_own_followups" on visit_followups for select
  to authenticated using (auth.uid() = user_id);

create policy "insert_own_followups" on visit_followups for insert
  to authenticated with check (auth.uid() = user_id);
