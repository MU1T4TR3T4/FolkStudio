-- Update Users Table to support 'admin' role

-- 1. If role is an ENUM type (e.g., "user_role"), add 'admin' value
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
    END IF;
END$$;

-- 2. If role is protected by a CHECK constraint, drop and recreate it
-- Note: You might need to adjust the constraint name if it differs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_role_check' AND table_name = 'users') THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('vendedor', 'equipe', 'admin'));
    END IF;
END$$;

-- 3. Just in case role is just text and we want to ensure no bad data, (optional, usually not needed if no constraint exists)
-- This ensures the column comment reflects the new role
COMMENT ON COLUMN users.role IS 'Roles: vendedor, equipe, admin';
