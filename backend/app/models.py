from typing import List, Optional

from pydantic import BaseModel, Field


class Book(BaseModel):
    id: str
    title: str
    author: str
    year: int
    genres: List[str]
    description: str
    rating: float = Field(ge=0.0, le=5.0)


class RecommendationRequest(BaseModel):
    query: str = Field(min_length=2, max_length=300)
    favorite_book_ids: List[str] = Field(default_factory=list)
    top_k: int = Field(default=8, ge=1, le=20)
    genre_filter: Optional[str] = None
    year_from: Optional[int] = None


class RecommendationResult(BaseModel):
    book: Book
    score: float
    reasons: List[str]


class RecommendationResponse(BaseModel):
    results: List[RecommendationResult]
    model_used: str
