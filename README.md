# AI Content Detector

Detect AI-generated writing in academic papers and reports. Built for researchers who need to verify the authenticity of academic content.

## Features

- **Upload** PDF and DOCX documents (up to 10MB)
- **Multi-layer detection**: Burstiness, lexical diversity, AI phrase density, sentence patterns
- **Color-coded output**: Red (high AI) / Yellow (suspicious) / Green (human-like)
- **Hover tooltips**: See exactly why each sentence was flagged
- **Rewrite suggestions**: Click flagged sentences to get human-like alternatives
- **Section breakdown**: Per-section AI scores (Intro, Methods, Results, etc.)
- **PDF export**: Download a full analysis report
- **Training Mode**: Practice spotting AI writing with scored examples

## Dataset

Built on:
- **Kobak et al. (2024)** — arXiv study of 14M+ PubMed abstracts showing post-ChatGPT word frequency surge
- **Weber-Wulff et al. (2023)** — AI detection tool benchmarking
- **Mitchell et al. DetectGPT** — Probability curvature-based detection
- **450+ AI words** and **220+ AI phrases** with risk weights

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+

### 1. Clone the repo
```bash
git clone https://github.com/AbhishekDondapati/ai-detector.git
cd ai-detector
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY for rewrite suggestions (optional)
python main.py
```
Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

### 4. Docker (alternative)
```bash
cp backend/.env.example .env
# Edit .env with your API keys
docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload/` | Upload PDF or DOCX |
| `POST` | `/analyze/{doc_id}` | Run AI detection |
| `GET`  | `/analyze/{doc_id}/results` | Get cached results |
| `POST` | `/analyze/{doc_id}/export-pdf` | Download PDF report |
| `POST` | `/analyze/rewrite` | Rewrite a sentence |
| `GET`  | `/training/examples` | Get training examples |
| `POST` | `/training/answer` | Submit training answer |
| `GET`  | `/health` | Health check |

### Example: Upload and analyze
```bash
# Upload
curl -X POST http://localhost:8000/upload/ \
  -F "file=@your_paper.pdf"
# → { "document_id": "abc-123", "word_count": 4521, ... }

# Analyze
curl -X POST "http://localhost:8000/analyze/abc-123?sensitivity=0.5"
# → { "ai_probability": 73.4, "humanization_score": 26.6, "sentences": [...], ... }
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (empty) | Claude API key for rewrite suggestions |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `UPLOAD_DIR` | `./uploads` | File upload directory |
| `MAX_FILE_SIZE_MB` | `10` | Maximum upload size |

## Detection Scoring

Each sentence is scored 0–100% AI probability:

| Layer | Weight | What it detects |
|-------|--------|-----------------|
| High-risk AI words | High | delve, pivotal, multifaceted, underscore, tapestry... |
| Medium-risk words | Medium | furthermore, notably, comprehensive, robust... |
| High-risk phrases | High | "it is important to note", "in the realm of"... |
| Sentence patterns | High | Rigid intro/conclusion formulas, AI transitions |
| Passive voice | Low | "it has been demonstrated", "was found"... |
| Transition overuse | Medium | Chained furthermore/moreover/additionally |
| Sentence length | Low | AI sweet spot: 22–38 words |

**Document-level** adjustments:
- **Burstiness penalty**: Low sentence length variation → +AI score
- **TTR penalty**: Vocabulary repetition → +AI score

**Color coding**:
- 🔴 Red: ≥65% AI probability
- 🟡 Yellow: 30–64%
- 🟢 Green: <30%

## Custom Dataset

The AI phrases dataset is at `backend/data/ai_phrases.json`. Format:

```json
{
  "single_words": {
    "high_risk": ["delve", "pivotal", ...],
    "medium_risk": ["furthermore", "robust", ...]
  },
  "phrases": {
    "high_risk": ["it is important to note", ...],
    "medium_risk": ["in light of", ...]
  }
}
```

Add your own words/phrases and restart the backend — no retraining needed.

## Project Structure

```
ai-detector/
├── backend/
│   ├── main.py                    # FastAPI application
│   ├── requirements.txt
│   ├── data/
│   │   └── ai_phrases.json        # AI word/phrase dataset
│   ├── models/
│   │   └── schemas.py             # Pydantic models
│   ├── routes/
│   │   ├── upload.py              # File upload endpoints
│   │   ├── analyze.py             # Analysis + rewrite endpoints
│   │   └── training.py            # Training mode endpoints
│   └── services/
│       ├── text_extractor.py      # PDF/DOCX extraction
│       ├── ai_detector.py         # Core detection engine
│       ├── humanizer.py           # Rewrite suggestions
│       └── report_generator.py    # PDF report generation
├── frontend/
│   └── src/
│       ├── components/            # React components
│       ├── pages/                 # Home, Results, Training
│       └── services/api.js        # API client
├── docker-compose.yml
└── README.md
```

## References

- Kobak D. et al. (2024). "Delving into ChatGPT usage in academic writing across arXiv." arXiv:2406.07016
- Weber-Wulff D. et al. (2023). "Testing of Detection Tools for AI-Generated Text." Int. J. Educational Integrity.
- Mitchell E. et al. (2023). "DetectGPT: Zero-Shot Machine-Generated Text Detection Using Probability Curvature." ICML 2023.
- Hans A. et al. (2024). "Spotting LLMs With Binoculars: Zero-Shot Detection of Machine-Generated Text."
- Liang J. et al. (2023). "GPT Detectors Are Biased Against Non-Native English Writers." Science Advances.

## License

MIT License — © 2025 AbhishekDondapati
