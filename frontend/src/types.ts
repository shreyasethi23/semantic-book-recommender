export interface Book {
  id: string
  title: string
  author: string
  year: number
  genres: string[]
  description: string
  rating: number
}

export interface RecommendationRequest {
  query: string
  favorite_book_ids: string[]
  top_k: number
  genre_filter: string | null
  year_from: number | null
}

export interface RecommendationResult {
  book: Book
  score: number
  reasons: string[]
}

export interface RecommendationResponse {
  results: RecommendationResult[]
  model_used: string
}

export interface HealthResponse {
  status: string
  model_used: string
}
