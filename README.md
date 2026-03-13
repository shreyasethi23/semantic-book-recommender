# Semantic Book Recommender

A portfolio-ready full-stack ML project that recommends books using semantic retrieval.

## What this demonstrates

- **ML / retrieval engineering**: semantic search pipeline with two modes
  - `sentence-transformers` embeddings (`all-MiniLM-L6-v2`) when installed
  - TF-IDF fallback for lightweight local runs
- **Backend engineering**: `FastAPI` service with typed request/response models and ranking logic
- **Frontend engineering**: `React + TypeScript` app with:
  - intent query box
  - genre + year filtering
  - favorite-book anchors to personalize results
  - recommendation explanations and scores
- **Product polish**: clean UI, robust error handling, health endpoint, reproducible local setup

## Architecture

- `backend/app/main.py` - API routes and app startup
- `backend/app/recommender.py` - semantic ranking engine
- `backend/app/models.py` - request/response and domain models
- `backend/app/data/books_seed.json` - seed dataset
- `frontend/src/App.tsx` - recommender interface
- `frontend/src/api.ts` - API client layer

## Quickstart

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Optional stronger semantic model:

```bash
pip install -r requirements-ml.txt
```

### 2) Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:8000` for API requests.

If you want a different API URL, create `frontend/.env`:

```bash
VITE_API_BASE=http://localhost:8000
```

## API

- `GET /health` - service and active model
- `GET /api/books` - all books in catalog
- `POST /api/recommend` - semantic recommendations

Example request body:

```json
{
  "query": "space survival with scientific realism",
  "favorite_book_ids": ["book-005"],
  "top_k": 8,
  "genre_filter": "Science Fiction",
  "year_from": 2000
}
```

## Demo talking points (for interviews)

- Why semantic retrieval beats keyword matching for user intent
- How graceful model fallback keeps the product functional on low-resource machines
- How personalization anchors (`favorite_book_ids`) alter ranking behavior
- Trade-offs between classic vectorizers vs transformer embeddings

## Next upgrades

- Add hybrid ranking (semantic + popularity + recency)
- Move seed JSON to a database (Postgres + pgvector)
- Add user auth and saved recommendation history
- Add experiment tracking and offline eval metrics (MRR/NDCG)
