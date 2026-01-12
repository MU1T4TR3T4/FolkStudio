-- Create a table to link clients with stamps and designs
create table if not exists client_stamps (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  stamp_id uuid references stamps(id) on delete cascade,
  design_id uuid references designs(id) on delete cascade,
  type text not null check (type in ('stamp', 'design')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Approval flow columns
  approval_token text unique,
  approval_status text check (approval_status in ('pending', 'approved', 'rejected')),
  approval_signature text,
  approved_at timestamp with time zone
);

-- Add indexes for performance
create index if not exists idx_client_stamps_client on client_stamps(client_id);
create index if not exists idx_client_stamps_token on client_stamps(approval_token);

-- RLS Policies (Enable RLS if you have it enabled on other tables)
alter table client_stamps enable row level security;

create policy "Enable all access for all users" on client_stamps
for all using (true) with check (true);
