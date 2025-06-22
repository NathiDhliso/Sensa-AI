/*
  # Seed Course Data

  1. Sample Courses
    - University of Cape Town courses
    - University of the Witwatersrand courses
    - Professional certifications
    - Online courses

  2. Course Categories
    - Computer Science
    - Psychology
    - Medicine
    - Business
    - Engineering
    - Technology Certifications
*/

-- Insert sample courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus, metadata) VALUES
-- University of Cape Town
(
  'Computer Science',
  'University of Cape Town',
  'Computer Science',
  'Intermediate',
  '3 years',
  'Transform your logical thinking into code that changes the world',
  ARRAY['Programming Fundamentals', 'Data Structures', 'Algorithms', 'Software Engineering', 'Database Design', 'Computer Networks', 'Operating Systems', 'AI and Machine Learning'],
  '{"icon": "💻", "color": "from-blue-500 via-indigo-500 to-purple-600", "students": "2,400+ students", "dreamJob": "Software Architect"}'::jsonb
),
(
  'Medicine (MBChB)',
  'University of Cape Town',
  'Medicine',
  'Advanced',
  '6 years',
  'Your compassion becomes the foundation for saving lives',
  ARRAY['Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Clinical Skills', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Psychiatry'],
  '{"icon": "🩺", "color": "from-red-400 via-pink-500 to-rose-600", "students": "1,200+ students", "dreamJob": "Medical Doctor"}'::jsonb
),
(
  'Business Science',
  'University of Cape Town',
  'Business',
  'Intermediate',
  '3 years',
  'Turn your analytical mind into business innovation',
  ARRAY['Financial Analysis', 'Economics', 'Statistics', 'Business Strategy', 'Marketing', 'Operations Management', 'Data Analytics'],
  '{"icon": "📊", "color": "from-emerald-400 via-teal-500 to-cyan-600", "students": "3,100+ students", "dreamJob": "Business Strategist"}'::jsonb
),

-- University of the Witwatersrand
(
  'Electrical Engineering',
  'University of the Witwatersrand',
  'Engineering',
  'Advanced',
  '4 years',
  'Your problem-solving skills become the backbone of modern civilization',
  ARRAY['Circuit Design', 'Power Systems', 'Control Systems', 'Signal Processing', 'Electronics', 'Electromagnetics', 'Digital Systems'],
  '{"icon": "⚡", "color": "from-yellow-400 via-orange-500 to-red-600", "students": "1,800+ students", "dreamJob": "Systems Engineer"}'::jsonb
),
(
  'Psychology',
  'University of the Witwatersrand',
  'Psychology',
  'Intermediate',
  '4 years',
  'Your empathy becomes a tool for healing and understanding',
  ARRAY['History of Psychology', 'Neurons and Neural Networks', 'Brain Structure and Function', 'Memory and Learning', 'Attention and Perception', 'Group Dynamics', 'Research Methods', 'Cognitive Psychology', 'Social Psychology', 'Developmental Psychology'],
  '{"icon": "🧠", "color": "from-purple-400 via-pink-500 to-rose-600", "students": "2,200+ students", "dreamJob": "Clinical Psychologist"}'::jsonb
),

-- Professional Certifications
(
  'Microsoft Azure Fundamentals',
  'Microsoft',
  'Technology',
  'Beginner',
  '40 hours',
  'Your curiosity about technology becomes cloud mastery',
  ARRAY['Cloud Computing Concepts', 'Azure Services', 'Virtual Machines', 'Storage Solutions', 'Networking', 'Security', 'Pricing and Support'],
  '{"icon": "☁️", "color": "from-blue-400 via-cyan-500 to-teal-600", "students": "50,000+ professionals", "dreamJob": "Cloud Architect"}'::jsonb
),
(
  'AWS Solutions Architect',
  'Amazon Web Services',
  'Technology',
  'Intermediate',
  '80 hours',
  'Transform your systematic thinking into scalable cloud solutions',
  ARRAY['Cloud Architecture', 'EC2', 'S3', 'VPC', 'Security', 'Cost Optimization', 'High Availability', 'Disaster Recovery'],
  '{"icon": "🏗️", "color": "from-orange-400 via-amber-500 to-yellow-600", "students": "75,000+ professionals", "dreamJob": "Solutions Architect"}'::jsonb
),
(
  'Google Data Analytics',
  'Google',
  'Technology',
  'Beginner',
  '6 months',
  'Your pattern recognition becomes powerful business insights',
  ARRAY['Data Analysis Process', 'SQL', 'Tableau', 'R Programming', 'Data Visualization', 'Statistics', 'Data Cleaning'],
  '{"icon": "📈", "color": "from-green-400 via-emerald-500 to-teal-600", "students": "100,000+ learners", "dreamJob": "Data Analyst"}'::jsonb
),

-- Additional Universities
(
  'Mechanical Engineering',
  'University of Stellenbosch',
  'Engineering',
  'Advanced',
  '4 years',
  'Design and build the machines that power our world',
  ARRAY['Thermodynamics', 'Fluid Mechanics', 'Materials Science', 'Machine Design', 'Manufacturing', 'Control Systems', 'CAD/CAM'],
  '{"icon": "⚙️", "color": "from-gray-400 via-slate-500 to-zinc-600", "students": "1,500+ students", "dreamJob": "Design Engineer"}'::jsonb
),
(
  'Law',
  'University of Cape Town',
  'Law',
  'Advanced',
  '4 years',
  'Your sense of justice becomes a force for change',
  ARRAY['Constitutional Law', 'Criminal Law', 'Contract Law', 'Tort Law', 'Legal Research', 'Legal Writing', 'Ethics'],
  '{"icon": "⚖️", "color": "from-indigo-400 via-blue-500 to-cyan-600", "students": "1,800+ students", "dreamJob": "Advocate"}'::jsonb
),

-- Online Courses
(
  'Introduction to Psychology',
  'Coursera',
  'Psychology',
  'Beginner',
  '6 weeks',
  'Discover the fascinating world of human behavior and mental processes',
  ARRAY['History of Psychology', 'Neurons and Neural Networks', 'Brain Structure and Function', 'Memory and Learning', 'Attention and Perception', 'Group Dynamics'],
  '{"icon": "🧠", "color": "from-purple-400 via-pink-500 to-rose-600", "students": "500,000+ learners", "dreamJob": "Psychology Researcher"}'::jsonb
),
(
  'Programming Fundamentals',
  'edX',
  'Computer Science',
  'Beginner',
  '12 weeks',
  'Learn the building blocks of software development',
  ARRAY['Variables and Data Types', 'Control Structures', 'Functions', 'Arrays and Lists', 'Sorting Algorithms', 'Object-Oriented Programming'],
  '{"icon": "💻", "color": "from-blue-500 via-indigo-500 to-purple-600", "students": "250,000+ learners", "dreamJob": "Software Developer"}'::jsonb
);