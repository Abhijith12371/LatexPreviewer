import os
import json
from datetime import datetime

LOG_FILE = os.path.join(os.path.dirname(__file__), "fine_tuning_logs.jsonl")

def log_generation(job_description: str, retrieved_context: dict, generated_json: dict, pdf_filepath: str):
    """
    Logs the generation request and output for future LLM fine-tuning.
    We save this as a JSONL (JSON Lines) file, which is standard for instruction fine-tuning datasets.
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "job_description": job_description,
        "retrieved_context": retrieved_context,
        "generated_resume_json": generated_json.model_dump() if hasattr(generated_json, 'model_dump') else generated_json,
        "final_resume_pdf": pdf_filepath
    }
    
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
