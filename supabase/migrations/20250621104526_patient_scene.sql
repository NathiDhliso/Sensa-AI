/*
  # Update courses database with South African university courses
  
  1. New Tables
    - None (using existing courses table)
  
  2. Changes
    - Adds comprehensive list of South African university courses
    - Organizes courses by field and category
    - Includes detailed descriptions for each course
  
  3. Security
    - Maintains existing RLS policies
*/

-- Clear existing courses to avoid duplicates
DELETE FROM courses;

-- Computer Science & Information Technology courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Computer Science I', 'University of Cape Town', 'Computer Science', 'Beginner', '1 semester', 'Introduces fundamental programming concepts, problem-solving, and algorithm development using a high-level language like Python.', ARRAY['Programming Basics', 'Problem Solving', 'Algorithm Development', 'Python Fundamentals']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Computer Science II', 'University of Cape Town', 'Computer Science', 'Beginner', '1 semester', 'Builds on programming foundations with an introduction to object-oriented programming (OOP), basic data structures, and the Java language.', ARRAY['Object-Oriented Programming', 'Java', 'Basic Data Structures', 'Software Design']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Algorithms & Programming', 'University of the Witwatersrand', 'Computer Science', 'Beginner', '1 semester', 'Establishes core principles of algorithm design, efficiency analysis, and practical implementation for solving computational problems.', ARRAY['Algorithm Design', 'Efficiency Analysis', 'Problem Solving', 'Programming Fundamentals']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Data Structures & Algorithms', 'University of Cape Town', 'Computer Science', 'Intermediate', '1 semester', 'A core second-year course on the implementation and analysis of fundamental data structures like lists, trees, and graphs.', ARRAY['Lists', 'Trees', 'Graphs', 'Algorithm Analysis', 'Sorting Algorithms', 'Searching Algorithms']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Computer Architecture & Concurrency', 'University of Cape Town', 'Computer Science', 'Intermediate', '1 semester', 'Introduces the organization of computer hardware, including the CPU and memory hierarchy, and the principles of concurrent programming.', ARRAY['CPU Architecture', 'Memory Hierarchy', 'Concurrent Programming', 'Operating Systems Fundamentals']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Database Systems', 'University of Pretoria', 'Computer Science', 'Intermediate', '1 semester', 'Covers the theory and practice of database systems, including the relational model, SQL, and database design.', ARRAY['Relational Model', 'SQL', 'Database Design', 'Normalization', 'Transaction Processing']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Cloud Computing', 'Online Learning Platform', 'Computer Science', 'Beginner', '6 weeks', 'Provides a foundational understanding of cloud computing concepts, services (IaaS, PaaS, SaaS), and deployment models.', ARRAY['Cloud Concepts', 'Service Models', 'Deployment Models', 'Cloud Security', 'Cloud Providers']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('AI For Everyone', 'Online Learning Platform', 'Computer Science', 'Beginner', '4 weeks', 'A non-technical introduction to artificial intelligence, explaining its capabilities, limitations, and societal impact.', ARRAY['AI Concepts', 'Machine Learning', 'AI Applications', 'AI Ethics', 'Future of AI']);

-- Biological & Life Sciences courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Cell Biology', 'University of Cape Town', 'Biology', 'Beginner', '1 semester', 'Explores the structure, function, and biochemistry of the cell as the fundamental unit of life.', ARRAY['Cell Structure', 'Cell Function', 'Cell Biochemistry', 'Organelles', 'Cell Division']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Biological Diversity', 'University of Cape Town', 'Biology', 'Beginner', '1 semester', 'A survey of the major groups of living organisms, exploring their evolutionary relationships and ecological roles.', ARRAY['Taxonomy', 'Evolution', 'Ecology', 'Biodiversity', 'Conservation']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Principles of Ecology & Evolution', 'University of Cape Town', 'Biology', 'Intermediate', '1 semester', 'A core second-year course examining the interactions between organisms and their environment and the evolutionary processes that shape them.', ARRAY['Ecological Systems', 'Natural Selection', 'Population Dynamics', 'Speciation', 'Adaptation']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Biochemistry', 'University of Pretoria', 'Biochemistry', 'Intermediate', '1 semester', 'Introduces the chemistry of life, focusing on the structure and function of proteins, carbohydrates, lipids, and nucleic acids.', ARRAY['Proteins', 'Carbohydrates', 'Lipids', 'Nucleic Acids', 'Enzymes', 'Metabolism']);

-- Physical Sciences courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Physics A for Engineers', 'University of Cape Town', 'Physics', 'Beginner', '1 semester', 'A calculus-based introduction to mechanics and thermodynamics tailored for engineering students.', ARRAY['Mechanics', 'Thermodynamics', 'Energy', 'Motion', 'Forces']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Physics B for Engineers', 'University of Cape Town', 'Physics', 'Beginner', '1 semester', 'A calculus-based introduction to electromagnetism, waves, and optics for engineering students.', ARRAY['Electromagnetism', 'Waves', 'Optics', 'Electric Fields', 'Magnetic Fields']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Chemistry I', 'University of Cape Town', 'Chemistry', 'Beginner', '1 year', 'A year-long introduction to the fundamental principles of chemistry, including atomic structure, bonding, and stoichiometry.', ARRAY['Atomic Structure', 'Chemical Bonding', 'Stoichiometry', 'Thermochemistry', 'Chemical Equilibrium']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Chemistry for Engineers', 'University of Cape Town', 'Chemistry', 'Beginner', '1 semester', 'A foundational chemistry course focusing on principles of materials science and chemical processes relevant to engineering.', ARRAY['Materials Science', 'Chemical Processes', 'Thermodynamics', 'Electrochemistry', 'Corrosion']);

-- Mathematical & Statistical Sciences courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Mathematics 1A for Engineers', 'University of Cape Town', 'Mathematics', 'Beginner', '1 semester', 'A foundational calculus course for engineering students, covering limits, differentiation, and integration.', ARRAY['Limits', 'Differentiation', 'Integration', 'Applications of Calculus']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Mathematics 1B for Engineers', 'University of Cape Town', 'Mathematics', 'Beginner', '1 semester', 'Continues the study of calculus for engineers, introducing multivariable calculus and differential equations.', ARRAY['Multivariable Calculus', 'Differential Equations', 'Series', 'Vectors']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Linear Algebra', 'University of Cape Town', 'Mathematics', 'Intermediate', '1 semester', 'Covers vector spaces, linear transformations, eigenvalues, and eigenvectors, which are fundamental to all quantitative fields.', ARRAY['Vector Spaces', 'Linear Transformations', 'Eigenvalues', 'Eigenvectors', 'Matrices']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Statistics for Engineers', 'University of Cape Town', 'Statistics', 'Beginner', '1 semester', 'An introduction to probability theory and statistical methods tailored for engineering applications.', ARRAY['Probability Theory', 'Statistical Methods', 'Data Analysis', 'Hypothesis Testing', 'Regression Analysis']);

-- Engineering courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Engineering Drawing', 'University of Cape Town', 'Mechanical Engineering', 'Beginner', '1 year', 'Teaches the principles of technical drawing and computer-aided design (CAD) for communicating engineering designs.', ARRAY['Technical Drawing', 'CAD', 'Orthographic Projection', 'Dimensioning', 'Assembly Drawings']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Engineering Mechanics', 'University of Cape Town', 'Civil Engineering', 'Beginner', '1 semester', 'Introduces the fundamental principles of statics and dynamics for analyzing forces and motion in engineering systems.', ARRAY['Statics', 'Dynamics', 'Force Analysis', 'Equilibrium', 'Motion']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Engineering Thermodynamics I', 'University of the Witwatersrand', 'Mechanical Engineering', 'Intermediate', '1 semester', 'Introduces the laws of thermodynamics and their application to energy conversion systems.', ARRAY['Laws of Thermodynamics', 'Energy Conversion', 'Heat Transfer', 'Entropy', 'Thermodynamic Cycles']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Electric Circuits', 'University of the Witwatersrand', 'Electrical Engineering', 'Intermediate', '1 semester', 'A foundational course on the analysis of direct current (DC) and alternating current (AC) electrical circuits.', ARRAY['DC Circuits', 'AC Circuits', 'Circuit Analysis', 'Kirchhoff''s Laws', 'Thevenin''s Theorem']);

-- Commerce, Economics, and Management courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Accounting I', 'University of the Witwatersrand', 'Accounting', 'Beginner', '1 semester', 'Introduces the fundamental principles of financial accounting, the accounting cycle, and the preparation of financial statements.', ARRAY['Financial Accounting', 'Accounting Cycle', 'Financial Statements', 'Debits and Credits', 'Accounting Standards']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Microeconomics I', 'University of Cape Town', 'Economics', 'Beginner', '1 semester', 'Introduces the theory of consumer behavior, firm behavior, and market structures like competition and monopoly.', ARRAY['Consumer Behavior', 'Firm Behavior', 'Market Structures', 'Supply and Demand', 'Elasticity']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Macroeconomics I', 'University of Cape Town', 'Economics', 'Beginner', '1 semester', 'Introduces the study of the economy as a whole, including topics like GDP, inflation, unemployment, and economic growth.', ARRAY['GDP', 'Inflation', 'Unemployment', 'Economic Growth', 'Fiscal Policy', 'Monetary Policy']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Finance', 'University of the Witwatersrand', 'Finance', 'Intermediate', '1 semester', 'Provides an overview of financial management, financial markets, and the basic principles of investment.', ARRAY['Financial Management', 'Financial Markets', 'Investment Principles', 'Time Value of Money', 'Risk and Return']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Marketing I', 'University of Cape Town', 'Business', 'Beginner', '1 semester', 'An introduction to the principles of marketing, including market research, consumer behavior, and the marketing mix.', ARRAY['Market Research', 'Consumer Behavior', 'Marketing Mix', 'Product Strategy', 'Pricing Strategy', 'Promotion Strategy']);

-- Psychology courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Psychology I', 'University of Cape Town', 'Psychology', 'Beginner', '1 semester', 'Provides a broad overview of the field of psychology, covering its history, major perspectives, and key areas of study.', ARRAY['History of Psychology', 'Major Perspectives', 'Research Methods', 'Biological Bases of Behavior', 'Sensation and Perception']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Psychology II', 'University of Cape Town', 'Psychology', 'Beginner', '1 semester', 'Continues the introduction to psychology, often focusing on specific subfields like personality, health, and psychological disorders.', ARRAY['Personality', 'Health Psychology', 'Psychological Disorders', 'Social Psychology', 'Developmental Psychology']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Research in Psychology I', 'University of Cape Town', 'Psychology', 'Intermediate', '1 semester', 'Introduces students to the principles of research design and data analysis in psychology.', ARRAY['Research Design', 'Data Analysis', 'Statistical Methods', 'Experimental Methods', 'Ethical Considerations']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Social Psychology & Intergroup Relations', 'University of Cape Town', 'Psychology', 'Intermediate', '1 semester', 'Examines how individuals'' thoughts, feelings, and behaviors are influenced by the actual, imagined, or implied presence of others.', ARRAY['Social Influence', 'Attitudes', 'Group Dynamics', 'Stereotyping', 'Prejudice', 'Intergroup Relations']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Developmental Psychology', 'University of Cape Town', 'Psychology', 'Intermediate', '1 semester', 'Studies the psychological changes that occur across the human lifespan, from infancy to old age.', ARRAY['Infancy', 'Childhood', 'Adolescence', 'Adulthood', 'Aging', 'Cognitive Development', 'Social Development']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Cognition and Neuroscience', 'University of Cape Town', 'Psychology', 'Intermediate', '1 semester', 'Explores the mental processes of knowing, including attention, language, memory, and perception, and their neural underpinnings.', ARRAY['Attention', 'Language', 'Memory', 'Perception', 'Brain Structure', 'Neural Function']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Clinical Psychology 1', 'University of Cape Town', 'Psychology', 'Intermediate', '1 semester', 'An introduction to the field of clinical psychology, including the assessment, diagnosis, and treatment of psychological disorders.', ARRAY['Psychological Assessment', 'Diagnosis', 'Treatment', 'Therapeutic Approaches', 'Mental Health']);

-- Sociology & Anthropology courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Sociology', 'University of Cape Town', 'Sociology', 'Beginner', '1 semester', 'Introduces the sociological imagination and how social structures like family, education, and work shape individual lives.', ARRAY['Sociological Imagination', 'Social Structures', 'Family', 'Education', 'Work', 'Social Institutions']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Individual and Society', 'University of Cape Town', 'Sociology', 'Beginner', '1 semester', 'Focuses on key issues in contemporary South African society, exploring social inequality and how people navigate their daily lives.', ARRAY['Social Inequality', 'Race', 'Class', 'Gender', 'South African Society']);

-- History & Philosophy courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('The Making of the Modern World', 'University of Cape Town', 'History', 'Beginner', '1 semester', 'A survey of major global historical developments that have shaped the contemporary world.', ARRAY['Industrial Revolution', 'World Wars', 'Decolonization', 'Globalization', 'Contemporary Issues']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('South Africa: A Social and Economic History', 'University of Cape Town', 'History', 'Beginner', '1 semester', 'Explores the social and economic history of South Africa, focusing on themes of conquest, labor, and resistance.', ARRAY['Colonization', 'Apartheid', 'Resistance Movements', 'Democratic Transition', 'Contemporary South Africa']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Philosophy', 'University of Cape Town', 'Philosophy', 'Beginner', '1 semester', 'Aims to make students more critical in thinking about fundamental beliefs and values concerning the self, free will, and knowledge.', ARRAY['Epistemology', 'Metaphysics', 'Ethics', 'Logic', 'Philosophy of Mind']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Ethics', 'University of Cape Town', 'Philosophy', 'Beginner', '1 semester', 'Introduces students to moral philosophy and its central questions about right action, objectivity, and the good life.', ARRAY['Moral Philosophy', 'Normative Ethics', 'Applied Ethics', 'Meta-ethics', 'Virtue Ethics']);

-- Law & Legal Studies courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Foundations of South African Law', 'University of Cape Town', 'Law', 'Beginner', '1 year', 'Introduces the history, sources, and structure of the South African legal system, including the court hierarchy and legal reasoning.', ARRAY['Legal History', 'Sources of Law', 'Court Hierarchy', 'Legal Reasoning', 'Legal Research']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Law of Persons and Family', 'University of Cape Town', 'Law', 'Beginner', '1 semester', 'Covers the legal status of natural persons and the principles of family law, including marriage and parent-child relationships.', ARRAY['Legal Status', 'Marriage', 'Divorce', 'Parent-Child Relationships', 'Children''s Rights']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Constitutional Law', 'University of the Witwatersrand', 'Law', 'Intermediate', '1 year', 'Analyzes the fundamental principles of constitutional law, including the structure of government and the protection of fundamental rights.', ARRAY['Government Structure', 'Fundamental Rights', 'Constitutional Interpretation', 'Judicial Review', 'Bill of Rights']);

-- Health Sciences courses
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Anatomy for Health Sciences', 'University of the Witwatersrand', 'Health Sciences', 'Beginner', '1 year', 'Introduces the macroscopic and microscopic structure of the human body, providing a foundation for clinical studies.', ARRAY['Gross Anatomy', 'Histology', 'Musculoskeletal System', 'Nervous System', 'Cardiovascular System']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Physiology I', 'University of the Witwatersrand', 'Health Sciences', 'Beginner', '1 year', 'Covers the fundamental principles of human physiology, focusing on the function of cells, tissues, and organ systems.', ARRAY['Cell Physiology', 'Tissue Function', 'Organ Systems', 'Homeostasis', 'Physiological Regulation']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Introduction to Public Health', 'University of Cape Town', 'Public Health', 'Beginner', '1 semester', 'Provides an overview of the field of public health, including its history, core functions, and ethical principles.', ARRAY['Public Health History', 'Core Functions', 'Ethical Principles', 'Health Promotion', 'Disease Prevention']);

-- Cross-Disciplinary & General Modules
INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Academic Information Management', 'University of Pretoria', 'Academic Skills', 'Beginner', '1 semester', 'Teaches students how to find, evaluate, process, and manage information resources for academic purposes using appropriate technology.', ARRAY['Information Literacy', 'Research Skills', 'Digital Literacy', 'Academic Writing', 'Citation Methods']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Academic Literacy', 'University of Pretoria', 'Academic Skills', 'Beginner', '1 semester', 'Develops the reading, writing, and critical reasoning skills necessary for success in a university environment.', ARRAY['Academic Reading', 'Academic Writing', 'Critical Reasoning', 'Argumentation', 'Academic Discourse']);

INSERT INTO courses (name, university, field, difficulty, duration, description, syllabus) VALUES
('Critical Thinking at University', 'Online Learning Platform', 'Academic Skills', 'Beginner', '6 weeks', 'A course designed to develop critical thinking skills for analyzing arguments, evaluating evidence, and constructing reasoned positions.', ARRAY['Argument Analysis', 'Evidence Evaluation', 'Logical Reasoning', 'Fallacy Recognition', 'Constructing Arguments']);