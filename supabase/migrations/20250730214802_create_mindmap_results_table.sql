-- Create mindmap_results table for storing mindmap generation job results
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mindmap_results_job_id ON mindmap_results(job_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_user_id ON mindmap_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_status ON mindmap_results(status);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_created_at ON mindmap_results(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mindmap_results ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage their own mindmap results
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

-- Add table comment for documentation
COMMENT ON TABLE mindmap_results IS 'Stores mindmap generation job results from AWS Lambda backend';
COMMENT ON COLUMN mindmap_results.job_id IS 'Unique identifier for the mindmap generation job';
COMMENT ON COLUMN mindmap_results.status IS 'Current status of the mindmap generation job';
COMMENT ON COLUMN mindmap_results.result_data IS 'Generated mindmap data including nodes and edges';
COMMENT ON COLUMN mindmap_results.error_message IS 'Error details if the job failed';