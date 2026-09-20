import React, { useEffect, useState } from 'react'
import { fetchTrending } from '../api'
import MovieCard from '../components/MovieCard'
import { CardGridSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function Trending(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = sessionStorage.getItem('user_id')

  useEffect(() => {
    fetchTrending(10)
      .then(setRows)
      .catch(e => { console.error(e); setError('트렌딩 정보를 불러오지 못했어요.') })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <h2>🔥 실시간 평점 랭킹</h2>
        <p>등록된 popularity 값이 아니라, 실제 사용자 평점 평균 기준 랭킹이에요.</p>
      </div>

      {loading && <CardGridSkeleton count={6} />}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <EmptyState title="아직 집계할 평점이 없어요" description="평점이 하나 이상 등록된 영화부터 랭킹에 나타나요." />
      )}

      <div className="card-grid">
        {rows.map((r, idx) => (
          <MovieCard
            key={r.movie.id}
            movie={r.movie}
            rank={idx + 1}
            avgRating={r.avg_rating}
            ratingCount={r.rating_count}
            userId={userId}
          />
        ))}
      </div>
    </>
  )
}
