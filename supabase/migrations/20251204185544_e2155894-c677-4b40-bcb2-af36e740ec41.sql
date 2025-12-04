-- Create table to track daily AI assistant usage per user
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT (now()::date),
  question_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_usage_user_date_unique UNIQUE (user_id, usage_date)
);

-- Enable Row Level Security
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies so users can only manage their own usage rows
CREATE POLICY "Users can view own ai usage"
ON public.ai_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai usage"
ON public.ai_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai usage"
ON public.ai_usage
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai usage"
ON public.ai_usage
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to keep updated_at in sync
CREATE TRIGGER update_ai_usage_updated_at
BEFORE UPDATE ON public.ai_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();