import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:9000'

const api = axios.create({ baseURL: BASE_URL })

// ---------------- 대시보드 ----------------
export async function fetchStats(){
  const { data } = await api.get('/api/stats')
  return data
}

// ---------------- 회원 CRUD / 검색 ----------------
export async function fetchUsers(q){
  const { data } = await api.get('/api/users', { params: { q: q || undefined } })
  return data
}
export async function fetchUser(userId){
  const { data } = await api.get(`/api/users/${userId}`)
  return data
}
export async function createUser(name){
  const { data } = await api.post('/api/users', { name })
  return data
}
export async function updateUser(userId, name){
  const { data } = await api.put(`/api/users/${userId}`, { name })
  return data
}
export async function deleteUser(userId){
  await api.delete(`/api/users/${userId}`)
}

// ---------------- 영화 CRUD / 검색 / 정렬 / 페이지네이션 ----------------
export async function searchMovies({ q, genre, sort = 'id', order = 'asc', skip = 0, limit = 24 } = {}){
  const res = await api.get('/api/movies', { params: { q, genre, sort, order, skip, limit } })
  const total = Number(res.headers['x-total-count'] ?? res.data.length)
  return { items: res.data, total }
}
export async function fetchMovie(movieId){
  const { data } = await api.get(`/api/movies/${movieId}`)
  return data
}
export async function createMovie(payload){
  const { data } = await api.post('/api/movies', payload)
  return data
}
export async function updateMovie(movieId, payload){
  const { data } = await api.put(`/api/movies/${movieId}`, payload)
  return data
}
export async function deleteMovie(movieId){
  await api.delete(`/api/movies/${movieId}`)
}

// ---------------- 회원의 영화별 평점 CRUD ----------------
export async function fetchUserRatings(userId){
  const { data } = await api.get(`/api/users/${userId}/ratings`)
  return data
}
export async function submitRating(userId, movieId, rating){
  const { data } = await api.post(`/api/users/${userId}/ratings`, { movie_id: movieId, rating })
  return data
}
export async function updateRating(userId, movieId, rating){
  const { data } = await api.put(`/api/users/${userId}/ratings/${movieId}`, { rating })
  return data
}
export async function deleteRating(userId, movieId){
  await api.delete(`/api/users/${userId}/ratings/${movieId}`)
}
export function ratingsExportUrl(userId){
  return `${BASE_URL}/api/users/${userId}/ratings/export`
}

// ---------------- 영화별 평점 평균 검색 ----------------
export async function fetchMovieRatingSummary(movieId){
  const { data } = await api.get(`/api/movies/${movieId}/rating-summary`)
  return data
}

// ---------------- 추천 / 유사영화 / 트렌딩 ----------------
export async function fetchRecommendations(userId, limit=12){
  const { data } = await api.get('/api/recommend', { params: { user_id: userId, limit } })
  return data
}
export async function fetchSimilarMovies(movieId, limit = 10){
  const { data } = await api.get(`/api/movies/${movieId}/similar`, { params: { limit } })
  return data
}
export async function fetchTrending(limit = 10){
  const { data } = await api.get('/api/movies/trending', { params: { limit } })
  return data
}

export default api
