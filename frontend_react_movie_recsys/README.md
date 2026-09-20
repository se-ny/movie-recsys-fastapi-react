# 씨네매치 (CineMatch) — Frontend

React 18 + Vite로 만든 영화 추천 웹앱 프론트엔드입니다. `backend_fastapi_movie_recsys` API 서버와 함께 동작합니다.

## 기술 스택

- React 18, react-router-dom
- Vite
- axios
- lucide-react (아이콘)

## 폴더 구조

```
src/
├── api.js                 # 백엔드 API 호출 함수 모음
├── utils.js                # 포스터 색상 틴트, 대표 장르 추출 등 공용 헬퍼
├── App.jsx                 # 라우트 정의
├── main.jsx
├── components/
│   ├── Layout.jsx           # 사이드바 네비게이션 + 다크/라이트 테마 토글
│   ├── MovieCard.jsx         # 포스터 카드 (랭킹 배지, 점수/평점 표시, 별점 등록)
│   ├── EmptyState.jsx
│   └── Skeleton.jsx          # 로딩 스켈레톤
├── context/
│   └── ToastContext.jsx      # 전역 토스트 알림
├── pages/
│   ├── Login.jsx             # 홈 — 히어로 배너, 장르별 포스터 랙, 회원 선택
│   ├── Movies.jsx            # 영화 둘러보기 — 검색/정렬/페이지네이션
│   ├── Recommendations.jsx   # AI 추천 (콘텐츠+협업 필터링 하이브리드)
│   ├── SimilarMovies.jsx     # 비슷한 영화
│   ├── Trending.jsx          # 실시간 평점 랭킹
│   ├── ManageUsers.jsx       # 회원 관리 (CRUD)
│   ├── ManageMovies.jsx      # 영화 관리 (CRUD)
│   └── UserRatings.jsx       # 회원별 평점 CRUD + CSV 내보내기
└── styles/
    └── theme.css             # 다크 OTT 스타일 디자인 시스템 (레드 브랜드 컬러)
```

## 설치 및 실행

```powershell
cd frontend_react_movie_recsys
npm install
npm run dev
```

브라우저에서 `http://localhost:5175` 접속.

## 백엔드 연결

먼저 `backend_fastapi_movie_recsys`를 `http://127.0.0.1:9000`에서 실행해두어야 합니다 (별도 터미널).

`api.js`의 기본 API 주소가 `http://127.0.0.1:9000`으로 이미 지정되어 있어서, `.env` 파일 없이도 정상 동작합니다. `vite.config.js`의 `/api` 프록시 설정도 9000번 포트를 바라봅니다.

다른 포트나 주소를 쓰고 싶다면 `.env.example`을 복사해 `.env`를 만들고 `VITE_API_BASE` 값을 원하는 주소로 바꾸세요.

## 주요 화면

| 경로 | 설명 |
|---|---|
| `/` | 홈 — 트렌딩 1위 영화 히어로 배너(포스터 배경), 회원 선택, 장르별 포스터 랙 |
| `/recommendations` | 선택한 회원 기준 AI 추천 (순위, 점수, 추천 사유 표시) |
| `/movies` | 영화 둘러보기 — 제목/장르 검색, 정렬, 더 보기 페이지네이션 |
| `/movies/:movieId/similar` | 콘텐츠 유사도 기준 비슷한 영화 |
| `/trending` | 실제 사용자 평점 평균 기준 랭킹 (포스터 랭킹 월) |
| `/admin/users` | 회원 관리 — 등록/수정/삭제 |
| `/admin/movies` | 영화 관리 — 등록/수정/삭제, 평균 평점 조회 |
| `/ratings/:userId` | 회원별 평점 조회/등록/수정/삭제, CSV 내보내기 |

## 스크립트

```powershell
npm run dev       # 개발 서버 (기본 5175 포트)
npm run build     # 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
```

## 디자인

`theme.css`에 다크 톤 + 레드 브랜드 컬러 기반 디자인 시스템이 정의되어 있습니다. 포스터가 주가 되는 그리드형 카드, 랭킹 배지, 히어로 배너, 장르 칩 등 국내 영화 예매 사이트(CGV, 롯데시네마, 메가박스)의 UI 패턴을 참고해 구성했습니다.