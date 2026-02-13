# FORCE UPDATE FOR GITHUB

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
import re

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
import Levenshtein

# -------------------------
# NLTK SAFE DOWNLOAD
# -------------------------
def download_nltk_data():
    resources = ["punkt", "stopwords", "wordnet", "omw-1.4"]
    for r in resources:
        try:
            nltk.data.find(r)
        except LookupError:
            nltk.download(r)

download_nltk_data()

# -------------------------
# APP SETUP
# -------------------------
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
# NLP SETUP
# -------------------------
stop_words = set(stopwords.words("english"))
stemmer = PorterStemmer()
lemmatizer = WordNetLemmatizer()

# -------------------------
# HELPERS
# -------------------------
def extract_text(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        if page.extract_text():
            text += page.extract_text() + " "
    return text.lower()


def tokenize_and_clean(text):
    tokens = word_tokenize(text)
    return [w for w in tokens if w.isalpha() and w not in stop_words]


def stem_and_lemmatize(words):
    return [stemmer.stem(lemmatizer.lemmatize(w)) for w in words]


def correct_spelling(word, vocabulary, threshold=0.8):
    best_match = word
    best_score = 0
    for vocab_word in vocabulary:
        score = Levenshtein.ratio(word, vocab_word)
        if score > best_score:
            best_score = score
            best_match = vocab_word
    return best_match if best_score >= threshold else word


def extract_keywords_tfidf(text, top_n=12):
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf = vectorizer.fit_transform([text])
    scores = zip(vectorizer.get_feature_names_out(), tfidf.toarray()[0])
    sorted_words = sorted(scores, key=lambda x: x[1], reverse=True)
    return [w for w, _ in sorted_words[:top_n]]


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


def calculate_match(job_keywords, resume_words):
    matched = list(set(job_keywords).intersection(resume_words))
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
    # JOB DESCRIPTION PROCESSING
    job_tokens = tokenize_and_clean(job_description.lower())
    job_processed = stem_and_lemmatize(job_tokens)
    job_keywords = extract_keywords_tfidf(" ".join(job_processed))

    results = []

    for file in files:
        resume_text = extract_text(file.file)

        # RESUME PROCESSING
        resume_tokens = tokenize_and_clean(resume_text)
        resume_processed = stem_and_lemmatize(resume_tokens)

        # SPELLING CORRECTION
        corrected_resume_words = {
            correct_spelling(word, job_keywords)
            for word in resume_processed
        }

        match_score, matched_keywords = calculate_match(
            job_keywords,
            corrected_resume_words
        )

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
