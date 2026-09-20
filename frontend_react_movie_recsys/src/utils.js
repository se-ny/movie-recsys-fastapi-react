// 포스터가 없는 영화에 붙일 그라디언트 색상을 제목 기반으로 고정 배정하는 헬퍼.
// 같은 영화는 항상 같은 색이 나오도록 간단한 해시를 사용한다.
const TINT_PALETTE = ['#7A2E33', '#1E3A5F', '#5B3A29', '#2F5233', '#5C3D6B', '#7A4B12', '#284B54']

export function hashTitle(str = ''){
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

export function tintFor(title){
  return TINT_PALETTE[hashTitle(title) % TINT_PALETTE.length]
}

export function primaryGenre(genres = ''){
  return genres.split(',')[0]?.trim() || '기타'
}
