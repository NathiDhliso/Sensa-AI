-- Create epistemic_driver_history table for saving user's generated study maps
-- This allows users to save, view, and manage their epistemic driver results

CREATE TABLE epistemic_driver_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  objectives text NOT NULL,
  study_map_data jsonb NOT NULL,
  is_favorite boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_epistemic_driver_history_user_id ON epistemic_driver_history(user_id);
CREATE INDEX idx_epistemic_driver_history_created_at ON epistemic_driver_history(created_at DESC);
CREATE INDEX idx_epistemic_driver_history_is_favorite ON epistemic_driver_history(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_epistemic_driver_history_tags ON epistemic_driver_history USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE epistemic_driver_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage their own history
CREATE POLICY "Users can create their own epistemic driver history"
  ON epistemic_driver_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own epistemic driver history"
  ON epistemic_driver_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own epistemic driver history"
  ON epistemic_driver_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own epistemic driver history"
  ON epistemic_driver_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_epistemic_driver_history_updated_at
    BEFORE UPDATE ON epistemic_driver_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comment for documentation
COMMENT ON TABLE epistemic_driver_history IS 'Stores user-generated epistemic driver study maps with metadata for personal history and organization';
COMMENT ON COLUMN epistemic_driver_history.study_map_data IS 'Complete JSON data of the generated epistemic driver including epistemological_drivers, learning_paths, and connecting_link';
COMMENT ON COLUMN epistemic_driver_history.tags IS 'User-defined tags for organizing and categorizing study maps';
COMMENT ON COLUMN epistemic_driver_history.is_favorite IS 'Flag to mark important or frequently accessed study maps';
