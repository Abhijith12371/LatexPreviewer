from fastapi import FastAPI, HTTPException, Response, Depends, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import os
import traceback
import json
from bson import ObjectId

from schemas import (
    GenerateResumeRequest, GenerateResumeResponse, CandidateProfile, 
    PersonalInfo, Project, Experience, UserCreate, UserResponse, Token
)
from pipeline import generate_resume_json
from pdf_generator import generate_pdf_from_json
from logger import log_generation
from database import store_candidate_data
from database_mongo import init_db, users_collection, profiles_collection
from auth import get_password_hash, verify_password, create_access_token, decode_access_token

app = FastAPI(title="AI Resume Generation API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    email = payload.get("email")
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return {"id": str(user["_id"]), "email": user["email"]}

@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = await users_collection.insert_one({
        "email": user.email,
        "hashed_password": hashed_password
    })
    
    # Initialize empty profile
    empty_profile = CandidateProfile(user_id=str(new_user.inserted_id))
    await profiles_collection.insert_one(empty_profile.model_dump())
    
    return UserResponse(id=str(new_user.inserted_id), email=user.email)

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"email": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/profile", response_model=CandidateProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    profile = await profiles_collection.find_one({"user_id": current_user["id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return CandidateProfile(**profile)

@app.put("/api/profile", response_model=CandidateProfile)
async def update_profile(profile_update: CandidateProfile, current_user: dict = Depends(get_current_user)):
    # Ensure they are updating their own profile
    if profile_update.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    update_data = profile_update.model_dump()
    await profiles_collection.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_data},
        upsert=True
    )
    return profile_update

@app.post("/generate-resume", response_model=GenerateResumeResponse)
async def generate_resume(request: GenerateResumeRequest, current_user: dict = Depends(get_current_user)):
    try:
        profile_dict = await profiles_collection.find_one({"user_id": current_user["id"]})
        if not profile_dict:
            raise HTTPException(status_code=404, detail="Profile not found for this user.")
        
        profile = CandidateProfile(**profile_dict)
        
        # 1. RAG + LLM Pipeline
        pipeline_result = generate_resume_json(request.job_description, profile)
        resume_json = pipeline_result["generated_json"]
        
        # 2. Render LaTeX and compile PDF
        pdf_filepath = generate_pdf_from_json(resume_json, current_user["id"])
        
        # 3. Save the generated JSON payload to the output directory for inspection
        json_output_path = os.path.join(os.path.dirname(__file__), "output", f"resume_{current_user['id']}.json")
        with open(json_output_path, "w", encoding="utf-8") as f:
            f.write(resume_json.model_dump_json(indent=2))
        
        # pdf_filepath may be a .pdf (if pdflatex ran successfully) or a .tex
        # (if pdflatex is not installed). Derive the .tex path accordingly.
        if pdf_filepath.endswith('.pdf'):
            tex_filepath = pdf_filepath[:-4] + '.tex'
        else:
            tex_filepath = pdf_filepath  # already a .tex

        with open(tex_filepath, 'r', encoding='utf-8') as f:
            latex_content = f.read()
            
        # In a real app, the pdf_url would point to an S3 bucket or a static files endpoint
        pdf_basename = os.path.basename(pdf_filepath)
        return GenerateResumeResponse(
            resume_json=resume_json,
            latex=latex_content,
            pdf_url=f"/download-pdf/{pdf_basename}"
        )
        
    except Exception as e:
        traceback.print_exc()  # Print full traceback to terminal
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-pdf/{filename}")
async def download_pdf(filename: str):
    pdf_path = os.path.join(os.path.dirname(__file__), "output", filename)
    if os.path.exists(pdf_path):
        return FileResponse(pdf_path, media_type="application/pdf", filename=filename)
    raise HTTPException(status_code=404, detail="PDF not found")

class CompilePDFRequest(BaseModel):
    latex: str

@app.post("/compile-pdf")
async def compile_pdf(request: CompilePDFRequest):
    """
    Proxy endpoint to compile LaTeX into a PDF using texlive.net.
    This avoids CORS issues in the browser and lets us read exact error messages.
    """
    import requests
    url = "https://texlive.net/cgi-bin/latexcgi"
    files = {
        "filecontents[]": (None, request.latex),
        "filename[]": (None, "document.tex"),
        "engine": (None, "pdflatex"),
        "return": (None, "pdf")
    }
    
    try:
        response = requests.post(url, files=files, timeout=60)
        
        if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
            return Response(content=response.content, media_type="application/pdf")
        else:
            # Return the text error from texlive so the frontend can display it
            error_text = response.text[:1000]
            raise HTTPException(status_code=400, detail=f"LaTeX Compilation Failed:\n{error_text}")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Compilation timed out. The document might be too complex.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/candidate", summary="Create or update a candidate profile in ChromaDB")
async def create_candidate(candidate: CandidateProfile):
    """
    Store a full candidate profile (projects, experiences, certifications, achievements)
    into ChromaDB so it can be retrieved during resume generation.
    
    Send your real profile here once to seed the knowledge base.
    The candidate_id can be anything (e.g. 'abhijith' or 'user_123').
    """
    try:
        store_candidate_data(candidate)
        return {
            "status": "success",
            "candidate_id": candidate.candidate_id,
            "message": f"Stored {len(candidate.projects)} projects, "
                       f"{len(candidate.experiences)} experiences, "
                       f"{len(candidate.certifications)} certifications, "
                       f"{len(candidate.achievements)} achievements."
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/populate-candidate", summary="Seed ChromaDB with a rich sample candidate profile")
async def populate_candidate():
    """
    Seeds ChromaDB with a rich sample AI/ML candidate profile for testing.
    Uses candidate_id='user_123'.
    """
    from schemas import Certification, Achievement
    sample = CandidateProfile(
        candidate_id="user_123",
        personal=PersonalInfo(
            name="Abhijith Kumar",
            email="abhijith@example.com",
            phone="+91-9876543210",
            linkedin="linkedin.com/in/abhijith",
            github="github.com/abhijith",
            portfolio="abhijith.dev"
        ),
        education=[],
        skills={
            "Languages": ["Python", "JavaScript", "TypeScript", "C++", "SQL"],
            "AI / ML": ["PyTorch", "HuggingFace", "LangChain", "ChromaDB", "OpenCV", "Whisper"],
            "Web": ["React", "FastAPI", "Next.js", "Node.js", "TailwindCSS"],
            "Cloud / Tools": ["AWS", "Docker", "Git", "Linux", "PostgreSQL"]
        },
        projects=[
            Project(
                id="p1",
                title="Voice Cloning System",
                technologies=["Python", "PyTorch", "Whisper", "TTS", "FastAPI"],
                tags=["AI", "Deep Learning", "Speech", "NLP"],
                description="Built a real-time voice cloning pipeline using fine-tuned TTS models.",
                impact_metrics=["Achieved 92% MOS score", "Reduced cloning time to under 5s"],
                ats_keywords=["voice cloning", "TTS", "speech synthesis", "PyTorch", "deep learning"],
                github_link="github.com/abhijith/voice-clone"
            ),
            Project(
                id="p2",
                title="AI Video Caption Generator",
                technologies=["Python", "OpenCV", "Whisper", "ffmpeg", "React"],
                tags=["AI", "Computer Vision", "NLP", "Full Stack"],
                description="Automated caption generation for videos using Whisper ASR and CV pipeline.",
                impact_metrics=["Processed 500+ videos", "95% transcription accuracy"],
                ats_keywords=["caption generation", "ASR", "Whisper", "OpenCV", "video AI"],
                github_link="github.com/abhijith/ai-captions"
            ),
            Project(
                id="p3",
                title="ChatBro – Full Stack Chat App",
                technologies=["React", "Node.js", "Socket.io", "PostgreSQL", "Docker"],
                tags=["Full Stack", "Backend", "Web Development"],
                description="Real-time chat application with authentication, rooms, and media sharing.",
                impact_metrics=["500+ active users", "Sub-100ms message latency"],
                ats_keywords=["React", "Node.js", "WebSockets", "full stack", "real-time"],
                github_link="github.com/abhijith/chatbro"
            ),
            Project(
                id="p4",
                title="AI Resume Builder",
                technologies=["FastAPI", "React", "ChromaDB", "LangChain", "Jinja2"],
                tags=["AI", "Full Stack", "NLP", "RAG"],
                description="End-to-end AI pipeline for generating ATS-friendly resumes from job descriptions.",
                impact_metrics=["10x faster resume creation", "RAG-powered candidate matching"],
                ats_keywords=["RAG", "LangChain", "FastAPI", "LLM", "ChromaDB", "AI"],
                github_link="github.com/abhijith/ai-resume-builder"
            ),
        ],
        experiences=[
            Experience(
                id="e1",
                company="AI Startup (Internship)",
                role="Machine Learning Engineer Intern",
                location="Bangalore, India",
                duration="Jun 2023 – Aug 2023",
                bullet_library=[
                    "Developed NLP pipeline for entity extraction, improving accuracy by 18%.",
                    "Fine-tuned BERT-based model on domain-specific dataset of 50K samples.",
                    "Deployed model as REST API using FastAPI, reducing inference latency by 30%.",
                    "Collaborated with cross-functional team to deliver production ML features."
                ],
                ats_keywords=["NLP", "BERT", "fine-tuning", "FastAPI", "Python", "ML", "deep learning"]
            ),
            Experience(
                id="e2",
                company="Freelance",
                role="Full Stack Developer",
                location="Remote",
                duration="Jan 2023 – Present",
                bullet_library=[
                    "Built and deployed 5+ client web applications using React and Node.js.",
                    "Designed RESTful APIs and PostgreSQL schemas for e-commerce platforms.",
                    "Implemented CI/CD pipelines using GitHub Actions and Docker."
                ],
                ats_keywords=["React", "Node.js", "PostgreSQL", "REST API", "Docker", "full stack"]
            )
        ],
        certifications=[
            Certification(
                name="AWS Certified Cloud Practitioner",
                issuer="Amazon Web Services",
                date="2023",
                tags=["Cloud", "AWS"]
            ),
            Certification(
                name="Deep Learning Specialization",
                issuer="Coursera / DeepLearning.AI",
                date="2022",
                tags=["AI", "Deep Learning", "ML"]
            )
        ],
        achievements=[
            Achievement(
                title="National Hackathon Winner",
                description="1st place out of 200 teams at Smart India Hackathon 2023 for AI-powered accessibility tool.",
                category="Competition"
            ),
            Achievement(
                title="Research Paper Published",
                description="Published paper on efficient voice cloning at ICASSP-affiliated workshop, 2024.",
                category="Publication"
            )
        ]
    )

    store_candidate_data(sample)
    return {
        "status": "success",
        "candidate_id": sample.candidate_id,
        "message": f"Seeded with {len(sample.projects)} projects and {len(sample.experiences)} experiences."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

