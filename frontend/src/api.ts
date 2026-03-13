import type {
  Book,
  HealthResponse,
  RecommendationRequest,
  RecommendationResponse,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export async function fetchBooks(): Promise<Book[]> {
  return request<Book[]>('/api/books')
}

export async function fetchRecommendations(
  payload: RecommendationRequest,
): Promise<RecommendationResponse> {
  return request<RecommendationResponse>('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
