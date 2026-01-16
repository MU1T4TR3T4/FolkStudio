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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_token TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_signature_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders; -- Added missing drop
DROP POLICY IF EXISTS "Users can update orders" ON orders;
DROP POLICY IF EXISTS "Users can delete orders" ON orders; -- Added missing drop

-- 6. Create Permissive Policies (Fixes Visibility Issue)
-- Allow ALL users (public) to SEE ALL orders because we handle auth in the app
CREATE POLICY "Users can view all orders" 
ON orders FOR SELECT 
TO public
USING (true);

-- Allow public to INSERT orders (Auth is handled by App Logic)
CREATE POLICY "Users can insert orders" 
ON orders FOR INSERT 
TO public
WITH CHECK (true);

-- Allow public to UPDATE orders
CREATE POLICY "Users can update orders" 
ON orders FOR UPDATE 
TO public
USING (true);

-- Allow public to DELETE orders
CREATE POLICY "Users can delete orders" 
ON orders FOR DELETE 
TO public
USING (true);
