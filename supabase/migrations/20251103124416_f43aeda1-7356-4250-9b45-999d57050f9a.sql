-- Add category enum type
CREATE TYPE video_category AS ENUM ('عربي', 'English', 'علوم حياتية', 'كيمياء', 'علوم ارض', 'رياضيات');

-- Add category column to videos table
ALTER TABLE videos ADD COLUMN category video_category NOT NULL DEFAULT 'عربي';