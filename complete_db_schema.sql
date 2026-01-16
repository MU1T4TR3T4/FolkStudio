-- Add missing columns to 'orders' table to prevent 400 Errors on Insert

-- 1. Identity & Foreign Keys
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by UUID; -- Can reference auth.users or public.users, keep loose for now if unsure
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id UUID;

-- 2. Customer Details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 3. Order Details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 4. Images & Design (Snake Case for DB)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image_url TEXT;      -- Front Image
ALTER TABLE orders ADD COLUMN IF NOT EXISTS back_image_url TEXT; -- Back Image
ALTER TABLE orders ADD COLUMN IF NOT EXISTS logo_front_url TEXT; 
ALTER TABLE orders ADD COLUMN IF NOT EXISTS logo_back_url TEXT; 
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 5. Design JSONB Objects (for canvas data)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_front JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_back JSONB;

-- 6. Additional Costs
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ad1 NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ad2 NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ad3 NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ad4 NUMERIC DEFAULT 0;

-- 7. Ensure RLS Policies are still correct (Idempotent)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public View" ON orders;
DROP POLICY IF EXISTS "Public Insert" ON orders;
DROP POLICY IF EXISTS "Public Update" ON orders;
DROP POLICY IF EXISTS "Public Delete" ON orders;

-- Re-apply purely public policies for this custom-auth app
CREATE POLICY "Public View" ON orders FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert" ON orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Update" ON orders FOR UPDATE TO public USING (true);
CREATE POLICY "Public Delete" ON orders FOR DELETE TO public USING (true);
