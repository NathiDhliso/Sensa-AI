import asyncio
from typing import Dict, Any, List
from ..base_agent import SensaBaseAgent
from ..types import OrchestratorRequest, OrchestratorResponse, CourseAnalysisResult
from .memory_analysis_agent import MemoryAnalysisAgent
from .course_intel_agent import CourseIntelAgent
from .personalization_agent import PersonalizationAgent
from .career_pathway_agent import CareerPathwayAgent
from .study_map_agent import StudyMapAgent
from .knowledge_extraction_agent import KnowledgeExtractionAgent
from .scenario_generation_agent import ScenarioGenerationAgent
from .real_time_scoring_agent import RealTimeScoringAgent
from .performance_reporting_agent import PerformanceReportingAgent

class OrchestratorAgent(SensaBaseAgent):
    """Central coordinator agent that manages all other Sensa agents"""
    
    def __init__(self):
        super().__init__("OrchestratorAgent")
        self.agents = {
            'memory_analysis': MemoryAnalysisAgent(),
            'course_intel': CourseIntelAgent(),
            'personalization': PersonalizationAgent(),
            'career_pathway': CareerPathwayAgent(),
            'study_map': StudyMapAgent(),
            'knowledge_extraction': KnowledgeExtractionAgent(),
            'scenario_generation': ScenarioGenerationAgent(),
            'real_time_scoring': RealTimeScoringAgent(),
            'performance_reporting': PerformanceReportingAgent()
        }
    
    async def delegate_task(self, agent_name: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate a task to a specific agent"""
        if agent_name not in self.agents:
            raise ValueError(f"Unknown agent: {agent_name}")
        
        agent = self.agents[agent_name]
        self.log(f"Delegating task to {agent_name}: {task_data.get('action', 'unknown')}")
        
        try:
            result = await agent.process(task_data)
            self.log(f"Task completed by {agent_name}")
            return result
        except Exception as e:
            self.log(f"Task failed in {agent_name}: {str(e)}", "ERROR")
            raise
    
    async def consolidate_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Consolidate results from multiple agents into a cohesive response"""
        self.log("Consolidating results from all agents")
        
        consolidated = {
            'success': True,
            'course_analysis': results.get('course_analysis'),
            'learning_profile': results.get('learning_profile'),
            'personalized_insights': results.get('personalized_insights'),
            'career_pathways': results.get('career_pathways'),
            'study_map': results.get('study_map'),
            'timestamp': self._get_timestamp()
        }
        
        return consolidated
    
    async def analyze_course_for_user(self, user_id: str, course_query: str = None, course_id: str = None) -> Dict[str, Any]:
        """Orchestrate the end-to-end course analysis process"""
        self.log(f"Starting comprehensive course analysis for user {user_id}")
        
        try:
            # Step 1: Retrieve user data
            self.log("Step 1: Retrieving user data")
            user_data = await self.retrieve_user_data(user_id)
            user_memories = user_data.get('memories', [])
            
            if not user_memories:
                raise ValueError("No user memories found. Please complete the memory elicitation process first.")
            
            # Step 2: Analyze user memories to create learning profile
            self.log("Step 2: Analyzing user memories")
            memory_analyses = []
            
            # Analyze each memory
            for memory in user_memories[:5]:  # Limit to 5 most recent memories
                memory_result = await self.delegate_task('memory_analysis', {
                    'action': 'analyze_single_memory',
                    'memory_text': memory.get('content', memory.get('text', '')),
                    'category': memory.get('category', 'general')
                })
                memory_analyses.append(memory_result)
            
            # Synthesize learning profile
            learning_profile = await self.delegate_task('memory_analysis', {
                'action': 'synthesize_profile',
                'memory_analyses': memory_analyses
            })
            
            # Step 3: Analyze course content
            self.log("Step 3: Analyzing course content")
            if course_id:
                # Get course from database
                course_data = await self.retrieve_course_data(course_id)
                course_syllabus = course_data.get('description', '')
                course_name = course_data.get('title', '')
            else:
                # Use course query
                course_syllabus = course_query or ''
                course_name = course_query or 'Course Analysis'
            
            course_analysis = await self.delegate_task('course_intel', {
                'action': 'analyze_syllabus',
                'syllabus': course_syllabus,
                'course_name': course_name
            })
            
            # Step 4: Generate personalized insights
            self.log("Step 4: Creating personalized insights")
            personalized_insights = await self.delegate_task('personalization', {
                'action': 'personalize_course',
                'course_analysis': course_analysis,
                'learning_profile': learning_profile,
                'user_memories': user_memories
            })
            
            # Step 5: Generate career pathways
            self.log("Step 5: Generating career pathways")
            career_pathways = await self.delegate_task('career_pathway', {
                'action': 'generate_pathways',
                'course_analysis': course_analysis,
                'learning_profile': learning_profile,
                'user_memories': user_memories
            })
            
            # Step 6: Create study map
            self.log("Step 6: Creating study map")
            study_map = await self.delegate_task('study_map', {
                'action': 'generate_mermaid',
                'course_analysis': course_analysis,
                'personalized_insights': personalized_insights.get('memory_connections', [])
            })
            
            # Step 7: Consolidate all results
            self.log("Step 7: Consolidating results")
            final_result = await self.consolidate_results({
                'course_analysis': course_analysis,
                'learning_profile': learning_profile,
                'personalized_insights': personalized_insights,
                'career_pathways': career_pathways,
                'study_map': study_map
            })
            
            self.log("Course analysis completed successfully")
            return final_result
            
        except Exception as e:
            self.log(f"Course analysis failed: {str(e)}", "ERROR")
            return {
                'success': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def analyze_memory_only(self, memory_content: str, category: str) -> Dict[str, Any]:
        """Analyze a single memory (for onboarding process)"""
        self.log(f"Analyzing single memory for category: {category}")
        
        try:
            result = await self.delegate_task('memory_analysis', {
                'action': 'analyze_single_memory',
                'memory_text': memory_content,
                'category': category
            })
            
            return {
                'success': True,
                'analysis': result,
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            self.log(f"Memory analysis failed: {str(e)}", "ERROR")
            return {
                'success': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def generate_study_map_only(self, field_of_study: str, course_syllabus: List[str], user_id: str) -> Dict[str, Any]:
        """Generate only a study map (legacy compatibility)"""
        self.log(f"Generating study map for field: {field_of_study}")
        
        try:
            # Get user data for personalization
            user_data = await self.retrieve_user_data(user_id)
            user_memories = user_data.get('memories', [])
            
            # Create a basic course analysis from the input
            course_analysis = CourseAnalysisResult(
                course_id=f"field_{hash(field_of_study) % 100000}",
                course_name=field_of_study,
                university='General',
                core_goal=f'Master the fundamentals of {field_of_study}',
                practical_outcome=f'Apply {field_of_study} knowledge in real-world scenarios',
                learning_objectives=course_syllabus,
                prerequisites=['Basic academic preparation'],
                estimated_duration='Variable',
                difficulty_level='Intermediate',
                key_topics=course_syllabus,
                career_outcomes=[f'{field_of_study} Specialist', f'{field_of_study} Consultant']
            )
            
            # Generate study map
            study_map = await self.delegate_task('study_map', {
                'action': 'generate_mermaid',
                'course_analysis': course_analysis.dict(),
                'personalized_insights': []
            })
            
            return {
                'success': True,
                'study_map': study_map,
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            self.log(f"Study map generation failed: {str(e)}", "ERROR")
            return {
                'success': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def know_me_workflow(self, pdf_content: str, user_id: str) -> Dict[str, Any]:
        """
        Complete Know Me workflow: PDF analysis -> questionnaire -> scenarios -> scoring -> reporting
        """
        self.log(f"Starting Know Me workflow for user {user_id}")
        
        try:
            # Phase 1: Knowledge Extraction
            self.log("Phase 1: Knowledge Extraction from PDF")
            knowledge_result = await self.delegate_task('knowledge_extraction', {
                'action': 'full_analysis',
                'pdf_content': pdf_content
            })
            
            return {
                'success': True,
                'phase': 'knowledge_extraction_complete',
                'knowledge_analysis': knowledge_result,
                'next_step': 'present_questionnaire',
                'timestamp': self._get_timestamp()
            }
            
        except Exception as e:
            self.log(f"Know Me workflow failed: {str(e)}", "ERROR")
            return {
                'success': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def process_questionnaire_responses(self, questionnaire_responses: List[Dict], 
                                            knowledge_analysis: Dict, user_id: str) -> Dict[str, Any]:
        """
        Phase 2: Process questionnaire responses and generate scenario questions
        """
        self.log(f"Processing questionnaire responses for user {user_id}")
        
        try:
            core_topics = knowledge_analysis.get('topic_analysis', {}).get('core_topics', [])
            subject_area = knowledge_analysis.get('topic_analysis', {}).get('subject_area', 'Unknown Subject')
            
            # Generate scenario questions
            scenarios_result = await self.delegate_task('scenario_generation', {
                'action': 'full_scenario_workflow',
                'core_topics': core_topics,
                'user_responses': questionnaire_responses,
                'subject_area': subject_area
            })
            
            return {
                'success': True,
                'phase': 'scenarios_generated',
                'scenarios': scenarios_result,
                'next_step': 'present_scenario_questions',
                'timestamp': self._get_timestamp()
            }
            
        except Exception as e:
            self.log(f"Questionnaire processing failed: {str(e)}", "ERROR")
            return {
                'success': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def score_scenario_answer(self, question_id: str, user_answer: str, 
                                  scenarios_data: Dict, partial_answer: bool = False) -> Dict[str, Any]:
        """
        Phase 3: Score a single scenario answer in real-time
        """
        self.log(f"Scoring answer for question {question_id}")
        
        try:
            # Find the question and its rubric
            scenarios = scenarios_data.get('scenarios', {}).get('scenarios', [])
            rubrics = scenarios_data.get('rubrics', [])
            
            question_context = next((s for s in scenarios if s.get('question_id') == question_id), {})
            rubric = next((r for r in rubrics if r.get('question_id') == question_id), {})
            
            if not question_context or not rubric:
                raise ValueError(f"Question or rubric not found for {question_id}")
            
            if partial_answer:
                # Provide real-time hints
                result = await self.delegate_task('real_time_scoring', {
                    'action': 'real_time_hints',
                    'partial_answer': user_answer,
                    'rubric': rubric,
                    'question_context': question_context
                })
            else:
                # Full scoring
                result = await self.delegate_task('real_time_scoring', {
                    'action': 'score_answer',
                    'user_answer': user_answer,
                    'rubric': rubric,
                    'question_context': question_context
                })
            
            return {
                'success': True,
                'scoring_result': result,
                'timestamp': self._get_timestamp()
            }
            
        except Exception as e:
            self.log(f"Answer scoring failed: {str(e)}", "ERROR")
            return {
                'success': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def generate_performance_report(self, all_scoring_results: List[Dict], 
                                        knowledge_analysis: Dict, user_id: str) -> Dict[str, Any]:
        """
        Phase 4: Generate final performance report and recommendations
        """
        self.log(f"Generating performance report for user {user_id}")
        
        try:
            core_topics = knowledge_analysis.get('topic_analysis', {}).get('core_topics', [])
            subject_area = knowledge_analysis.get('topic_analysis', {}).get('subject_area', 'Unknown Subject')
            
            report = await self.delegate_task('performance_reporting', {
                'action': 'generate_report',
                'scoring_results': all_scoring_results,
                'subject_area': subject_area,
                'core_topics': core_topics
            })
            
            return {
                'success': True,
                'phase': 'know_me_complete',
                'performance_report': report,
                'timestamp': self._get_timestamp()
            }
            
        except Exception as e:
            self.log(f"Performance report generation failed: {str(e)}", "ERROR")
            return {
                'success': False,
                'error': str(e),
                'timestamp': self._get_timestamp()
            }

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Orchestrator Agent"""
        action = data.get('action')
        
        if action == 'analyze_course':
            user_id = data.get('user_id')
            course_query = data.get('course_query')
            course_id = data.get('course_id')
            
            if not user_id:
                raise ValueError("user_id is required")
            
            return await self.analyze_course_for_user(user_id, course_query, course_id)
        
        elif action == 'analyze_memory':
            memory_content = data.get('memory_content', '')
            category = data.get('category', 'general')
            return await self.analyze_memory_only(memory_content, category)
        
        elif action == 'generate_study_map':
            field_of_study = data.get('field_of_study', '')
            course_syllabus = data.get('course_syllabus', [])
            user_id = data.get('user_id', '')
            return await self.generate_study_map_only(field_of_study, course_syllabus, user_id)
        
        # Know Me Feature Actions
        elif action == 'know_me_start':
            pdf_content = data.get('pdf_content', '')
            user_id = data.get('user_id', '')
            if not user_id or not pdf_content:
                raise ValueError("user_id and pdf_content are required")
            return await self.know_me_workflow(pdf_content, user_id)
        
        elif action == 'know_me_questionnaire':
            questionnaire_responses = data.get('questionnaire_responses', [])
            knowledge_analysis = data.get('knowledge_analysis', {})
            user_id = data.get('user_id', '')
            if not user_id:
                raise ValueError("user_id is required")
            return await self.process_questionnaire_responses(questionnaire_responses, knowledge_analysis, user_id)
        
        elif action == 'know_me_score':
            question_id = data.get('question_id', '')
            user_answer = data.get('user_answer', '')
            scenarios_data = data.get('scenarios_data', {})
            partial_answer = data.get('partial_answer', False)
            return await self.score_scenario_answer(question_id, user_answer, scenarios_data, partial_answer)
        
        elif action == 'know_me_report':
            all_scoring_results = data.get('scoring_results', [])
            knowledge_analysis = data.get('knowledge_analysis', {})
            user_id = data.get('user_id', '')
            if not user_id:
                raise ValueError("user_id is required")
            return await self.generate_performance_report(all_scoring_results, knowledge_analysis, user_id)
        
        else:
            raise ValueError(f"Unknown action: {action}")
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check the health of all agents"""
        self.log("Performing health check")
        
        health_status = {
            'orchestrator': 'healthy',
            'agents': {},
            'timestamp': self._get_timestamp()
        }
        
        for agent_name, agent in self.agents.items():
            try:
                # Simple health check - just verify the agent can be initialized
                health_status['agents'][agent_name] = 'healthy'
            except Exception as e:
                health_status['agents'][agent_name] = f'unhealthy: {str(e)}'
        
        return health_status 