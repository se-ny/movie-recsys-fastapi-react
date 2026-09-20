import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchMovies } from '../api'
import MovieCard from '../components/MovieCard'
import { CardGridSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const PAGE_SIZE = 12

export default function Movies(){
  const [searchParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState(searchParams.get('genre') || '')
  const [sort, setSort] = useState('id')
  const [order, setOrder] = useState('asc')
  const [movies, setMovies] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const userId = sessionStorage.getItem('user_id')

  async function load({ reset = true, genreOverride } = {}){
    const skip = reset ? 0 : movies.length
    reset ? setLoading(true) : setLoadingMore(true)
    setError('')
    try {
      const g = genreOverride !== undefined ? genreOverride : genre
      const { items, total: t } = await searchMovies({
        q: q || undefined, genre: g || undefined, sort, order, skip, limit: PAGE_SIZE,
      })
      setMovies(prev => (reset ? items : [...prev, ...items]))
      setTotal(t)
    } catch (e) {
      console.error(e)
      setError('영화 목록을 불러오지 못했어요.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    const urlGenre = searchParams.get('genre') || ''
    setGenre(urlGenre)
    load({ reset: true, genreOverride: urlGenre })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sort, order])

  function handleSubmit(e){
    e.preventDefault()
    load({ reset: true })
  }

  return (
    <>
      <div className="page-header">
        <h2>영화 둘러보기</h2>
        <p>제목·장르로 검색하고, 정렬 기준을 바꿔가며 카탈로그를 탐색할 수 있어요.</p>
      </div>

      <form onSubmit={handleSubmit} className="search-row">
        <div className="search-input-wrap">
          <Search size={15} />
          <input placeholder="제목 검색" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <input placeholder="장르 (예: Action)" value={genre} onChange={e => setGenre(e.target.value)} style={{ maxWidth: 200 }} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="id">기본순</option>
          <option value="title">제목순</option>
          <option value="year">연도순</option>
          <option value="popularity">인기순</option>
        </select>
        <select value={order} onChange={e => setOrder(e.target.value)} style={{ maxWidth: 110 }}>
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
        <button className="btn btn-primary" type="submit">검색</button>
      </form>

      {loading && <CardGridSkeleton count={6} />}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && movies.length === 0 && <EmptyState title="조건에 맞는 영화가 없어요" />}

      <div className="card-grid">
        {movies.map(m => <MovieCard key={m.id} movie={m} userId={userId} />)}
      </div>

      {!loading && !error && movies.length > 0 && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
          {movies.length < total ? (
            <button className="btn" onClick={() => load({ reset: false })} disabled={loadingMore}>
              {loadingMore ? '불러오는 중...' : `더 보기 (${movies.length}/${total})`}
            </button>
          ) : (
            <span className="hint">전체 {total}개 중 {movies.length}개 표시됨</span>
          )}
        </div>
      )}
    </>
  )
}
