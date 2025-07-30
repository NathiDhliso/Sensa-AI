from typing import Dict, Any, List
from ..base_agent import SensaBaseAgent
from ..types import StudyMap, MermaidStudyMap, KnowledgeNode, SensaInsight, NodeData, CourseAnalysisResult

class StudyMapAgent(SensaBaseAgent):
    """Agent specialized in creating visual study maps and educational diagrams"""
    
    def __init__(self):
        super().__init__("StudyMapAgent")
    
    async def generate_mermaid_code(self, course_analysis: CourseAnalysisResult, personalized_insights: List[Dict]) -> MermaidStudyMap:
        """Generate Mermaid.js code for a visual study map with personalized insights"""
        
        insights_context = "\n".join([f"Topic: {insight.get('concept', '')} - Insight: {insight.get('analogy', '')}" for insight in personalized_insights])
        
        prompt = f"""Create a Mermaid.js flowchart for the course: {course_analysis.course_name}

Key Topics: {', '.join(course_analysis.key_topics)}
Learning Objectives: {', '.join(course_analysis.learning_objectives)}

Generate JSON with:
- mermaid_code: valid Mermaid.js flowchart syntax
- node_data: object mapping node IDs to details
- legend_html: HTML legend

Create a logical flow from prerequisites to advanced concepts."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.5)
            response_data = self.extract_json_from_text(response_text)
            
            if 'mermaid_code' not in response_data or not response_data['mermaid_code']:
                raise ValueError('AI response did not include mermaid_code')
            
            node_data = {}
            raw_node_data = response_data.get('node_data', {})
            
            for node_id, node_info in raw_node_data.items():
                if isinstance(node_info, dict) and 'node_name' in node_info:
                    insight = node_info.get('sensa_insight', {})
                    node_data[node_id] = NodeData(
                        node_name=node_info['node_name'],
                        sensa_insight=SensaInsight(
                            analogy=insight.get('analogy', 'Connect this to your personal experiences'),
                            study_tip=insight.get('study_tip', 'Practice this concept regularly')
                        )
                    )
            
            return MermaidStudyMap(
                mermaid_code=response_data.get('mermaid_code'),
                node_data=node_data,
                legend_html=response_data.get('legend_html', self._generate_legend_html())
            )
            
        except Exception as e:
            self.log(f"Error generating Mermaid study map: {str(e)}", "ERROR")
            raise
    
    async def create_study_guide(self, course_analysis: CourseAnalysisResult, learning_profile: Dict[str, Any]) -> StudyMap:
        """Generate a structured study guide from course analysis"""
        
        prompt = f"""Create a structured study guide for the following course:

COURSE: {course_analysis.course_name}
CORE GOAL: {course_analysis.core_goal}
KEY TOPICS: {', '.join(course_analysis.key_topics)}
LEARNING OBJECTIVES: {', '.join(course_analysis.learning_objectives)}

LEARNING PROFILE:
- Dominant Learning Style: {learning_profile.get('dominant_learning_style', 'Multimodal')}
- Study Recommendations: {', '.join(learning_profile.get('study_recommendations', []))}

Create a hierarchical study guide in JSON format with:
- field: the course/field name
- map: array of knowledge nodes representing the study structure

Each knowledge node should have:
- node_name: name of the topic/concept
- in_course: true (since all nodes are from the course)
- sensa_insight: object with analogy and study_tip tailored to learning style
- children: array of sub-topics (if applicable)

Organize the content logically from foundational to advanced concepts."""

        try:
            response_text = await self.call_gemini(prompt)
            response_data = self.extract_json_from_text(response_text)
            
            # Convert response to StudyMap format
            knowledge_nodes = []
            for node_data in response_data.get('map', []):
                node = self._convert_to_knowledge_node(node_data)
                knowledge_nodes.append(node)
            
            return StudyMap(
                field=response_data.get('field', course_analysis.course_name),
                map=knowledge_nodes
            )
            
        except Exception as e:
            self.log(f"Error creating study guide: {str(e)}", "ERROR")
            raise
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Study Map Agent"""
        action = data.get('action')
        
        if action == 'generate_mermaid':
            course_analysis = CourseAnalysisResult(**data.get('course_analysis', {}))
            personalized_insights = data.get('personalized_insights', [])
            result = await self.generate_mermaid_code(course_analysis, personalized_insights)
            return result.dict()
        
        elif action == 'create_study_guide':
            course_analysis = CourseAnalysisResult(**data.get('course_analysis', {}))
            learning_profile = data.get('learning_profile', {})
            result = await self.create_study_guide(course_analysis, learning_profile)
            return result.dict()
        
        else:
            raise ValueError(f"Unknown action: {action}")
    
    def _convert_to_knowledge_node(self, node_data: Dict) -> KnowledgeNode:
        """Convert dictionary data to KnowledgeNode object"""
        insight_data = node_data.get('sensa_insight', {})
        insight = SensaInsight(
            analogy=insight_data.get('analogy', 'Connect this to your experiences'),
            study_tip=insight_data.get('study_tip', 'Practice this concept regularly')
        ) if insight_data else None
        
        children = None
        if 'children' in node_data and node_data['children']:
            children = [self._convert_to_knowledge_node(child) for child in node_data['children']]
        
        return KnowledgeNode(
            node_name=node_data.get('node_name', 'Concept'),
            in_course=node_data.get('in_course', True),
            sensa_insight=insight,
            children=children
        )
    
    def _generate_legend_html(self) -> str:
        """Generate HTML legend for the study map"""
        return """
        <div class="study-map-legend">
            <h4>Study Map Legend</h4>
            <div class="legend-item">
                <div class="legend-color foundation"></div>
                <span>Foundation Concepts</span>
            </div>
            <div class="legend-item">
                <div class="legend-color core"></div>
                <span>Core Topics</span>
            </div>
        </div>
        """ 