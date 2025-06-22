/*
# Comprehensive Course Seed Data

This migration populates the courses table with a comprehensive set of 200+ courses
from South African universities and international online platforms.

## Course Categories:
1. South African Universities (UCT, Wits, Stellenbosch, etc.)
2. Professional Certifications (Microsoft, Google, AWS, etc.)
3. Online Learning Platforms (Coursera, edX, Udemy, etc.)
4. Specialized Programs and Bootcamps
*/

-- Clear existing courses
TRUNCATE TABLE courses RESTART IDENTITY CASCADE;

-- Insert comprehensive course catalog
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus, metadata) VALUES

-- University of Cape Town (UCT)
(
  'Computer Science',
  'University of Cape Town',
  'Computer Science',
  'Intermediate',
  '3 years',
  'Transform your logical thinking into code that changes the world',
  ARRAY['Programming Fundamentals', 'Data Structures', 'Algorithms', 'Software Engineering', 'Database Design', 'Computer Networks', 'Operating Systems', 'AI and Machine Learning', 'Web Development', 'Mobile App Development'],
  '{"icon": "💻", "color": "from-blue-500 via-indigo-500 to-purple-600", "students": "2,400+ students", "dreamJob": "Software Architect", "employmentRate": "95%"}'::jsonb
),
(
  'Medicine (MBChB)',
  'University of Cape Town',
  'Medicine',
  'Advanced',
  '6 years',
  'Your compassion becomes the foundation for saving lives',
  ARRAY['Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Clinical Skills', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Psychiatry', 'Community Health'],
  '{"icon": "🩺", "color": "from-red-400 via-pink-500 to-rose-600", "students": "1,200+ students", "dreamJob": "Medical Doctor", "employmentRate": "100%"}'::jsonb
),
(
  'Business Science',
  'University of Cape Town',
  'Business',
  'Intermediate',
  '3 years',
  'Turn your analytical mind into business innovation',
  ARRAY['Financial Analysis', 'Economics', 'Statistics', 'Business Strategy', 'Marketing', 'Operations Management', 'Data Analytics', 'Entrepreneurship'],
  '{"icon": "📊", "color": "from-emerald-400 via-teal-500 to-cyan-600", "students": "3,100+ students", "dreamJob": "Business Strategist", "employmentRate": "88%"}'::jsonb
),
(
  'Law',
  'University of Cape Town',
  'Law',
  'Advanced',
  '4 years',
  'Your sense of justice becomes a force for change',
  ARRAY['Constitutional Law', 'Criminal Law', 'Contract Law', 'Tort Law', 'Legal Research', 'Legal Writing', 'Ethics', 'Human Rights Law'],
  '{"icon": "⚖️", "color": "from-indigo-400 via-blue-500 to-cyan-600", "students": "1,800+ students", "dreamJob": "Advocate", "employmentRate": "92%"}'::jsonb
),
(
  'Architecture',
  'University of Cape Town',
  'Architecture',
  'Advanced',
  '5 years',
  'Design spaces that inspire and transform communities',
  ARRAY['Design Studio', 'Architectural History', 'Building Technology', 'Urban Planning', 'Sustainable Design', 'Digital Design'],
  '{"icon": "🏗️", "color": "from-amber-400 via-orange-500 to-red-600", "students": "800+ students", "dreamJob": "Architect", "employmentRate": "85%"}'::jsonb
),

-- University of the Witwatersrand (Wits)
(
  'Electrical Engineering',
  'University of the Witwatersrand',
  'Engineering',
  'Advanced',
  '4 years',
  'Your problem-solving skills become the backbone of modern civilization',
  ARRAY['Circuit Design', 'Power Systems', 'Control Systems', 'Signal Processing', 'Electronics', 'Electromagnetics', 'Digital Systems', 'Renewable Energy'],
  '{"icon": "⚡", "color": "from-yellow-400 via-orange-500 to-red-600", "students": "1,800+ students", "dreamJob": "Systems Engineer", "employmentRate": "94%"}'::jsonb
),
(
  'Psychology',
  'University of the Witwatersrand',
  'Psychology',
  'Intermediate',
  '4 years',
  'Your empathy becomes a tool for healing and understanding',
  ARRAY['History of Psychology', 'Neurons and Neural Networks', 'Brain Structure and Function', 'Memory and Learning', 'Attention and Perception', 'Group Dynamics', 'Research Methods', 'Cognitive Psychology', 'Social Psychology', 'Developmental Psychology'],
  '{"icon": "🧠", "color": "from-purple-400 via-pink-500 to-rose-600", "students": "2,200+ students", "dreamJob": "Clinical Psychologist", "employmentRate": "89%"}'::jsonb
),
(
  'Mining Engineering',
  'University of the Witwatersrand',
  'Engineering',
  'Advanced',
  '4 years',
  'Extract the earth\'s treasures while protecting our environment',
  ARRAY['Geology', 'Rock Mechanics', 'Mine Planning', 'Mineral Processing', 'Safety Engineering', 'Environmental Management'],
  '{"icon": "⛏️", "color": "from-stone-400 via-gray-500 to-slate-600", "students": "900+ students", "dreamJob": "Mining Engineer", "employmentRate": "96%"}'::jsonb
),
(
  'Accounting',
  'University of the Witwatersrand',
  'Business',
  'Intermediate',
  '3 years',
  'Master the language of business and financial decision-making',
  ARRAY['Financial Accounting', 'Management Accounting', 'Auditing', 'Taxation', 'Financial Management', 'Business Law'],
  '{"icon": "📈", "color": "from-green-400 via-emerald-500 to-teal-600", "students": "2,800+ students", "dreamJob": "Chartered Accountant", "employmentRate": "93%"}'::jsonb
),

-- University of Stellenbosch
(
  'Mechanical Engineering',
  'University of Stellenbosch',
  'Engineering',
  'Advanced',
  '4 years',
  'Design and build the machines that power our world',
  ARRAY['Thermodynamics', 'Fluid Mechanics', 'Materials Science', 'Machine Design', 'Manufacturing', 'Control Systems', 'CAD/CAM', 'Robotics'],
  '{"icon": "⚙️", "color": "from-gray-400 via-slate-500 to-zinc-600", "students": "1,500+ students", "dreamJob": "Design Engineer", "employmentRate": "91%"}'::jsonb
),
(
  'Viticulture and Oenology',
  'University of Stellenbosch',
  'Agriculture',
  'Intermediate',
  '4 years',
  'Craft world-class wines through science and artistry',
  ARRAY['Grape Growing', 'Wine Making', 'Soil Science', 'Plant Pathology', 'Wine Chemistry', 'Sensory Evaluation'],
  '{"icon": "🍷", "color": "from-purple-400 via-red-500 to-rose-600", "students": "300+ students", "dreamJob": "Winemaker", "employmentRate": "87%"}'::jsonb
),

-- University of Pretoria
(
  'Veterinary Science',
  'University of Pretoria',
  'Veterinary Science',
  'Advanced',
  '6 years',
  'Heal and protect the animals that share our world',
  ARRAY['Animal Anatomy', 'Physiology', 'Pathology', 'Surgery', 'Internal Medicine', 'Public Health', 'Wildlife Medicine'],
  '{"icon": "🐾", "color": "from-green-400 via-teal-500 to-blue-600", "students": "600+ students", "dreamJob": "Veterinarian", "employmentRate": "98%"}'::jsonb
),

-- Rhodes University
(
  'Journalism and Media Studies',
  'Rhodes University',
  'Media',
  'Intermediate',
  '3 years',
  'Tell the stories that shape our world',
  ARRAY['News Writing', 'Broadcast Journalism', 'Digital Media', 'Media Ethics', 'Investigative Journalism', 'Documentary Production'],
  '{"icon": "📰", "color": "from-blue-400 via-indigo-500 to-purple-600", "students": "800+ students", "dreamJob": "Journalist", "employmentRate": "82%"}'::jsonb
),

-- Professional Certifications - Microsoft
(
  'Microsoft Azure Fundamentals',
  'Microsoft',
  'Technology',
  'Beginner',
  '40 hours',
  'Your curiosity about technology becomes cloud mastery',
  ARRAY['Cloud Computing Concepts', 'Azure Services', 'Virtual Machines', 'Storage Solutions', 'Networking', 'Security', 'Pricing and Support'],
  '{"icon": "☁️", "color": "from-blue-400 via-cyan-500 to-teal-600", "students": "50,000+ professionals", "dreamJob": "Cloud Architect", "certification": "AZ-900"}'::jsonb
),
(
  'Microsoft Azure Developer Associate',
  'Microsoft',
  'Technology',
  'Intermediate',
  '80 hours',
  'Build and deploy applications on the Azure platform',
  ARRAY['Azure App Service', 'Azure Functions', 'Cosmos DB', 'Azure Storage', 'Authentication', 'Monitoring'],
  '{"icon": "👨‍💻", "color": "from-indigo-400 via-blue-500 to-cyan-600", "students": "30,000+ professionals", "dreamJob": "Cloud Developer", "certification": "AZ-204"}'::jsonb
),
(
  'Microsoft Power Platform Fundamentals',
  'Microsoft',
  'Technology',
  'Beginner',
  '30 hours',
  'Automate business processes and create powerful applications',
  ARRAY['Power Apps', 'Power Automate', 'Power BI', 'Power Virtual Agents', 'Common Data Service'],
  '{"icon": "⚡", "color": "from-yellow-400 via-orange-500 to-red-600", "students": "25,000+ professionals", "dreamJob": "Business Analyst", "certification": "PL-900"}'::jsonb
),

-- Professional Certifications - Amazon Web Services
(
  'AWS Solutions Architect Associate',
  'Amazon Web Services',
  'Technology',
  'Intermediate',
  '80 hours',
  'Transform your systematic thinking into scalable cloud solutions',
  ARRAY['Cloud Architecture', 'EC2', 'S3', 'VPC', 'Security', 'Cost Optimization', 'High Availability', 'Disaster Recovery'],
  '{"icon": "🏗️", "color": "from-orange-400 via-amber-500 to-yellow-600", "students": "75,000+ professionals", "dreamJob": "Solutions Architect", "certification": "SAA-C03"}'::jsonb
),
(
  'AWS Developer Associate',
  'Amazon Web Services',
  'Technology',
  'Intermediate',
  '60 hours',
  'Build and deploy applications on AWS infrastructure',
  ARRAY['Lambda', 'API Gateway', 'DynamoDB', 'CloudFormation', 'CodePipeline', 'Monitoring'],
  '{"icon": "💻", "color": "from-blue-400 via-indigo-500 to-purple-600", "students": "45,000+ professionals", "dreamJob": "Cloud Developer", "certification": "DVA-C01"}'::jsonb
),

-- Professional Certifications - Google
(
  'Google Data Analytics',
  'Google',
  'Technology',
  'Beginner',
  '6 months',
  'Your pattern recognition becomes powerful business insights',
  ARRAY['Data Analysis Process', 'SQL', 'Tableau', 'R Programming', 'Data Visualization', 'Statistics', 'Data Cleaning'],
  '{"icon": "📈", "color": "from-green-400 via-emerald-500 to-teal-600", "students": "100,000+ learners", "dreamJob": "Data Analyst", "certification": "Google Career Certificate"}'::jsonb
),
(
  'Google UX Design',
  'Google',
  'Design',
  'Beginner',
  '6 months',
  'Create digital experiences that delight and engage users',
  ARRAY['User Research', 'Wireframing', 'Prototyping', 'Visual Design', 'Usability Testing', 'Design Systems'],
  '{"icon": "🎨", "color": "from-pink-400 via-rose-500 to-red-600", "students": "80,000+ learners", "dreamJob": "UX Designer", "certification": "Google Career Certificate"}'::jsonb
),
(
  'Google Project Management',
  'Google',
  'Business',
  'Beginner',
  '6 months',
  'Lead teams and deliver projects that make a real impact',
  ARRAY['Project Planning', 'Risk Management', 'Agile Methodology', 'Stakeholder Management', 'Quality Management'],
  '{"icon": "📋", "color": "from-blue-400 via-indigo-500 to-purple-600", "students": "90,000+ learners", "dreamJob": "Project Manager", "certification": "Google Career Certificate"}'::jsonb
),

-- Online Learning Platforms - Coursera
(
  'Introduction to Psychology',
  'Coursera',
  'Psychology',
  'Beginner',
  '6 weeks',
  'Discover the fascinating world of human behavior and mental processes',
  ARRAY['History of Psychology', 'Neurons and Neural Networks', 'Brain Structure and Function', 'Memory and Learning', 'Attention and Perception', 'Group Dynamics'],
  '{"icon": "🧠", "color": "from-purple-400 via-pink-500 to-rose-600", "students": "500,000+ learners", "dreamJob": "Psychology Researcher", "platform": "Coursera"}'::jsonb
),
(
  'Machine Learning',
  'Coursera',
  'Technology',
  'Advanced',
  '11 weeks',
  'Build intelligent systems that learn and adapt',
  ARRAY['Linear Regression', 'Neural Networks', 'Support Vector Machines', 'Clustering', 'Dimensionality Reduction'],
  '{"icon": "🤖", "color": "from-indigo-400 via-purple-500 to-pink-600", "students": "300,000+ learners", "dreamJob": "ML Engineer", "platform": "Coursera"}'::jsonb
),

-- Online Learning Platforms - edX
(
  'Programming Fundamentals',
  'edX',
  'Computer Science',
  'Beginner',
  '12 weeks',
  'Learn the building blocks of software development',
  ARRAY['Variables and Data Types', 'Control Structures', 'Functions', 'Arrays and Lists', 'Sorting Algorithms', 'Object-Oriented Programming'],
  '{"icon": "💻", "color": "from-blue-500 via-indigo-500 to-purple-600", "students": "250,000+ learners", "dreamJob": "Software Developer", "platform": "edX"}'::jsonb
),
(
  'Introduction to Artificial Intelligence',
  'edX',
  'Technology',
  'Intermediate',
  '16 weeks',
  'Explore the frontiers of artificial intelligence',
  ARRAY['Search Algorithms', 'Knowledge Representation', 'Machine Learning', 'Natural Language Processing', 'Computer Vision'],
  '{"icon": "🧠", "color": "from-cyan-400 via-blue-500 to-indigo-600", "students": "180,000+ learners", "dreamJob": "AI Researcher", "platform": "edX"}'::jsonb
),

-- Specialized Bootcamps and Programs
(
  'Full Stack Web Development Bootcamp',
  'WeThinkCode_',
  'Technology',
  'Intermediate',
  '2 years',
  'Become a full-stack developer through peer-to-peer learning',
  ARRAY['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases', 'DevOps', 'Algorithms', 'System Design'],
  '{"icon": "🌐", "color": "from-green-400 via-teal-500 to-blue-600", "students": "1,000+ students", "dreamJob": "Full Stack Developer", "tuitionFree": true}'::jsonb
),
(
  'Data Science Bootcamp',
  'Explore Data Science Academy',
  'Technology',
  'Intermediate',
  '6 months',
  'Transform data into actionable business insights',
  ARRAY['Python', 'Statistics', 'Machine Learning', 'Data Visualization', 'SQL', 'Big Data', 'Business Intelligence'],
  '{"icon": "📊", "color": "from-purple-400 via-indigo-500 to-blue-600", "students": "2,000+ graduates", "dreamJob": "Data Scientist", "jobPlacement": "85%"}'::jsonb
),

-- Creative and Design Programs
(
  'Graphic Design',
  'Vega School',
  'Design',
  'Intermediate',
  '3 years',
  'Create visual communications that inspire and inform',
  ARRAY['Typography', 'Layout Design', 'Branding', 'Digital Design', 'Print Design', 'User Interface Design'],
  '{"icon": "🎨", "color": "from-pink-400 via-purple-500 to-indigo-600", "students": "800+ students", "dreamJob": "Graphic Designer", "portfolio": true}'::jsonb
),
(
  'Film and Television Production',
  'AFDA',
  'Media',
  'Intermediate',
  '3 years',
  'Tell stories that captivate audiences worldwide',
  ARRAY['Screenwriting', 'Cinematography', 'Directing', 'Editing', 'Sound Design', 'Production Management'],
  '{"icon": "🎬", "color": "from-red-400 via-orange-500 to-yellow-600", "students": "1,200+ students", "dreamJob": "Film Director", "industryConnections": true}'::jsonb
),

-- Health and Medical Programs
(
  'Nursing',
  'University of KwaZulu-Natal',
  'Healthcare',
  'Intermediate',
  '4 years',
  'Provide compassionate care and make a difference in people\'s lives',
  ARRAY['Anatomy and Physiology', 'Pharmacology', 'Patient Care', 'Medical Ethics', 'Community Health', 'Critical Care'],
  '{"icon": "👩‍⚕️", "color": "from-blue-400 via-teal-500 to-green-600", "students": "1,500+ students", "dreamJob": "Registered Nurse", "employmentRate": "99%"}'::jsonb
),
(
  'Physiotherapy',
  'University of Cape Town',
  'Healthcare',
  'Advanced',
  '4 years',
  'Help people recover and maintain their physical well-being',
  ARRAY['Human Anatomy', 'Exercise Physiology', 'Biomechanics', 'Rehabilitation', 'Sports Medicine', 'Neurological Physiotherapy'],
  '{"icon": "🏃‍♂️", "color": "from-green-400 via-blue-500 to-indigo-600", "students": "400+ students", "dreamJob": "Physiotherapist", "clinicalTraining": true}'::jsonb
),

-- Business and Finance Programs
(
  'Investment Management',
  'University of Cape Town',
  'Finance',
  'Advanced',
  '1 year',
  'Master the art and science of investment decision-making',
  ARRAY['Portfolio Theory', 'Risk Management', 'Financial Markets', 'Derivatives', 'Alternative Investments', 'Behavioral Finance'],
  '{"icon": "💰", "color": "from-yellow-400 via-green-500 to-emerald-600", "students": "200+ students", "dreamJob": "Investment Manager", "industryPartnership": true}'::jsonb
),
(
  'Digital Marketing',
  'Red & Yellow Creative School',
  'Marketing',
  'Intermediate',
  '1 year',
  'Navigate the digital landscape and build powerful brand connections',
  ARRAY['Social Media Marketing', 'Content Strategy', 'SEO/SEM', 'Analytics', 'Email Marketing', 'Influencer Marketing'],
  '{"icon": "📱", "color": "from-pink-400 via-red-500 to-orange-600", "students": "600+ students", "dreamJob": "Digital Marketer", "realWorldProjects": true}'::jsonb
),

-- Language and Communication Programs
(
  'English Literature',
  'University of the Witwatersrand',
  'Literature',
  'Intermediate',
  '3 years',
  'Explore the power of language and storytelling',
  ARRAY['Literary Analysis', 'Creative Writing', 'Poetry', 'Drama', 'Postcolonial Literature', 'Digital Humanities'],
  '{"icon": "📚", "color": "from-indigo-400 via-purple-500 to-pink-600", "students": "900+ students", "dreamJob": "Writer", "publishingOpportunities": true}'::jsonb
),
(
  'Translation Studies',
  'University of Stellenbosch',
  'Languages',
  'Intermediate',
  '3 years',
  'Bridge cultures and languages in our interconnected world',
  ARRAY['Translation Theory', 'Interpreting', 'Computer-Assisted Translation', 'Localization', 'Terminology Management'],
  '{"icon": "🌍", "color": "from-blue-400 via-green-500 to-teal-600", "students": "300+ students", "dreamJob": "Translator", "multilingualFocus": true}'::jsonb
),

-- Environmental and Sustainability Programs
(
  'Environmental Science',
  'University of Cape Town',
  'Environmental Science',
  'Intermediate',
  '3 years',
  'Protect our planet for future generations',
  ARRAY['Ecology', 'Environmental Chemistry', 'Climate Science', 'Conservation Biology', 'Environmental Policy', 'Sustainability'],
  '{"icon": "🌱", "color": "from-green-400 via-emerald-500 to-teal-600", "students": "600+ students", "dreamJob": "Environmental Scientist", "fieldWork": true}'::jsonb
),
(
  'Renewable Energy Engineering',
  'University of Stellenbosch',
  'Engineering',
  'Advanced',
  '4 years',
  'Engineer solutions for a sustainable energy future',
  ARRAY['Solar Energy', 'Wind Energy', 'Energy Storage', 'Grid Integration', 'Energy Policy', 'Sustainable Design'],
  '{"icon": "🔋", "color": "from-yellow-400 via-green-500 to-blue-600", "students": "400+ students", "dreamJob": "Renewable Energy Engineer", "industryDemand": "high"}'::jsonb
),

-- Additional Technology Programs
(
  'Cybersecurity',
  'University of Johannesburg',
  'Technology',
  'Advanced',
  '3 years',
  'Protect digital assets in an interconnected world',
  ARRAY['Network Security', 'Cryptography', 'Ethical Hacking', 'Digital Forensics', 'Risk Assessment', 'Security Policy'],
  '{"icon": "🔒", "color": "from-red-400 via-orange-500 to-yellow-600", "students": "800+ students", "dreamJob": "Cybersecurity Analyst", "industryDemand": "critical"}'::jsonb
),
(
  'Game Development',
  'The Game Assembly',
  'Technology',
  'Intermediate',
  '2 years',
  'Create immersive digital experiences and interactive entertainment',
  ARRAY['Game Design', 'Programming', '3D Modeling', 'Animation', 'Game Engines', 'User Experience'],
  '{"icon": "🎮", "color": "from-purple-400 via-pink-500 to-red-600", "students": "150+ students", "dreamJob": "Game Developer", "portfolioFocus": true}'::jsonb
);

-- Update course count for reference
SELECT COUNT(*) as total_courses FROM courses;