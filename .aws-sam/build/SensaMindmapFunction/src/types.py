from typing import Dict, List, Optional, Union, Literal
from pydantic import BaseModel
from datetime import datetime

# Memory and Profile Types
class MemoryProfile(BaseModel):
    id: str
    themes: List[str]
    emotional_anchors: List[str]
    sensory_details: List[str]
    learning_style: str
    motivational_triggers: List[str]
    cognitive_patterns: List[str]

class UserMemoryProfile(BaseModel):
    memories: List[Dict[str, str]]  # Each memory has 'category' and 'text'

class MemoryAnalysisResult(BaseModel):
    themes: List[str]
    emotional_tone: str
    learning_indicators: List[str]
    confidence: float
    insights: str

# Course Analysis Types
class CourseAnalysisResult(BaseModel):
    course_id: str
    course_name: str
    university: str
    core_goal: str
    practical_outcome: str
    learning_objectives: List[str]
    prerequisites: List[str]
    estimated_duration: str
    difficulty_level: Literal['Beginner', 'Intermediate', 'Advanced']
    key_topics: List[str]
    career_outcomes: List[str]

# Personalization Types
class MemoryConnection(BaseModel):
    concept: str
    analogy: str
    memory_connection: str
    study_tip: str

class PersonalizationResult(BaseModel):
    memory_connections: List[MemoryConnection]

# Career Pathway Types
class CareerPathway(BaseModel):
    type: Literal['The Prominent Path', 'Your Personalized Discovery Path']
    field_name: str
    description: str
    memory_link: str

class CareerPathwayResponse(BaseModel):
    pathways: List[CareerPathway]

# Study Map Types
class SensaInsight(BaseModel):
    analogy: str
    study_tip: str

class KnowledgeNode(BaseModel):
    node_name: str
    in_course: bool
    sensa_insight: Optional[SensaInsight] = None
    children: Optional[List['KnowledgeNode']] = None

class StudyMap(BaseModel):
    field: str
    map: List[KnowledgeNode]

class NodeData(BaseModel):
    node_name: str
    sensa_insight: SensaInsight

class MermaidStudyMap(BaseModel):
    mermaid_code: str
    node_data: Dict[str, NodeData]
    legend_html: str

# Orchestration Types
class OrchestratorRequest(BaseModel):
    user_id: str
    course_id: Optional[str] = None
    course_query: Optional[str] = None
    action: Literal['analyze_course', 'generate_study_map', 'analyze_memory']
    additional_data: Optional[Dict] = None

class OrchestratorResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None

# Update forward references
KnowledgeNode.model_rebuild() 