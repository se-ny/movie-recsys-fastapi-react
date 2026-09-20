import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { fetchUsers, fetchStats, fetchTrending, searchMovies } from '../api'
import { tintFor, primaryGenre } from '../utils'

function PosterCard({ movie, rank }){
  const [imgError, setImgError] = useState(false)
  const hasPoster = movie.poster_url && !imgError
  const color = tintFor(movie.title)

  return (
    <Link to={`/movies/${movie.id}/similar`} className="poster-card">
      <div
        className="poster-card-art"
        style={hasPoster ? undefined : { background: `linear-gradient(155deg, ${color}, ${color}99)` }}
      >
        {rank && <span className="poster-card-rank">#{rank}</span>}
        {hasPoster ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="poster-card-img"
            onError={() => setImgError(true)}
          />
        ) : (
          movie.title?.[0]?.toUpperCase()
        )}
      </div>
      <div className="poster-card-title">{movie.title}</div>
      <div className="poster-card-meta">{movie.genres}</div>
    </Link>
  )
}

function PosterRow({ title, movies, showRank, linkTo }){
  if (!movies.length) return null
  return (
    <>
      <div className="row-header">
        <span className="row-header-title">{title}</span>
        {linkTo && <Link to={linkTo} className="row-header-link">전체 보기 →</Link>}
      </div>
      <div className="poster-row">
        {movies.map((m, idx) => (
          <PosterCard key={m.id} movie={m} rank={showRank ? idx + 1 : undefined} />
        ))}
      </div>
    </>
  )
}

export default function Login(){
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [trending, setTrending] = useState([])
  const [allMovies, setAllMovies] = useState([])
  const [heroImgError, setHeroImgError] = useState(false)
  const navigate = useNavigate()

  function load(){
    setLoading(true)
    setError('')
    Promise.all([
      fetchUsers(),
      fetchStats().catch(() => null),
      fetchTrending(8).catch(() => []),
      searchMovies({ limit: 100 }).catch(() => ({ items: [] })),
    ])
      .then(([u, s, t, movies]) => { setUsers(u); setStats(s); setTrending(t); setAllMovies(movies.items) })
      .catch(e => { console.error(e); setError('회원 목록을 불러오지 못했어요.') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function submit(e){
    e.preventDefault()
    if (!selected) return
    sessionStorage.setItem('user_id', selected)
    navigate('/recommendations')
  }

  const top = trending[0]
  const heroTint = top ? tintFor(top.movie.title) : '#26262b'
  const heroHasPoster = top?.movie.poster_url && !heroImgError

  const genreRows = useMemo(() => {
    const buckets = new Map()
    for (const m of allMovies) {
      const g = primaryGenre(m.genres)
      if (!buckets.has(g)) buckets.set(g, [])
      buckets.get(g).push(m)
    }
    return [...buckets.entries()]
      .filter(([, list]) => list.length >= 2)
      .slice(0, 3)
  }, [allMovies])

  return (
    <>
      <section className="ott-hero" style={{ '--hero-tint': heroTint }}>
        {heroHasPoster && (
          <img
            src={top.movie.poster_url}
            alt=""
            aria-hidden="true"
            className="ott-hero-backdrop"
            onError={() => setHeroImgError(true)}
          />
        )}
        <div className="ott-hero-scrim" />
        <div className="ott-hero-columns">
        <div className="ott-hero-inner">
          <div className="ott-hero-badge"><span className="dot" /> 지금 가장 평점 좋은 영화</div>
          {top ? (
            <>
              <h1 className="ott-hero-title">{top.movie.title}</h1>
              <div className="ott-hero-meta">
                <span>{top.movie.genres}{top.movie.year ? ` · ${top.movie.year}` : ''}</span>
                <span className="ott-hero-rating"><Star size={14} fill="currentColor" /> {top.avg_rating.toFixed(2)}</span>
                <span>평가 {top.rating_count}건</span>
              </div>
              {top.movie.overview && <p className="ott-hero-overview">{top.movie.overview}</p>}
            </>
          ) : (
            <h1 className="ott-hero-title">씨네매치</h1>
          )}

          {loading && <p style={{ color: 'rgba(255,255,255,0.8)' }}>불러오는 중...</p>}
          {error && (
            <div className="error-banner row">
              <span>{error}</span>
              <button className="btn btn-sm" onClick={load}>다시 시도</button>
            </div>
          )}

          {!loading && !error && (
            <form onSubmit={submit} className="hero-form">
              <select value={selected} onChange={e => setSelected(e.target.value)}>
                <option value="">회원 선택...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} (#{u.id})</option>)}
              </select>
              <button className="btn btn-primary" type="submit" disabled={!selected}>추천 받기</button>
              <Link to="/movies" className="btn btn-hero-secondary">영화 둘러보기</Link>
            </form>
          )}

          {!loading && !error && users.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 10, fontSize: 13 }}>
              등록된 회원이 없어요. <a href="/admin/users" style={{ color: '#fff', textDecoration: 'underline' }}>회원 관리</a>에서 먼저 등록해 주세요.
            </p>
          )}
        </div>

        {heroHasPoster && (
          <img src={top.movie.poster_url} alt={top.movie.title} className="ott-hero-poster" />
        )}
        </div>
      </section>

      {stats && (
        <div className="stat-inline-row">
          <div className="stat-inline"><div className="stat-inline-value">{stats.total_users}</div><div className="stat-inline-label">회원</div></div>
          <div className="stat-inline"><div className="stat-inline-value">{stats.total_movies}</div><div className="stat-inline-label">영화</div></div>
          <div className="stat-inline"><div className="stat-inline-value">{stats.total_ratings}</div><div className="stat-inline-label">평점</div></div>
          <div className="stat-inline"><div className="stat-inline-value">{stats.avg_rating != null ? stats.avg_rating.toFixed(2) : '—'}</div><div className="stat-inline-label">평균 평점</div></div>
        </div>
      )}

      <PosterRow title="지금 뜨는 콘텐츠" movies={trending.map(r => r.movie)} showRank linkTo="/trending" />

      {genreRows.map(([genre, movies]) => (
        <PosterRow key={genre} title={`${genre} 영화`} movies={movies} linkTo={`/movies?genre=${encodeURIComponent(genre)}`} />
      ))}
    </>
  )
}
