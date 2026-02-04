from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI()

# -------------------------
# CORS (local + production safe)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for now (later restrict)
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Helper NLP functions
# -------------------------
def extract_text(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        if page.extract_text():
            text += page.extract_text() + " "
    return text.lower()

def extract_experience(text):
    years = re.findall(r'(\d+)\s+years?', text)
    return max([int(y) for y in years], default=0)

def extract_keywords(text, top_n=8):
    vectorizer = TfidfVectorizer(stop_words="english", max_features=50)
    vectorizer.fit([text])
    return list(vectorizer.get_feature_names_out())[:top_n]

def check_eligibility(match_score, experience, min_score=40, min_exp=1):
    """
    Simple eligibility rule:
    - Match score >= 40%
    - Experience >= 1 year
    """
    if match_score >= min_score and experience >= min_exp:
        return "ELIGIBLE"
    return "NOT ELIGIBLE"

# -------------------------
# API Endpoint
# -------------------------
@app.post("/parse-resumes/")
async def parse_resumes(
    job_description: str = Form(...),
    files: list[UploadFile] = File(...)
):
    resume_texts = []
    filenames = []

    for file in files:
        resume_texts.append(extract_text(file.file))
        filenames.append(file.filename)

    vectorizer = TfidfVectorizer(stop_words="english")
    vectors = vectorizer.fit_transform([job_description] + resume_texts)
    scores = cosine_similarity(vectors[0:1], vectors[1:])[0]

    results = []
    for i, text in enumerate(resume_texts):
        experience = extract_experience(text)
        match_score = round(scores[i] * 100, 2)
        eligibility = check_eligibility(match_score, experience)

        results.append({
            "filename": filenames[i],
            "keywords": extract_keywords(text),
            "experience": experience,
            "match_score": match_score,
            "eligibility": eligibility
        })

    return results

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {
        "status": "OK",
        "message": "Resume Parser backend is live 🚀"
    }
