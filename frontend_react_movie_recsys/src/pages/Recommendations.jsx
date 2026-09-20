import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRecommendations } from '../api'
import MovieCard from '../components/MovieCard'
import { CardGridSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function Recommendations(){
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = sessionStorage.getItem('user_id')

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    fetchRecommendations(userId, 12)
      .then(setRecs)
      .catch(e => { console.error(e); setError('추천을 불러오지 못했어요.') })
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <>
      <div className="page-header">
        <h2>AI 추천</h2>
        <p>{userId ? `회원 #${userId} 기준, 콘텐츠 유사도와 협업 필터링을 함께 반영한 추천이에요.` : '먼저 회원을 선택해 주세요.'}</p>
      </div>

      {!userId && (
        <EmptyState title="회원을 먼저 선택해 주세요" description={<Link to="/">홈에서 데모 회원을 선택하면 추천을 볼 수 있어요.</Link>} />
      )}

      {loading && <CardGridSkeleton count={6} />}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && userId && recs.length === 0 && (
        <EmptyState title="아직 추천할 데이터가 없어요" description="평점을 몇 개 등록하면 더 정확한 추천을 받을 수 있어요." />
      )}

      <div className="card-grid">
        {recs.map((r, idx) => (
          <MovieCard key={idx} movie={r.movie} rank={idx + 1} score={r.score} reason={r.reason} source={r.source} userId={userId} />
        ))}
      </div>
    </>
  )
}
