-- Update user profile creation to use preferred currency from registration
-- This migration updates the create_user_profile function to use the currency
-- passed during registration from user metadata

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  preferred_currency TEXT := 'USD'; -- Default fallback
BEGIN
  -- Extract preferred currency from user metadata if available
  IF NEW.raw_user_meta_data ? 'preferred_currency' THEN
    preferred_currency := NEW.raw_user_meta_data ->> 'preferred_currency';
  END IF;

  -- Validate currency is one of the supported options
  IF preferred_currency NOT IN ('USD', 'EUR', 'GBP', 'CAD', 'UGX') THEN
    preferred_currency := 'USD';
  END IF;

  INSERT INTO user_profiles (user_id, preferences)
  VALUES (
    NEW.id,
    json_build_object(
      'notifications_enabled', true,
      'dark_mode', false,
      'default_currency', preferred_currency
    )::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the function comment
COMMENT ON FUNCTION create_user_profile() IS 'Creates user profile with currency preference from registration. Supported currencies: USD, EUR, GBP, CAD, UGX';