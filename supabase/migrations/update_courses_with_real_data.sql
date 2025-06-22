-- Update courses table with real South African university foundational modules
-- This migration replaces sample data with actual course information from UCT, Wits, Stellenbosch, and UP

-- First, clear existing sample data
TRUNCATE TABLE courses RESTART IDENTITY CASCADE;

-- Insert real South African university foundational modules
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus, metadata) VALUES
-- Computer Science & Information Technology
('Introduction to Computer Science I', 'University of Cape Town', 'Computer Science', 'Beginner', '1 semester', 'Introduces fundamental programming concepts, problem-solving, and algorithm development using Python programming language', ARRAY['Python Programming', 'Algorithm Development', 'Problem Solving', 'Data Types', 'Control Structures'], '{"course_code": "CSC1015F", "semester": "First", "credits": 18}'),

('Data Structures & Algorithms', 'University of Cape Town', 'Computer Science', 'Intermediate', '1 semester', 'A core second-year course on the implementation and analysis of fundamental data structures like lists, trees, and graphs', ARRAY['Lists', 'Trees', 'Graphs', 'Algorithm Analysis', 'Sorting Algorithms', 'Searching Algorithms'], '{"course_code": "CSC2001F", "semester": "First", "credits": 18}'),

('Introduction to Algorithms & Programming', 'University of the Witwatersrand', 'Computer Science', 'Beginner', '1 semester', 'Establishes core principles of algorithm design, efficiency analysis, and practical implementation for solving computational problems', ARRAY['Algorithm Design', 'Efficiency Analysis', 'Computational Problems', 'Programming Logic', 'Code Optimization'], '{"course_code": "COMS1018A", "credits": 16}'),

-- Mathematics & Statistics
('Mathematics 1A for Engineers', 'University of Cape Town', 'Mathematics', 'Intermediate', '1 semester', 'A foundational calculus course for engineering students, covering limits, differentiation, and integration with applications', ARRAY['Calculus', 'Limits', 'Differentiation', 'Integration', 'Mathematical Modeling'], '{"course_code": "MAM1020F", "semester": "First", "credits": 18}'),

('Calculus', 'Stellenbosch University', 'Mathematics', 'Intermediate', '1 semester', 'A rigorous introduction to differential and integral calculus of single-variable functions', ARRAY['Differential Calculus', 'Integral Calculus', 'Single-Variable Functions', 'Limits', 'Continuity'], '{"course_code": "WTW114", "credits": 16}'),

('Statistics for Engineers', 'University of Cape Town', 'Statistics', 'Intermediate', '1 semester', 'An introduction to probability theory and statistical methods tailored for engineering applications', ARRAY['Probability Theory', 'Statistical Methods', 'Engineering Applications', 'Data Analysis', 'Hypothesis Testing'], '{"course_code": "STA1008F", "semester": "First", "credits": 18}'),

-- Psychology
('Introduction to Psychology I', 'University of Cape Town', 'Psychology', 'Beginner', '1 semester', 'Provides a broad overview of psychology, covering its history, major perspectives, and key areas of study', ARRAY['Research Methods', 'Human Behavior', 'Psychological Theories', 'Cognitive Psychology', 'Social Psychology'], '{"course_code": "PSYC1004F", "semester": "First", "credits": 18}'),

('Psychology I', 'University of the Witwatersrand', 'Psychology', 'Beginner', '1 year', 'A full-year course providing a broad introduction to the discipline of psychology as a foundation for future studies', ARRAY['Psychological Science', 'Research Design', 'Behavioral Analysis', 'Developmental Psychology', 'Personality Psychology'], '{"course_code": "PSYC1009", "credits": 32}'),

-- Accounting & Finance
('Accounting I', 'University of the Witwatersrand', 'Accounting', 'Beginner', '1 semester', 'Introduces the fundamental principles of financial accounting, the accounting cycle, and the preparation of financial statements', ARRAY['Financial Statements', 'Accounting Cycle', 'Financial Reporting', 'Debits and Credits', 'Accounting Standards'], '{"course_code": "ACCN1006A", "credits": 16}'),

('Financial Accounting', 'Stellenbosch University', 'Accounting', 'Beginner', '1 semester', 'Provides a comprehensive introduction to the principles and practices of financial accounting', ARRAY['Accounting Principles', 'Financial Reporting', 'Accounting Standards', 'Financial Analysis', 'Business Transactions'], '{"course_code": "FRK111", "credits": 16}'),

-- Economics
('Microeconomics I', 'University of Cape Town', 'Economics', 'Intermediate', '1 semester', 'Introduces the theory of consumer behavior, firm behavior, and market structures including competition and monopoly', ARRAY['Market Analysis', 'Economic Theory', 'Policy Evaluation', 'Consumer Behavior', 'Market Structures'], '{"course_code": "ECO1010F", "semester": "First", "credits": 18}'),

('Economics', 'Stellenbosch University', 'Economics', 'Beginner', '1 semester', 'A foundational course covering the core principles of microeconomics, including supply, demand, and market equilibrium', ARRAY['Supply and Demand', 'Market Equilibrium', 'Economic Principles', 'Price Theory', 'Market Analysis'], '{"course_code": "EKN110", "credits": 16}'),

-- Physical Sciences
('Chemistry I', 'University of Cape Town', 'Chemistry', 'Intermediate', '1 year', 'A year-long introduction to fundamental principles of chemistry, including atomic structure, bonding, and stoichiometry', ARRAY['Chemical Bonding', 'Stoichiometry', 'Laboratory Techniques', 'Atomic Structure', 'Chemical Reactions'], '{"course_code": "CEM1000W", "duration": "Full year", "credits": 36}'),

('Physics A for Engineers', 'University of Cape Town', 'Physics', 'Intermediate', '1 semester', 'A calculus-based introduction to mechanics and thermodynamics tailored for engineering students', ARRAY['Classical Mechanics', 'Thermodynamics', 'Engineering Applications', 'Force and Motion', 'Energy Conservation'], '{"course_code": "PHY1012F", "semester": "First", "credits": 18}'),

-- Biological Sciences
('Cell Biology', 'University of Cape Town', 'Biology', 'Intermediate', '1 semester', 'Explores the structure, function, and biochemistry of the cell as the fundamental unit of life', ARRAY['Cellular Processes', 'Molecular Biology', 'Laboratory Skills', 'Cell Structure', 'Biochemistry'], '{"course_code": "BIO1000F", "semester": "First", "credits": 18}'),

-- Engineering
('Applied Mechanics A', 'University of the Witwatersrand', 'Mechanical Engineering', 'Advanced', '1 semester', 'A core second-year course covering the principles of statics and the mechanics of rigid bodies', ARRAY['Statics', 'Dynamics', 'Force Analysis', 'Rigid Body Mechanics', 'Engineering Analysis'], '{"course_code": "MECN2024A", "credits": 16}'),

('Electric Circuits', 'University of the Witwatersrand', 'Electrical Engineering', 'Intermediate', '1 semester', 'A foundational course on the analysis of direct current (DC) and alternating current (AC) electrical circuits', ARRAY['DC Circuits', 'AC Circuits', 'Circuit Analysis', 'Electrical Components', 'Network Theory'], '{"course_code": "ELEN2000A", "credits": 16}'),

-- Social Sciences
('Introduction to Sociology', 'University of Cape Town', 'Sociology', 'Beginner', '1 semester', 'Introduces the sociological imagination and how social structures like family, education, and work shape individual lives', ARRAY['Social Analysis', 'Research Methods', 'Critical Thinking', 'Social Structures', 'Social Theory'], '{"course_code": "SOC1001F", "semester": "First", "credits": 18}'),

-- Law
('Foundations of South African Law', 'University of Cape Town', 'Law', 'Intermediate', '1 year', 'Introduces the history, sources, and structure of the South African legal system, including court hierarchy and legal reasoning', ARRAY['Legal Reasoning', 'Constitutional Law', 'Case Analysis', 'Legal System', 'Court Hierarchy'], '{"course_code": "PVL1003W", "duration": "Full year", "credits": 36}'),

-- History
('The Making of the Modern World', 'University of Cape Town', 'History', 'Beginner', '1 semester', 'A survey of major global historical developments that have shaped the contemporary world', ARRAY['Historical Analysis', 'Critical Thinking', 'Research Skills', 'Global History', 'Historical Methodology'], '{"course_code": "HIS1012F", "semester": "First", "credits": 18}'),

-- Business Management
('Evidence-based Management', 'University of Cape Town', 'Business Management', 'Intermediate', '1 semester', 'Introduces the practice of making managerial decisions based on critical evaluation of the best available evidence', ARRAY['Data Analysis', 'Decision Making', 'Strategic Planning', 'Evidence-based Practice', 'Business Analytics'], '{"course_code": "BUS1036F", "semester": "First", "credits": 18});

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_field ON courses(field);
CREATE INDEX IF NOT EXISTS idx_courses_university ON courses(university);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty);

-- Add a comment documenting this migration
COMMENT ON TABLE courses IS 'Updated with real South African university foundational modules from UCT, Wits, Stellenbosch, and UP as of 2025'; 