"""
Knowledge Extraction Agent for Sensa AI - Phase 1 of Know Me Feature

This agent handles:
1. PDF parsing and text extraction using PyMuPDF
2. Core topic identification (5-7 key domains) via Gemini API
3. "Know Me" questionnaire generation bridging academic content with personal experiences
"""

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    
import re
from typing import Dict, List, Any, Optional
from ..base_agent import SensaBaseAgent
from ..config import config
import json

class KnowledgeExtractionAgent(SensaBaseAgent):
    """Agent responsible for extracting knowledge from PDFs and generating personalized questionnaires."""
    
    def __init__(self):
        super().__init__("KnowledgeExtractionAgent")
    
    def extract_text_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract text content from PDF using PyMuPDF.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary containing extracted text, metadata, and structure info
        """
        if not PYMUPDF_AVAILABLE:
            raise ImportError("PyMuPDF is not installed. Please install it with: pip install PyMuPDF")
            
        try:
            doc = fitz.open(pdf_path)
            
            extracted_data = {
                "text_content": "",
                "page_count": len(doc),
                "metadata": doc.metadata,
                "pages": [],
                "structure": {
                    "chapters": [],
                    "sections": [],
                    "key_terms": []
                }
            }
            
            full_text = ""
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                # Store individual page content
                extracted_data["pages"].append({
                    "page_number": page_num + 1,
                    "text": page_text,
                    "word_count": len(page_text.split())
                })
                
                full_text += page_text + "\n"
            
            extracted_data["text_content"] = full_text
            extracted_data["total_word_count"] = len(full_text.split())
            
            # Extract structure elements
            extracted_data["structure"] = self._analyze_document_structure(full_text)
            
            doc.close()
            
            self.logger.info(f"Successfully extracted {len(full_text.split())} words from {len(doc)} pages")
            return extracted_data
            
        except Exception as e:
            self.logger.error(f"Error extracting PDF: {str(e)}")
            raise Exception(f"PDF extraction failed: {str(e)}")
    
    def _analyze_document_structure(self, text: str) -> Dict[str, List[str]]:
        """Analyze document structure to identify chapters, sections, and key terms."""
        structure = {
            "chapters": [],
            "sections": [],
            "key_terms": []
        }
        
        lines = text.split('\n')
        
        # Identify chapters (lines that might be chapter headers)
        chapter_patterns = [
            r'^Chapter \d+',
            r'^\d+\.\s+[A-Z]',
            r'^[A-Z][A-Z\s]+$',  # All caps lines
            r'^[A-Z][a-z]+:'
        ]
        
        # Identify sections
        section_patterns = [
            r'^\d+\.\d+',
            r'^[A-Z][a-z]+:',
            r'^\w+\s+\w+$'
        ]
        
        for line in lines:
            line = line.strip()
            if len(line) < 3 or len(line) > 100:
                continue
                
            # Check for chapters
            for pattern in chapter_patterns:
                if re.match(pattern, line):
                    structure["chapters"].append(line)
                    break
            
            # Check for sections
            for pattern in section_patterns:
                if re.match(pattern, line):
                    structure["sections"].append(line)
                    break
        
        # Extract key terms (capitalized words that appear frequently)
        words = re.findall(r'\b[A-Z][a-z]+\b', text)
        word_freq = {}
        for word in words:
            if len(word) > 3:  # Only consider significant words
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top 20 most frequent capitalized terms
        structure["key_terms"] = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20]
        structure["key_terms"] = [term[0] for term in structure["key_terms"]]
        
        return structure
    
    def identify_core_topics(self, extracted_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Identify 5-7 core knowledge domains from the extracted content using Gemini API.
        
        Args:
            extracted_data: Output from extract_text_from_pdf
            
        Returns:
            List of core topics with descriptions and key concepts
        """
        try:
            # Prepare content for analysis
            text_sample = extracted_data["text_content"][:8000]  # Use first 8000 chars for analysis
            key_terms = extracted_data["structure"]["key_terms"][:15]
            chapters = extracted_data["structure"]["chapters"][:10]
            
            prompt = f"""
            Analyze this educational content and identify 5-7 core knowledge domains that represent the main topics covered.
            
            Content Sample:
            {text_sample}
            
            Key Terms Found: {', '.join(key_terms)}
            Chapter Structure: {', '.join(chapters)}
            
            For each core topic, provide:
            1. Topic Name (concise, 2-4 words)
            2. Description (1-2 sentences explaining the topic)
            3. Key Concepts (3-5 main concepts within this topic)
            4. Difficulty Level (Beginner/Intermediate/Advanced)
            5. Prerequisites (what knowledge is needed)
            
            Return as JSON array with this structure:
            [
                {{
                    "topic_name": "Topic Name",
                    "description": "Brief description of the topic",
                    "key_concepts": ["concept1", "concept2", "concept3"],
                    "difficulty_level": "Intermediate",
                    "prerequisites": ["prerequisite1", "prerequisite2"],
                    "estimated_study_time": "X hours"
                }}
            ]
            
            Focus on identifying topics that would be essential for understanding and applying this material in real-world scenarios.
            """
            
            response = self.gemini_client.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                topics = json.loads(json_str)
                
                self.logger.info(f"Identified {len(topics)} core topics")
                return topics
            else:
                raise Exception("Could not parse topics from AI response")
                
        except Exception as e:
            self.logger.error(f"Error identifying core topics: {str(e)}")
            # Provide fallback topics based on key terms
            return self._generate_fallback_topics(extracted_data)
    
    def _generate_fallback_topics(self, extracted_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate fallback topics when AI analysis fails."""
        key_terms = extracted_data["structure"]["key_terms"][:10]
        
        fallback_topics = []
        for i, term in enumerate(key_terms[:5]):
            fallback_topics.append({
                "topic_name": term,
                "description": f"Key concepts and applications related to {term}",
                "key_concepts": [f"{term} fundamentals", f"{term} applications", f"{term} best practices"],
                "difficulty_level": "Intermediate",
                "prerequisites": ["Basic understanding of the subject"],
                "estimated_study_time": "2-3 hours"
            })
        
        return fallback_topics
    
    def generate_know_me_questionnaire(self, core_topics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate a "Know Me" questionnaire that bridges academic content with personal experiences.
        
        Args:
            core_topics: List of identified core topics
            
        Returns:
            Dictionary containing questionnaire structure and questions
        """
        try:
            topics_summary = "\n".join([
                f"- {topic['topic_name']}: {topic['description']}"
                for topic in core_topics
            ])
            
            prompt = f"""
            Create a personalized "Know Me" questionnaire based on these academic topics:
            
            {topics_summary}
            
            The questionnaire should:
            1. Bridge academic concepts with personal experiences
            2. Help understand the user's background and learning style
            3. Identify real-world contexts from the user's life
            4. Be engaging and conversational (not like a test)
            5. Have 8-12 questions total
            
            Question types to include:
            - Experience questions ("Tell me about a time when...")
            - Preference questions ("How do you prefer to...")
            - Background questions ("What's your experience with...")
            - Scenario questions ("Imagine you need to...")
            - Interest questions ("What interests you most about...")
            
            Return as JSON with this structure:
            {{
                "title": "Get to Know You - Personalized Learning Profile",
                "description": "Help us understand your background and interests to create personalized scenarios",
                "estimated_time": "5-7 minutes",
                "questions": [
                    {{
                        "id": "q1",
                        "type": "experience",
                        "question": "Tell me about a time when you had to learn something technical quickly. What approach worked best for you?",
                        "purpose": "Understanding learning style and technical aptitude",
                        "related_topics": ["topic1", "topic2"]
                    }}
                ]
            }}
            
            Make questions conversational and relatable. Focus on experiences that could connect to the academic topics in meaningful ways.
            """
            
            response = self.gemini_client.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                questionnaire = json.loads(json_str)
                
                # Add metadata
                questionnaire["created_at"] = self._get_timestamp()
                questionnaire["total_questions"] = len(questionnaire.get("questions", []))
                questionnaire["core_topics"] = [topic["topic_name"] for topic in core_topics]
                
                self.logger.info(f"Generated questionnaire with {questionnaire['total_questions']} questions")
                return questionnaire
            else:
                raise Exception("Could not parse questionnaire from AI response")
                
        except Exception as e:
            self.logger.error(f"Error generating questionnaire: {str(e)}")
            return self._generate_fallback_questionnaire(core_topics)
    
    def _generate_fallback_questionnaire(self, core_topics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a basic questionnaire when AI generation fails."""
        return {
            "title": "Get to Know You - Learning Profile",
            "description": "Help us understand your background to personalize your learning experience",
            "estimated_time": "5 minutes",
            "created_at": self._get_timestamp(),
            "total_questions": 6,
            "core_topics": [topic["topic_name"] for topic in core_topics],
            "questions": [
                {
                    "id": "q1",
                    "type": "background",
                    "question": "What's your current experience level with the topics in this material?",
                    "purpose": "Assess baseline knowledge",
                    "related_topics": [topic["topic_name"] for topic in core_topics[:3]]
                },
                {
                    "id": "q2",
                    "type": "preference",
                    "question": "How do you prefer to learn new technical concepts?",
                    "purpose": "Understand learning style",
                    "related_topics": []
                },
                {
                    "id": "q3",
                    "type": "experience",
                    "question": "Describe a challenging problem you've solved recently.",
                    "purpose": "Assess problem-solving approach",
                    "related_topics": []
                },
                {
                    "id": "q4",
                    "type": "scenario",
                    "question": "What situations would you most likely apply this knowledge in?",
                    "purpose": "Identify practical applications",
                    "related_topics": [topic["topic_name"] for topic in core_topics]
                },
                {
                    "id": "q5",
                    "type": "interest",
                    "question": "Which aspects of this subject interest you most?",
                    "purpose": "Focus on engaging content",
                    "related_topics": [topic["topic_name"] for topic in core_topics]
                },
                {
                    "id": "q6",
                    "type": "goal",
                    "question": "What do you hope to achieve by mastering this material?",
                    "purpose": "Understand motivation and goals",
                    "related_topics": []
                }
            ]
        }
    
    def process_knowledge_extraction(self, pdf_path: str) -> Dict[str, Any]:
        """
        Complete Phase 1 workflow: Extract PDF content, identify topics, generate questionnaire.
        
        Args:
            pdf_path: Path to the PDF file to analyze
            
        Returns:
            Complete Phase 1 results including extracted content, topics, and questionnaire
        """
        try:
            self.logger.info("Starting Phase 1: Knowledge Extraction")
            
            # Step 1: Extract PDF content
            self.logger.info("Extracting PDF content...")
            extracted_data = self.extract_text_from_pdf(pdf_path)
            
            # Step 2: Identify core topics
            self.logger.info("Identifying core topics...")
            core_topics = self.identify_core_topics(extracted_data)
            
            # Step 3: Generate questionnaire
            self.logger.info("Generating Know Me questionnaire...")
            questionnaire = self.generate_know_me_questionnaire(core_topics)
            
            # Compile complete results
            results = {
                "phase": "knowledge_extraction",
                "status": "completed",
                "timestamp": self._get_timestamp(),
                "pdf_metadata": {
                    "page_count": extracted_data["page_count"],
                    "word_count": extracted_data["total_word_count"],
                    "title": extracted_data["metadata"].get("title", "Unknown"),
                    "author": extracted_data["metadata"].get("author", "Unknown")
                },
                "extracted_content": {
                    "text_sample": extracted_data["text_content"][:1000] + "...",  # Store sample only
                    "structure": extracted_data["structure"]
                },
                "core_topics": core_topics,
                "questionnaire": questionnaire,
                "next_phase": "user_interaction"
            }
            
            self.logger.info("Phase 1 completed successfully")
            return results
            
        except Exception as e:
            self.logger.error(f"Phase 1 failed: {str(e)}")
            return {
                "phase": "knowledge_extraction",
                "status": "failed",
                "error": str(e),
                "timestamp": self._get_timestamp()
            }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()