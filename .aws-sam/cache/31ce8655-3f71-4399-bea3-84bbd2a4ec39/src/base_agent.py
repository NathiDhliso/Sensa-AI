import json
import asyncio
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
import google.generativeai as genai
from supabase import create_client, Client
from .config import config
from .types import *

class SensaBaseAgent(ABC):
    """Base class for all Sensa AI agents"""
    
    def __init__(self, name: str):
        self.name = name
        self.gemini_model = None
        self.supabase: Optional[Client] = None
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize external services (Gemini and Supabase)"""
        if not config.validate():
            raise ValueError("Missing required configuration. Check your environment variables.")
        
        # Initialize Gemini
        genai.configure(api_key=config.GOOGLE_AI_API_KEY)
        self.gemini_model = genai.GenerativeModel(config.GEMINI_MODEL)
        
        # Initialize Supabase
        self.supabase = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def call_gemini(self, prompt: str, temperature: float = None, max_tokens: int = None) -> str:
        """Make an async call to Gemini API"""
        temp = temperature or config.DEFAULT_TEMPERATURE
        max_tok = max_tokens or config.MAX_OUTPUT_TOKENS
        
        try:
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temp,
                    max_output_tokens=max_tok,
                )
            )
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API call failed: {str(e)}")
    
    def extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """Extract JSON from Gemini response text"""
        try:
            # Try to find JSON in the text
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                raise ValueError("No JSON found in response")
        except Exception as e:
            raise Exception(f"Failed to parse JSON from response: {str(e)}")
    
    async def retrieve_user_data(self, user_id: str) -> Dict[str, Any]:
        """Retrieve user data from Supabase"""
        try:
            # Get user memories
            memories_response = self.supabase.table('user_memories').select('*').eq('user_id', user_id).execute()
            
            # Get user profile if exists
            profile_response = self.supabase.table('user_profiles').select('*').eq('user_id', user_id).execute()
            
            return {
                'memories': memories_response.data if memories_response.data else [],
                'profile': profile_response.data[0] if profile_response.data else None
            }
        except Exception as e:
            raise Exception(f"Failed to retrieve user data: {str(e)}")
    
    async def retrieve_course_data(self, course_id: str) -> Dict[str, Any]:
        """Retrieve course data from Supabase"""
        try:
            response = self.supabase.table('courses').select('*').eq('id', course_id).execute()
            if not response.data:
                raise ValueError(f"Course not found: {course_id}")
            return response.data[0]
        except Exception as e:
            raise Exception(f"Failed to retrieve course data: {str(e)}")
    
    @abstractmethod
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Abstract method that each agent must implement"""
        pass
    
    def log(self, message: str, level: str = "INFO"):
        """Simple logging method"""
        print(f"[{level}] {self.name}: {message}") 