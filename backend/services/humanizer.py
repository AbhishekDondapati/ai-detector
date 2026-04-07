"""
Humanization service.
Uses the Anthropic Claude API to generate human-like rewrites
of AI-detected sentences and provide writing improvement feedback.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# System prompt for the rewriter
REWRITE_SYSTEM_PROMPT = """You are an academic writing expert who helps researchers write more naturally and authentically.

When given an AI-sounding sentence, you rewrite it to sound like it was written by a real researcher:
- Use specific, concrete language instead of vague buzzwords
- Prefer active voice over passive
- Write shorter, varied sentences
- Replace AI clichés with plain English
- Keep the core scientific meaning intact
- Sound like a knowledgeable human, not a corporate press release

Common AI words to AVOID: delve, pivotal, multifaceted, leverage, harness, underscore,
nuanced, transformative, groundbreaking, seamlessly, robust, holistic, paradigm,
unparalleled, cutting-edge, synergistic, empower, foster, streamline.

Respond with JSON format:
{
  "rewrite": "the improved sentence",
  "explanation": "brief explanation of key changes made (1-2 sentences)"
}"""


async def get_rewrite_suggestion(
    sentence: str,
    context: Optional[str] = None,
    style: str = "academic"
) -> dict:
    """
    Get a human-like rewrite for an AI-detected sentence.
    Uses the Anthropic Claude API.

    Args:
        sentence: The AI-sounding sentence to rewrite
        context: Optional surrounding context for better rewrites
        style: Writing style ('academic', 'technical', 'general')

    Returns:
        {"rewrite": str, "explanation": str}
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _rule_based_rewrite(sentence)

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)

        context_str = f"\n\nContext (surrounding text):\n{context}" if context else ""
        style_note = f"Style: {style} writing"

        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=REWRITE_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Rewrite this sentence to sound more human and natural:\n\n\"{sentence}\"\n\n{style_note}{context_str}\n\nRespond with JSON only."
            }]
        )

        import json
        response_text = message.content[0].text.strip()
        # Extract JSON even if wrapped in markdown
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        result = json.loads(response_text)
        return {
            "rewrite": result.get("rewrite", sentence),
            "explanation": result.get("explanation", "Simplified and made more direct.")
        }

    except ImportError:
        logger.warning("anthropic package not installed, using rule-based fallback")
        return _rule_based_rewrite(sentence)
    except Exception as e:
        logger.error(f"Error calling Anthropic API: {e}")
        return _rule_based_rewrite(sentence)


def _rule_based_rewrite(sentence: str) -> dict:
    """
    Rule-based fallback rewriter when API is unavailable.
    Applies simple transformations to make text more human-like.
    """
    import re

    replacements = {
        # High-risk words → simpler alternatives
        r'\bdelve into\b': 'examine',
        r'\bdelves into\b': 'examines',
        r'\bdelved into\b': 'examined',
        r'\bpivotal\b': 'key',
        r'\bmultifaceted\b': 'complex',
        r'\bnuanced\b': 'detailed',
        r'\bleverage[sd]?\b': 'use',
        r'\bleveraging\b': 'using',
        r'\bharness[ed]?\b': 'use',
        r'\bharnessing\b': 'using',
        r'\bunderscore[sd]?\b': 'highlight',
        r'\bunderscoring\b': 'highlighting',
        r'\btransformative\b': 'significant',
        r'\bgroundbreaking\b': 'novel',
        r'\bseamlessly\b': 'smoothly',
        r'\brobust\b': 'strong',
        r'\bholistic\b': 'overall',
        r'\bparadigm\b': 'approach',
        r'\bunparalleled\b': 'exceptional',
        r'\bsynergistic\b': 'combined',
        r'\bempower[s]?\b': 'enable[s]',
        r'\bfoster[s]?\b': 'support[s]',
        r'\bstreamline[sd]?\b': 'simplif',
        r'\belucidates?\b': 'explains',
        r'\belucidating\b': 'explaining',
        r'\bfacilitate[sd]?\b': 'help',
        r'\bfacilitating\b': 'helping',
        r'\bfundamental\b': 'basic',
        r'\binvaluable\b': 'valuable',
        r'\bcomprehensive\b': 'thorough',
        r'\bmeticulous(?:ly)?\b': 'careful',
        r'\bimperative\b': 'necessary',
        r'\bparamount\b': 'crucial',
        r'\bpivotal\b': 'important',
        r'\bformidable\b': 'considerable',
        r'\bpropelling\b': 'driving',
        r'\borchestrating\b': 'coordinating',
        r'\byielding\b': 'producing',
        r'\bburgeoning\b': 'growing',
        r'\bbolstering\b': 'supporting',
        r'\bexacerbating\b': 'worsening',
        r'\bmitigating\b': 'reducing',

        # Phrase replacements
        r'\bit is important to note that\b': '',
        r'\bit is worth noting that\b': '',
        r'\bit should be noted that\b': '',
        r'\bit is crucial to\b': 'we must',
        r'\bit is essential to\b': 'we need to',
        r'\bin the realm of\b': 'in',
        r'\bin the ever-evolving\b': 'in',
        r'\bin today\'s rapidly evolving\b': 'in modern',
        r'\nat the intersection of\b': 'between',
        r'\bpaves the way for\b': 'enables',
        r'\bsheds light on\b': 'clarifies',
        r'\bbrings to light\b': 'reveals',
        r'\ba myriad of\b': 'many',
        r'\ba plethora of\b': 'many',
        r'\bnumerous\b': 'many',
        r'\bsubsequently\b': 'then',
        r'\butilize[sd]?\b': 'use',
        r'\butilizing\b': 'using',
        r'\bsubstantiate[sd]?\b': 'support',
    }

    result = sentence
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    # Clean up double spaces
    result = re.sub(r'\s+', ' ', result).strip()
    # Capitalize first letter
    if result:
        result = result[0].upper() + result[1:]

    changes_made = sentence != result
    explanation = (
        "Replaced AI buzzwords with simpler, clearer alternatives."
        if changes_made
        else "The sentence structure looks fairly natural. Consider adding specific data or examples."
    )

    return {
        "rewrite": result if changes_made else sentence,
        "explanation": explanation
    }


async def get_batch_rewrites(sentences: list[dict]) -> list[dict]:
    """
    Get rewrites for multiple flagged sentences.
    Only processes sentences with score >= 65 (red).
    """
    results = []
    for sent in sentences:
        if sent.get("score", 0) >= 65:
            rewrite = await get_rewrite_suggestion(sent["text"])
            results.append({
                "id": sent["id"],
                "original": sent["text"],
                "rewrite": rewrite["rewrite"],
                "explanation": rewrite["explanation"]
            })
    return results
