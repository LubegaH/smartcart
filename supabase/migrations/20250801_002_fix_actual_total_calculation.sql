-- Fix actual total calculation to fall back to estimated price when actual price is not set
-- This migration fixes the bug where items without actual_price contribute 0 to the total
-- instead of using their estimated_price as fallback

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_trip_totals_trigger ON trip_items;
DROP FUNCTION IF EXISTS update_trip_totals();

-- Create updated function with correct actual_total calculation
CREATE OR REPLACE FUNCTION update_trip_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update estimated total (unchanged)
  UPDATE shopping_trips 
  SET estimated_total = (
    SELECT COALESCE(SUM(quantity * COALESCE(estimated_price, 0)), 0)
    FROM trip_items 
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
  )
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  -- Update actual total with fallback logic:
  -- Use actual_price if available, otherwise fall back to estimated_price
  UPDATE shopping_trips 
  SET actual_total = (
    SELECT COALESCE(SUM(quantity * COALESCE(actual_price, estimated_price, 0)), 0)
    FROM trip_items 
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
  )
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_trip_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trip_items
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_totals();

-- Update existing trips with incorrect actual_total values
UPDATE shopping_trips 
SET actual_total = (
  SELECT COALESCE(SUM(quantity * COALESCE(actual_price, estimated_price, 0)), 0)
  FROM trip_items 
  WHERE trip_id = shopping_trips.id
)
WHERE actual_total != (
  SELECT COALESCE(SUM(quantity * COALESCE(actual_price, estimated_price, 0)), 0)
  FROM trip_items 
  WHERE trip_id = shopping_trips.id
);

-- Add comment documenting the fix
COMMENT ON FUNCTION update_trip_totals() IS 'Updates trip totals. Actual total uses actual_price if available, otherwise falls back to estimated_price.';