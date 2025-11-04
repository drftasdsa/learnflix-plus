-- Drop the old video_category type
DROP TYPE IF EXISTS video_category CASCADE;

-- Create new video_category enum without علوم ارض
CREATE TYPE video_category AS ENUM ('عربي', 'English', 'علوم حياتية', 'كيمياء', 'رياضيات');

-- Add category column back to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS category video_category NOT NULL DEFAULT 'عربي'::video_category;