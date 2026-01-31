-- ============================================
-- COMPLETE Migration: Add ALL missing columns to trades table
-- Run this SQL to fix ALL column errors
-- ============================================

-- 1. Add opened_at column (เวลาเปิดออเดอร์)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;

-- 2. Add closed_at column (เวลาปิดออเดอร์)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- 3. Extend pair column to 50 characters (for custom pairs)
ALTER TABLE trades 
ALTER COLUMN pair TYPE VARCHAR(50);

-- 4. Set default value for existing rows
UPDATE trades SET opened_at = created_at WHERE opened_at IS NULL;

-- 5. Verify all columns exist
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'trades' 
ORDER BY ordinal_position;

-- ============================================
-- IMPORTANT: After running this migration:
-- 1. Restart the backend server
-- 2. Try saving a trade again
-- ============================================
