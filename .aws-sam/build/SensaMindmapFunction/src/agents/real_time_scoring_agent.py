from typing import Dict, Any, List
from ..base_agent import SensaBaseAgent
from ..types import *
import json
import re

class RealTimeScoringAgent(SensaBaseAgent):
    """Agent responsible for real-time scoring of user answers against dynamic rubrics"""
    
    def __init__(self):
        super().__init__("RealTimeScoringAgent")
    
    async def score_answer(self, user_answer: str, rubric: Dict[str, Any], question_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 3: Real-time answer analysis and scoring
        """
        self.log(f"Scoring answer for question: {question_context.get('question_id', 'unknown')}")
        
        # Get rubric details
        rubric_data = rubric.get('rubric', {})
        rubric_items = rubric_data.get('rubric_items', [])
        bonus_points = rubric_data.get('bonus_points', [])
        total_possible = rubric_data.get('total_points', 100)
        
        # Score each rubric item
        scores = []
        total_score = 0
        feedback_items = []
        
        for item in rubric_items:
            item_score = await self._score_rubric_item(user_answer, item, question_context)
            scores.append(item_score)
            total_score += item_score['points_earned']
            
            # Generate feedback for this item
            if item_score['points_earned'] > 0:
                feedback_items.append({
                    "type": "positive",
                    "concept": item['concept'],
                    "message": f"✓ {item['concept']} addressed",
                    "points": item_score['points_earned']
                })
            else:
                feedback_items.append({
                    "type": "missing",
                    "concept": item['concept'],
                    "message": f"Consider addressing: {item['description']}",
                    "points": 0
                })
        
        # Check for bonus points
        bonus_earned = 0
        for bonus in bonus_points:
            if await self._check_bonus_criteria(user_answer, bonus):
                bonus_earned += bonus.get('points', 0)
                feedback_items.append({
                    "type": "bonus",
                    "concept": bonus['concept'],
                    "message": f"🌟 Bonus: {bonus['description']}",
                    "points": bonus.get('points', 0)
                })
        
        final_score = min(total_score + bonus_earned, total_possible + sum(b.get('points', 0) for b in bonus_points))
        percentage = (final_score / total_possible) * 100
        
        # Generate overall feedback
        overall_feedback = await self._generate_overall_feedback(
            user_answer, final_score, percentage, feedback_items, question_context
        )
        
        return {
            "question_id": question_context.get('question_id'),
            "total_score": final_score,
            "total_possible": total_possible,
            "percentage": round(percentage, 1),
            "detailed_scores": scores,
            "feedback_items": feedback_items,
            "overall_feedback": overall_feedback,
            "completion_status": "complete" if len(user_answer.split()) > 50 else "in_progress"
        }
    
    async def _score_rubric_item(self, user_answer: str, rubric_item: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Score a single rubric item"""
        
        concept = rubric_item.get('concept', '')
        max_points = rubric_item.get('points', 0)
        keywords = rubric_item.get('keywords', [])
        levels = rubric_item.get('levels', {})
        
        # AI-powered semantic scoring
        prompt = f"""You are an expert examiner scoring a student's answer for a specific concept.

CONCEPT TO EVALUATE: {concept}
DESCRIPTION: {rubric_item.get('description', '')}
MAXIMUM POINTS: {max_points}

SCORING LEVELS:
- Excellent ({max_points} points): {levels.get('excellent', 'Demonstrates complete understanding')}
- Good ({max_points * 0.75:.0f} points): {levels.get('good', 'Demonstrates good understanding')}
- Basic ({max_points * 0.5:.0f} points): {levels.get('basic', 'Demonstrates basic understanding')}
- Not Addressed (0 points): Concept not mentioned or incorrectly applied

STUDENT'S ANSWER:
"{user_answer}"

TASK: Evaluate how well the student addressed this specific concept.

RETURN FORMAT (JSON):
{{
  "points_earned": 0-{max_points},
  "level_achieved": "excellent|good|basic|not_addressed",
  "reasoning": "Brief explanation of scoring decision",
  "evidence": "Specific text from answer that supports the score"
}}

Provide accurate, fair scoring."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.2)
            response_data = self.extract_json_from_text(response_text)
            
            return {
                "concept": concept,
                "points_earned": response_data.get("points_earned", 0),
                "max_points": max_points,
                "level_achieved": response_data.get("level_achieved", "not_addressed"),
                "reasoning": response_data.get("reasoning", ""),
                "evidence": response_data.get("evidence", "")
            }
        except Exception as e:
            self.log(f"Error scoring rubric item {concept}: {str(e)}", "ERROR")
            return {
                "concept": concept,
                "points_earned": 0,
                "max_points": max_points,
                "level_achieved": "not_addressed",
                "reasoning": "Error in scoring",
                "evidence": ""
            }
    
    async def _check_bonus_criteria(self, user_answer: str, bonus: Dict[str, Any]) -> bool:
        """Check if answer meets bonus criteria"""
        
        concept = bonus.get('concept', '')
        description = bonus.get('description', '')
        
        prompt = f"""You are evaluating whether a student's answer demonstrates exceptional insight for bonus points.

BONUS CRITERIA: {concept}
DESCRIPTION: {description}

STUDENT'S ANSWER:
"{user_answer}"

TASK: Determine if the answer demonstrates the exceptional insight described in the bonus criteria.

RETURN FORMAT (JSON):
{{
  "meets_criteria": true/false,
  "reasoning": "Brief explanation of decision"
}}

Be selective - bonus points should only be awarded for truly exceptional insights."""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.2)
            response_data = self.extract_json_from_text(response_text)
            return response_data.get("meets_criteria", False)
        except Exception as e:
            self.log(f"Error checking bonus criteria: {str(e)}", "ERROR")
            return False
    
    async def _generate_overall_feedback(self, user_answer: str, score: int, percentage: float, 
                                       feedback_items: List[Dict], context: Dict[str, Any]) -> str:
        """Generate encouraging overall feedback"""
        
        prompt = f"""You are an encouraging tutor providing feedback on a student's exam answer.

QUESTION CONTEXT: {context.get('topic', 'Academic Topic')}
SCORE: {score} points ({percentage:.1f}%)

DETAILED FEEDBACK:
{chr(10).join([f"- {item['message']}" for item in feedback_items])}

STUDENT'S ANSWER LENGTH: {len(user_answer.split())} words

TASK: Write encouraging, constructive feedback that:
1. Acknowledges what they did well
2. Provides specific suggestions for improvement
3. Maintains a positive, supportive tone
4. Is concise (2-3 sentences max)

Example tone: "Great work on explaining the security concepts! Your real-world connection was excellent. To strengthen your answer, consider discussing the specific technical implementation details."

Generate supportive feedback:"""

        try:
            response_text = await self.call_gemini(prompt, temperature=0.6)
            return response_text.strip()
        except Exception as e:
            self.log(f"Error generating feedback: {str(e)}", "ERROR")
            if percentage >= 80:
                return "Excellent work! You demonstrated strong understanding of the concepts."
            elif percentage >= 60:
                return "Good effort! You covered the main points. Consider adding more specific details."
            else:
                return "You're on the right track! Focus on addressing the key concepts more thoroughly."
    
    async def provide_real_time_hints(self, partial_answer: str, rubric: Dict[str, Any], 
                                    question_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide real-time hints as user types (password-style feedback)
        """
        if len(partial_answer.split()) < 10:  # Don't provide hints for very short answers
            return {"hints": [], "covered_concepts": []}
        
        # Quick check of what concepts have been addressed
        covered_concepts = []
        hints = []
        
        rubric_items = rubric.get('rubric', {}).get('rubric_items', [])
        
        for item in rubric_items:
            keywords = item.get('keywords', [])
            concept = item.get('concept', '')
            
            # Simple keyword matching for real-time feedback
            if any(keyword.lower() in partial_answer.lower() for keyword in keywords):
                covered_concepts.append(concept)
            else:
                hints.append(f"Consider discussing: {concept}")
        
        return {
            "covered_concepts": covered_concepts,
            "hints": hints[:2],  # Limit to 2 hints to avoid overwhelming
            "progress": f"{len(covered_concepts)}/{len(rubric_items)} concepts addressed"
        }
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method for the Real-Time Scoring Agent"""
        action = data.get('action')
        
        if action == 'score_answer':
            user_answer = data.get('user_answer', '')
            rubric = data.get('rubric', {})
            question_context = data.get('question_context', {})
            result = await self.score_answer(user_answer, rubric, question_context)
            return result
        
        elif action == 'real_time_hints':
            partial_answer = data.get('partial_answer', '')
            rubric = data.get('rubric', {})
            question_context = data.get('question_context', {})
            result = await self.provide_real_time_hints(partial_answer, rubric, question_context)
            return result
        
        elif action == 'process_voice_input':
            # Placeholder for voice processing - ready for Eleven Labs integration
            audio_data = data.get('audio_data', '')
            # For now, return the text as-is (would integrate Eleven Labs here)
            return {
                "transcribed_text": data.get('transcribed_text', ''),
                "confidence": 0.95,
                "processing_method": "text_input"
            }
        
        else:
            raise ValueError(f"Unknown action: {action}") 