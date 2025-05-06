-- Create reminders table
CREATE TABLE IF NOT EXISTS "reminders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "contactName" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  message TEXT NOT NULL,
  frequency TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "lastTriggered" TIMESTAMP WITH TIME ZONE,
  time JSONB NOT NULL,
  "weekDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "monthDay" INTEGER,
  date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS "contacts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "lastUsed" TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create message_templates table
CREATE TABLE IF NOT EXISTS "message_templates" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create status_updates table for WhatsApp Status feature
CREATE TABLE IF NOT EXISTS "status_updates" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "lastUsed" TIMESTAMP WITH TIME ZONE
);

-- Create stickers table for WhatsApp Sticker feature
CREATE TABLE IF NOT EXISTS "stickers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  category TEXT NOT NULL,
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "lastUsed" TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "status_updates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stickers" ENABLE ROW LEVEL SECURITY;

-- Create policies for reminders table
CREATE POLICY "Enable read access for all users" ON "reminders"
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON "reminders"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON "reminders"
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON "reminders"
  FOR DELETE USING (true);

-- Create policies for contacts table
CREATE POLICY "Enable read access for all users" ON "contacts"
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON "contacts"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON "contacts"
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON "contacts"
  FOR DELETE USING (true);

-- Create policies for message_templates table
CREATE POLICY "Enable read access for all users" ON "message_templates"
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON "message_templates"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON "message_templates"
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON "message_templates"
  FOR DELETE USING (true);

-- Create policies for status_updates table
CREATE POLICY "Enable read access for all users" ON "status_updates"
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON "status_updates"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON "status_updates"
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON "status_updates"
  FOR DELETE USING (true);

-- Create policies for stickers table
CREATE POLICY "Enable read access for all users" ON "stickers"
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON "stickers"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON "stickers"
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON "stickers"
  FOR DELETE USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS reminders_frequency_idx ON "reminders" (frequency);
CREATE INDEX IF NOT EXISTS reminders_is_active_idx ON "reminders" ("isActive");
CREATE INDEX IF NOT EXISTS contacts_name_idx ON "contacts" (name);
CREATE INDEX IF NOT EXISTS contacts_phone_number_idx ON "contacts" ("phoneNumber");
CREATE INDEX IF NOT EXISTS status_updates_category_idx ON "status_updates" (category);
CREATE INDEX IF NOT EXISTS status_updates_favorite_idx ON "status_updates" (favorite);
CREATE INDEX IF NOT EXISTS stickers_category_idx ON "stickers" (category);
CREATE INDEX IF NOT EXISTS stickers_favorite_idx ON "stickers" (favorite); 