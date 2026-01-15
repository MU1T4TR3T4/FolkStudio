-- Migration to support Unified Kanban Board V2
-- Run this in your Supabase SQL Editor

-- 1. Add kanban_stage column (Text to allow flexibility)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS kanban_stage TEXT DEFAULT 'waiting_confirmation';

-- 2. Add support columns for the workflow
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS photolith_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photolith_url TEXT,
ADD COLUMN IF NOT EXISTS checklist_photolith JSONB,
ADD COLUMN IF NOT EXISTS checklist_arrival JSONB,
ADD COLUMN IF NOT EXISTS checklist_customization JSONB,
ADD COLUMN IF NOT EXISTS final_product_url TEXT,
ADD COLUMN IF NOT EXISTS client_signature_url TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS observations TEXT;

-- 3. Optional: Create an index on kanban_stage for faster filtering
-- CREATE INDEX IF NOT EXISTS idx_orders_kanban_stage ON orders(kanban_stage);

-- 4. Verify status column constraint (Soft check, usually 'pending', 'active', 'completed', 'cancelled', 'returned')
-- If you need to add 'returned' to the status check constraint, you might need to drop and re-add it.
-- Example (Only run if you get constraint violations on 'returned' status):
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'returned'));
