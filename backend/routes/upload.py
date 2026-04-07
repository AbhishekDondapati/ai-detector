"""
File upload routes.
Handles PDF and DOCX uploads, text extraction, and document storage.
"""
import os
import uuid
import logging
import aiofiles
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from models.schemas import UploadResponse
from services.text_extractor import extract_text, count_words, detect_sections

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}

# In-memory document store (replace with DB in production)
document_store: dict = {}


def _cleanup_old_file(file_path: str):
    """Background task to clean up uploaded files after processing."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to clean up file {file_path}: {e}")


@router.post("/", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF or DOCX file to analyze")
):
    """
    Upload a document for AI detection analysis.

    - Accepts .pdf and .docx files (max 10MB by default)
    - Extracts and preprocesses text
    - Returns a document_id for subsequent analysis
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Validate file size
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size / 1024 / 1024:.1f}MB). Max allowed: {MAX_FILE_SIZE_MB}MB"
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Generate unique document ID
    doc_id = str(uuid.uuid4())

    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Save file temporarily
    save_path = UPLOAD_DIR / f"{doc_id}{file_ext}"
    async with aiofiles.open(save_path, 'wb') as f:
        await f.write(content)

    # Extract text
    try:
        text, metadata = extract_text(str(save_path), file_ext)
    except Exception as e:
        os.remove(save_path)
        logger.error(f"Text extraction failed for {file.filename}: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from document: {str(e)}"
        )

    if not text or len(text.strip()) < 50:
        os.remove(save_path)
        raise HTTPException(
            status_code=422,
            detail="Could not extract meaningful text from document. Ensure the file is not scanned/image-only."
        )

    # Detect sections
    sections = detect_sections(text)
    word_count = count_words(text)

    # Store document data
    document_store[doc_id] = {
        "id": doc_id,
        "filename": file.filename,
        "file_path": str(save_path),
        "file_ext": file_ext,
        "text": text,
        "metadata": metadata,
        "sections": sections,
        "word_count": word_count,
        "file_size": file_size,
        "analysis": None  # Will be populated after analysis
    }

    logger.info(f"Uploaded document: {file.filename} → {doc_id} ({word_count} words)")

    return UploadResponse(
        document_id=doc_id,
        filename=file.filename,
        file_size=file_size,
        word_count=word_count,
        message=f"Document uploaded successfully. {word_count} words extracted. Ready for analysis."
    )


@router.get("/{doc_id}/status")
async def get_document_status(doc_id: str):
    """Check if a document exists and its analysis status."""
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = document_store[doc_id]
    return {
        "document_id": doc_id,
        "filename": doc["filename"],
        "word_count": doc["word_count"],
        "has_analysis": doc["analysis"] is not None
    }


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, background_tasks: BackgroundTasks):
    """Delete a document and its analysis from the store."""
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = document_store.pop(doc_id)
    background_tasks.add_task(_cleanup_old_file, doc["file_path"])

    return {"message": f"Document {doc_id} deleted successfully"}
