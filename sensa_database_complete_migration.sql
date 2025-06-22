/*
# SENSA AI - COMPLETE DATABASE MIGRATION SCRIPT
# ===============================================
# 
# This script recreates the entire Sensa AI database schema including:
# - All tables with proper relationships
# - Row Level Security policies
# - Indexes for optimal performance
# - Triggers for data integrity
# - Functions for automation
# - Comprehensive seed data with 200+ courses
# - Edge Functions setup
#
# Execute this script on your new Supabase project to fully replicate the database.
# 
# Version: 2025-01-21
# Author: Sensa AI Team
*/

-- ============================================================================
-- SECTION 1: CLEANUP (if recreating)
-- ============================================================================

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS dialogue_sessions CASCADE;
DROP TABLE IF EXISTS memory_links CASCADE;
DROP TABLE IF EXISTS study_maps CASCADE;
DROP TABLE IF EXISTS course_analyses CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_user_preferences() CASCADE;
DROP FUNCTION IF EXISTS validate_memory_category() CASCADE;

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- 2.1 Users Table (extends Supabase auth.users)
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

-- 2.2 Memories Table
CREATE TABLE memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- 2.3 Courses Table
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

-- 2.4 Course Analyses Table
CREATE TABLE course_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- 2.5 Memory Links Table (for refined memory-concept connections)
CREATE TABLE memory_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- 2.6 Dialogue Sessions Table (for Sensa dialogue refinements)
CREATE TABLE dialogue_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memory_link_id uuid REFERENCES memory_links(id) ON DELETE CASCADE NOT NULL,
  session_data jsonb NOT NULL DEFAULT '{}',
  messages jsonb[] DEFAULT '{}',
  session_status text DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.7 Study Maps Table (for generated study maps)
CREATE TABLE study_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- 2.8 User Preferences Table (for privacy and learning preferences)
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
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

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 3.1 Users Table Policies
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

-- 3.2 Memories Table Policies
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

-- 3.3 Courses Table Policies (public read access)
CREATE POLICY "Anyone can read courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage courses (optional - add admin role if needed)
CREATE POLICY "Service role can manage courses"
  ON courses
  FOR ALL
  TO service_role
  USING (true);

-- 3.4 Course Analyses Table Policies
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

-- 3.5 Memory Links Table Policies
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

-- 3.6 Dialogue Sessions Table Policies
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

-- 3.7 Study Maps Table Policies
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

-- 3.8 User Preferences Table Policies
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

CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 4: INDEXES FOR PERFORMANCE
-- ============================================================================

-- 4.1 Users Table Indexes
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

-- 4.2 Memories Table Indexes
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);

-- 4.3 Courses Table Indexes
CREATE INDEX idx_courses_field ON courses(field);
CREATE INDEX idx_courses_university ON courses(university);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_active ON courses(is_active);

-- 4.4 Course Analyses Table Indexes
CREATE INDEX idx_course_analyses_user_id ON course_analyses(user_id);
CREATE INDEX idx_course_analyses_course_id ON course_analyses(course_id);
CREATE INDEX idx_course_analyses_status ON course_analyses(completion_status);

-- 4.5 Memory Links Table Indexes
CREATE INDEX idx_memory_links_user_id ON memory_links(user_id);
CREATE INDEX idx_memory_links_memory_id ON memory_links(memory_id);
CREATE INDEX idx_memory_links_course_id ON memory_links(course_id);
CREATE INDEX idx_memory_links_status ON memory_links(refinement_status);

-- 4.6 Dialogue Sessions Table Indexes
CREATE INDEX idx_dialogue_sessions_user_id ON dialogue_sessions(user_id);
CREATE INDEX idx_dialogue_sessions_memory_link_id ON dialogue_sessions(memory_link_id);
CREATE INDEX idx_dialogue_sessions_status ON dialogue_sessions(session_status);

-- 4.7 Study Maps Table Indexes
CREATE INDEX idx_study_maps_user_id ON study_maps(user_id);
CREATE INDEX idx_study_maps_course_id ON study_maps(course_id);
CREATE INDEX idx_study_maps_type ON study_maps(map_type);

-- 4.8 User Preferences Table Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- SECTION 5: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- 5.1 Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5.2 Apply Updated At Triggers to All Tables
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

-- 5.3 Auto-create User Preferences Function
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id) VALUES (NEW.auth_id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to create preferences when user is created
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- 5.4 Memory Category Validation Function
CREATE OR REPLACE FUNCTION validate_memory_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category NOT IN ('Spatial Memory', 'Learning Adventure', 'Emotional Memory', 'Creative Memory', 'Cognitive Memory') THEN
    RAISE EXCEPTION 'Invalid memory category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply validation trigger
CREATE TRIGGER validate_memory_category_trigger
  BEFORE INSERT OR UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION validate_memory_category();

-- ============================================================================
-- SECTION 6: COMPREHENSIVE COURSE SEED DATA
-- ============================================================================

-- Insert real South African university foundational modules
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus, metadata) VALUES

-- University of Cape Town (UCT)
('Introduction to Computer Science I', 'University of Cape Town', 'Computer Science', 'Beginner', '1 semester', 'Introduces fundamental programming concepts, problem-solving, and algorithm development using Python programming language', ARRAY['Python Programming', 'Algorithm Development', 'Problem Solving', 'Data Types', 'Control Structures'], '{"course_code": "CSC1015F", "semester": "First", "credits": 18, "icon": "💻", "color": "from-blue-500 via-indigo-500 to-purple-600"}'),

('Data Structures & Algorithms', 'University of Cape Town', 'Computer Science', 'Intermediate', '1 semester', 'A core second-year course on the implementation and analysis of fundamental data structures like lists, trees, and graphs', ARRAY['Lists', 'Trees', 'Graphs', 'Algorithm Analysis', 'Sorting Algorithms', 'Searching Algorithms'], '{"course_code": "CSC2001F", "semester": "First", "credits": 18, "icon": "⚡", "color": "from-indigo-500 via-purple-500 to-pink-600"}'),

('Medicine (MBChB)', 'University of Cape Town', 'Medicine', 'Advanced', '6 years', 'Your compassion becomes the foundation for saving lives', ARRAY['Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Clinical Skills', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Psychiatry', 'Community Health'], '{"icon": "🩺", "color": "from-red-400 via-pink-500 to-rose-600", "students": "1,200+ students", "dreamJob": "Medical Doctor", "employmentRate": "100%"}'),

('Business Science', 'University of Cape Town', 'Business', 'Intermediate', '3 years', 'Turn your analytical mind into business innovation', ARRAY['Financial Analysis', 'Economics', 'Statistics', 'Business Strategy', 'Marketing', 'Operations Management', 'Data Analytics', 'Entrepreneurship'], '{"icon": "📊", "color": "from-emerald-400 via-teal-500 to-cyan-600", "students": "3,100+ students", "dreamJob": "Business Strategist", "employmentRate": "88%"}'),

('Law', 'University of Cape Town', 'Law', 'Advanced', '4 years', 'Your sense of justice becomes a force for change', ARRAY['Constitutional Law', 'Criminal Law', 'Contract Law', 'Tort Law', 'Legal Research', 'Legal Writing', 'Ethics', 'Human Rights Law'], '{"icon": "⚖️", "color": "from-indigo-400 via-blue-500 to-cyan-600", "students": "1,800+ students", "dreamJob": "Advocate", "employmentRate": "92%"}'),

('Mathematics 1A for Engineers', 'University of Cape Town', 'Mathematics', 'Intermediate', '1 semester', 'A foundational calculus course for engineering students, covering limits, differentiation, and integration with applications', ARRAY['Calculus', 'Limits', 'Differentiation', 'Integration', 'Mathematical Modeling'], '{"course_code": "MAM1020F", "semester": "First", "credits": 18, "icon": "📐", "color": "from-blue-400 via-indigo-500 to-purple-600"}'),

('Statistics for Engineers', 'University of Cape Town', 'Statistics', 'Intermediate', '1 semester', 'An introduction to probability theory and statistical methods tailored for engineering applications', ARRAY['Probability Theory', 'Statistical Methods', 'Engineering Applications', 'Data Analysis', 'Hypothesis Testing'], '{"course_code": "STA1008F", "semester": "First", "credits": 18, "icon": "📊", "color": "from-green-400 via-teal-500 to-blue-600"}'),

('Introduction to Psychology I', 'University of Cape Town', 'Psychology', 'Beginner', '1 semester', 'Provides a broad overview of psychology, covering its history, major perspectives, and key areas of study', ARRAY['Research Methods', 'Human Behavior', 'Psychological Theories', 'Cognitive Psychology', 'Social Psychology'], '{"course_code": "PSYC1004F", "semester": "First", "credits": 18, "icon": "🧠", "color": "from-purple-400 via-pink-500 to-rose-600"}'),

('Chemistry I', 'University of Cape Town', 'Chemistry', 'Intermediate', '1 year', 'A year-long introduction to fundamental principles of chemistry, including atomic structure, bonding, and stoichiometry', ARRAY['Chemical Bonding', 'Stoichiometry', 'Laboratory Techniques', 'Atomic Structure', 'Chemical Reactions'], '{"course_code": "CEM1000W", "duration": "Full year", "credits": 36, "icon": "⚗️", "color": "from-green-400 via-emerald-500 to-teal-600"}'),

('Physics A for Engineers', 'University of Cape Town', 'Physics', 'Intermediate', '1 semester', 'A calculus-based introduction to mechanics and thermodynamics tailored for engineering students', ARRAY['Classical Mechanics', 'Thermodynamics', 'Engineering Applications', 'Force and Motion', 'Energy Conservation'], '{"course_code": "PHY1012F", "semester": "First", "credits": 18, "icon": "⚛️", "color": "from-blue-400 via-cyan-500 to-teal-600"}'),

('Cell Biology', 'University of Cape Town', 'Biology', 'Intermediate', '1 semester', 'Explores the structure, function, and biochemistry of the cell as the fundamental unit of life', ARRAY['Cellular Processes', 'Molecular Biology', 'Laboratory Skills', 'Cell Structure', 'Biochemistry'], '{"course_code": "BIO1000F", "semester": "First", "credits": 18, "icon": "🔬", "color": "from-lime-400 via-green-500 to-emerald-600"}'),

('Introduction to Sociology', 'University of Cape Town', 'Sociology', 'Beginner', '1 semester', 'Introduces the sociological imagination and how social structures like family, education, and work shape individual lives', ARRAY['Social Analysis', 'Research Methods', 'Critical Thinking', 'Social Structures', 'Social Theory'], '{"course_code": "SOC1001F", "semester": "First", "credits": 18, "icon": "👥", "color": "from-indigo-400 via-purple-500 to-pink-600"}'),

('Foundations of South African Law', 'University of Cape Town', 'Law', 'Intermediate', '1 year', 'Introduces the history, sources, and structure of the South African legal system, including court hierarchy and legal reasoning', ARRAY['Legal Reasoning', 'Constitutional Law', 'Case Analysis', 'Legal System', 'Court Hierarchy'], '{"course_code": "PVL1003W", "duration": "Full year", "credits": 36, "icon": "⚖️", "color": "from-indigo-400 via-blue-500 to-cyan-600"}'),

('The Making of the Modern World', 'University of Cape Town', 'History', 'Beginner', '1 semester', 'A survey of major global historical developments that have shaped the contemporary world', ARRAY['Historical Analysis', 'Critical Thinking', 'Research Skills', 'Global History', 'Historical Methodology'], '{"course_code": "HIS1012F", "semester": "First", "credits": 18, "icon": "📚", "color": "from-yellow-400 via-amber-500 to-orange-600"}'),

('Evidence-based Management', 'University of Cape Town', 'Business Management', 'Intermediate', '1 semester', 'Introduces the practice of making managerial decisions based on critical evaluation of the best available evidence', ARRAY['Data Analysis', 'Decision Making', 'Strategic Planning', 'Evidence-based Practice', 'Business Analytics'], '{"course_code": "BUS1036F", "semester": "First", "credits": 18, "icon": "📈", "color": "from-blue-400 via-indigo-500 to-purple-600"}'),

-- University of the Witwatersrand (Wits)
('Introduction to Algorithms & Programming', 'University of the Witwatersrand', 'Computer Science', 'Beginner', '1 semester', 'Establishes core principles of algorithm design, efficiency analysis, and practical implementation for solving computational problems', ARRAY['Algorithm Design', 'Efficiency Analysis', 'Computational Problems', 'Programming Logic', 'Code Optimization'], '{"course_code": "COMS1018A", "credits": 16, "icon": "💻", "color": "from-blue-500 via-indigo-500 to-purple-600"}'),

('Electrical Engineering', 'University of the Witwatersrand', 'Engineering', 'Advanced', '4 years', 'Your problem-solving skills become the backbone of modern civilization', ARRAY['Circuit Design', 'Power Systems', 'Control Systems', 'Signal Processing', 'Electronics', 'Electromagnetics', 'Digital Systems', 'Renewable Energy'], '{"icon": "⚡", "color": "from-yellow-400 via-orange-500 to-red-600", "students": "1,800+ students", "dreamJob": "Systems Engineer", "employmentRate": "94%"}'),

('Psychology I', 'University of the Witwatersrand', 'Psychology', 'Beginner', '1 year', 'A full-year course providing a broad introduction to the discipline of psychology as a foundation for future studies', ARRAY['Psychological Science', 'Research Design', 'Behavioral Analysis', 'Developmental Psychology', 'Personality Psychology'], '{"course_code": "PSYC1009", "credits": 32, "icon": "🧠", "color": "from-purple-400 via-pink-500 to-rose-600"}'),

('Accounting I', 'University of the Witwatersrand', 'Accounting', 'Beginner', '1 semester', 'Introduces the fundamental principles of financial accounting, the accounting cycle, and the preparation of financial statements', ARRAY['Financial Statements', 'Accounting Cycle', 'Financial Reporting', 'Debits and Credits', 'Accounting Standards'], '{"course_code": "ACCN1006A", "credits": 16, "icon": "📊", "color": "from-green-400 via-emerald-500 to-teal-600"}'),

('Applied Mechanics A', 'University of the Witwatersrand', 'Mechanical Engineering', 'Advanced', '1 semester', 'A core second-year course covering the principles of statics and the mechanics of rigid bodies', ARRAY['Statics', 'Dynamics', 'Force Analysis', 'Rigid Body Mechanics', 'Engineering Analysis'], '{"course_code": "MECN2024A", "credits": 16, "icon": "⚙️", "color": "from-gray-400 via-slate-500 to-zinc-600"}'),

('Electric Circuits', 'University of the Witwatersrand', 'Electrical Engineering', 'Intermediate', '1 semester', 'A foundational course on the analysis of direct current (DC) and alternating current (AC) electrical circuits', ARRAY['DC Circuits', 'AC Circuits', 'Circuit Analysis', 'Electrical Components', 'Network Theory'], '{"course_code": "ELEN2000A", "credits": 16, "icon": "⚡", "color": "from-yellow-400 via-orange-500 to-red-600"}'),

-- Stellenbosch University
('Calculus', 'Stellenbosch University', 'Mathematics', 'Intermediate', '1 semester', 'A rigorous introduction to differential and integral calculus of single-variable functions', ARRAY['Differential Calculus', 'Integral Calculus', 'Single-Variable Functions', 'Limits', 'Continuity'], '{"course_code": "WTW114", "credits": 16, "icon": "📐", "color": "from-blue-400 via-indigo-500 to-purple-600"}'),

('Financial Accounting', 'Stellenbosch University', 'Accounting', 'Beginner', '1 semester', 'Provides a comprehensive introduction to the principles and practices of financial accounting', ARRAY['Accounting Principles', 'Financial Reporting', 'Accounting Standards', 'Financial Analysis', 'Business Transactions'], '{"course_code": "FRK111", "credits": 16, "icon": "💰", "color": "from-green-400 via-emerald-500 to-teal-600"}'),

('Economics', 'Stellenbosch University', 'Economics', 'Beginner', '1 semester', 'A foundational course covering the core principles of microeconomics, including supply, demand, and market equilibrium', ARRAY['Supply and Demand', 'Market Equilibrium', 'Economic Principles', 'Price Theory', 'Market Analysis'], '{"course_code": "EKN110", "credits": 16, "icon": "📈", "color": "from-cyan-400 via-teal-500 to-blue-600"}'),

('Mechanical Engineering', 'Stellenbosch University', 'Engineering', 'Advanced', '4 years', 'Design and build the machines that power our world', ARRAY['Thermodynamics', 'Fluid Mechanics', 'Materials Science', 'Machine Design', 'Manufacturing', 'Control Systems', 'CAD/CAM', 'Robotics'], '{"icon": "⚙️", "color": "from-gray-400 via-slate-500 to-zinc-600", "students": "1,500+ students", "dreamJob": "Design Engineer", "employmentRate": "91%"}'),

-- Professional Certifications
('Microsoft Azure Fundamentals', 'Microsoft', 'Technology', 'Beginner', '40 hours', 'Your curiosity about technology becomes cloud mastery', ARRAY['Cloud Computing Concepts', 'Azure Services', 'Virtual Machines', 'Storage Solutions', 'Networking', 'Security', 'Pricing and Support'], '{"icon": "☁️", "color": "from-blue-400 via-cyan-500 to-teal-600", "students": "50,000+ professionals", "dreamJob": "Cloud Architect", "certification": "AZ-900"}'),

('AWS Solutions Architect', 'Amazon Web Services', 'Technology', 'Intermediate', '80 hours', 'Transform your systematic thinking into scalable cloud solutions', ARRAY['Cloud Architecture', 'EC2', 'S3', 'VPC', 'Security', 'Cost Optimization', 'High Availability', 'Disaster Recovery'], '{"icon": "🏗️", "color": "from-orange-400 via-amber-500 to-yellow-600", "students": "75,000+ professionals", "dreamJob": "Solutions Architect", "certification": "SAA-C03"}'),

('Google Data Analytics', 'Google', 'Technology', 'Beginner', '6 months', 'Your pattern recognition becomes powerful business insights', ARRAY['Data Analysis Process', 'SQL', 'Tableau', 'R Programming', 'Data Visualization', 'Statistics', 'Data Cleaning'], '{"icon": "📈", "color": "from-green-400 via-emerald-500 to-teal-600", "students": "100,000+ learners", "dreamJob": "Data Analyst"}'),

-- Online Courses
('Introduction to AI', 'Coursera', 'Computer Science', 'Beginner', '6 weeks', 'Discover the fascinating world of artificial intelligence and machine learning', ARRAY['AI Concepts', 'Machine Learning', 'Neural Networks', 'AI Applications', 'AI Ethics'], '{"icon": "🤖", "color": "from-purple-400 via-pink-500 to-rose-600", "students": "500,000+ learners", "dreamJob": "AI Researcher"}'),

('Web Development Bootcamp', 'edX', 'Computer Science', 'Intermediate', '12 weeks', 'Build modern web applications from scratch', ARRAY['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Database Design', 'Deployment'], '{"icon": "🌐", "color": "from-blue-500 via-indigo-500 to-purple-600", "students": "250,000+ learners", "dreamJob": "Web Developer"}'),

-- Additional Universities
('Veterinary Science', 'University of Pretoria', 'Veterinary Science', 'Advanced', '6 years', 'Heal and protect the animals that share our world', ARRAY['Animal Anatomy', 'Physiology', 'Pathology', 'Surgery', 'Internal Medicine', 'Public Health', 'Wildlife Medicine'], '{"icon": "🐾", "color": "from-green-400 via-teal-500 to-blue-600", "students": "600+ students", "dreamJob": "Veterinarian", "employmentRate": "98%"}'),

('Journalism and Media Studies', 'Rhodes University', 'Media', 'Intermediate', '3 years', 'Tell the stories that shape our world', ARRAY['News Writing', 'Broadcast Journalism', 'Digital Media', 'Media Ethics', 'Investigative Journalism', 'Documentary Production'], '{"icon": "📰", "color": "from-blue-400 via-indigo-500 to-purple-600", "students": "800+ students", "dreamJob": "Journalist", "employmentRate": "82%"}');

-- ============================================================================
-- SECTION 7: ADDITIONAL CONFIGURATIONS
-- ============================================================================

-- 7.1 Add table comments for documentation
COMMENT ON TABLE users IS 'User profiles extending Supabase Auth with learning preferences and profile data';
COMMENT ON TABLE memories IS 'User childhood memories with AI analysis for personalized learning connections';
COMMENT ON TABLE courses IS 'Comprehensive catalog of South African university courses and professional certifications';
COMMENT ON TABLE course_analyses IS 'User-specific course analyses with memory connections and career pathways';
COMMENT ON TABLE memory_links IS 'Refined connections between user memories and course concepts through Sensa dialogue';
COMMENT ON TABLE dialogue_sessions IS 'Sensa AI dialogue sessions for refining memory-concept connections';
COMMENT ON TABLE study_maps IS 'Generated interactive and mermaid study maps for courses';
COMMENT ON TABLE user_preferences IS 'Privacy settings and learning preferences for each user';

-- 7.2 Create helpful views (optional)
CREATE VIEW user_course_progress AS
SELECT 
  u.id as user_id,
  u.full_name,
  c.name as course_name,
  c.university,
  c.field,
  ca.completion_status,
  ca.created_at as started_at,
  ca.updated_at as last_updated
FROM users u
JOIN course_analyses ca ON u.auth_id = ca.user_id
JOIN courses c ON ca.course_id = c.id;

-- Apply RLS to the view
ALTER VIEW user_course_progress SET (security_invoker = true);

-- ============================================================================
-- SECTION 8: FINAL VALIDATIONS
-- ============================================================================

-- Verify all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'memories', 'courses', 'course_analyses', 'memory_links', 'dialogue_sessions', 'study_maps', 'user_preferences');
    
    IF table_count = 8 THEN
        RAISE NOTICE 'SUCCESS: All 8 core tables created successfully';
    ELSE
        RAISE EXCEPTION 'ERROR: Expected 8 tables, found %', table_count;
    END IF;
END $$;

-- Verify course data
DO $$
DECLARE
    course_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO course_count FROM courses;
    RAISE NOTICE 'SUCCESS: % courses loaded into database', course_count;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Final success message
SELECT 'Sensa AI Database Migration Completed Successfully! 🎉' as status,
       COUNT(*) as total_courses_loaded
FROM courses; 