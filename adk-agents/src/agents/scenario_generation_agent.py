"""
Scenario Generation Agent for Sensa AI - Phase 2 of Know Me Feature

This agent handles:
1. Processing user questionnaire responses
2. Dynamic scenario generation combining academic topics with personal experiences
3. Creating scoring rubrics for each scenario question
4. Contextualizing academic content with user's real-world experiences
"""

from typing import Dict, List, Any, Optional
from ..base_agent import BaseAgent
from ..config import get_gemini_client
import json
import random

class ScenarioGenerationAgent(BaseAgent):
    """Agent responsible for generating personalized scenarios based on user responses."""
    
    def __init__(self):
        super().__init__("ScenarioGenerationAgent")
        self.gemini_client = get_gemini_client()
    
    def process_user_responses(self, questionnaire_responses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and analyze user questionnaire responses to extract key insights.
        
        Args:
            questionnaire_responses: User's responses to the Know Me questionnaire
            
        Returns:
            Processed user profile with insights and context factors
        """
        try:
            responses_text = "\n".join([
                f"Q: {response.get('question', '')}\nA: {response.get('answer', '')}"
                for response in questionnaire_responses.get('responses', [])
            ])
            
            prompt = f"""
            Analyze these user responses to create a personalized learning profile:
            
            {responses_text}
            
            Extract and identify:
            1. Learning Style (visual, auditory, kinesthetic, reading/writing)
            2. Experience Level (beginner, intermediate, advanced)
            3. Professional Context (work environment, role, industry)
            4. Personal Interests and Motivations
            5. Preferred Problem-Solving Approach
            6. Real-World Contexts (specific situations they mentioned)
            7. Technical Background
            8. Communication Preferences
            
            Return as JSON:
            {{
                "user_profile": {{
                    "learning_style": "primary learning preference",
                    "experience_level": "beginner/intermediate/advanced",
                    "professional_context": "work environment description",
                    "technical_background": "summary of technical experience",
                    "problem_solving_style": "approach to challenges",
                    "communication_preference": "formal/casual/technical"
                }},
                "context_factors": [
                    {{
                        "context_type": "work/home/hobby/academic",
                        "description": "specific situation or environment",
                        "relevance_topics": ["topic1", "topic2"]
                    }}
                ],
                "personalization_keywords": ["keyword1", "keyword2", "keyword3"],
                "engagement_triggers": ["what motivates this user"]
            }}
            
            Focus on identifying specific contexts and experiences that can be used to create relatable scenarios.
            """
            
            response = self.gemini_client.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                user_profile = json.loads(json_str)
                
                # Add metadata
                user_profile["processed_at"] = self._get_timestamp()
                user_profile["response_count"] = len(questionnaire_responses.get('responses', []))
                
                self.logger.info("Successfully processed user responses")
                return user_profile
            else:
                raise Exception("Could not parse user profile from AI response")
                
        except Exception as e:
            self.logger.error(f"Error processing user responses: {str(e)}")
            return self._generate_fallback_profile(questionnaire_responses)
    
    def _generate_fallback_profile(self, questionnaire_responses: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a basic user profile when AI processing fails."""
        return {
            "user_profile": {
                "learning_style": "mixed",
                "experience_level": "intermediate",
                "professional_context": "general professional environment",
                "technical_background": "moderate technical experience",
                "problem_solving_style": "systematic approach",
                "communication_preference": "professional"
            },
            "context_factors": [
                {
                    "context_type": "work",
                    "description": "professional work environment",
                    "relevance_topics": ["general"]
                }
            ],
            "personalization_keywords": ["professional", "practical", "efficient"],
            "engagement_triggers": ["practical applications", "real-world examples"],
            "processed_at": self._get_timestamp(),
            "response_count": len(questionnaire_responses.get('responses', []))
        }
    
    def generate_personalized_scenarios(self, 
                                      core_topics: List[Dict[str, Any]], 
                                      user_profile: Dict[str, Any],
                                      num_scenarios: int = 5) -> List[Dict[str, Any]]:
        """
        Generate personalized scenario-based questions combining academic topics with user context.
        
        Args:
            core_topics: List of identified core topics from Phase 1
            user_profile: Processed user profile from questionnaire responses
            num_scenarios: Number of scenarios to generate
            
        Returns:
            List of personalized scenario questions with context
        """
        try:
            scenarios = []
            
            # Select topics for scenarios (prioritize by difficulty and user level)
            selected_topics = self._select_topics_for_scenarios(core_topics, user_profile, num_scenarios)
            
            for i, topic in enumerate(selected_topics):
                scenario = self._generate_single_scenario(topic, user_profile, i + 1)
                if scenario:
                    scenarios.append(scenario)
            
            self.logger.info(f"Generated {len(scenarios)} personalized scenarios")
            return scenarios
            
        except Exception as e:
            self.logger.error(f"Error generating scenarios: {str(e)}")
            return self._generate_fallback_scenarios(core_topics, num_scenarios)
    
    def _select_topics_for_scenarios(self, 
                                   core_topics: List[Dict[str, Any]], 
                                   user_profile: Dict[str, Any],
                                   num_scenarios: int) -> List[Dict[str, Any]]:
        """Select and prioritize topics for scenario generation based on user profile."""
        user_level = user_profile.get("user_profile", {}).get("experience_level", "intermediate")
        
        # Filter topics by appropriate difficulty
        suitable_topics = []
        for topic in core_topics:
            topic_difficulty = topic.get("difficulty_level", "intermediate").lower()
            
            # Match topics to user level
            if user_level == "beginner" and topic_difficulty in ["beginner", "intermediate"]:
                suitable_topics.append(topic)
            elif user_level == "intermediate" and topic_difficulty in ["beginner", "intermediate", "advanced"]:
                suitable_topics.append(topic)
            elif user_level == "advanced":
                suitable_topics.append(topic)
        
        # If we don't have enough suitable topics, include all topics
        if len(suitable_topics) < num_scenarios:
            suitable_topics = core_topics
        
        # Select topics (prioritize variety)
        if len(suitable_topics) <= num_scenarios:
            return suitable_topics
        else:
            return random.sample(suitable_topics, num_scenarios)
    
    def _generate_single_scenario(self, 
                                topic: Dict[str, Any], 
                                user_profile: Dict[str, Any], 
                                scenario_number: int) -> Optional[Dict[str, Any]]:
        """Generate a single personalized scenario question."""
        try:
            # Extract user context
            user_context = user_profile.get("user_profile", {})
            context_factors = user_profile.get("context_factors", [])
            keywords = user_profile.get("personalization_keywords", [])
            
            # Select relevant context factor
            relevant_context = None
            for context in context_factors:
                if any(topic_name in context.get("relevance_topics", []) for topic_name in [topic["topic_name"]]):
                    relevant_context = context
                    break
            
            if not relevant_context and context_factors:
                relevant_context = context_factors[0]  # Use first context as fallback
            
            prompt = f"""
            Create a personalized scenario-based question that combines this academic topic with the user's personal context:
            
            Academic Topic: {topic['topic_name']}
            Topic Description: {topic['description']}
            Key Concepts: {', '.join(topic.get('key_concepts', []))}
            
            User Profile:
            - Experience Level: {user_context.get('experience_level', 'intermediate')}
            - Professional Context: {user_context.get('professional_context', 'general')}
            - Learning Style: {user_context.get('learning_style', 'mixed')}
            - Technical Background: {user_context.get('technical_background', 'moderate')}
            
            Personal Context: {relevant_context.get('description', 'professional environment') if relevant_context else 'work environment'}
            
            Personalization Keywords: {', '.join(keywords)}
            
            Create a scenario that:
            1. Starts with a relatable situation from their context
            2. Naturally incorporates the academic topic
            3. Requires practical application of key concepts
            4. Feels authentic and relevant to their experience
            5. Has multiple valid approaches (not just one right answer)
            
            Example format: "You're working on [user's context] and need to [apply topic concepts]. How would you approach [specific challenge]?"
            
            Return as JSON:
            {{
                "scenario_id": "scenario_{scenario_number}",
                "topic_name": "{topic['topic_name']}",
                "scenario_title": "Brief descriptive title",
                "scenario_description": "Full scenario description (2-3 sentences)",
                "question": "Specific question asking how they would handle the situation",
                "context_type": "{relevant_context.get('context_type', 'work') if relevant_context else 'work'}",
                "difficulty_level": "{topic.get('difficulty_level', 'intermediate')}",
                "key_concepts_tested": ["concept1", "concept2"],
                "expected_response_type": "explanation/strategy/step-by-step/analysis",
                "estimated_time": "3-5 minutes"
            }}
            
            Make it feel like a real situation they might encounter, not an academic exercise.
            """
            
            response = self.gemini_client.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                scenario = json.loads(json_str)
                
                # Add metadata
                scenario["created_at"] = self._get_timestamp()
                scenario["personalization_applied"] = True
                
                return scenario
            else:
                raise Exception("Could not parse scenario from AI response")
                
        except Exception as e:
            self.logger.error(f"Error generating scenario for {topic['topic_name']}: {str(e)}")
            return None
    
    def _generate_fallback_scenarios(self, core_topics: List[Dict[str, Any]], num_scenarios: int) -> List[Dict[str, Any]]:
        """Generate basic scenarios when AI generation fails."""
        scenarios = []
        
        for i, topic in enumerate(core_topics[:num_scenarios]):
            scenario = {
                "scenario_id": f"scenario_{i + 1}",
                "topic_name": topic["topic_name"],
                "scenario_title": f"Practical Application of {topic['topic_name']}",
                "scenario_description": f"You need to apply {topic['topic_name']} concepts in a professional setting.",
                "question": f"How would you approach implementing {topic['topic_name']} in your work environment?",
                "context_type": "work",
                "difficulty_level": topic.get("difficulty_level", "intermediate"),
                "key_concepts_tested": topic.get("key_concepts", [])[:3],
                "expected_response_type": "explanation",
                "estimated_time": "3-5 minutes",
                "created_at": self._get_timestamp(),
                "personalization_applied": False
            }
            scenarios.append(scenario)
        
        return scenarios
    
    def generate_dynamic_rubric(self, scenario: Dict[str, Any], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a dynamic scoring rubric for a specific scenario question.
        
        Args:
            scenario: The scenario question to create a rubric for
            user_profile: User's profile to adjust expectations
            
        Returns:
            Dynamic scoring rubric with criteria and point allocations
        """
        try:
            user_level = user_profile.get("user_profile", {}).get("experience_level", "intermediate")
            
            prompt = f"""
            Create a dynamic scoring rubric for this scenario question:
            
            Scenario: {scenario.get('scenario_description', '')}
            Question: {scenario.get('question', '')}
            Topic: {scenario.get('topic_name', '')}
            Key Concepts: {', '.join(scenario.get('key_concepts_tested', []))}
            User Experience Level: {user_level}
            Expected Response Type: {scenario.get('expected_response_type', 'explanation')}
            
            Create a rubric that:
            1. Has 4-6 scoring criteria relevant to the scenario
            2. Adjusts expectations based on user experience level
            3. Focuses on practical understanding, not just theory
            4. Includes both technical accuracy and real-world applicability
            5. Provides specific indicators for each score level
            
            Return as JSON:
            {{
                "rubric_id": "rubric_for_{scenario.get('scenario_id', 'scenario')}",
                "total_points": 100,
                "criteria": [
                    {{
                        "criterion_name": "Concept Understanding",
                        "description": "Demonstrates understanding of key concepts",
                        "weight": 30,
                        "score_levels": {{
                            "excellent": {{
                                "points": 25-30,
                                "description": "Clear, accurate understanding with examples",
                                "indicators": ["specific indicator 1", "indicator 2"]
                            }},
                            "good": {{
                                "points": 20-24,
                                "description": "Solid understanding with minor gaps",
                                "indicators": ["indicator 1", "indicator 2"]
                            }},
                            "satisfactory": {{
                                "points": 15-19,
                                "description": "Basic understanding evident",
                                "indicators": ["indicator 1", "indicator 2"]
                            }},
                            "needs_improvement": {{
                                "points": 0-14,
                                "description": "Limited or unclear understanding",
                                "indicators": ["indicator 1", "indicator 2"]
                            }}
                        }}
                    }}
                ],
                "bonus_points": {{
                    "innovation": 5,
                    "real_world_insight": 5,
                    "comprehensive_approach": 5
                }},
                "user_level_adjustments": "Expectations adjusted for {user_level} level"
            }}
            
            Adjust the complexity and expectations based on the user's experience level.
            """
            
            response = self.gemini_client.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                rubric = json.loads(json_str)
                
                # Add metadata
                rubric["created_at"] = self._get_timestamp()
                rubric["scenario_id"] = scenario.get("scenario_id")
                rubric["adapted_for_user"] = True
                
                self.logger.info(f"Generated dynamic rubric for {scenario.get('topic_name')}")
                return rubric
            else:
                raise Exception("Could not parse rubric from AI response")
                
        except Exception as e:
            self.logger.error(f"Error generating rubric: {str(e)}")
            return self._generate_fallback_rubric(scenario)
    
    def _generate_fallback_rubric(self, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a basic rubric when AI generation fails."""
        return {
            "rubric_id": f"rubric_for_{scenario.get('scenario_id', 'scenario')}",
            "total_points": 100,
            "criteria": [
                {
                    "criterion_name": "Understanding",
                    "description": "Demonstrates understanding of the topic",
                    "weight": 40,
                    "score_levels": {
                        "excellent": {"points": "35-40", "description": "Clear, comprehensive understanding"},
                        "good": {"points": "30-34", "description": "Good understanding with minor gaps"},
                        "satisfactory": {"points": "25-29", "description": "Basic understanding"},
                        "needs_improvement": {"points": "0-24", "description": "Limited understanding"}
                    }
                },
                {
                    "criterion_name": "Application",
                    "description": "Applies concepts to the scenario effectively",
                    "weight": 35,
                    "score_levels": {
                        "excellent": {"points": "30-35", "description": "Excellent practical application"},
                        "good": {"points": "25-29", "description": "Good application with minor issues"},
                        "satisfactory": {"points": "20-24", "description": "Basic application"},
                        "needs_improvement": {"points": "0-19", "description": "Poor application"}
                    }
                },
                {
                    "criterion_name": "Communication",
                    "description": "Communicates response clearly and effectively",
                    "weight": 25,
                    "score_levels": {
                        "excellent": {"points": "22-25", "description": "Clear, well-structured response"},
                        "good": {"points": "19-21", "description": "Generally clear communication"},
                        "satisfactory": {"points": "16-18", "description": "Adequate communication"},
                        "needs_improvement": {"points": "0-15", "description": "Unclear communication"}
                    }
                }
            ],
            "bonus_points": {"innovation": 5, "insight": 5},
            "created_at": self._get_timestamp(),
            "scenario_id": scenario.get("scenario_id"),
            "adapted_for_user": False
        }
    
    def process_scenario_generation(self, 
                                  core_topics: List[Dict[str, Any]], 
                                  questionnaire_responses: Dict[str, Any],
                                  num_scenarios: int = 5) -> Dict[str, Any]:
        """
        Complete Phase 2 workflow: Process user responses, generate scenarios, create rubrics.
        
        Args:
            core_topics: Core topics from Phase 1
            questionnaire_responses: User's questionnaire responses
            num_scenarios: Number of scenarios to generate
            
        Returns:
            Complete Phase 2 results including scenarios and rubrics
        """
        try:
            self.logger.info("Starting Phase 2: Scenario Generation")
            
            # Step 1: Process user responses
            self.logger.info("Processing user responses...")
            user_profile = self.process_user_responses(questionnaire_responses)
            
            # Step 2: Generate personalized scenarios
            self.logger.info("Generating personalized scenarios...")
            scenarios = self.generate_personalized_scenarios(core_topics, user_profile, num_scenarios)
            
            # Step 3: Generate rubrics for each scenario
            self.logger.info("Generating dynamic rubrics...")
            scenarios_with_rubrics = []
            for scenario in scenarios:
                rubric = self.generate_dynamic_rubric(scenario, user_profile)
                scenario["rubric"] = rubric
                scenarios_with_rubrics.append(scenario)
            
            # Compile complete results
            results = {
                "phase": "scenario_generation",
                "status": "completed",
                "timestamp": self._get_timestamp(),
                "user_profile": user_profile,
                "scenarios": scenarios_with_rubrics,
                "scenario_count": len(scenarios_with_rubrics),
                "personalization_applied": all(s.get("personalization_applied", False) for s in scenarios),
                "next_phase": "real_time_scoring"
            }
            
            self.logger.info("Phase 2 completed successfully")
            return results
            
        except Exception as e:
            self.logger.error(f"Phase 2 failed: {str(e)}")
            return {
                "phase": "scenario_generation",
                "status": "failed",
                "error": str(e),
                "timestamp": self._get_timestamp()
            }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat() 