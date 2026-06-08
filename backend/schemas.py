from pydantic import BaseModel, Field
from typing import List, Dict, Optional

# --- Candidate Knowledge Base Models ---

class Project(BaseModel):
    id: str
    title: str
    technologies: List[str]
    tags: List[str]
    description: str
    impact_metrics: List[str]
    github_link: Optional[str] = None
    ats_keywords: List[str]

class Experience(BaseModel):
    id: str
    company: str
    role: str
    location: str
    duration: str
    bullet_library: List[str]
    ats_keywords: List[str]

class Certification(BaseModel):
    name: str
    issuer: str
    date: str
    tags: List[str]

class Achievement(BaseModel):
    title: str
    description: str
    category: str # e.g., 'Competition', 'Publication', 'Award', 'Ranking'

class EducationItem(BaseModel):
    institution: str
    degree: str
    gpa: str
    graduation_date: str

class PersonalInfo(BaseModel):
    name: str
    email: str
    phone: str
    linkedin: str
    github: str
    portfolio: Optional[str] = None

class CandidateProfile(BaseModel):
    candidate_id: str
    personal: PersonalInfo
    education: List[EducationItem]
    skills: Dict[str, List[str]] # Categories like "Programming Languages", "AI / ML"
    projects: List[Project]
    experiences: List[Experience]
    certifications: List[Certification]
    achievements: List[Achievement]


# --- Resume JSON Schema (LLM Output) ---

class ResumeExperience(BaseModel):
    title: str
    company: str
    location: str
    year: str
    bullets: List[str]

class ResumeProject(BaseModel):
    name: str
    tech: str
    date: str
    github: Optional[str] = None
    bullets: List[str]

class ResumeCertification(BaseModel):
    name: str
    details: str # e.g. issuer and date

class ResumeEducation(BaseModel):
    institution: str
    degree: str
    date: str
    gpa: str

class ResumeAchievement(BaseModel):
    title: str
    description: str

class ResumeJSON(BaseModel):
    personal: PersonalInfo
    education: List[ResumeEducation]
    skills: Dict[str, str] # e.g. {"Languages": "Python, C++", "Frameworks": "React, FastAPI"}
    experiences: List[ResumeExperience]
    projects: List[ResumeProject]
    certifications: List[ResumeCertification]
    achievements: List[ResumeAchievement]

# --- API Request/Response Models ---

class GenerateResumeRequest(BaseModel):
    job_description: str
    candidate_id: str

class GenerateResumeResponse(BaseModel):
    resume_json: ResumeJSON
    latex: str
    pdf_url: str
