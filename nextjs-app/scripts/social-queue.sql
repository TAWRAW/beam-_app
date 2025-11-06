-- SQL script to create the social_queue table for social media publishing queue
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Create the social_queue table
CREATE TABLE IF NOT EXISTS social_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  article_excerpt TEXT,
  article_image_url TEXT,
  article_category TEXT,
  article_tags TEXT[],
  platforms TEXT[] NOT NULL,
  custom_message TEXT,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_social_queue_status ON social_queue(status);
CREATE INDEX IF NOT EXISTS idx_social_queue_scheduled ON social_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_queue_article ON social_queue(article_id);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER social_queue_updated_at_trigger
BEFORE UPDATE ON social_queue
FOR EACH ROW
EXECUTE FUNCTION update_social_queue_updated_at();

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Table social_queue created successfully!';
  RAISE NOTICE 'Indexes created: idx_social_queue_status, idx_social_queue_scheduled, idx_social_queue_article';
  RAISE NOTICE 'Trigger created: social_queue_updated_at_trigger';
END $$;
