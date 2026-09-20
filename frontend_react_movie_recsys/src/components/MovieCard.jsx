import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight } from 'lucide-react'
import { submitRating } from '../api'
import { useToast } from '../context/ToastContext'
import { tintFor, primaryGenre } from '../utils'

const SOURCE_LABEL = {
  content: '콘텐츠 기반',
  collaborative: '협업 필터링',
  popularity: '인기도',
}

// movie: 영화 정보(필수)
// rank: 순위 배지(트렌딩/추천/유사영화처럼 "정렬된 결과"일 때만 전달)
// score + source: 추천 알고리즘 점수 (recommend / similar API 응답)
// avgRating + ratingCount: 실사용자 평점 집계 (trending API 응답)
// reason: 추천 사유 한 줄 설명
export default function MovieCard({ movie, score, reason, source, rank, avgRating, ratingCount, userId, onRated }){
  const [myRating, setMyRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { notify } = useToast()

  const hasPoster = movie.poster_url && !imgError
  const tint = tintFor(movie.title)

  async function handleRate(value){
    if (!userId) return
    setSubmitting(true)
    try {
      await submitRating(userId, movie.id, value)
      setMyRating(value)
      onRated?.(movie.id, value)
      notify(`"${movie.title}"에 ${value}점을 등록했어요.`)
    } catch (e) {
      console.error(e)
      notify('평점 등록에 실패했어요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="movie-card">
      <div
        className="movie-card-poster-wrap"
        style={hasPoster ? undefined : { background: `linear-gradient(155deg, ${tint}, ${tint}99)` }}
      >
        {rank && <span className="movie-card-rank">{rank}</span>}

        {typeof score === 'number' && source && (
          <span className={`movie-card-chip badge-${source}`}>{SOURCE_LABEL[source] || source}</span>
        )}
        {avgRating != null && !source && (
          <span className="movie-card-chip movie-card-chip-rating">
            <Star size={11} fill="currentColor" /> {avgRating.toFixed(1)}
          </span>
        )}

        {hasPoster ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="movie-card-poster"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="movie-card-poster-fallback">{movie.title?.[0]?.toUpperCase() || '🎬'}</span>
        )}
      </div>

      <div className="movie-card-body">
        <h3 className="movie-card-title" title={movie.title}>{movie.title}</h3>
        <div className="movie-card-meta">
          <span className="chip">{primaryGenre(movie.genres)}</span>
          {movie.year && <span className="hint">{movie.year}</span>}
        </div>

        {typeof score === 'number' && (
          <div className="movie-card-stat">AI 점수 {score.toFixed(3)}</div>
        )}
        {avgRating != null && (
          <div className="movie-card-stat">
            <Star size={12} fill="currentColor" style={{ color: '#FFC94A' }} /> 평균 {avgRating.toFixed(2)}
            {ratingCount != null && <span className="hint"> · 평가 {ratingCount}건</span>}
          </div>
        )}
        {reason && <div className="movie-card-reason">💡 {reason}</div>}

        {userId && (
          <div className="star-row">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={`star-btn${n <= myRating ? ' filled' : ''}`}
                onClick={() => handleRate(n)}
                disabled={submitting}
                aria-label={`${n}점 평가`}
              >★</button>
            ))}
            {myRating > 0 && <span className="star-note">{myRating}점 등록됨</span>}
          </div>
        )}

        <Link to={`/movies/${movie.id}/similar`} className="movie-card-link">
          비슷한 영화 <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
