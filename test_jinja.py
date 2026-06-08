from jinja2 import Environment, FileSystemLoader
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from schemas import ResumeJSON, PersonalInfo, ResumeExperience, ResumeProject, ResumeEducation, ResumeCertification, ResumeAchievement

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "backend", "templates")
env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=False,
    comment_start_string='{##',
    comment_end_string='##}',
)
env.filters['latex_escape'] = lambda v: v if isinstance(v, str) else str(v)

try:
    template = env.get_template("resume_template.tex.jinja")
    dummy = ResumeJSON(
        personal=PersonalInfo(name="Abhijith K", email="a@b.com", phone="+91 999",
                              linkedin="linkedin.com/in/a", github="github.com/a"),
        education=[ResumeEducation(institution="NRI Institute", degree="B.Tech DS", date="2026", gpa="8.5")],
        skills={"Languages": "Python, JS", "AI": "PyTorch, HuggingFace"},
        experiences=[ResumeExperience(title="ML Intern", company="AI Corp", location="Remote",
                                      year="2024", bullets=["Built models", "Deployed APIs"])],
        projects=[ResumeProject(name="Voice Clone", tech="FastAPI, XTTS", date="2024",
                                github="github.com/a/vc", bullets=["95% accuracy"])],
        certifications=[ResumeCertification(name="Azure AI", details="Microsoft, 2024")],
        achievements=[ResumeAchievement(title="1st Prize", description="Hackathon 2024")]
    )
    result = template.render(
        personal=dummy.personal, education=dummy.education,
        skills=dummy.skills, experiences=dummy.experiences,
        projects=dummy.projects, certifications=dummy.certifications,
        achievements=dummy.achievements
    )
    print("✅ Template rendered successfully!")
    print(f"   Output length: {len(result)} chars")
    print("--- First 300 chars ---")
    print(result[:300])
except Exception as e:
    import traceback
    traceback.print_exc()
