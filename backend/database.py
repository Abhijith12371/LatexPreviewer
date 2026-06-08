import chromadb
from chromadb.config import Settings
import json
from schemas import CandidateProfile, Project, Experience, Certification, Achievement
from typing import Dict, Any, List

# Initialize ChromaDB (Persistent storage)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# We'll create separate collections for different types of experiences/projects
# or a single collection with metadata types. Let's use a single collection for simplicity.
collection = chroma_client.get_or_create_collection(name="candidate_knowledge_base")

def store_candidate_data(candidate: CandidateProfile):
    """Stores a candidate's projects, experiences, certifications, and achievements in ChromaDB."""
    
    # Store Projects
    for proj in candidate.projects:
        doc_text = f"Title: {proj.title}\nTags: {', '.join(proj.tags)}\nTech: {', '.join(proj.technologies)}\nDescription: {proj.description}\nImpact: {', '.join(proj.impact_metrics)}\nKeywords: {', '.join(proj.ats_keywords)}"
        collection.upsert(
            documents=[doc_text],
            metadatas=[{"type": "project", "id": proj.id, "candidate_id": candidate.candidate_id, "data": json.dumps(proj.model_dump())}],
            ids=[f"{candidate.candidate_id}_project_{proj.id}"]
        )
        
    # Store Experiences
    for exp in candidate.experiences:
        doc_text = f"Role: {exp.role}\nCompany: {exp.company}\nKeywords: {', '.join(exp.ats_keywords)}\nBullets: {' | '.join(exp.bullet_library)}"
        collection.upsert(
            documents=[doc_text],
            metadatas=[{"type": "experience", "id": exp.id, "candidate_id": candidate.candidate_id, "data": json.dumps(exp.model_dump())}],
            ids=[f"{candidate.candidate_id}_exp_{exp.id}"]
        )
        
    # Store Certifications
    for cert in candidate.certifications:
        doc_text = f"Certification: {cert.name}\nIssuer: {cert.issuer}\nTags: {', '.join(cert.tags)}"
        collection.upsert(
            documents=[doc_text],
            metadatas=[{"type": "certification", "name": cert.name, "candidate_id": candidate.candidate_id, "data": json.dumps(cert.model_dump())}],
            ids=[f"{candidate.candidate_id}_cert_{cert.name.replace(' ', '_')}"]
        )

    # Store Achievements
    for ach in candidate.achievements:
        doc_text = f"Achievement ({ach.category}): {ach.title}\nDescription: {ach.description}"
        collection.upsert(
            documents=[doc_text],
            metadatas=[{"type": "achievement", "title": ach.title, "candidate_id": candidate.candidate_id, "data": json.dumps(ach.model_dump())}],
            ids=[f"{candidate.candidate_id}_ach_{ach.title.replace(' ', '_')}"]
        )

def get_candidate_profile_metadata(candidate_id: str) -> Dict[str, Any]:
    # In a real app, you'd store the base personal info and education in a standard relational DB (e.g., PostgreSQL).
    # We will mock fetching the core profile here for demonstration.
    # We assume the user creates the candidate base profile.
    pass

def retrieve_relevant_context(job_description: str, candidate_id: str, k: int = 10) -> Dict[str, List[Any]]:
    """Retrieves the most relevant projects, experiences, etc. for a given job description."""
    retrieved_data = {
        "projects": [],
        "experiences": [],
        "certifications": [],
        "achievements": []
    }
    
    count = collection.count()
    if count == 0:
        return retrieved_data
        
    n_res = min(k, count)
    
    results = collection.query(
        query_texts=[job_description],
        n_results=n_res,
        where={"candidate_id": candidate_id}
    )
    
    if not results['metadatas'] or not results['metadatas'][0]:
        return retrieved_data
        
    for metadata in results['metadatas'][0]:
        item_type = metadata['type']
        item_data = json.loads(metadata['data'])
        if item_type == 'project':
            retrieved_data['projects'].append(item_data)
        elif item_type == 'experience':
            retrieved_data['experiences'].append(item_data)
        elif item_type == 'certification':
            retrieved_data['certifications'].append(item_data)
        elif item_type == 'achievement':
            retrieved_data['achievements'].append(item_data)
            
    return retrieved_data
