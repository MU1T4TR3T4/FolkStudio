-- 1. Ensure Critical Columns Exist (Matches Typescript Interface)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kanban_stage TEXT DEFAULT 'waiting_confirmation';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price NUMERIC;

-- 2. JSONB columns for Checklists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checklist_photolith JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checklist_arrival JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checklist_customization JSONB;

-- 3. Boolean/Status logs
ALTER TABLE orders ADD COLUMN IF NOT EXISTS photolith_status BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;

-- 6. Create Permissive Policies (Fixes Visibility Issue)
-- Allow ALL authenticated users (Workspace, Admin, Vendor) to SEE ALL orders
CREATE POLICY "Users can view all orders" 
ON orders FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to INSERT orders
CREATE POLICY "Users can insert orders" 
ON orders FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to UPDATE orders
CREATE POLICY "Users can update orders" 
ON orders FOR UPDATE 
USING (auth.role() = 'authenticated');
