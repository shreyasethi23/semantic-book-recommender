from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "model_used" in payload


def test_recommendation_contract() -> None:
    response = client.post(
        "/api/recommend",
        json={
            "query": "engineering survival on mars",
            "favorite_book_ids": ["book-005"],
            "top_k": 3,
            "genre_filter": "Science Fiction",
            "year_from": 2000,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["results"]) > 0
    first = payload["results"][0]
    assert "book" in first
    assert "score" in first
    assert "reasons" in first
