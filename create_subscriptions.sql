-- Create the subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.subscriptions enable row level security;

-- Allow anyone (including anonymous users) to insert/subscribe
create policy "Enable insert for all users" on public.subscriptions
  for insert with check (true);

-- Only allow authenticated users (like admins) to view the subscriptions
create policy "Enable read access for authenticated users" on public.subscriptions
  for select using (auth.role() = 'authenticated');
