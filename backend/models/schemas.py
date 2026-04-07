"""
Pydantic schemas for request/response models.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class RiskLevel(str, Enum):
    HIGH = "red"
    MEDIUM = "yellow"
    LOW = "green"


class SentenceAnalysis(BaseModel):
    """Analysis result for a single sentence."""
    id: int
    text: str
    score: float = Field(ge=0, le=100, description="AI probability score 0-100")
    risk_level: RiskLevel
    ai_words_found: List[str] = []
    phrases_found: List[str] = []
    reasons: List[str] = []
    word_count: int
    char_count: int
    rewrite_suggestion: Optional[str] = None


class SectionAnalysis(BaseModel):
    """Analysis result for a document section."""
    name: str
    start_sentence: int
    end_sentence: int
    ai_score: float
    humanization_score: float
    sentence_count: int
    flagged_count: int


class DocumentAnalysis(BaseModel):
    """Complete analysis result for a document."""
    document_id: str
    filename: str

    # Overall scores
    ai_probability: float = Field(ge=0, le=100, description="Overall AI probability %")
    humanization_score: float = Field(ge=0, le=100, description="Human-like writing score %")

    # Detailed metrics
    burstiness_score: float = Field(description="Sentence length variation (-1 to 1)")
    lexical_diversity: float = Field(description="Type-token ratio 0-1")
    avg_sentence_length: float
    readability_score: float

    # Per-sentence analysis
    sentences: List[SentenceAnalysis]

    # Section breakdown
    sections: List[SectionAnalysis]

    # Summary statistics
    total_sentences: int
    red_count: int
    yellow_count: int
    green_count: int

    # Top issues
    top_ai_words: List[Dict[str, Any]] = []
    top_phrases: List[Dict[str, Any]] = []

    # Metadata
    word_count: int
    char_count: int
    processing_time_ms: float


class UploadResponse(BaseModel):
    """Response after file upload."""
    document_id: str
    filename: str
    file_size: int
    word_count: int
    message: str


class AnalysisRequest(BaseModel):
    """Request to analyze a document."""
    document_id: str
    include_rewrites: bool = False
    sensitivity: float = Field(default=0.5, ge=0, le=1, description="Detection sensitivity")


class RewriteRequest(BaseModel):
    """Request to get rewrite suggestion for a sentence."""
    sentence: str
    context: Optional[str] = None
    style: str = "academic"


class RewriteResponse(BaseModel):
    """Response with rewrite suggestion."""
    original: str
    suggestion: str
    explanation: str


class TrainingExample(BaseModel):
    """A training example for the learning mode."""
    id: int
    text: str
    is_ai_generated: bool
    difficulty: str  # "easy", "medium", "hard"
    hints: List[str]
    explanation: str
    ai_words_highlighted: List[str] = []


class TrainingAnswer(BaseModel):
    """User's answer to a training example."""
    example_id: int
    user_answer: bool  # True = user thinks it's AI, False = user thinks it's human


class TrainingResult(BaseModel):
    """Result of a training answer."""
    correct: bool
    user_answer: bool
    correct_answer: bool
    score_delta: int
    explanation: str
    highlighted_text: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    model_loaded: bool
