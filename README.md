# 🤖 AI-Powered Resume Generation System

A production-ready, full-stack system that generates **ATS-friendly, role-specific PDF resumes** using RAG (Retrieval-Augmented Generation), a real LLM, and a professional LaTeX template — all from just a Job Description.

---

## 📸 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  ┌──────────────┐   ┌───────────────┐   ┌───────────────────┐  │
│  │ AI Generator │   │  LaTeX Editor │   │   PDF Preview     │  │
│  │   Panel      │──▶│   (Live Code) │──▶│  (texlive.net)    │  │
│  └──────────────┘   └───────────────┘   └───────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST /generate-resume
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                            │
│                                                                 │
│  Job Description + Candidate ID                                 │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐    ┌──────────────────────────────────┐    │
│  │   ChromaDB RAG  │    │  OpenRouter LLM                  │    │
│  │  (Vector Store) │───▶│  openai/gpt-oss-120b:free        │    │
│  └─────────────────┘    └──────────────────────────────────┘    │
│           │                          │                          │
│           │              Structured ResumeJSON                  │
│           │                          │                          │
│           │                          ▼                          │
│           │              ┌──────────────────────┐              │
│           │              │  Jinja2 LaTeX Template│              │
│           │              │  resume_template.jinja│              │
│           │              └──────────────────────┘              │
│           │                          │                          │
│           │                          ▼                          │
│           │              ┌──────────────────────┐              │
│           │              │   resume.tex          │              │
│           │              │   (pdflatex / cloud)  │              │
│           │              └──────────────────────┘              │
│           │                          │                          │
│           │              ┌──────────────────────┐              │
│           └─────────────▶│ Fine-Tuning Logger   │              │
│                          │ fine_tuning_logs.jsonl│              │
│                          └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Principles

| Principle | Detail |
|---|---|
| **LLM Output** | Structured JSON **only** — never raw LaTeX |
| **LaTeX** | Handled entirely by Jinja2 templates |
| **RAG** | ChromaDB retrieves relevant candidate context before the LLM call |
| **Fallback** | Every component has a graceful fallback — no crashes |
| **Fine-Tuning Ready** | Every generation is logged to JSONL for future Qwen3/LoRA training |

---

## 📁 Project Structure

```
ResumeBuilder/
│
├── src/                              # React + TypeScript Frontend
│   ├── components/
│   │   ├── AIGeneratorPanel.tsx      # Job description input + Generate button
│   │   ├── EditorPane.tsx            # Live LaTeX code editor
│   │   └── PreviewPane.tsx           # PDF preview via texlive.net
│   ├── App.tsx                       # 3-column layout (AI | Editor | Preview)
│   └── index.css                     # Global styles
│
├── backend/                          # Python FastAPI Backend
│   ├── main.py                       # FastAPI app + all API endpoints
│   ├── pipeline.py                   # RAG retrieval + LLM generation
│   ├── database.py                   # ChromaDB vector store operations
│   ├── pdf_generator.py              # Jinja2 rendering + pdflatex compilation
│   ├── logger.py                     # Fine-tuning JSONL logger
│   ├── schemas.py                    # Pydantic models (CandidateProfile, ResumeJSON)
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # API keys (never commit!)
│   ├── templates/
│   │   └── resume_template.tex.jinja # ATS-friendly LaTeX template
│   ├── output/                       # Generated .tex and .pdf files
│   ├── chroma_db/                    # Persistent ChromaDB vector store
│   └── fine_tuning_logs.jsonl        # Training data for future fine-tuning
│
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ How It Works — Step by Step

### Step 1 — Candidate Knowledge Base (ChromaDB)

Before generating any resume, you store your entire professional history in ChromaDB. This is your **master knowledge base** — you only do this once.

Each item (project, experience, certification, achievement) is embedded as a vector using the `all-MiniLM-L6-v2` sentence transformer model and stored persistently.

**What gets stored:**
- Projects (title, tech stack, tags, description, impact metrics, ATS keywords, GitHub link)
- Experiences (role, company, bullet library, ATS keywords)
- Certifications (name, issuer, tags)
- Achievements (competitions, publications, awards)

```bash
# Seed the database:
POST http://127.0.0.1:8000/populate-candidate

# Or store your real profile:
POST http://127.0.0.1:8000/candidate
# Body: Full CandidateProfile JSON (see /docs)
```

---

### Step 2 — RAG Retrieval

When you submit a Job Description, the system:

1. Embeds the job description text into a vector
2. Queries ChromaDB for the **top 10 most relevant** candidate items
3. Returns a filtered context: `{projects: [...], experiences: [...], certifications: [...], achievements: [...]}`

This means an **AI Engineer JD** retrieves voice cloning and NLP projects, while a **Full Stack JD** retrieves React/Node.js projects — automatically.

---

### Step 3 — LLM Generation (OpenRouter)

The system calls **`openai/gpt-oss-120b:free`** via OpenRouter with:
- A strict system prompt requiring **raw JSON output only**
- The job description as context
- The retrieved candidate items from ChromaDB
- The candidate's skill set

The LLM selects the most relevant experiences, rewrites bullets to be ATS-friendly, quantifies achievements, and outputs a `ResumeJSON` object.

#### 📄 Example Structured JSON Output
The LLM generates a strictly formatted JSON object that matches our Pydantic schema:
```json
{
  "personal": {
    "name": "Abhijith Kumar",
    "email": "abhijith@example.com",
    "phone": "+91-9876543210",
    "linkedin": "linkedin.com/in/abhijith",
    "github": "github.com/abhijith",
    "portfolio": "abhijith.dev"
  },
  "education": [],
  "skills": {
    "Languages": "Python, JavaScript, TypeScript, SQL",
    "AI / ML": "LangChain, ChromaDB, PyTorch, HuggingFace"
  },
  "experiences": [
    {
      "title": "Machine Learning Engineer Intern",
      "company": "AI Startup",
      "location": "Bangalore, India",
      "year": "Jun 2023 – Aug 2023",
      "bullets": [
        "Developed NLP pipeline for entity extraction, improving accuracy by 18%.",
        "Deployed model as REST API using FastAPI, reducing inference latency by 30%."
      ]
    }
  ],
  "projects": [
    {
      "name": "AI Resume Builder",
      "tech": "FastAPI, React, ChromaDB, LangChain, Jinja2",
      "date": "2023",
      "github": "github.com/abhijith/ai-resume-builder",
      "bullets": [
        "End-to-end AI pipeline for generating ATS-friendly resumes from job descriptions.",
        "10x faster resume creation with RAG-powered candidate matching."
      ]
    }
  ],
  "certifications": [],
  "achievements": []
}
```

#### ⚙️ How the Backend Handles the JSON
1. **Extraction:** The backend receives the raw text from the LLM, strips any markdown fences (like ` ```json ... ``` `), and parses the string into a Python dictionary (`extract_json` in `pipeline.py`).
2. **Validation:** The dictionary is passed into a Pydantic model (`ResumeJSON(**json_data)`). This ensures all required fields exist and are of the correct type. If the LLM hallucinates a bad structure, Pydantic catches it.
3. **Rendering:** The validated `ResumeJSON` object is passed to `pdf_generator.py`, where its fields are injected into the Jinja2 LaTeX template.
4. **Storage:** A copy of the generated JSON is saved to the `output/` directory alongside the PDF, and the full interaction is logged to `fine_tuning_logs.jsonl`.

---

### Step 4 — Jinja2 → LaTeX → PDF

The `ResumeJSON` is passed into a Jinja2 template (`resume_template.tex.jinja`) which renders a complete `.tex` file.

**Key detail:** All user-supplied text passes through a `latex_escape` filter that escapes `%`, `&`, `_`, `#`, `$`, `{`, `}`, `~`, `^` — preventing LaTeX compilation errors.

```
ResumeJSON  →  Jinja2 Template  →  resume.tex  →  pdflatex  →  resume.pdf
```

If `pdflatex` is not installed locally, the `.tex` file is returned and the **frontend compiles it via [texlive.net](https://texlive.net)** directly in the browser.

---

### Step 5 — Fine-Tuning Logger

Every successful generation writes one line to `fine_tuning_logs.jsonl`:

```json
{
  "timestamp": "2026-06-07T19:16:35",
  "job_description": "We are looking for a Software Development Engineer...",
  "retrieved_context": { "projects": [...], "experiences": [...] },
  "generated_resume_json": { "personal": {}, "education": [...], ... },
  "final_resume_pdf": "D:\\...\\resume_user_123.tex"
}
```

These logs are training examples for future **Qwen3 14B / 32B** fine-tuning using Unsloth + LoRA. The model learns project selection, bullet rewriting, and skill matching — **not** LaTeX formatting.

---

## 🚀 Setup & Running

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.9+ | Backend runtime |
| Node.js | 18+ | Frontend dev server |
| MiKTeX / TeX Live | Any | Local PDF compilation (optional) |

### 1. Install Frontend Dependencies

```bash
cd ResumeBuilder
npm install
npm run dev
# → http://localhost:5173
```

### 2. Install Backend Dependencies

```bash
cd ResumeBuilder/backend
pip install -r requirements.txt
```

### 3. Configure API Key

Create `backend/.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get a free key at [openrouter.ai](https://openrouter.ai). The system uses **`openai/gpt-oss-120b:free`** by default (no cost).

### 4. Start the Backend

```bash
cd backend
python main.py
# → http://127.0.0.1:8000
# → Swagger docs: http://127.0.0.1:8000/docs
```

### 5. Seed Your Candidate Profile

Visit `http://127.0.0.1:8000/docs` and run:

- **`POST /populate-candidate`** — Seeds with a rich AI/ML sample profile for testing
- **`POST /candidate`** — Store your **real** profile (recommended for production use)

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate-resume` | Main endpoint — generates resume from JD + candidate profile |
| `GET` | `/download-pdf/{filename}` | Download a previously generated PDF |
| `POST` | `/candidate` | Store/update a full candidate profile in ChromaDB |
| `POST` | `/populate-candidate` | Seed ChromaDB with a rich sample AI/ML candidate |
| `GET` | `/docs` | Interactive Swagger UI for all endpoints |

### `POST /generate-resume`

**Request:**
```json
{
  "job_description": "We are looking for a Backend Engineer with Python, FastAPI...",
  "candidate_id": "user_123"
}
```

**Response:**
```json
{
  "resume_json": { "personal": {}, "education": [], "skills": {}, ... },
  "latex": "\\documentclass[letterpaper,11pt]{article}...",
  "pdf_url": "/download-pdf/resume_user_123.pdf"
}
```

---

## 🔧 Configuration

### Changing the LLM Model

In `backend/pipeline.py`, change the `FREE_MODEL` constant:

```python
# Free models available on OpenRouter:
FREE_MODEL = "openai/gpt-oss-120b:free"        # Current (GPT-class, 120B)
FREE_MODEL = "google/gemini-2.5-flash:free"     # Google Gemini Flash
FREE_MODEL = "meta-llama/llama-4-maverick:free" # Meta Llama 4
FREE_MODEL = "deepseek/deepseek-r1:free"        # DeepSeek R1 (reasoning)
```

### Customizing the LaTeX Template

Edit `backend/templates/resume_template.tex.jinja`. All Jinja2 variables use `{{ value | latex_escape }}` syntax.

> ⚠️ Never use `{#` in the template — it conflicts with LaTeX argument syntax. Comments use `{## ... ##}` instead.

---

## 🧠 Future Fine-Tuning Plan

The system is designed from the ground up to support **Qwen3 14B / 32B fine-tuning**:

| Stage | Detail |
|---|---|
| **Data Collection** | Every resume generation writes to `fine_tuning_logs.jsonl` |
| **Format** | JSONL instruction pairs: `(job_description + context) → resume_json` |
| **Framework** | Unsloth + LoRA / QLoRA |
| **What the model learns** | Project selection, bullet rewriting, skill matching |
| **What it does NOT learn** | LaTeX — that stays in the Jinja2 template |

Once you have ~500+ logged generations, you can fine-tune a local model to replace the OpenRouter API entirely.

---

## 🛡️ Security Notes

- The `backend/.env` file containing your API key is excluded from git via `.gitignore`
- The `chroma_db/` folder (your vector data) is also gitignored
- CORS is set to `allow_origins=["*"]` for development — restrict this for production

---

## 📄 License

MIT — free to use and modify for personal or commercial projects.
