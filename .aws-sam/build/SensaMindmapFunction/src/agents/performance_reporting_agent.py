from typing import Dict, Any, List
from ..base_agent import SensaBaseAgent
from ..types import *
import json
import statistics

class PerformanceReportingAgent(SensaBaseAgent):
    """Agent responsible for generating predictive performance reports and improvement recommendations"""
    
    def __init__(self):
        super().__init__("PerformanceReportingAgent")
    
    async def generate_performance_report(self, scoring_results: List[Dict[str, Any]], 
                                        subject_area: str, core_topics: List[Dict]) -> Dict[str, Any]:
        """
        Phase 4: Generate comprehensive predictive performance report
        """
        self.log(f"Generating performance report for {len(scoring_results)} scored questions")
        
        # Aggregate scores by topic
        topic_scores = self._aggregate_scores_by_topic(scoring_results, core_topics)
        
        # Calculate overall metrics
        overall_metrics = self._calculate_overall_metrics(scoring_results)
        
        # Generate predictive insights
        predictive_insights = await self._generate_predictive_insights(
            topic_scores, overall_metrics, subject_area
        )
        
        # Identify improvement areas
        improvement_areas = await self._identify_improvement_areas(
            topic_scores, core_topics, subject_area
        )
        
        # Generate study recommendations
        study_recommendations = await self._generate_study_recommendations(
            improvement_areas, overall_metrics, subject_area
        )
        
        return {
            "overall_metrics": overall_metrics,
            "topic_breakdown": topic_scores,
            "predictive_insights": predictive_insights,
            "improvement_areas": improvement_areas,
            "study_recommendations": study_recommendations,
            "report_generated_at": self._get_timestamp(),
            "subject_area": subject_area
        }
    
    def _aggregate_scores_by_topic(self, scoring_results: List[Dict], core_topics: List[Dict]) -> Dict[str, Any]:
        """Aggregate scores by academic topic"""
        topic_scores = {}
        
        for result in scoring_results:
            topic = None
            # Find the topic this question relates to
            for core_topic in core_topics:
                if core_topic.get('topic', '').lower() in result.get('question_id', '').lower():
                    topic = core_topic.get('topic')
                    break
            
            if not topic:
                topic = "General"
            
            if topic not in topic_scores:
                topic_scores[topic] = {
                    "scores": [],
                    "total_questions": 0,
                    "average_score": 0,
                    "complexity": core_topics[0].get('complexity', 'intermediate') if core_topics else 'intermediate'
                }
            
            topic_scores[topic]["scores"].append(result.get('percentage', 0))
            topic_scores[topic]["total_questions"] += 1
        
        # Calculate averages
        for topic, data in topic_scores.items():
            if data["scores"]:
                data["average_score"] = round(statistics.mean(data["scores"]), 1)
                data["score_range"] = f"{min(data['scores']):.1f}% - {max(data['scores']):.1f}%"
        
        return topic_scores
    
    def _calculate_overall_metrics(self, scoring_results: List[Dict]) -> Dict[str, Any]:
        """Calculate overall performance metrics"""
        if not scoring_results:
            return {"estimated_exam_score": 0, "confidence_level": "low"}
        
        all_scores = [result.get('percentage', 0) for result in scoring_results]
        
        return {
            "estimated_exam_score": round(statistics.mean(all_scores), 1),
            "score_consistency": round(statistics.stdev(all_scores) if len(all_scores) > 1 else 0, 1),
            "highest_score": max(all_scores),
            "lowest_score": min(all_scores),
            "total_questions_answered": len(scoring_results),
            "confidence_level": "high" if statistics.mean(all_scores) >= 75 else "medium" if statistics.mean(all_scores) >= 60 else "low"
        }
    
    async def _generate_predictive_insights(self, topic_scores: Dict, overall_metrics: Dict, subject_area: str) -> Dict[str, Any]:
        """Generate AI-powered predictive insights"""
        
        # Prepare topic performance summary
        topic_summary = []
        for topic, data in topic_scores.items():
            topic_summary.append(f"{topic}: {data['average_score']:.1f}% (based on {data['total_questions']} questions)")
        
        prompt = f"""You are an expert educational assessment analyst providing predictive insights for exam performance.

SUBJECT AREA: {subject_area}
OVERALL ESTIMATED SCORE: {overall_metrics.get('estimated_exam_score', 0):.1f}%
SCORE CONSISTENCY: {overall_metrics.get('score_consistency', 0):.1f}% standard deviation

TOPIC PERFORMANCE BREAKDOWN:
{chr(10).join(topic_summary)}

TASK: Generate predictive insights about likely exam performance and key patterns.

INSTRUCTIONS:
1. Provide a realistic estimated exam score percentage
2. Identify the student's strongest and weakest areas
3. Comment on score consistency and what it indicates
4. Predict likely challenges on the actual exam
5. Highlight positive patterns and learning strengths

RETURN FORMAT (JSON):
{{
  "predicted_exam_score": "65-75%",
  "confidence_in_prediction": "high|medium|low",
  "strongest_areas": ["area1", "area2"],
  "weakest_areas": ["area1", "area2"],
  "performance_pattern": "Description of their learning pattern",
  "exam_readiness": "ready|needs_work|not_ready",
  "key_insights": ["insight1", "insight2", "insight3"]
}}

Provide realistic, actionable insights."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.4)
            response_data = self.extract_json_from_text(response_text)
            
            return {
                "predicted_exam_score": response_data.get("predicted_exam_score", "Score range unavailable"),
                "confidence_in_prediction": response_data.get("confidence_in_prediction", "medium"),
                "strongest_areas": response_data.get("strongest_areas", []),
                "weakest_areas": response_data.get("weakest_areas", []),
                "performance_pattern": response_data.get("performance_pattern", ""),
                "exam_readiness": response_data.get("exam_readiness", "needs_work"),
                "key_insights": response_data.get("key_insights", [])
            }
        except Exception as e:
            self.log(f"Error generating predictive insights: {str(e)}", "ERROR")
            raise
    
    async def _identify_improvement_areas(self, topic_scores: Dict, core_topics: List[Dict], subject_area: str) -> List[Dict[str, Any]]:
        """Identify top 3 areas for improvement"""
        
        # Sort topics by score (lowest first)
        sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1]['average_score'])
        top_3_weak = sorted_topics[:3]
        
        improvement_areas = []
        
        for topic_name, score_data in top_3_weak:
            # Find the original topic details
            topic_details = next((t for t in core_topics if t.get('topic') == topic_name), {})
            
            prompt = f"""You are an expert tutor identifying specific improvement strategies.

SUBJECT AREA: {subject_area}
WEAK TOPIC: {topic_name}
CURRENT PERFORMANCE: {score_data['average_score']:.1f}%
TOPIC DESCRIPTION: {topic_details.get('description', 'No description available')}
COMPLEXITY LEVEL: {topic_details.get('complexity', 'intermediate')}

TASK: Provide specific, actionable improvement advice for this topic.

RETURN FORMAT (JSON):
{{
  "topic": "{topic_name}",
  "current_score": {score_data['average_score']:.1f},
  "improvement_potential": "high|medium|low",
  "specific_actions": ["action1", "action2", "action3"],
  "study_methods": ["method1", "method2"],
  "estimated_improvement_time": "time estimate",
  "priority_level": "high|medium|low"
}}

Focus on practical, specific actions."""

            try:
                response_text = await self.call_gemini(prompt, temperature=0.5)
                response_data = self.extract_json_from_text(response_text)
                improvement_areas.append(response_data)
            except Exception as e:
                self.log(f"Error generating improvement area for {topic_name}: {str(e)}", "ERROR")
                improvement_areas.append({
                    "topic": topic_name,
                    "current_score": score_data['average_score'],
                    "improvement_potential": "medium",
                    "specific_actions": ["Review core concepts", "Practice more questions"],
                    "study_methods": ["Active recall", "Spaced repetition"],
                    "estimated_improvement_time": "1-2 weeks",
                    "priority_level": "high" if score_data['average_score'] < 60 else "medium"
                })
        
        return improvement_areas
    
    async def _generate_study_recommendations(self, improvement_areas: List[Dict], 
                                            overall_metrics: Dict, subject_area: str) -> Dict[str, Any]:
        """Generate personalized study recommendations"""
        
        improvement_summary = "\n".join([
            f"- {area['topic']}: {area['current_score']:.1f}% (Priority: {area.get('priority_level', 'medium')})"
            for area in improvement_areas
        ])
        
        prompt = f"""You are an expert study coach creating a personalized study plan.

SUBJECT AREA: {subject_area}
CURRENT ESTIMATED EXAM SCORE: {overall_metrics.get('estimated_exam_score', 0):.1f}%
SCORE CONSISTENCY: {overall_metrics.get('score_consistency', 0):.1f}%

AREAS NEEDING IMPROVEMENT:
{improvement_summary}

TASK: Create a comprehensive study plan with timeline and specific strategies.

RETURN FORMAT (JSON):
{{
  "study_timeline": "2-3 weeks|1 month|2 months",
  "daily_study_time": "1-2 hours recommended",
  "priority_order": ["topic1", "topic2", "topic3"],
  "week_by_week_plan": [
    {{
      "week": 1,
      "focus": "Primary focus area",
      "activities": ["activity1", "activity2"],
      "goal": "Specific weekly goal"
    }}
  ],
  "study_techniques": ["technique1", "technique2"],
  "practice_recommendations": ["practice1", "practice2"],
  "confidence_building": ["strategy1", "strategy2"]
}}

Create a realistic, motivating study plan."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.5)
            response_data = self.extract_json_from_text(response_text)
            
            return {
                "study_timeline": response_data.get("study_timeline", "2-3 weeks"),
                "daily_study_time": response_data.get("daily_study_time", "1-2 hours"),
                "priority_order": response_data.get("priority_order", []),
                "week_by_week_plan": response_data.get("week_by_week_plan", []),
                "study_techniques": response_data.get("study_techniques", []),
                "practice_recommendations": response_data.get("practice_recommendations", []),
                "confidence_building": response_data.get("confidence_building", [])
            }
        except Exception as e:
            self.log(f"Error generating study recommendations: {str(e)}", "ERROR")
            return {
                "study_timeline": "2-3 weeks",
                "daily_study_time": "1-2 hours",
                "priority_order": [area['topic'] for area in improvement_areas],
                "study_techniques": ["Active recall", "Spaced repetition", "Practice testing"],
                "practice_recommendations": ["Review weak topics daily", "Take practice exams"],
                "confidence_building": ["Focus on improvement", "Track progress"]
            }
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Performance Reporting Agent"""
        action = data.get('action')
        
        if action == 'generate_report':
            scoring_results = data.get('scoring_results', [])
            subject_area = data.get('subject_area', 'Unknown Subject')
            core_topics = data.get('core_topics', [])
            result = await self.generate_performance_report(scoring_results, subject_area, core_topics)
            return result
        
        else:
            raise ValueError(f"Unknown action: {action}") 