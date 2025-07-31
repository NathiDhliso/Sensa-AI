-- Quick fix: Create mindmap_results table
CREATE TABLE IF NOT EXISTS mindmap_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  result_data jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_mindmap_results_job_id ON mindmap_results(job_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_user_id ON mindmap_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_status ON mindmap_results(status);

-- Enable RLS
ALTER TABLE mindmap_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own mindmap results"
  ON mindmap_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service can insert mindmap results"
  ON mindmap_results
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update mindmap results"
  ON mindmap_results
  FOR UPDATE
  TO authenticated
  USING (true);