-- Task Board Schema
-- Run this in Supabase SQL Editor

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee text not null,
  deadline date,
  status text not null default 'active' check (status in ('active', 'done')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  title text not null,
  is_done boolean default false,
  created_at timestamptz default now()
);

-- Enable realtime for both tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table subtasks;
