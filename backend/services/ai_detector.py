"""
Core AI detection engine.
Uses multi-layer NLP analysis to detect AI-generated text patterns.

Detection layers:
1. AI word/phrase density analysis
2. Sentence burstiness (length variation)
3. Lexical diversity (type-token ratio)
4. Readability consistency
5. Transition word overuse
6. Passive voice density
7. Sentence structure patterns
"""
import json
import re
import time
import math
import logging
from pathlib import Path
from collections import Counter
from typing import List, Dict, Tuple, Any, Optional

logger = logging.getLogger(__name__)

# Load AI phrases dataset
DATA_FILE = Path(__file__).parent.parent / "data" / "ai_phrases.json"

def _load_dataset() -> dict:
    """Load the AI phrases dataset."""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"Dataset not found at {DATA_FILE}, using minimal fallback")
        return {"single_words": {"high_risk": [], "medium_risk": []}, "phrases": {"high_risk": [], "medium_risk": []}}

DATASET = _load_dataset()

# Build lookup sets for fast detection
HIGH_RISK_WORDS = set(w.lower() for w in DATASET["single_words"]["high_risk"])
MEDIUM_RISK_WORDS = set(w.lower() for w in DATASET["single_words"]["medium_risk"])
ALL_AI_WORDS = HIGH_RISK_WORDS | MEDIUM_RISK_WORDS

HIGH_RISK_PHRASES = [p.lower() for p in DATASET["phrases"]["high_risk"]]
MEDIUM_RISK_PHRASES = [p.lower() for p in DATASET["phrases"]["medium_risk"]]
ALL_PHRASES = HIGH_RISK_PHRASES + MEDIUM_RISK_PHRASES

TRANSITIONS = set(t.lower() for t in DATASET.get("academic_overused_transitions", []))
PASSIVE_MARKERS = DATASET.get("structural_red_flags", {}).get("passive_voice_markers", [])


# ─────────────────────────────────────────────
# Low-level NLP helpers (no heavy dependencies)
# ─────────────────────────────────────────────

def _tokenize_words(text: str) -> List[str]:
    """Simple word tokenizer."""
    return re.findall(r"\b[a-zA-Z']+\b", text.lower())


def _sentence_word_count(sentence: str) -> int:
    return len(_tokenize_words(sentence))


def _calculate_burstiness(lengths: List[int]) -> float:
    """
    Calculate burstiness score for sentence lengths.
    B = (σ - μ) / (σ + μ)  range: [-1, +1]
    Human writing: B > 0 (bursty, varied lengths)
    AI writing: B < 0 (uniform lengths)
    """
    if len(lengths) < 3:
        return 0.0
    n = len(lengths)
    mu = sum(lengths) / n
    variance = sum((x - mu) ** 2 for x in lengths) / n
    sigma = math.sqrt(variance)
    if mu + sigma == 0:
        return 0.0
    return (sigma - mu) / (sigma + mu)


def _calculate_ttr(words: List[str]) -> float:
    """
    Type-Token Ratio: unique words / total words.
    Lower TTR = more repetitive (AI-like).
    """
    if not words:
        return 0.0
    return len(set(words)) / len(words)


def _flesch_reading_ease(text: str) -> float:
    """
    Flesch reading ease score (approximate).
    206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
    """
    try:
        import textstat
        return textstat.flesch_reading_ease(text)
    except ImportError:
        # Fallback approximation
        sentences = re.split(r'[.!?]+', text)
        sentences = [s for s in sentences if s.strip()]
        words = _tokenize_words(text)
        if not sentences or not words:
            return 50.0
        avg_sentence_length = len(words) / len(sentences)
        # Simple syllable count approximation
        syllables = sum(_count_syllables(w) for w in words)
        avg_syllables = syllables / len(words) if words else 1
        score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables)
        return max(0, min(100, score))


def _count_syllables(word: str) -> int:
    """Approximate syllable count."""
    word = word.lower()
    if len(word) <= 3:
        return 1
    word = re.sub(r'e$', '', word)
    vowels = re.findall(r'[aeiou]+', word)
    return max(1, len(vowels))


def _has_passive_voice(sentence: str) -> bool:
    """Detect passive voice constructions."""
    s_lower = sentence.lower()
    return any(marker in s_lower for marker in PASSIVE_MARKERS)


def _count_transitions(sentence: str) -> int:
    """Count transition/filler words in sentence."""
    words = _tokenize_words(sentence)
    # Also check 2-gram transitions
    bigrams = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
    trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
    all_grams = set(words) | set(bigrams) | set(trigrams)
    return len(all_grams & TRANSITIONS)


def _check_sentence_pattern(sentence: str) -> bool:
    """Check if sentence matches known AI structural patterns."""
    patterns = DATASET.get("sentence_patterns", [])
    s = sentence.strip()
    for pattern in patterns:
        if re.search(pattern, s, re.IGNORECASE):
            return True
    return False


# ─────────────────────────────────────────────
# Per-sentence scoring
# ─────────────────────────────────────────────

def _score_sentence(
    sentence: str,
    sensitivity: float = 0.5
) -> Dict[str, Any]:
    """
    Score a single sentence for AI likelihood.
    Returns score (0-100) and detailed breakdown.
    """
    s_lower = sentence.lower()
    words = _tokenize_words(sentence)
    word_set = set(words)
    score = 0.0
    reasons = []
    ai_words_found = []
    phrases_found = []

    # ── Layer 1: High-risk AI word detection ──
    hr_matches = word_set & HIGH_RISK_WORDS
    if hr_matches:
        contribution = min(len(hr_matches) * 15, 45)
        score += contribution
        ai_words_found.extend(list(hr_matches))
        reasons.append(f"Contains {len(hr_matches)} high-risk AI word(s): {', '.join(sorted(hr_matches)[:3])}")

    # ── Layer 2: Medium-risk AI word detection ──
    mr_matches = word_set & MEDIUM_RISK_WORDS
    if mr_matches:
        contribution = min(len(mr_matches) * 7, 25)
        score += contribution
        ai_words_found.extend(list(mr_matches))
        if len(mr_matches) >= 2:
            reasons.append(f"Contains {len(mr_matches)} medium-risk AI word(s): {', '.join(sorted(mr_matches)[:3])}")

    # ── Layer 3: High-risk phrase detection ──
    for phrase in HIGH_RISK_PHRASES:
        if phrase in s_lower:
            score += 25
            phrases_found.append(phrase)
            reasons.append(f"Contains high-risk AI phrase: \"{phrase}\"")

    # ── Layer 4: Medium-risk phrase detection ──
    for phrase in MEDIUM_RISK_PHRASES:
        if phrase in s_lower:
            score += 12
            phrases_found.append(phrase)

    if len(phrases_found) > len(HIGH_RISK_PHRASES):
        medium_count = len(phrases_found) - len([p for p in phrases_found if p in HIGH_RISK_PHRASES])
        if medium_count > 0:
            reasons.append(f"Contains {medium_count} generic AI phrase(s)")

    # ── Layer 5: Transition word overuse ──
    transition_count = _count_transitions(sentence)
    if transition_count >= 2:
        score += 10
        reasons.append(f"Overuse of transition words ({transition_count} found)")

    # ── Layer 6: Passive voice ──
    if _has_passive_voice(sentence):
        score += 8
        reasons.append("Uses passive voice construction")

    # ── Layer 7: Structural pattern match ──
    if _check_sentence_pattern(sentence):
        score += 15
        reasons.append("Matches typical AI sentence structure pattern")

    # ── Layer 8: Sentence length (AI tends toward 20-35 word sweet spot) ──
    word_count = len(words)
    if 22 <= word_count <= 38:
        score += 5
        reasons.append("Typical AI sentence length")

    # Apply sensitivity multiplier
    score = score * (0.7 + sensitivity * 0.6)

    # Clamp to 0-100
    final_score = min(100.0, max(0.0, score))

    # Determine risk level
    if final_score >= 65:
        risk_level = "red"
    elif final_score >= 30:
        risk_level = "yellow"
    else:
        risk_level = "green"

    return {
        "score": round(final_score, 1),
        "risk_level": risk_level,
        "ai_words_found": list(set(ai_words_found)),
        "phrases_found": list(set(phrases_found)),
        "reasons": reasons if reasons else ["Writing appears natural"],
        "word_count": word_count,
        "char_count": len(sentence)
    }


# ─────────────────────────────────────────────
# Document-level analysis
# ─────────────────────────────────────────────

def _assign_sections(sentences: List[str], section_markers: List[dict]) -> List[dict]:
    """Map sentences to document sections."""
    if not section_markers:
        return [{"name": "Body", "start": 0, "end": len(sentences) - 1}]

    # Build a rough mapping based on character positions
    # This is approximate since we work with sentence indices
    sections_out = []
    total = len(sentences)
    n_sections = len(section_markers)

    for i, marker in enumerate(section_markers):
        start_idx = int((i / n_sections) * total)
        end_idx = int(((i + 1) / n_sections) * total) - 1
        end_idx = min(end_idx, total - 1)
        sections_out.append({
            "name": marker["name"],
            "start": start_idx,
            "end": end_idx
        })

    return sections_out


def analyze_document(
    text: str,
    filename: str,
    doc_id: str,
    sections: List[dict] = None,
    sensitivity: float = 0.5
) -> dict:
    """
    Full document analysis pipeline.

    Args:
        text: Extracted document text
        filename: Original filename
        doc_id: Unique document identifier
        sections: List of detected sections from text_extractor
        sensitivity: Detection sensitivity (0=lenient, 1=strict)

    Returns:
        Complete analysis result dict
    """
    start_time = time.time()

    # Import here to avoid circular issues
    from .text_extractor import split_into_sentences

    sentences_raw = split_into_sentences(text)
    if not sentences_raw:
        raise ValueError("No sentences found in document")

    # ── Per-sentence analysis ──
    sentence_results = []
    all_words = []
    sentence_lengths = []

    for idx, sent in enumerate(sentences_raw):
        result = _score_sentence(sent, sensitivity)
        sentence_results.append({
            "id": idx,
            "text": sent,
            **result,
            "rewrite_suggestion": None
        })
        all_words.extend(_tokenize_words(sent))
        sentence_lengths.append(result["word_count"])

    # ── Document-level metrics ──
    burstiness = _calculate_burstiness(sentence_lengths)
    ttr = _calculate_ttr(all_words)
    avg_sent_len = sum(sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0

    try:
        readability = _flesch_reading_ease(text)
    except Exception:
        readability = 50.0

    # ── Overall AI probability ──
    sentence_scores = [s["score"] for s in sentence_results]
    raw_avg = sum(sentence_scores) / len(sentence_scores) if sentence_scores else 0

    # Burstiness penalty: low burstiness (uniform = AI) increases score
    # Burstiness ranges -1 to +1; normalize to penalty 0-15
    burstiness_penalty = max(0, (0 - burstiness) * 15)  # penalty when negative

    # TTR penalty: very low TTR suggests repetitive AI writing
    ttr_penalty = max(0, (0.5 - ttr) * 20) if ttr < 0.5 else 0

    ai_probability = min(100.0, raw_avg + burstiness_penalty + ttr_penalty)
    humanization_score = max(0.0, 100.0 - ai_probability)

    # Apply a gentle curve so moderate documents aren't all 50%
    # Sigmoid-like adjustment
    centered = ai_probability - 50
    ai_probability = 50 + centered * 1.1
    ai_probability = max(0.0, min(100.0, ai_probability))
    humanization_score = 100.0 - ai_probability

    # ── Color stats ──
    red_count = sum(1 for s in sentence_results if s["risk_level"] == "red")
    yellow_count = sum(1 for s in sentence_results if s["risk_level"] == "yellow")
    green_count = sum(1 for s in sentence_results if s["risk_level"] == "green")

    # ── Top AI words/phrases ──
    word_counter: Counter = Counter()
    phrase_counter: Counter = Counter()
    for s in sentence_results:
        for w in s["ai_words_found"]:
            word_counter[w] += 1
        for p in s["phrases_found"]:
            phrase_counter[p] += 1

    top_words = [{"word": w, "count": c} for w, c in word_counter.most_common(10)]
    top_phrases = [{"phrase": p, "count": c} for p, c in phrase_counter.most_common(8)]

    # ── Section breakdown ──
    section_list = sections or []
    mapped_sections = _assign_sections(sentences_raw, section_list)

    sections_output = []
    for sec in mapped_sections:
        start_i = sec["start"]
        end_i = min(sec["end"], len(sentence_results) - 1)
        sec_sentences = sentence_results[start_i:end_i + 1]
        if not sec_sentences:
            continue
        sec_scores = [s["score"] for s in sec_sentences]
        sec_ai = sum(sec_scores) / len(sec_scores)
        flagged = sum(1 for s in sec_sentences if s["risk_level"] in ("red", "yellow"))
        sections_output.append({
            "name": sec["name"],
            "start_sentence": start_i,
            "end_sentence": end_i,
            "ai_score": round(sec_ai, 1),
            "humanization_score": round(100 - sec_ai, 1),
            "sentence_count": len(sec_sentences),
            "flagged_count": flagged
        })

    processing_time_ms = (time.time() - start_time) * 1000

    return {
        "document_id": doc_id,
        "filename": filename,
        "ai_probability": round(ai_probability, 1),
        "humanization_score": round(humanization_score, 1),
        "burstiness_score": round(burstiness, 3),
        "lexical_diversity": round(ttr, 3),
        "avg_sentence_length": round(avg_sent_len, 1),
        "readability_score": round(readability, 1),
        "sentences": sentence_results,
        "sections": sections_output,
        "total_sentences": len(sentence_results),
        "red_count": red_count,
        "yellow_count": yellow_count,
        "green_count": green_count,
        "top_ai_words": top_words,
        "top_phrases": top_phrases,
        "word_count": len(all_words),
        "char_count": len(text),
        "processing_time_ms": round(processing_time_ms, 1)
    }


def get_training_examples() -> List[Dict]:
    """
    Return training examples for the learning mode.
    These are curated AI vs human writing samples.
    """
    return [
        {
            "id": 1,
            "text": "The findings of this study underscore the pivotal role of leveraging multifaceted approaches to comprehensively elucidate the transformative impact of cutting-edge methodologies in the ever-evolving landscape of biomedical research.",
            "is_ai_generated": True,
            "difficulty": "easy",
            "hints": ["Look for stacked buzzwords", "Check for overly complex phrasing", "Notice abstract vagueness"],
            "explanation": "This sentence packs in 7+ high-risk AI markers (underscore, pivotal, leveraging, multifaceted, comprehensively, elucidate, transformative, cutting-edge, ever-evolving) and is vague despite sounding sophisticated.",
            "ai_words_highlighted": ["underscore", "pivotal", "leveraging", "multifaceted", "comprehensively", "elucidate", "transformative", "cutting-edge"]
        },
        {
            "id": 2,
            "text": "We gave 42 patients a 10 mg dose twice daily for six weeks. Three dropped out—one due to nausea, two lost to follow-up. The rest tolerated it fine.",
            "is_ai_generated": False,
            "difficulty": "easy",
            "hints": ["Specific numbers", "Casual tone", "Direct reporting of facts"],
            "explanation": "Human researchers write with specific numbers, acknowledge failures plainly, and use natural short sentences. 'Tolerated it fine' is informal—AI would say 'demonstrated adequate tolerability'.",
            "ai_words_highlighted": []
        },
        {
            "id": 3,
            "text": "It is important to note that this novel approach serves as a robust framework that not only addresses the existing gaps in the literature but also paves the way for future groundbreaking discoveries.",
            "is_ai_generated": True,
            "difficulty": "easy",
            "hints": ["Classic AI opener", "Overloaded with buzzwords", "No specific claims"],
            "explanation": "\"It is important to note\" is a signature AI phrase. Combined with novel, robust, framework, paves the way, groundbreaking — this sentence makes big claims with no actual content.",
            "ai_words_highlighted": ["novel", "robust", "framework", "paves the way", "groundbreaking"]
        },
        {
            "id": 4,
            "text": "Cell viability dropped sharply after 48 hours at 37°C, from 89% to 31%. I'd expect this to worsen under the oxidative stress conditions we're planning next.",
            "is_ai_generated": False,
            "difficulty": "medium",
            "hints": ["First person", "Specific measurements", "Anticipates future work informally"],
            "explanation": "Real researchers use first person ('I'd expect'), specific data points, and informal projections. AI tends to write in passive voice and avoid personal perspective.",
            "ai_words_highlighted": []
        },
        {
            "id": 5,
            "text": "Furthermore, the multifaceted nature of this phenomenon necessitates a holistic approach that encompasses both quantitative and qualitative dimensions, thereby facilitating a more nuanced understanding of the underlying mechanisms.",
            "is_ai_generated": True,
            "difficulty": "medium",
            "hints": ["Starts with a filler transition", "Circular logic (holistic → nuanced)", "No actual information"],
            "explanation": "This sentence says essentially nothing while using 5+ AI markers: multifaceted, necessitates, holistic, facilitating, nuanced. The entire sentence is filler — it adds no factual content.",
            "ai_words_highlighted": ["Furthermore", "multifaceted", "necessitates", "holistic", "facilitating", "nuanced"]
        },
        {
            "id": 6,
            "text": "The algorithm ran in O(n log n) time on 10,000 samples but degraded to O(n²) once we hit sparse matrices. We're not sure why yet—possibly the hash table behavior under low occupancy.",
            "is_ai_generated": False,
            "difficulty": "medium",
            "hints": ["Technical precision", "Admits uncertainty casually", "Uses 'we're not sure'"],
            "explanation": "Experts admit uncertainty without formal hedging. AI would write 'further investigation is warranted'. The specific computational complexity and hypothesis show genuine technical thinking.",
            "ai_words_highlighted": []
        },
        {
            "id": 7,
            "text": "In conclusion, this research has delved into the intricate interplay between various factors, yielding invaluable insights that contribute significantly to our collective understanding and open new avenues for exploration.",
            "is_ai_generated": True,
            "difficulty": "hard",
            "hints": ["'In conclusion' as opener", "delved + intricate + interplay", "'invaluable insights'", "ends with 'new avenues'"],
            "explanation": "Classic AI conclusion formula: In conclusion + delved + [vague claim about insights] + [opens new avenues]. Every phrase is a documented AI cliché. Nothing specific was actually concluded.",
            "ai_words_highlighted": ["delved", "intricate", "interplay", "invaluable", "insights", "avenues"]
        },
        {
            "id": 8,
            "text": "The correlation was r=0.73 (p<0.001), stronger than I expected given the 3-month lag. Worth checking if seasonal variation explains the residuals.",
            "is_ai_generated": False,
            "difficulty": "hard",
            "hints": ["Exact statistics", "Casual first-person surprise", "Informal follow-up thought"],
            "explanation": "Real researchers share exact numbers, express genuine surprise (\"stronger than I expected\"), and think out loud. AI doesn't express personal expectation or leave open questions casually.",
            "ai_words_highlighted": []
        }
    ]
