-- Fix numeric field overflow: Change decimal(18,8) to decimal(24,8)
-- Run this SQL in your Neon.tech database console

ALTER TABLE trades 
  ALTER COLUMN entry_price TYPE DECIMAL(24,8),
  ALTER COLUMN exit_price TYPE DECIMAL(24,8),
  ALTER COLUMN stop_loss TYPE DECIMAL(24,8),
  ALTER COLUMN take_profit TYPE DECIMAL(24,8);

-- Verify changes
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND column_name IN ('entry_price', 'exit_price', 'stop_loss', 'take_profit');
