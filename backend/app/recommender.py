from __future__ import annotations

import json
from pathlib import Path
from typing import List, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models import Book, RecommendationRequest, RecommendationResult


class SemanticBookRecommender:
    def __init__(self, books_path: Path) -> None:
        self.books = self._load_books(books_path)
        self.book_lookup = {book.id: book for book in self.books}
        self.corpus = [self._book_to_text(book) for book in self.books]
        self.model_used = "tfidf"
        self.tfidf = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.embeddings = self.tfidf.fit_transform(self.corpus)
        self.transformer = None
        self._try_load_sentence_transformer()

    def _load_books(self, books_path: Path) -> List[Book]:
        with books_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
        return [Book.model_validate(item) for item in payload]

    @staticmethod
    def _book_to_text(book: Book) -> str:
        return " | ".join(
            [
                f"title: {book.title}",
                f"author: {book.author}",
                f"genres: {' '.join(book.genres)}",
                f"description: {book.description}",
            ]
        )

    def _try_load_sentence_transformer(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer

            self.transformer = SentenceTransformer("all-MiniLM-L6-v2")
            vectors = self.transformer.encode(self.corpus, normalize_embeddings=True)
            self.embeddings = np.asarray(vectors)
            self.model_used = "sentence-transformers/all-MiniLM-L6-v2"
        except Exception:
            self.transformer = None
            self.model_used = "tfidf"

    def _query_vector(self, req: RecommendationRequest) -> np.ndarray:
        if self.transformer is not None:
            return np.asarray(self.transformer.encode([req.query], normalize_embeddings=True))
        return self.tfidf.transform([req.query]).toarray()

    def _favorite_centroid(self, req: RecommendationRequest) -> np.ndarray | None:
        favorite_ids = set(req.favorite_book_ids)
        indices = [
            idx
            for idx, book in enumerate(self.books)
            if book.id in favorite_ids
        ]
        if not indices:
            return None

        if self.transformer is not None:
            vectors = self.embeddings[indices]
            centroid = vectors.mean(axis=0, keepdims=True)
            norm = np.linalg.norm(centroid)
            return centroid if norm == 0 else centroid / norm

        vectors = self.embeddings[indices].toarray()
        return vectors.mean(axis=0, keepdims=True)

    def _blended_query_vector(self, req: RecommendationRequest) -> np.ndarray:
        query_vector = self._query_vector(req)
        favorite_centroid = self._favorite_centroid(req)
        if favorite_centroid is None:
            return query_vector
        return (0.75 * query_vector) + (0.25 * favorite_centroid)

    def _similarities(self, query_vector: np.ndarray) -> np.ndarray:
        if self.transformer is not None:
            return cosine_similarity(query_vector, self.embeddings)[0]
        return cosine_similarity(query_vector, self.embeddings.toarray())[0]

    def recommend(self, req: RecommendationRequest) -> List[RecommendationResult]:
        query_vector = self._blended_query_vector(req)
        similarities = self._similarities(query_vector)
        candidates: List[Tuple[Book, float]] = []

        for idx, score in enumerate(similarities):
            book = self.books[idx]
            if req.genre_filter and req.genre_filter.lower() not in [
                g.lower() for g in book.genres
            ]:
                continue
            if req.year_from and book.year < req.year_from:
                continue
            candidates.append((book, float(score)))

        candidates.sort(key=lambda x: x[1], reverse=True)

        results: List[RecommendationResult] = []
        query_terms = set(req.query.lower().split())

        for book, score in candidates[: req.top_k]:
            reasons = []
            reasons.append(f"Semantic similarity score: {score:.3f}")
            overlapping_terms = [
                term for term in query_terms if term in book.description.lower()
            ]
            if overlapping_terms:
                reasons.append(
                    f"Shares topics: {', '.join(sorted(overlapping_terms)[:4])}"
                )
            reasons.append(f"Genres: {', '.join(book.genres)}")

            results.append(RecommendationResult(book=book, score=score, reasons=reasons))

        return results
