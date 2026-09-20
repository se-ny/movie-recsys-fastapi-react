import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchSimilarMovies } from '../api'
import MovieCard from '../components/MovieCard'
import { CardGridSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function SimilarMovies(){
  const { movieId } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = sessionStorage.getItem('user_id')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSimilarMovies(movieId, 10)
      .then(data => { if (!cancelled) setItems(data) })
      .catch(e => { console.error(e); if (!cancelled) setError('비슷한 영화를 찾지 못했어요.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [movieId])

  return (
    <>
      <p><Link to="/movies">← 영화 둘러보기로</Link></p>
      <div className="page-header">
        <h2>이 영화와 비슷한 영화</h2>
        <p>콘텐츠(장르·줄거리) 유사도 기준으로 골랐어요.</p>
      </div>

      {loading && <CardGridSkeleton count={4} />}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && items.length === 0 && <EmptyState title="비슷한 영화를 찾지 못했어요" />}

      <div className="card-grid">
        {items.map((it, idx) => (
          <MovieCard key={idx} movie={it.movie} rank={idx + 1} score={it.similarity} userId={userId} />
        ))}
      </div>
    </>
  )
}
