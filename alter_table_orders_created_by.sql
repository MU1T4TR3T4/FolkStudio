-- Add created_by column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Ensure status_logs has the correct structure (if not already present)
CREATE TABLE IF NOT EXISTS status_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by TEXT, -- Stores user name or ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
