import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { searchMovies, createMovie, updateMovie, deleteMovie, fetchMovieRatingSummary } from '../api'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/EmptyState'
import { CardGridSkeleton } from '../components/Skeleton'
import { tintFor } from '../utils'

const EMPTY_FORM = { title: '', genres: '', overview: '', year: '', poster_url: '', popularity: '' }

export default function ManageMovies(){
  const [movies, setMovies] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [summaries, setSummaries] = useState({})
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('id')
  const { notify } = useToast()

  async function load(params = {}){
    setLoading(true)
    setError('')
    try {
      const { items, total: t } = await searchMovies({ q: q || undefined, sort, limit: 100, ...params })
      setMovies(items)
      setTotal(t)
    } catch (e) {
      console.error(e)
      setError('영화 목록을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sort])

  function toPayload(f){
    return {
      title: f.title.trim(),
      genres: f.genres.trim() || null,
      overview: f.overview.trim() || null,
      year: f.year ? Number(f.year) : null,
      poster_url: f.poster_url.trim() || null,
      popularity: f.popularity !== '' ? Number(f.popularity) : 0,
    }
  }

  async function handleSubmit(e){
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      if (editingId) {
        await updateMovie(editingId, toPayload(form))
        notify('영화 정보를 수정했어요.')
      } else {
        await createMovie(toPayload(form))
        notify(`"${form.title.trim()}" 영화를 등록했어요.`)
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      load()
    } catch (e) {
      console.error(e)
      notify(editingId ? '영화 수정에 실패했어요.' : '영화 등록에 실패했어요.', 'error')
    }
  }

  function startEdit(m){
    setEditingId(m.id)
    setForm({
      title: m.title || '',
      genres: m.genres || '',
      overview: m.overview || '',
      year: m.year ?? '',
      poster_url: m.poster_url || '',
      popularity: m.popularity ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit(){
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleDelete(m){
    if (!window.confirm(`"${m.title}"을(를) 삭제하면 관련 평점도 함께 삭제돼요. 계속할까요?`)) return
    try {
      await deleteMovie(m.id)
      notify(`"${m.title}"을(를) 삭제했어요.`)
      load()
    } catch (e) {
      console.error(e)
      notify('영화 삭제에 실패했어요.', 'error')
    }
  }

  async function handleCheckAverage(id){
    try {
      const summary = await fetchMovieRatingSummary(id)
      setSummaries(prev => ({ ...prev, [id]: summary }))
    } catch (e) {
      console.error(e)
      setSummaries(prev => ({ ...prev, [id]: { error: true } }))
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>영화 관리</h2>
        <p>영화를 등록·수정·삭제하고, 영화별 평균 평점을 조회할 수 있어요.</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <div className="field">
            <label>제목 *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="field">
            <label>장르</label>
            <input value={form.genres} onChange={e => setForm({ ...form, genres: e.target.value })} placeholder="Action, Drama" />
          </div>
          <div className="field">
            <label>연도</label>
            <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
          </div>
          <div className="field">
            <label>인기도 (popularity)</label>
            <input type="number" step="0.1" value={form.popularity} onChange={e => setForm({ ...form, popularity: e.target.value })} />
          </div>
          <div className="field form-row-full">
            <label>포스터 URL</label>
            <input value={form.poster_url} onChange={e => setForm({ ...form, poster_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="field form-row-full">
            <label>줄거리</label>
            <textarea rows={2} value={form.overview} onChange={e => setForm({ ...form, overview: e.target.value })} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">{editingId ? '수정 저장' : '영화 등록'}</button>
          {editingId && <button type="button" className="btn" onClick={cancelEdit}>취소</button>}
        </div>
      </form>

      <form onSubmit={e => { e.preventDefault(); load({ q }) }} className="search-row">
        <div className="search-input-wrap">
          <Search size={15} />
          <input placeholder="제목으로 검색" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="id">기본순</option>
          <option value="title">제목순</option>
          <option value="year">연도순</option>
          <option value="popularity">인기순</option>
        </select>
        <button className="btn btn-primary" type="submit">검색</button>
      </form>

      {!loading && !error && <p className="hint">전체 {total}개 영화</p>}

      {loading && <CardGridSkeleton count={4} />}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && movies.length === 0 && <EmptyState title="등록된 영화가 없어요" />}

      <div className="stack">
        {movies.map(m => (
          <div key={m.id} className="card admin-row">
            {m.poster_url ? (
              <img src={m.poster_url} alt={m.title} className="admin-row-thumb" />
            ) : (
              <div className="admin-row-thumb-fallback" style={{ background: tintFor(m.title) }}>
                {m.title?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="admin-row-body">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>#{m.id} {m.title}</strong>{' '}
                  <span className="hint">({m.genres}{m.year ? `, ${m.year}` : ''})</span>
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => startEdit(m)}>수정</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m)}>삭제</button>
                <button className="btn btn-sm" onClick={() => handleCheckAverage(m.id)}>평균 평점 조회</button>
              </div>
              {summaries[m.id] && (
                summaries[m.id].error ? (
                  <div className="hint" style={{ color: 'var(--rose)', marginTop: 6 }}>평점 정보를 불러오지 못했어요.</div>
                ) : (
                  <div className="hint" style={{ marginTop: 6 }}>
                    ⭐ 평균 {summaries[m.id].avg_rating != null ? summaries[m.id].avg_rating.toFixed(2) : '평점 없음'}
                    {' '}· 평가 {summaries[m.id].rating_count}건
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
