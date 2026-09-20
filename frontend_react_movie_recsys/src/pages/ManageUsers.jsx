import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { fetchUsers, createUser, updateUser, deleteUser } from '../api'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/EmptyState'
import { tintFor } from '../utils'

export default function ManageUsers(){
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const { notify } = useToast()

  async function load(searchTerm = q){
    setLoading(true)
    setError('')
    try {
      setUsers(await fetchUsers(searchTerm))
    } catch (e) {
      console.error(e)
      setError('회원 목록을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('') }, [])

  async function handleCreate(e){
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createUser(newName.trim())
      notify(`"${newName.trim()}" 회원을 등록했어요.`)
      setNewName('')
      load()
    } catch (e) {
      console.error(e)
      notify('회원 등록에 실패했어요.', 'error')
    }
  }

  function startEdit(u){
    setEditingId(u.id)
    setEditingName(u.name)
  }

  async function handleUpdate(id){
    if (!editingName.trim()) return
    try {
      await updateUser(id, editingName.trim())
      notify('회원 정보를 수정했어요.')
      setEditingId(null)
      load()
    } catch (e) {
      console.error(e)
      notify('회원 수정에 실패했어요.', 'error')
    }
  }

  async function handleDelete(u){
    if (!window.confirm(`"${u.name}" 회원을 삭제하면 평점 기록도 함께 삭제돼요. 계속할까요?`)) return
    try {
      await deleteUser(u.id)
      notify(`"${u.name}" 회원을 삭제했어요.`)
      load()
    } catch (e) {
      console.error(e)
      notify('회원 삭제에 실패했어요.', 'error')
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>회원 관리</h2>
        <p>회원을 등록·수정·삭제하고, 회원별 평점 기록으로 이동할 수 있어요.</p>
      </div>

      <form onSubmit={handleCreate} className="row" style={{ marginBottom: 12 }}>
        <input
          placeholder="새 회원 이름"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <button className="btn btn-primary" type="submit">회원 등록</button>
      </form>

      <form onSubmit={e => { e.preventDefault(); load(q) }} className="search-row">
        <div className="search-input-wrap" style={{ maxWidth: 260 }}>
          <Search size={15} />
          <input placeholder="이름으로 검색" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button className="btn" type="submit">검색</button>
      </form>

      {loading && <p>불러오는 중...</p>}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && users.length === 0 && <EmptyState title="등록된 회원이 없어요" description="위에서 첫 회원을 등록해 보세요." />}

      {!loading && users.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>이름</th>
                <th style={{ width: 90 }}>평점 수</th>
                <th style={{ width: 100 }}>평점</th>
                <th style={{ width: 160 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="hint">#{u.id}</td>
                  <td>
                    {editingId === u.id ? (
                      <input value={editingName} onChange={e => setEditingName(e.target.value)} />
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="avatar-chip" style={{ background: tintFor(u.name) }}>
                          {u.name?.[0]?.toUpperCase()}
                        </span>
                        {u.name}
                      </span>
                    )}
                  </td>
                  <td className="hint">{u.rating_count ?? 0}개</td>
                  <td><Link to={`/ratings/${u.id}`}>평점 보기</Link></td>
                  <td>
                    <div className="table-actions">
                      {editingId === u.id ? (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => handleUpdate(u.id)}>저장</button>
                          <button className="btn btn-sm" onClick={() => setEditingId(null)}>취소</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm" onClick={() => startEdit(u)}>수정</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)}>삭제</button>
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
