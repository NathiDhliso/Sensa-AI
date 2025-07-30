from typing import Dict, Any
from ..base_agent import SensaBaseAgent
from ..types import CourseAnalysisResult

class CourseIntelAgent(SensaBaseAgent):
    """Agent specialized in analyzing educational content and course syllabi"""
    
    def __init__(self):
        super().__init__("CourseIntelAgent")
    
    async def analyze_course_syllabus(self, syllabus: str, course_name: str = "") -> CourseAnalysisResult:
        """Analyze a course syllabus and extract structured information"""
        
        system_instructions = """You are Sensa AI, an advanced educational companion that creates personalized, memory-driven learning experiences. Your core mission is to transform how students learn by connecting new knowledge to their personal memories and experiences.

SPECIFIC FOCUS: Analyze courses and connect concepts to personal memories for deeper understanding.
OUTPUT FORMAT: Structured course analysis with memory-driven insights and study strategies.
PRIORITY: Memory integration, practical connections, and actionable learning paths.

Course Analysis Guidelines:
- Extract clear learning objectives and competencies
- Connect academic concepts to real-world applications
- Create powerful analogies using personal memories
- Provide specific, actionable study recommendations
- Identify transferable skills and knowledge"""

        prompt = f"""{system_instructions}

You are a Course Analysis Agent specializing in objective educational content analysis.

SYSTEM INSTRUCTIONS:
- Extract structured information about learning objectives and competencies
- Focus on actionable learning elements with NO FLUFF
- Identify real-world applications and career outcomes
- Provide clear articulation of practical outcomes

COURSE NAME: {course_name}
COURSE CONTENT/SYLLABUS: {syllabus}

ANALYSIS FRAMEWORK:
1. Course Structure: Break down the course into core components
2. Learning Objectives: Identify key skills and knowledge to be gained
3. Prerequisites: Determine necessary background knowledge
4. Career Applications: Connect course content to career outcomes

Provide analysis in JSON format with:
- course_id: unique identifier (generate one)
- course_name: name of the course
- university: institution (if mentioned, otherwise "General")
- core_goal: main objective of the course
- practical_outcome: real-world application
- learning_objectives: array of specific learning goals
- prerequisites: array of required background knowledge
- estimated_duration: time commitment estimate
- difficulty_level: Beginner/Intermediate/Advanced
- key_topics: array of main topics covered
- career_outcomes: array of potential career paths

Focus on depth over breadth. Prioritize actionable insights over general descriptions."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.4)
            response_data = self.extract_json_from_text(response_text)
            
            return CourseAnalysisResult(
                course_id=response_data.get('course_id', f"course_{hash(course_name + syllabus) % 100000}"),
                course_name=response_data.get('course_name', course_name or 'Unknown Course'),
                university=response_data.get('university', 'General'),
                core_goal=response_data.get('core_goal', 'Develop knowledge and skills in the subject area'),
                practical_outcome=response_data.get('practical_outcome', 'Apply learned concepts in real-world scenarios'),
                learning_objectives=response_data.get('learning_objectives', []),
                prerequisites=response_data.get('prerequisites', []),
                estimated_duration=response_data.get('estimated_duration', 'Variable'),
                difficulty_level=response_data.get('difficulty_level', 'Intermediate'),
                key_topics=response_data.get('key_topics', []),
                career_outcomes=response_data.get('career_outcomes', [])
            )
        except Exception as e:
            self.log(f"Error analyzing course: {str(e)}", "ERROR")
            raise
    
    async def analyze_user_document(self, document_content: str, document_type: str = "general") -> Dict[str, Any]:
        """Extract key topics and learning objectives from user-uploaded files"""
        
        prompt = f"""Analyze the following document and extract key educational information:

DOCUMENT TYPE: {document_type}
DOCUMENT CONTENT: {document_content}

Extract the following in JSON format:
- key_topics: array of main topics covered
- learning_objectives: array of what someone would learn from this
- complexity_level: assessment of difficulty (Beginner/Intermediate/Advanced)
- estimated_study_time: rough estimate of time needed to master content
- prerequisite_knowledge: what background knowledge is needed
- practical_applications: how this knowledge could be applied

Focus on educational value and learning potential."""

        try:
            response_text = await self.call_gemini(prompt)
            return self.extract_json_from_text(response_text)
        except Exception as e:
            self.log(f"Error analyzing document: {str(e)}", "ERROR")
            raise
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Course Intel Agent"""
        action = data.get('action')
        
        if action == 'analyze_syllabus':
            syllabus = data.get('syllabus', '')
            course_name = data.get('course_name', '')
            result = await self.analyze_course_syllabus(syllabus, course_name)
            return result.dict()
        
        elif action == 'analyze_document':
            document_content = data.get('document_content', '')
            document_type = data.get('document_type', 'general')
            result = await self.analyze_user_document(document_content, document_type)
            return result
        
        else:
            raise ValueError(f"Unknown action: {action}")
    
    # Fallback generation methods removed – rely on upstream error handling. 