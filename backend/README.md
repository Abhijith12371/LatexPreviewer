# AI-Powered Resume Generation Backend

This is the backend system for generating targeted, ATS-friendly resumes using an AI pipeline. It takes a Job Description, retrieves a candidate's master knowledge base using ChromaDB, and uses an LLM to select the most relevant projects, experiences, and skills. The result is then formatted into a predefined JSON schema and rendered into a PDF using Jinja2 and LaTeX.

## Architecture & Data Flow

1. **Input**: `POST /generate-resume` receives `job_description` and `candidate_id`.
2. **Retrieval**: Queries ChromaDB (Vector DB) for the candidate's most relevant projects, experiences, certifications, and achievements based on the job description.
3. **Generation**: Passes the retrieved context and job description to an LLM (OpenAI/Local) with strict instructions to output a `ResumeJSON` structure.
4. **Rendering**: The `ResumeJSON` is mapped to variables in a Jinja2 template (`templates/resume_template.tex.jinja`), producing a raw `resume.tex` file.
5. **Compilation**: `pdflatex` compiles `resume.tex` into `resume.pdf`.
6. **Logging**: The inputs, retrieved context, generated JSON, and PDF path are logged to `fine_tuning_logs.jsonl` for future fine-tuning (e.g., Qwen3 LoRA).

## Setup & Requirements

- Python 3.9+
- `pdflatex` installed on the system (e.g., MiKTeX on Windows, TeX Live on Linux/macOS)

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Running the API

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

### Testing the Pipeline

1. **Seed the Database**: Run `POST http://127.0.0.1:8000/populate-candidate` to insert mock candidate data into ChromaDB.
2. **Generate a Resume**: Run `POST http://127.0.0.1:8000/generate-resume` with the following body:
```json
{
  "job_description": "We are looking for a backend engineer with experience in Python, FastAPI, and AI.",
  "candidate_id": "user_123"
}
```
3. **Check the PDF**: The API will return the structured JSON and a URL to download the generated PDF. The file will be saved in `backend/output/`.

## Fine-Tuning Preparation
Every generated resume is logged in `backend/fine_tuning_logs.jsonl`. This file captures the `job_description`, `retrieved_context`, and `generated_resume_json`, which forms a perfect dataset for instruction fine-tuning a model to learn selection and writing styles without learning LaTeX formatting.
