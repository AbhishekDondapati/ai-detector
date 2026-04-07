"""
AI Content Detector — FastAPI Backend
======================================
Main application entry point.

Endpoints:
  POST /upload/              → Upload PDF or DOCX
  POST /analyze/{doc_id}     → Run AI detection
  GET  /analyze/{doc_id}/results    → Get cached results
  POST /analyze/{doc_id}/export-pdf → Download PDF report
  POST /analyze/rewrite      → Get sentence rewrite suggestion
  GET  /training/examples    → Training mode examples
  POST /training/answer      → Submit training answer
  POST /training/analyze-sample → Analyze a quick sample
  GET  /health               → Health check
"""
import logging
import os
import nltk
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.training import router as training_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Download NLTK data on startup if needed."""
    logger.info("Starting AI Detector API...")
    try:
        for resource in ['punkt', 'punkt_tab', 'averaged_perceptron_tagger', 'stopwords']:
            try:
                nltk.download(resource, quiet=True)
            except Exception:
                pass
        logger.info("NLTK resources ready")
    except Exception as e:
        logger.warning(f"NLTK download skipped: {e}")

    # Ensure upload directory exists
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    os.makedirs(upload_dir, exist_ok=True)
    logger.info(f"Upload directory: {upload_dir}")

    logger.info("AI Detector API ready!")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="AI Content Detector API",
    description="""
## AI-Generated Content Detection for Academic Writing

Detect AI-generated patterns in academic papers, reports, and articles.

### Features
- **Upload** PDF and DOCX documents
- **Analyze** text with multi-layer NLP detection engine
- **Score** documents with AI probability (0-100%)
- **Highlight** sentences by risk level (Red/Yellow/Green)
- **Rewrite** AI-flagged sentences into human-like text
- **Train** with interactive learning mode examples
- **Export** detailed PDF reports

### Detection Engine
Uses burstiness analysis, lexical diversity, AI phrase detection,
sentence pattern matching, and the Kobak et al. (2024) word frequency
dataset from analysis of 14M+ PubMed abstracts.
    """,
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS — allow frontend origins
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(training_router)


@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint for monitoring and Docker healthchecks."""
    return {
        "status": "healthy",
        "version": "3.0.0",
        "model_loaded": True,
        "endpoints": {
            "upload": "/upload/",
            "analyze": "/analyze/{doc_id}",
            "training": "/training/examples",
            "docs": "/docs"
        }
    }


@app.get("/", tags=["system"])
async def root():
    """API root — links to documentation."""
    return {
        "message": "AI Content Detector API",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Check API logs."}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
