import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration settings for Sensa ADK Agents"""
    
    # Google AI Configuration
    GOOGLE_AI_API_KEY: str = os.getenv('GOOGLE_AI_API_KEY', '')
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv('SUPABASE_URL', '')
    SUPABASE_ANON_KEY: str = os.getenv('SUPABASE_ANON_KEY', '')
    
    # Agent Configuration
    DEFAULT_TEMPERATURE: float = 0.4
    MAX_OUTPUT_TOKENS: int = 2048
    
    # Model Configuration
    GEMINI_MODEL: str = 'gemini-1.5-pro'
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that all required configuration is present"""
        required_vars = [
            cls.GOOGLE_AI_API_KEY,
            cls.SUPABASE_URL,
            cls.SUPABASE_ANON_KEY
        ]
        return all(var for var in required_vars)

config = Config() 