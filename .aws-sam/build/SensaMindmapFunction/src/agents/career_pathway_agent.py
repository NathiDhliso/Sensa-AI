from typing import Dict, Any, List
from ..base_agent import SensaBaseAgent
from ..types import CareerPathway, CareerPathwayResponse, CourseAnalysisResult

class CareerPathwayAgent(SensaBaseAgent):
    """Agent specialized in generating personalized career pathways and recommendations"""
    
    def __init__(self):
        super().__init__("CareerPathwayAgent")
    
    async def generate_career_pathways(self, course_analysis: CourseAnalysisResult, learning_profile: Dict[str, Any], user_memories: List[Dict]) -> CareerPathwayResponse:
        """Generate both traditional and personalized career pathways based on course and user profile"""
        
        # Extract memory context for personalization
        memory_context = "\n".join([f"Memory: {mem.get('text', '')}" for mem in user_memories[:3]])
        
        system_instructions = """You are Sensa AI, an advanced educational companion that creates personalized, memory-driven learning experiences. Your core mission is to transform how students learn by connecting new knowledge to their personal memories and experiences.

SPECIFIC FOCUS: Generate personalized career pathways that bridge personal history and academic pursuits.
OUTPUT FORMAT: Traditional career paths and personalized discovery paths with memory connections.
PRIORITY: Personal relevance, achievable progression, and meaningful career alignment."""

        prompt = f"""{system_instructions}

You are a Career Pathway Agent specializing in creating personalized career recommendations.

SYSTEM INSTRUCTIONS:
- Generate both traditional career paths and personalized discovery paths
- Connect career opportunities to the user's personal memories and experiences
- Focus on achievable progression and meaningful alignment
- Provide specific, actionable career guidance

COURSE ANALYSIS:
- Course Name: {course_analysis.course_name}
- Core Goal: {course_analysis.core_goal}
- Key Topics: {', '.join(course_analysis.key_topics)}
- Career Outcomes: {', '.join(course_analysis.career_outcomes)}

LEARNING PROFILE:
- Dominant Learning Style: {learning_profile.get('dominant_learning_style', 'Multimodal')}
- Emotional Anchors: {', '.join(learning_profile.get('emotional_anchors', []))}
- Motivational Triggers: {', '.join(learning_profile.get('motivational_triggers', []))}

USER MEMORIES (for personalization):
{memory_context}

CAREER PATHWAY FRAMEWORK:
1. Traditional Paths: Standard career progressions related to the course
2. Discovery Paths: Unique career opportunities that connect to personal memories and interests

Generate exactly 2 career pathways in JSON format:
- pathways: array of exactly 2 career pathway objects

Each pathway object should have:
- type: either "The Prominent Path" or "Your Personalized Discovery Path"
- field_name: name of the career field
- description: detailed description of the career path and opportunities
- memory_link: explanation of how this connects to the user's personal experiences

Make the discovery path creative and personally meaningful."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.6)
            response_data = self.extract_json_from_text(response_text)
            
            pathways = []
            pathway_data = response_data.get('pathways', [])
            
            for pathway in pathway_data:
                pathways.append(CareerPathway(
                    type=pathway.get('type', 'The Prominent Path'),
                    field_name=pathway.get('field_name', 'Professional Career'),
                    description=pathway.get('description', 'A career path in this field'),
                    memory_link=pathway.get('memory_link', 'This connects to your interests and experiences')
                ))
            
            if len(pathways) < 2:
                raise ValueError("AI response did not return the required number of career pathways")

            return CareerPathwayResponse(pathways=pathways[:2])
            
        except Exception as e:
            self.log(f"Error generating career pathways: {str(e)}", "ERROR")
            raise
    
    async def analyze_career_fit(self, career_field: str, learning_profile: Dict[str, Any], user_memories: List[Dict]) -> Dict[str, Any]:
        """Analyze how well a specific career field fits the user's profile"""
        
        memory_context = "\n".join([f"Memory: {mem.get('text', '')}" for mem in user_memories[:2]])
        
        prompt = f"""Analyze the career fit for the following career field based on the user's profile:

CAREER FIELD: {career_field}

LEARNING PROFILE:
- Dominant Learning Style: {learning_profile.get('dominant_learning_style', 'Multimodal')}
- Emotional Anchors: {', '.join(learning_profile.get('emotional_anchors', []))}
- Motivational Triggers: {', '.join(learning_profile.get('motivational_triggers', []))}

USER MEMORIES:
{memory_context}

Provide analysis in JSON format with:
- fit_score: number between 0-100 indicating career fit
- strengths: array of why this career suits the user
- challenges: array of potential challenges or areas for growth
- development_suggestions: array of specific ways to prepare for this career
- memory_connections: how the user's experiences relate to this career

Focus on realistic assessment and actionable guidance."""

        try:
            response_text = await self.call_gemini(prompt)
            return self.extract_json_from_text(response_text)
        except Exception as e:
            self.log(f"Error analyzing career fit: {str(e)}", "ERROR")
            raise
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Career Pathway Agent"""
        action = data.get('action')
        
        if action == 'generate_pathways':
            course_analysis = CourseAnalysisResult(**data.get('course_analysis', {}))
            learning_profile = data.get('learning_profile', {})
            user_memories = data.get('user_memories', [])
            result = await self.generate_career_pathways(course_analysis, learning_profile, user_memories)
            return result.dict()
        
        elif action == 'analyze_career_fit':
            career_field = data.get('career_field', '')
            learning_profile = data.get('learning_profile', {})
            user_memories = data.get('user_memories', [])
            result = await self.analyze_career_fit(career_field, learning_profile, user_memories)
            return result
        
        else:
            raise ValueError(f"Unknown action: {action}")
    
    # Removed fallback generation methods – rely on upstream error handling. 