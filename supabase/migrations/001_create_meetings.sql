create table meetings (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  purpose text not null,
  candidates jsonb not null,
  confirmed_index integer,
  confirmed_at timestamptz,
  created_at timestamptz default now() not null
);
