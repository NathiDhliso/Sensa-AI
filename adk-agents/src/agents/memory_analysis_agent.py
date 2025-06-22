from typing import Dict, Any
from ..base_agent import SensaBaseAgent
from ..types import MemoryAnalysisResult

class MemoryAnalysisAgent(SensaBaseAgent):
    """Agent specialized in analyzing user memories for learning insights"""
    
    def __init__(self):
        super().__init__("MemoryAnalysisAgent")
    
    async def analyze_memory(self, memory_text: str, category: str) -> MemoryAnalysisResult:
        """Analyze a single memory for themes, emotional tone, and learning indicators"""
        
        system_instructions = """You are Sensa AI, an advanced educational companion that creates personalized, memory-driven learning experiences. Your core mission is to transform how students learn by connecting new knowledge to their personal memories and experiences.

SPECIFIC FOCUS: Analyze personal memories for learning patterns.
OUTPUT FORMAT: Learning style insights and emotional connections.
PRIORITY: Empathy and personal growth identification.

Your Identity & Purpose:
- You're a revolutionary learning assistant that makes education deeply personal and memorable
- You specialize in creating memory-based insights and personalized study strategies
- You understand that the best learning happens when new concepts connect to existing personal experiences
- You're empathetic, encouraging, and adapt your teaching style to individual learners"""

        prompt = f"""{system_instructions}

You are a Memory Analysis Agent specializing in real-time analysis of childhood memories for educational personalization.

SYSTEM INSTRUCTIONS:
- Analyze the memory content for learning-relevant patterns
- Identify emotional tone and cognitive indicators
- Extract themes that can inform learning personalization
- Provide confidence assessment of the analysis

CONTEXT: {category}
MEMORY CONTENT: {memory_text}

ANALYSIS FRAMEWORK:
1. Thematic Extraction: Identify key themes and patterns
2. Emotional Assessment: Determine emotional tone and associations
3. Learning Indicators: Extract clues about learning preferences
4. Confidence Rating: Assess reliability of analysis (0-1 scale)

Provide structured analysis in JSON format with the following fields:
- themes: array of key themes
- emotional_tone: string describing emotional tone
- learning_indicators: array of learning preference clues
- confidence: number between 0 and 1
- insights: string with encouraging insight about learning style

Focus on educational personalization potential."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.3)
            response_data = self.extract_json_from_text(response_text)
            
            return MemoryAnalysisResult(
                themes=response_data.get('themes', []),
                emotional_tone=response_data.get('emotional_tone', 'Reflective'),
                learning_indicators=response_data.get('learning_indicators', []),
                confidence=response_data.get('confidence', 0.5),
                insights=response_data.get('insights', 'Thank you for sharing this memory.')
            )
        except Exception as e:
            self.log(f"Error analyzing memory: {str(e)}", "ERROR")
            # Return fallback analysis
            return self._generate_fallback_analysis(memory_text, category)
    
    async def synthesize_learning_profile(self, memory_analyses: list) -> Dict[str, Any]:
        """Create a comprehensive learning profile from multiple memory analyses"""
        
        # Aggregate themes and learning indicators
        all_themes = []
        all_learning_indicators = []
        total_confidence = 0
        
        for analysis in memory_analyses:
            all_themes.extend(analysis.themes)
            all_learning_indicators.extend(analysis.learning_indicators)
            total_confidence += analysis.confidence
        
        avg_confidence = total_confidence / len(memory_analyses) if memory_analyses else 0
        
        # Create synthesis prompt
        prompt = f"""Based on the following memory analysis data, create a comprehensive learning profile:

THEMES: {', '.join(set(all_themes))}
LEARNING INDICATORS: {', '.join(set(all_learning_indicators))}
AVERAGE CONFIDENCE: {avg_confidence}

Create a learning profile in JSON format with:
- dominant_learning_style: primary learning style
- emotional_anchors: key emotional triggers
- cognitive_patterns: thinking patterns identified
- motivational_triggers: what motivates this learner
- study_recommendations: specific study strategies

Focus on actionable insights for personalized learning."""

        try:
            response_text = await self.call_gemini(prompt)
            return self.extract_json_from_text(response_text)
        except Exception as e:
            self.log(f"Error synthesizing learning profile: {str(e)}", "ERROR")
            return self._generate_fallback_profile()
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Memory Analysis Agent"""
        action = data.get('action')
        
        if action == 'analyze_single_memory':
            memory_text = data.get('memory_text', '')
            category = data.get('category', 'general')
            result = await self.analyze_memory(memory_text, category)
            return result.dict()
        
        elif action == 'synthesize_profile':
            memory_analyses = data.get('memory_analyses', [])
            # Convert dict data back to MemoryAnalysisResult objects
            analyses = [MemoryAnalysisResult(**analysis) for analysis in memory_analyses]
            result = await self.synthesize_learning_profile(analyses)
            return result
        
        else:
            raise ValueError(f"Unknown action: {action}")
    
    def _generate_fallback_analysis(self, content: str, category: str) -> MemoryAnalysisResult:
        """Generate fallback analysis when AI processing fails"""
        return MemoryAnalysisResult(
            themes=['AI Analysis Unavailable'],
            emotional_tone='AI service temporarily unavailable',
            learning_indicators=['AI analysis required'],
            confidence=0.0,
            insights='AI memory analysis is currently unavailable. Please try again later.'
        )
    
    def _generate_fallback_profile(self) -> Dict[str, Any]:
        """Generate fallback learning profile"""
        return {
            'dominant_learning_style': 'AI Analysis Unavailable',
            'emotional_anchors': ['AI service unavailable'],
            'cognitive_patterns': ['AI analysis required'],
            'motivational_triggers': ['AI service unavailable'],
            'study_recommendations': ['AI analysis currently unavailable. Please try again later.']
        } 