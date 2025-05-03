
-- Reminders table for WhatsApp reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  time JSONB NOT NULL, -- { hour: number, minute: number }
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'once')),
  week_days TEXT[] NULL, -- for weekly frequency
  month_day INTEGER NULL, -- for monthly frequency
  date TIMESTAMPTZ NULL, -- for once frequency
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS reminders_is_active_idx ON reminders (is_active);
CREATE INDEX IF NOT EXISTS reminders_frequency_idx ON reminders (frequency);

-- Function to transform the reminders table to match our TypeScript types
CREATE OR REPLACE FUNCTION transform_reminder() RETURNS TRIGGER AS $$
BEGIN
  -- Convert snake_case database columns to camelCase for TypeScript
  NEW.contactName := NEW.contact_name;
  NEW.phoneNumber := NEW.phone_number;
  NEW.weekDays := NEW.week_days;
  NEW.monthDay := NEW.month_day;
  NEW.isActive := NEW.is_active;
  NEW.lastTriggered := NEW.last_triggered;
  
  -- Remove the snake_case columns from the JSON response
  NEW.contact_name := NULL;
  NEW.phone_number := NULL;
  NEW.week_days := NULL;
  NEW.month_day := NULL;
  NEW.is_active := NULL;
  NEW.last_triggered := NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the transform function
DROP TRIGGER IF EXISTS transform_reminder_trigger ON reminders;
CREATE TRIGGER transform_reminder_trigger
  AFTER SELECT
  ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION transform_reminder();
