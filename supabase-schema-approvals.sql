-- Add approval fields to client_stamps table if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'client_stamps' and column_name = 'approval_token') then
        alter table client_stamps add column approval_token uuid default gen_random_uuid() unique;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'client_stamps' and column_name = 'approval_status') then
        alter table client_stamps add column approval_status text default 'pending' check (approval_status in ('pending', 'approved', 'rejected'));
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'client_stamps' and column_name = 'approval_signature') then
        alter table client_stamps add column approval_signature text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'client_stamps' and column_name = 'approved_at') then
        alter table client_stamps add column approved_at timestamp with time zone;
    end if;
end $$;

-- Enable RLS for these new columns if needed (assuming policy covers all rows)
-- No new policies needed if "Enable all access" is used
