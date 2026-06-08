import os
import json
import re
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from schemas import (
    ResumeJSON, ResumeProject, ResumeExperience,
    ResumeEducation, ResumeCertification, ResumeAchievement, PersonalInfo, CandidateProfile
)
from database import retrieve_relevant_context

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
FREE_MODEL = "openai/gpt-oss-120b:free"

SYSTEM_PROMPT = """You are an elite Resume Writer and ATS Optimization Expert.

Your ONLY output is a single valid JSON object. No markdown, no explanation, no text before or after.

=== STRICT GENERATION RULES ===

1. EXPERIENCES: Generate EXACTLY 4 internship/work experiences relevant to the target job role.
   - Each must be an internship or entry-level position with a realistic title (e.g. "ML Engineer Intern", "Data Science Intern", "Backend Developer Intern").
   - Company names should be realistic mid-tier tech companies, startups, or research labs suited to the role.
   - Each experience must have exactly 3 bullet points with quantified metrics (%, x faster, # users, time saved, accuracy %, etc.).
   - Bullets must use strong action verbs. Be DIRECTLY relevant to the target role's required skills.

2. SKILLS: Generate skills EXACTLY matched to the target job role.
   - Organize into 4-5 role-specific categories (e.g. for ML: "Languages", "ML Frameworks", "Data & Cloud", "Tools").
   - Each category value is a comma-separated string of 3-5 specific skills/tools from the job description or closely related.
   - Do NOT use generic skill categories. Make them highly relevant to the role.

3. PROJECTS: Generate EXACTLY 3 projects relevant to the target job role.
   - Use technologies from the job description or closely related stack.
   - Each project must have 2-3 bullet points with quantified impact.
   - Project names must be domain-specific and creative.
   - GitHub links: use format github.com/abhijith/project-name

4. CERTIFICATIONS: Generate 3-5 recognized certifications relevant to the target role.
   - Use real cert names from real providers: AWS, Google Cloud, Microsoft, Coursera/DeepLearning.AI, Oracle, etc.
   - Only include certs a hiring manager would find impressive for this specific role.

5. ACHIEVEMENTS: Generate 2-3 achievements relevant to the role.
   - Mix of hackathon wins, paper publications, or open-source contributions.
   - Every achievement must have quantified impact (rank, # participants, acceptance rate, etc.).

6. PERSONAL INFO: Use the exact candidate details provided in the knowledge base. Do NOT invent or change them.

7. EDUCATION: Use the education details provided in the knowledge base exactly as given.

OUTPUT FORMAT RULES (CRITICAL):
- Output RAW JSON only. Absolutely no markdown fences, no explanation text.
- Every string must be plain ASCII text only.
- Use standard ASCII hyphens (-) only. NO Unicode en-dashes, em-dashes, or non-breaking hyphens.
- NO curly/smart quotes. Use only straight quotes in strings.
- NO backslashes. NO LaTeX commands in any value.
- Quantify every bullet point with at least one concrete metric.

JSON SCHEMA:
{
  "personal": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string or null"
  },
  "education": [
    {"institution": "string", "degree": "string", "date": "string", "gpa": "string"}
  ],
  "skills": {
    "RoleSpecificCategory": "skill1, skill2, skill3"
  },
  "experiences": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "year": "string",
      "bullets": ["action verb + task + metric", "action verb + task + metric", "action verb + task + metric"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "tech": "tech1, tech2, tech3",
      "date": "string",
      "github": "github.com/abhijith/project-name",
      "bullets": ["bullet with metric", "bullet with metric"]
    }
  ],
  "certifications": [
    {"name": "Full Certification Name", "details": "Provider, Year"}
  ],
  "achievements": [
    {"title": "string", "description": "quantified description"}
  ]
}"""


def construct_prompt(job_description: str, profile: CandidateProfile) -> str:
    return f"""TARGET JOB DESCRIPTION:
{job_description}

CANDIDATE KNOWLEDGE BASE (use personal info and education exactly; use projects/experiences as inspiration):

Personal Info:
{json.dumps(profile.personal.model_dump(), indent=2)}

Basic Details:
{json.dumps(profile.basic_details.model_dump(), indent=2)}

Education:
{json.dumps([e.model_dump() for e in profile.education], indent=2)}

Skills:
{json.dumps(profile.skills, indent=2)}

Existing Projects (for inspiration — adapt and tailor to the role):
{json.dumps([p.model_dump() for p in profile.projects], indent=2)}

Existing Experiences (for inspiration — adapt and tailor to the role):
{json.dumps([e.model_dump() for e in profile.experiences], indent=2)}

Existing Certifications (for reference):
{json.dumps([c.model_dump() for c in profile.certifications], indent=2)}

Existing Achievements (for reference):
{json.dumps([a.model_dump() for a in profile.achievements], indent=2)}

TASK:
Generate a complete, ATS-optimised resume JSON for the above candidate targeting the job description above.
- Keep all personal info and education exactly as provided.
- Generate EXACTLY 4 role-relevant internship/work experiences.
- Generate EXACTLY 3 role-relevant projects.
- Generate role-specific skills, certifications, and achievements.
- Output RAW JSON only. No markdown. No explanation."""


def extract_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from LLM output."""
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'```\s*$', '', text, flags=re.MULTILINE)
    text = text.strip()
    return json.loads(text)


def get_mock_resume() -> ResumeJSON:
    """Fallback mock resume if the LLM call fails."""
    return ResumeJSON(
        personal=PersonalInfo(
            name="Nagula V S S Abhijith",
            email="abhijithnagula@gmail.com",
            phone="+91 8333058659",
            linkedin="linkedin.com/in/Abhijith71",
            github="github.com/Abhijith12371",
            portfolio="abhijith-3d.netlify.app"
        ),
        education=[
            ResumeEducation(
                institution="NRI Institute of Technology",
                degree="B.Tech in Data Science",
                date="Expected May 2026 | Vijayawada",
                gpa="8.5/10"
            )
        ],
        skills={
            "Languages": "Python, JavaScript, SQL, C++",
            "AI / ML": "PyTorch, HuggingFace, LangChain, ChromaDB",
            "Web": "React, FastAPI, Node.js",
            "Tools": "Docker, Git, AWS, Linux"
        },
        experiences=[
            ResumeExperience(
                title="Machine Learning Engineer Intern",
                company="AI Startup",
                location="Bangalore, India",
                year="Jun 2023 - Aug 2023",
                bullets=[
                    "Developed NLP pipeline for entity extraction, improving accuracy by 18%.",
                    "Fine-tuned BERT model on 50K samples, reducing inference latency by 30%.",
                    "Delivered production REST API using FastAPI, serving 10K requests/day."
                ]
            )
        ],
        projects=[
            ResumeProject(
                name="AI Resume Builder",
                tech="FastAPI, React, ChromaDB, LangChain",
                date="2024",
                github="github.com/Abhijith12371/ai-resume-builder",
                bullets=[
                    "End-to-end AI pipeline generating ATS-friendly resumes, reducing creation time by 10x.",
                    "RAG-powered candidate matching with 95% relevance accuracy."
                ]
            )
        ],
        certifications=[
            ResumeCertification(name="Microsoft Azure AI Fundamentals", details="Microsoft, 2024")
        ],
        achievements=[
            ResumeAchievement(
                title="AI Hackathon - 3rd Place",
                description="3rd place out of 200+ teams for AI-powered accessibility tool."
            )
        ]
    )


def generate_resume_json(job_description: str, profile: CandidateProfile) -> dict:
    """
    Orchestrates real LLM generation via OpenRouter using MongoDB profile data.
    Returns a dict with 'generated_json'.
    """
    if not OPENROUTER_API_KEY:
        print("[Pipeline] No API key found. Using mock resume.")
        return {"generated_json": get_mock_resume()}

    try:
        llm = ChatOpenAI(
            model=FREE_MODEL,
            api_key=OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
            temperature=0.4,
            max_tokens=3000,
            default_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "CareerHub"
            }
        )

        prompt = construct_prompt(job_description, profile)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt)
        ]

        print(f"[Pipeline] Calling OpenRouter model: {FREE_MODEL}")
        response = llm.invoke(messages)
        raw_text = response.content
        print(f"[Pipeline] Raw LLM output (first 300 chars): {raw_text[:300]}")

        json_data = extract_json(raw_text)
        resume = ResumeJSON(**json_data)
        print("[Pipeline] Successfully parsed LLM output into ResumeJSON.")

        return {"generated_json": resume}

    except Exception as e:
        print(f"[Pipeline] LLM call failed: {e}. Falling back to mock resume.")
        import traceback
        traceback.print_exc()
        return {"retrieved_context": retrieved_context, "generated_json": get_mock_resume()}
