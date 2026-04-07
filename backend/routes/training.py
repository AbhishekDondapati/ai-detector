"""
Training mode routes.
Provides learning examples and feedback for identifying AI-generated text.
"""
import logging
from fastapi import APIRouter, HTTPException
from ..models.schemas import TrainingAnswer, TrainingResult
from ..services.ai_detector import get_training_examples, _score_sentence

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/training", tags=["training"])


@router.get("/examples")
async def get_examples():
    """
    Get all training examples for the learning mode.
    Returns curated AI vs human writing samples with difficulty levels.
    """
    examples = get_training_examples()
    # Remove the answer from the response to avoid spoilers
    sanitized = []
    for ex in examples:
        sanitized.append({
            "id": ex["id"],
            "text": ex["text"],
            "difficulty": ex["difficulty"],
            "hints": ex["hints"]
            # is_ai_generated, explanation, ai_words_highlighted are hidden
        })
    return {"examples": sanitized, "total": len(sanitized)}


@router.post("/answer")
async def submit_answer(answer: TrainingAnswer) -> TrainingResult:
    """
    Submit an answer for a training example and get feedback.
    Returns whether the answer was correct with a detailed explanation.
    """
    examples = get_training_examples()
    example = next((e for e in examples if e["id"] == answer.example_id), None)

    if not example:
        raise HTTPException(
            status_code=404,
            detail=f"Training example {answer.example_id} not found"
        )

    correct = answer.user_answer == example["is_ai_generated"]

    # Score delta based on difficulty
    difficulty_multipliers = {"easy": 10, "medium": 15, "hard": 20}
    score_delta = difficulty_multipliers.get(example["difficulty"], 10) if correct else -5

    # Build highlighted text (highlight AI words in the text)
    highlighted = example["text"]
    ai_words = example.get("ai_words_highlighted", [])
    for word in ai_words:
        highlighted = highlighted.replace(
            word,
            f'**{word}**'
        )

    return TrainingResult(
        correct=correct,
        user_answer=answer.user_answer,
        correct_answer=example["is_ai_generated"],
        score_delta=score_delta,
        explanation=example["explanation"],
        highlighted_text=highlighted
    )


@router.post("/analyze-sample")
async def analyze_custom_sample(payload: dict):
    """
    Analyze a user-provided text sample.
    Useful for the training mode's 'test your own text' feature.
    """
    text = payload.get("text", "").strip()
    if not text or len(text) < 20:
        raise HTTPException(status_code=400, detail="Text too short to analyze (min 20 chars)")
    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long for this endpoint (max 2000 chars)")

    result = _score_sentence(text, sensitivity=0.5)

    return {
        "text": text,
        "score": result["score"],
        "risk_level": result["risk_level"],
        "ai_words_found": result["ai_words_found"],
        "phrases_found": result["phrases_found"],
        "reasons": result["reasons"]
    }


@router.get("/leaderboard")
async def get_leaderboard():
    """
    Return a mock leaderboard for gamification.
    In production, this would query a database.
    """
    return {
        "leaderboard": [
            {"rank": 1, "username": "Dr. Researcher", "score": 285, "streak": 12},
            {"rank": 2, "username": "AcademicWriter42", "score": 240, "streak": 8},
            {"rank": 3, "username": "PeerReviewer", "score": 195, "streak": 5},
            {"rank": 4, "username": "GradStudent", "score": 150, "streak": 3},
            {"rank": 5, "username": "You", "score": 0, "streak": 0},
        ],
        "message": "Keep practicing to climb the leaderboard!"
    }
