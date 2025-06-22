/*
# Complete Sensa Database Schema

This migration creates all necessary tables for the Sensa application with proper relationships,
indexes, and Row Level Security policies.

## Tables Created:
1. users - User profiles linked to Supabase Auth
2. memories - User childhood memories with AI analysis
3. courses - Course catalog (200+ courses)
4. course_analyses - User-specific course analyses
5. memory_links - Connections between memories and course concepts
6. dialogue_sessions - Sensa dialogue refinement sessions
7. study_maps - Generated study maps for courses
8. user_preferences - User privacy and learning preferences

## Security:
- Row Level Security enabled on all user data tables
- Proper foreign key relationships
- Optimized indexes for performance
*/

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS course_analyses CASCADE;
DROP TABLE IF EXISTS memory_links CASCADE;
DROP TABLE IF EXISTS dialogue_sessions CASCADE;
DROP TABLE IF EXISTS study_maps CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  learning_profile jsonb DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create memories table
CREATE TABLE memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(auth_id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('Spatial Memory', 'Learning Adventure', 'Emotional Memory', 'Creative Memory', 'Cognitive Memory')),
  text_content text NOT NULL,
  sensa_analysis jsonb DEFAULT '{}',
  themes text[] DEFAULT '{}',
  emotional_tone text,
  learning_indicators text[] DEFAULT '{}',
  confidence_score decimal(3,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  university text NOT NULL,
  field text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  duration text NOT NULL,
  description text,
  syllabus text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course_analyses table
CREATE TABLE course_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(auth_id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  analysis_data jsonb NOT NULL DEFAULT '{}',
  memory_connections jsonb DEFAULT '{}',
  career_pathways jsonb DEFAULT '{}',
  study_map jsonb DEFAULT '{}',
  completion_status text DEFAULT 'draft' CHECK (completion_status IN ('draft', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create memory_links table (for refined memory-concept connections)
CREATE TABLE memory_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(auth_id) ON DELETE CASCADE NOT NULL,
  memory_id uuid REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  concept text NOT NULL,
  original_analogy text NOT NULL,
  original_study_tip text NOT NULL,
  refined_analogy text,
  refined_study_tip text,
  refinement_status text DEFAULT 'original' CHECK (refinement_status IN ('original', 'refined', 'validated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dialogue_sessions table (for Sensa dialogue refinements)
CREATE TABLE dialogue_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(auth_id) ON DELETE CASCADE NOT NULL,
  memory_link_id uuid REFERENCES memory_links(id) ON DELETE CASCADE NOT NULL,
  session_data jsonb NOT NULL DEFAULT '{}',
  messages jsonb[] DEFAULT '{}',
  session_status text DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create study_maps table (for generated study maps)
CREATE TABLE study_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(auth_id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  field_of_study text NOT NULL,
  map_type text NOT NULL CHECK (map_type IN ('interactive', 'mermaid')),
  map_data jsonb NOT NULL DEFAULT '{}',
  node_data jsonb DEFAULT '{}',
  mermaid_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id, map_type)
);

-- Create user_preferences table (for privacy and learning preferences)
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(auth_id) ON DELETE CASCADE UNIQUE NOT NULL,
  memory_analysis_enabled boolean DEFAULT true,
  course_personalization_enabled boolean DEFAULT true,
  memory_storage_enabled boolean DEFAULT true,
  analytics_opt_out boolean DEFAULT false,
  data_sharing_consent boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{}',
  privacy_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

-- Create RLS policies for memories table
CREATE POLICY "Users can read own memories"
  ON memories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON memories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for courses table (public read access for authenticated users)
CREATE POLICY "Authenticated users can read courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create RLS policies for course_analyses table
CREATE POLICY "Users can read own course analyses"
  ON course_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course analyses"
  ON course_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course analyses"
  ON course_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own course analyses"
  ON course_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for memory_links table
CREATE POLICY "Users can read own memory links"
  ON memory_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory links"
  ON memory_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory links"
  ON memory_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory links"
  ON memory_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for dialogue_sessions table
CREATE POLICY "Users can read own dialogue sessions"
  ON dialogue_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dialogue sessions"
  ON dialogue_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dialogue sessions"
  ON dialogue_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dialogue sessions"
  ON dialogue_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for study_maps table
CREATE POLICY "Users can read own study maps"
  ON study_maps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study maps"
  ON study_maps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study maps"
  ON study_maps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study maps"
  ON study_maps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for user_preferences table
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);

CREATE INDEX idx_courses_field ON courses(field);
CREATE INDEX idx_courses_university ON courses(university);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_active ON courses(is_active);

CREATE INDEX idx_course_analyses_user_id ON course_analyses(user_id);
CREATE INDEX idx_course_analyses_course_id ON course_analyses(course_id);
CREATE INDEX idx_course_analyses_status ON course_analyses(completion_status);

CREATE INDEX idx_memory_links_user_id ON memory_links(user_id);
CREATE INDEX idx_memory_links_memory_id ON memory_links(memory_id);
CREATE INDEX idx_memory_links_course_id ON memory_links(course_id);
CREATE INDEX idx_memory_links_status ON memory_links(refinement_status);

CREATE INDEX idx_dialogue_sessions_user_id ON dialogue_sessions(user_id);
CREATE INDEX idx_dialogue_sessions_memory_link_id ON dialogue_sessions(memory_link_id);
CREATE INDEX idx_dialogue_sessions_status ON dialogue_sessions(session_status);

CREATE INDEX idx_study_maps_user_id ON study_maps(user_id);
CREATE INDEX idx_study_maps_course_id ON study_maps(course_id);
CREATE INDEX idx_study_maps_type ON study_maps(map_type);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at 
  BEFORE UPDATE ON memories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_analyses_updated_at 
  BEFORE UPDATE ON course_analyses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_links_updated_at 
  BEFORE UPDATE ON memory_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dialogue_sessions_updated_at 
  BEFORE UPDATE ON dialogue_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_maps_updated_at 
  BEFORE UPDATE ON study_maps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user preferences when user is created
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.auth_id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create user preferences
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- Create function to validate memory categories
CREATE OR REPLACE FUNCTION validate_memory_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category NOT IN ('Spatial Memory', 'Learning Adventure', 'Emotional Memory', 'Creative Memory', 'Cognitive Memory') THEN
    RAISE EXCEPTION 'Invalid memory category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for memory category validation
CREATE TRIGGER validate_memory_category_trigger
  BEFORE INSERT OR UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION validate_memory_category();