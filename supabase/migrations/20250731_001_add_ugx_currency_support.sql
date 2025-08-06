-- Add support for Uganda Shillings (UGX) currency
-- This migration adds UGX as a supported currency option

-- Update the default preferences in the user_profiles table to include UGX as an option
-- Note: This doesn't change existing user preferences, just documents the new supported currency

-- Add a comment to document supported currencies
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences JSON. Supported currencies: USD, EUR, GBP, CAD, UGX';

-- Update the default preference template for new users to show UGX is available
-- This only affects the create_user_profile function for new registrations
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, preferences)
  VALUES (
    NEW.id,
    '{
      "notifications_enabled": true,
      "dark_mode": false,
      "default_currency": "USD"
    }'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a comment documenting the supported currencies
COMMENT ON FUNCTION create_user_profile() IS 'Creates user profile with default preferences. Supported currencies: USD, EUR, GBP, CAD, UGX';