from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional
from datetime import datetime

# --- Auth Models ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr

# --- Dashboard Knowledge Base Models ---

class PersonalInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: Optional[str] = ""

class BasicDetails(BaseModel):
    role_designation: str = ""
    current_role: str = ""
    experience_years: str = ""
    notice_period: str = ""
    expected_ctc: str = ""

class Project(BaseModel):
    id: str
    title: str
    technologies: List[str]
    description: str
    github_link: Optional[str] = None
    impact_metrics: List[str] = []
    tags: List[str] = []
    ats_keywords: List[str] = []

class Experience(BaseModel):
    id: str
    company: str
    role: str
    location: str
    duration: str
    bullet_library: List[str]
    ats_keywords: List[str] = []

class Certification(BaseModel):
    id: str
    name: str
    issuer: str
    date: str
    tags: List[str] = []

class Achievement(BaseModel):
    id: str
    title: str
    description: str
    category: str = "Award"

class EducationItem(BaseModel):
    id: str
    institution: str
    degree: str
    gpa: str
    graduation_date: str

class CandidateProfile(BaseModel):
    user_id: str
    personal: PersonalInfo = Field(default_factory=PersonalInfo)
    basic_details: BasicDetails = Field(default_factory=BasicDetails)
    education: List[EducationItem] = Field(default_factory=list)
    skills: Dict[str, List[str]] = Field(default_factory=dict)
    projects: List[Project] = Field(default_factory=list)
    experiences: List[Experience] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    achievements: List[Achievement] = Field(default_factory=list)


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

class GenerateResumeResponse(BaseModel):
    resume_json: ResumeJSON
    latex: str
    pdf_url: str

class SavedResumeCreate(BaseModel):
    pdf_url: str
    job_title: Optional[str] = "Untitled Resume"

class SavedResume(SavedResumeCreate):
    id: str
    user_id: str
    created_at: datetime
