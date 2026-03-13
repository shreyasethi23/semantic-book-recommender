from pathlib import Path
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import Book, RecommendationRequest, RecommendationResponse
from app.recommender import SemanticBookRecommender

DATA_PATH = Path(__file__).parent / "data" / "books_seed.json"

app = FastAPI(
    title="Semantic Book Recommender API",
    description="ML-powered recommendations using semantic similarity",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

recommender = SemanticBookRecommender(DATA_PATH)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_used": recommender.model_used}


@app.get("/api/books", response_model=List[Book])
def get_books() -> List[Book]:
    return recommender.books


@app.post("/api/recommend", response_model=RecommendationResponse)
def recommend(req: RecommendationRequest) -> RecommendationResponse:
    results = recommender.recommend(req)
    return RecommendationResponse(results=results, model_used=recommender.model_used)
