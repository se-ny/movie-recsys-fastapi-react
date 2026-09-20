import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchUser, fetchUserRatings, submitRating, updateRating, deleteRating, ratingsExportUrl } from '../api'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/EmptyState'

export default function UserRatings(){
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMovieId, setNewMovieId] = useState('')
  const [newRating, setNewRating] = useState('')
  const [editing, setEditing] = useState({})
  const { notify } = useToast()

  async function load(){
    setLoading(true)
    setError('')
    try {
      const [u, r] = await Promise.all([fetchUser(userId), fetchUserRatings(userId)])
      setUser(u)
      setRatings(r)
    } catch (e) {
      console.error(e)
      setError('평점 정보를 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  async function handleAdd(e){
    e.preventDefault()
    if (!newMovieId || !newRating) return
    try {
      await submitRating(userId, Number(newMovieId), Number(newRating))
      notify('평점을 등록했어요.')
      setNewMovieId('')
      setNewRating('')
      load()
    } catch (e) {
      console.error(e)
      notify('평점 등록에 실패했어요. 영화번호를 확인해 주세요.', 'error')
    }
  }

  async function handleUpdate(movieId){
    const value = editing[movieId]
    if (value === undefined || value === '') return
    try {
      await updateRating(userId, movieId, Number(value))
      notify('평점을 수정했어요.')
      setEditing(prev => { const next = { ...prev }; delete next[movieId]; return next })
      load()
    } catch (e) {
      console.error(e)
      notify('평점 수정에 실패했어요.', 'error')
    }
  }

  async function handleDelete(movieId, title){
    if (!window.confirm(`"${title}" 평점을 삭제할까요?`)) return
    try {
      await deleteRating(userId, movieId)
      notify('평점을 삭제했어요.')
      load()
    } catch (e) {
      console.error(e)
      notify('평점 삭제에 실패했어요.', 'error')
    }
  }

  return (
    <>
      <p><Link to="/admin/users">← 회원 관리로</Link></p>
      <div className="page-header row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{user ? `${user.name}님의 평점` : `회원 #${userId}의 평점`}</h2>
          <p>영화번호와 평점을 등록하면 아래 표에 영화 이름과 함께 표시돼요.</p>
        </div>
        {ratings.length > 0 && (
          <a className="btn btn-sm" href={ratingsExportUrl(userId)} download>
            ⬇ CSV로 내보내기
          </a>
        )}
      </div>

      <form onSubmit={handleAdd} className="row" style={{ marginBottom: 20 }}>
        <div className="field" style={{ width: 120 }}>
          <label>영화번호</label>
          <input type="number" value={newMovieId} onChange={e => setNewMovieId(e.target.value)} />
        </div>
        <div className="field" style={{ width: 120 }}>
          <label>평점 (0~5)</label>
          <input type="number" step="0.5" min="0" max="5" value={newRating} onChange={e => setNewRating(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-end' }}>평점 등록</button>
      </form>

      {loading && <p>불러오는 중...</p>}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && ratings.length === 0 && <EmptyState title="등록된 평점이 없어요" />}

      {!loading && ratings.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>영화번호</th>
                <th>영화이름</th>
                <th style={{ width: 100 }}>평점</th>
                <th style={{ width: 160 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map(r => (
                <tr key={r.movie_id}>
                  <td className="hint">#{r.movie_id}</td>
                  <td>{r.movie_title}</td>
                  <td>
                    {editing[r.movie_id] !== undefined ? (
                      <input
                        type="number" step="0.5" min="0" max="5"
                        value={editing[r.movie_id]}
                        onChange={e => setEditing(prev => ({ ...prev, [r.movie_id]: e.target.value }))}
                        style={{ width: 70 }}
                      />
                    ) : `⭐ ${r.rating}`}
                  </td>
                  <td>
                    <div className="table-actions">
                      {editing[r.movie_id] !== undefined ? (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => handleUpdate(r.movie_id)}>저장</button>
                          <button className="btn btn-sm" onClick={() => setEditing(prev => { const n = { ...prev }; delete n[r.movie_id]; return n })}>취소</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm" onClick={() => setEditing(prev => ({ ...prev, [r.movie_id]: r.rating }))}>수정</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.movie_id, r.movie_title)}>삭제</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
