"""
Analysis routes.
Runs AI detection on uploaded documents and returns results.
"""
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import Response

from models.schemas import AnalysisRequest, RewriteRequest, RewriteResponse
from services.ai_detector import analyze_document
from services.humanizer import get_rewrite_suggestion, get_batch_rewrites
from services.report_generator import generate_pdf_report
from routes.upload import document_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("/{doc_id}")
async def analyze_document_endpoint(
    doc_id: str,
    sensitivity: float = 0.5,
    include_rewrites: bool = False
):
    """
    Analyze a previously uploaded document for AI-generated content.

    Args:
        doc_id: Document ID from upload
        sensitivity: Detection sensitivity (0=lenient, 1=strict). Default 0.5
        include_rewrites: If True, generate rewrite suggestions for red sentences (slower)

    Returns:
        Complete analysis with per-sentence scores, section breakdown, and metrics
    """
    if doc_id not in document_store:
        raise HTTPException(
            status_code=404,
            detail="Document not found. Please upload the document first."
        )

    doc = document_store[doc_id]

    # Check if we have a cached analysis with same sensitivity
    cached = doc.get("analysis")
    if cached and abs(cached.get("_sensitivity", -1) - sensitivity) < 0.01 and not include_rewrites:
        logger.info(f"Returning cached analysis for {doc_id}")
        return cached

    # Run analysis
    try:
        result = analyze_document(
            text=doc["text"],
            filename=doc["filename"],
            doc_id=doc_id,
            sections=doc.get("sections", []),
            sensitivity=sensitivity
        )
    except Exception as e:
        logger.error(f"Analysis failed for {doc_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

    # Optionally add rewrite suggestions for red sentences
    if include_rewrites:
        try:
            rewrites = await get_batch_rewrites(result["sentences"])
            rewrite_map = {r["id"]: r for r in rewrites}
            for sent in result["sentences"]:
                if sent["id"] in rewrite_map:
                    sent["rewrite_suggestion"] = rewrite_map[sent["id"]]["rewrite"]
        except Exception as e:
            logger.warning(f"Rewrite generation failed: {e}")
            # Continue without rewrites

    # Cache the result
    result["_sensitivity"] = sensitivity
    document_store[doc_id]["analysis"] = result

    logger.info(
        f"Analysis complete: {doc['filename']} → "
        f"AI: {result['ai_probability']:.1f}%, "
        f"Human: {result['humanization_score']:.1f}%"
    )

    return result


@router.get("/{doc_id}/results")
async def get_analysis_results(doc_id: str):
    """Retrieve cached analysis results for a document."""
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")

    analysis = document_store[doc_id].get("analysis")
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="No analysis found. Run POST /analyze/{doc_id} first."
        )

    return analysis


@router.post("/{doc_id}/export-pdf")
async def export_pdf_report(doc_id: str):
    """
    Export a PDF report of the analysis.
    Requires the document to have been analyzed first.
    """
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")

    analysis = document_store[doc_id].get("analysis")
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="No analysis found. Run POST /analyze/{doc_id} first."
        )

    try:
        pdf_bytes = generate_pdf_report(analysis)
    except Exception as e:
        logger.error(f"PDF generation failed for {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = document_store[doc_id]["filename"].replace('.', '_')
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ai_report_{filename}.pdf"',
            "Content-Length": str(len(pdf_bytes))
        }
    )


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite_sentence(request: RewriteRequest):
    """
    Get a human-like rewrite suggestion for a given sentence.
    Uses Claude API if ANTHROPIC_API_KEY is set, otherwise falls back to rule-based.
    """
    if not request.sentence or len(request.sentence.strip()) < 10:
        raise HTTPException(status_code=400, detail="Sentence too short to rewrite")

    result = await get_rewrite_suggestion(
        sentence=request.sentence,
        context=request.context,
        style=request.style
    )

    return RewriteResponse(
        original=request.sentence,
        suggestion=result["rewrite"],
        explanation=result["explanation"]
    )


@router.get("/{doc_id}/sentence/{sentence_id}/rewrite")
async def rewrite_specific_sentence(doc_id: str, sentence_id: int):
    """Get a rewrite suggestion for a specific sentence in a document."""
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")

    analysis = document_store[doc_id].get("analysis")
    if not analysis:
        raise HTTPException(status_code=404, detail="Document not yet analyzed")

    sentences = analysis.get("sentences", [])
    sentence = next((s for s in sentences if s["id"] == sentence_id), None)
    if not sentence:
        raise HTTPException(status_code=404, detail=f"Sentence {sentence_id} not found")

    result = await get_rewrite_suggestion(
        sentence=sentence["text"],
        style="academic"
    )

    # Update the cached analysis
    sentence["rewrite_suggestion"] = result["rewrite"]

    return RewriteResponse(
        original=sentence["text"],
        suggestion=result["rewrite"],
        explanation=result["explanation"]
    )
