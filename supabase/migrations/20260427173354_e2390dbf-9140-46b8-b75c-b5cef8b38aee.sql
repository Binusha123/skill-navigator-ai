ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS qtype text NOT NULL DEFAULT 'short',
  ADD COLUMN IF NOT EXISTS options jsonb,
  ADD COLUMN IF NOT EXISTS correct_answer text,
  ADD COLUMN IF NOT EXISTS source_url text;