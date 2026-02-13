from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
import re

app = FastAPI(title="Resume Parser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend is live"}

# -------------------------
# Helpers
# -------------------------

def extract_text(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        if page.extract_text():
            text += page.extract_text() + " "
    return text.lower()

def extract_experience(text):
    patterns = [
        r"(\d+)\+?\s*(years|yrs)",
        r"experience\s*[:\-]?\s*(\d+)"
    ]
    years = []
    for p in patterns:
        matches = re.findall(p, text)
        for m in matches:
            years.append(int(m[0]))
    return max(years, default=0)

def clean_words(text):
    return set(re.findall(r"[a-zA-Z]{2,}", text.lower()))

def extract_keywords_tfidf(text, top_n=12):
    vectorizer = TfidfVectorizer(stop_words="english")
    vectorizer.fit([text])
    return vectorizer.get_feature_names_out()[:top_n].tolist()

def calculate_match(job_keywords, resume_words):
    matched = [kw for kw in job_keywords if kw in resume_words]
    score = round((len(matched) / len(job_keywords)) * 100, 2) if job_keywords else 0
    return score, matched

def check_eligibility(match_score, experience):
    if match_score >= 40:
        return "ELIGIBLE"
    if match_score >= 25 and experience >= 1:
        return "ELIGIBLE"
    return "NOT ELIGIBLE"

# -------------------------
# API
# -------------------------

@app.post("/parse-resumes/")
async def parse_resumes(
    job_description: str = Form(...),
    files: list[UploadFile] = File(...)
):
    job_keywords = extract_keywords_tfidf(job_description.lower())

    results = []

    for file in files:
        resume_text = extract_text(file.file)
        resume_words = clean_words(resume_text)

        match_score, matched_keywords = calculate_match(job_keywords, resume_words)
        experience = extract_experience(resume_text)

        results.append({
            "filename": file.filename,
            "job_keywords": job_keywords,
            "matched_keywords": matched_keywords,
            "match_score": match_score,
            "experience": experience,
            "eligibility": check_eligibility(match_score, experience)
        })

    return results
