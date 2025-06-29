-- SmartCart Core Data Models Migration
-- Creates retailers, shopping_trips, trip_items, and price_history tables

-- 1. Retailers table (user-created stores)
CREATE TABLE IF NOT EXISTS retailers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_retailer_per_user UNIQUE(user_id, name)
);

-- 2. Shopping trips table
CREATE TABLE IF NOT EXISTS shopping_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  retailer_id UUID REFERENCES retailers(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('planned', 'active', 'completed', 'archived')) DEFAULT 'planned',
  estimated_total DECIMAL(10,2) DEFAULT 0,
  actual_total DECIMAL(10,2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Trip items table
CREATE TABLE IF NOT EXISTS trip_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES shopping_trips(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Price history table (for intelligence system)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES shopping_trips(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can manage their own retailers" ON retailers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own trips" ON shopping_trips
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items from their own trips" ON trip_items
  FOR ALL USING (auth.uid() = (SELECT user_id FROM shopping_trips WHERE id = trip_id));

CREATE POLICY "Users can manage their own price history" ON price_history
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_retailers_user_id ON retailers(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_trips_user_id ON shopping_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_trips_status ON shopping_trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_items_trip_id ON trip_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_price_history_user_item ON price_history(user_id, item_name);
CREATE INDEX IF NOT EXISTS idx_price_history_retailer ON price_history(retailer_id, item_name);

-- Updated_at trigger function (reuse existing one)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to new tables
CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON retailers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_trips_updated_at BEFORE UPDATE ON shopping_trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trip_items_updated_at BEFORE UPDATE ON trip_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update trip totals when items change
CREATE OR REPLACE FUNCTION update_trip_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update estimated total
  UPDATE shopping_trips 
  SET estimated_total = (
    SELECT COALESCE(SUM(quantity * COALESCE(estimated_price, 0)), 0)
    FROM trip_items 
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
  )
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  -- Update actual total
  UPDATE shopping_trips 
  SET actual_total = (
    SELECT COALESCE(SUM(quantity * COALESCE(actual_price, 0)), 0)
    FROM trip_items 
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
  )
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to automatically update trip totals
CREATE TRIGGER update_trip_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trip_items
  FOR EACH ROW EXECUTE FUNCTION update_trip_totals();

-- Function to record price history when actual prices are updated
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record when actual_price changes from NULL to a value or changes to a different value
  IF (OLD.actual_price IS NULL AND NEW.actual_price IS NOT NULL) OR 
     (OLD.actual_price IS NOT NULL AND NEW.actual_price IS NOT NULL AND OLD.actual_price != NEW.actual_price) THEN
    
    INSERT INTO price_history (user_id, item_name, price, retailer_id, trip_id, date)
    SELECT 
      st.user_id,
      NEW.item_name,
      NEW.actual_price,
      st.retailer_id,
      NEW.trip_id,
      st.date
    FROM shopping_trips st
    WHERE st.id = NEW.trip_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically record price history
CREATE TRIGGER record_price_history_trigger
  AFTER UPDATE ON trip_items
  FOR EACH ROW EXECUTE FUNCTION record_price_history();