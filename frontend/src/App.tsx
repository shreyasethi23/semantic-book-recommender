import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchBooks, fetchHealth, fetchRecommendations } from './api'
import type { Book, RecommendationResult } from './types'
import './App.css'

const starterPrompts = [
  'space survival with clever science',
  'fantasy with deep world building',
  'books on focused productivity',
  'startup strategy and product thinking',
]

function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [query, setQuery] = useState(starterPrompts[0])
  const [genreFilter, setGenreFilter] = useState('')
  const [yearFrom, setYearFrom] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [results, setResults] = useState<RecommendationResult[]>([])
  const [modelUsed, setModelUsed] = useState('loading')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const boot = async () => {
      try {
        const [bookData, health] = await Promise.all([fetchBooks(), fetchHealth()])
        setBooks(bookData)
        setModelUsed(health.model_used)
      } catch (err) {
        setError((err as Error).message)
      }
    }
    boot()
  }, [])

  const genres = useMemo(() => {
    const all = new Set<string>()
    books.forEach((book) => book.genres.forEach((genre) => all.add(genre)))
    return Array.from(all).sort((a, b) => a.localeCompare(b))
  }, [books])

  const favoriteBooks = useMemo(
    () => books.filter((book) => favorites.includes(book.id)),
    [books, favorites],
  )

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const runRecommendation = async (event: FormEvent) => {
    event.preventDefault()
    if (!query.trim()) {
      setError('Please enter a search intent.')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await fetchRecommendations({
        query,
        favorite_book_ids: favorites,
        top_k: 8,
        genre_filter: genreFilter || null,
        year_from: yearFrom ? Number(yearFrom) : null,
      })
      setResults(response.results)
      setModelUsed(response.model_used)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>Semantic Book Recommender</h1>
        <p>
          Discover books by meaning, not exact keywords. This app reads your
          intent and returns the closest-matching books from the catalog.
        </p>
        <span className="chip">Model: {modelUsed}</span>
      </header>

      <section className="panel instructions">
        <h2>How to use this website</h2>
        <p className="muted">
          Follow these steps to get personalized recommendations:
        </p>
        <ol>
          <li>
            Write what you want to read in plain language (topic, mood, style,
            or genre).
          </li>
          <li>
            Optionally choose a genre or year range to narrow results.
          </li>
          <li>
            Select a few books you already like in <strong>favorite anchors</strong>{' '}
            so the system learns your taste.
          </li>
          <li>
            Click <strong>Get Recommendations</strong> and review the score and
            explanation for each result.
          </li>
        </ol>
      </section>

      <section className="panel">
        <h2>Describe what you want</h2>
        <p className="muted">
          Example: "optimistic sci-fi with strong character growth" or
          "beginner-friendly books on building habits."
        </p>
        <form onSubmit={runRecommendation} className="controls">
          <label>
            Intent query
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. optimistic sci-fi with scientific realism"
            />
          </label>

          <div className="prompt-row">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ghost"
                onClick={() => setQuery(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="filters">
            <label>
              Genre
              <select
                value={genreFilter}
                onChange={(event) => setGenreFilter(event.target.value)}
              >
                <option value="">All genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Year from
              <input
                type="number"
                min={1900}
                max={2030}
                value={yearFrom}
                onChange={(event) => setYearFrom(event.target.value)}
              />
            </label>
          </div>

          <button className="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Finding books...' : 'Get Recommendations'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Pick favorite anchors</h2>
        <p>
          Choose books you already like. The recommender blends your favorites
          with your query to personalize results.
        </p>
        <div className="anchor-grid">
          {books.slice(0, 16).map((book) => {
            const active = favorites.includes(book.id)
            return (
              <button
                key={book.id}
                type="button"
                className={`anchor-card ${active ? 'active' : ''}`}
                onClick={() => toggleFavorite(book.id)}
              >
                <strong>{book.title}</strong>
                <span>{book.author}</span>
              </button>
            )
          })}
        </div>
        {favoriteBooks.length > 0 && (
          <p className="favorites-preview">
            Favorites: {favoriteBooks.map((book) => book.title).join(', ')}
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Recommendations</h2>
        <p className="muted">
          Higher score means stronger semantic match with your intent and
          selected favorites.
        </p>
        {error && <p className="error">{error}</p>}
        {!error && results.length === 0 && (
          <p className="muted">Run a query to see semantic recommendations.</p>
        )}
        <div className="results">
          {results.map(({ book, score, reasons }) => (
            <article key={book.id} className="result-card">
              <div className="top-row">
                <h3>{book.title}</h3>
                <span className="score">{score.toFixed(3)}</span>
              </div>
              <p className="meta">
                {book.author} • {book.year} • {book.rating.toFixed(1)} / 5
              </p>
              <p>{book.description}</p>
              <p className="tags">{book.genres.join(' • ')}</p>
              <ul>
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
