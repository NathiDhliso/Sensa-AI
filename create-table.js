import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okvdirskoukqnjzqsowb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdmRpcnNrb3VrcW5qenFzb3diIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU4NDE2NCwiZXhwIjoyMDY2MTYwMTY0fQ.9gNFYa6j5mtqTh14aS-TYacbujRmEO0WPiFVNMQztgA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateTable() {
  console.log('Checking if mindmap_results table exists...');
  
  // First, try to query the table to see if it exists
  const { data: testData, error: testError } = await supabase
    .from('mindmap_results')
    .select('*')
    .limit(1);
  
  if (testError && testError.code === '42P01') {
    console.log('Table does not exist. Please create it manually in Supabase SQL Editor.');
    console.log('Use this SQL:');
    console.log(`
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

CREATE INDEX IF NOT EXISTS idx_mindmap_results_job_id ON mindmap_results(job_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_user_id ON mindmap_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_status ON mindmap_results(status);
CREATE INDEX IF NOT EXISTS idx_mindmap_results_created_at ON mindmap_results(created_at DESC);

ALTER TABLE mindmap_results ENABLE ROW LEVEL SECURITY;

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
  USING (true);`);
  } else if (testError) {
    console.error('Error checking table:', testError);
  } else {
    console.log('✅ Table exists and is accessible!');
    console.log('Found', testData?.length || 0, 'records');
  }
}

checkAndCreateTable();