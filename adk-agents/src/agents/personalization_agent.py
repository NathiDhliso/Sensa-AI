from typing import Dict, Any, List
from ..base_agent import SensaBaseAgent
from ..types import MemoryConnection, PersonalizationResult, CourseAnalysisResult

class PersonalizationAgent(SensaBaseAgent):
    """Agent specialized in creating personalized learning content based on user memories"""
    
    def __init__(self):
        super().__init__("PersonalizationAgent")
    
    async def create_analogy(self, course_concept: str, learning_profile: Dict[str, Any], user_memories: List[Dict]) -> MemoryConnection:
        """Generate a personalized analogy for a course concept based on user's memory profile"""
        
        # Extract relevant memory content for context
        memory_context = "\n".join([f"Memory ({mem.get('category', 'general')}): {mem.get('text', '')}" for mem in user_memories[:3]])
        
        system_instructions = """You are Sensa AI, an advanced educational companion that creates personalized, memory-driven learning experiences. Your core mission is to transform how students learn by connecting new knowledge to their personal memories and experiences.

SPECIFIC FOCUS: Create powerful analogies that connect course concepts to personal memories.
OUTPUT FORMAT: Personalized analogies with emotional resonance and practical study tips.
PRIORITY: Deep personal connection, memorable associations, and actionable learning strategies."""

        prompt = f"""{system_instructions}

You are a Personalization Agent specializing in creating memory-driven analogies for educational concepts.

SYSTEM INSTRUCTIONS:
- Create analogies that deeply connect course concepts to personal memories
- Generate study tips that leverage the user's learning style and memory patterns
- Focus on emotional resonance and practical applicability
- Make the learning personal and memorable

COURSE CONCEPT: {course_concept}

LEARNING PROFILE:
- Dominant Learning Style: {learning_profile.get('dominant_learning_style', 'Multimodal')}
- Emotional Anchors: {', '.join(learning_profile.get('emotional_anchors', []))}
- Cognitive Patterns: {', '.join(learning_profile.get('cognitive_patterns', []))}
- Motivational Triggers: {', '.join(learning_profile.get('motivational_triggers', []))}

USER MEMORIES (for context):
{memory_context}

PERSONALIZATION FRAMEWORK:
1. Memory Connection: Find relevant personal experiences that relate to the concept
2. Analogy Creation: Build a bridge between the memory and the course concept
3. Study Strategy: Create actionable study tips based on the analogy and learning style

Provide the result in JSON format with:
- concept: the course concept being explained
- analogy: a detailed, personalized analogy connecting to user memories
- memory_connection: explanation of how the memory relates to the concept
- study_tip: specific, actionable study advice based on the analogy

Make it personal, memorable, and emotionally resonant."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.6)
            response_data = self.extract_json_from_text(response_text)
            
            return MemoryConnection(
                concept=response_data.get('concept', course_concept),
                analogy=response_data.get('analogy', f"Think of {course_concept} as..."),
                memory_connection=response_data.get('memory_connection', 'This connects to your personal experiences'),
                study_tip=response_data.get('study_tip', 'Practice relating this concept to your daily life')
            )
        except Exception as e:
            self.log(f"Error creating analogy: {str(e)}", "ERROR")
            return self._generate_fallback_connection(course_concept, learning_profile)
    
    async def generate_study_tip(self, course_concept: str, learning_profile: Dict[str, Any]) -> str:
        """Generate an actionable study tip aligned with the user's learning style"""
        
        prompt = f"""Generate a specific, actionable study tip for learning about {course_concept}.

LEARNING PROFILE:
- Dominant Learning Style: {learning_profile.get('dominant_learning_style', 'Multimodal')}
- Study Recommendations: {', '.join(learning_profile.get('study_recommendations', []))}

The study tip should:
- Be specific and actionable
- Align with the user's learning style
- Be practical to implement
- Focus on retention and understanding

Provide just the study tip as a clear, concise sentence."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.5)
            return response_text.strip()
        except Exception as e:
            self.log(f"Error generating study tip: {str(e)}", "ERROR")
            return self._generate_fallback_study_tip(course_concept, learning_profile)
    
    async def personalize_course_content(self, course_analysis: CourseAnalysisResult, learning_profile: Dict[str, Any], user_memories: List[Dict]) -> PersonalizationResult:
        """Create personalized content for an entire course based on user profile and memories"""
        
        memory_connections = []
        
        # Create personalized connections for key topics
        key_topics = course_analysis.key_topics[:5]  # Limit to top 5 topics
        
        for topic in key_topics:
            try:
                connection = await self.create_analogy(topic, learning_profile, user_memories)
                memory_connections.append(connection)
            except Exception as e:
                self.log(f"Error personalizing topic {topic}: {str(e)}", "ERROR")
                # Add fallback connection
                fallback = self._generate_fallback_connection(topic, learning_profile)
                memory_connections.append(fallback)
        
        return PersonalizationResult(memory_connections=memory_connections)
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Personalization Agent"""
        action = data.get('action')
        
        if action == 'create_analogy':
            concept = data.get('concept', '')
            learning_profile = data.get('learning_profile', {})
            user_memories = data.get('user_memories', [])
            result = await self.create_analogy(concept, learning_profile, user_memories)
            return result.dict()
        
        elif action == 'generate_study_tip':
            concept = data.get('concept', '')
            learning_profile = data.get('learning_profile', {})
            result = await self.generate_study_tip(concept, learning_profile)
            return {'study_tip': result}
        
        elif action == 'personalize_course':
            course_analysis = CourseAnalysisResult(**data.get('course_analysis', {}))
            learning_profile = data.get('learning_profile', {})
            user_memories = data.get('user_memories', [])
            result = await self.personalize_course_content(course_analysis, learning_profile, user_memories)
            return result.dict()
        
        else:
            raise ValueError(f"Unknown action: {action}")
    
    def _generate_fallback_connection(self, concept: str, learning_profile: Dict[str, Any]) -> MemoryConnection:
        """Generate fallback memory connection when AI processing fails"""
        return MemoryConnection(
            concept=concept,
            analogy='AI analogy generation is currently unavailable. Please try again later.',
            memory_connection="AI service unavailable for memory connections.",
            study_tip='AI study tip generation is currently unavailable. Please try again later.'
        )
    
    def _generate_fallback_study_tip(self, concept: str, learning_profile: Dict[str, Any]) -> str:
        """Generate fallback study tip"""
        return 'AI study tip generation is currently unavailable. Please try again later.' 