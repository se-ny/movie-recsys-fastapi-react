# 씨네매치 (CineMatch) — Movie Recommender

FastAPI + MySQL 백엔드와 React(Vite) 프론트엔드로 구성된 영화 추천 웹 서비스입니다.

## 폴더 구조

```
movie-recsys-fastapi-react/
├── backend_fastapi_movie_recsys/   # FastAPI + MySQL API 서버
└── frontend_react_movie_recsys/    # React + Vite 프론트엔드
```

각 폴더의 상세한 설치·실행 방법은 폴더 안의 README를 참고하세요.
- [backend_fastapi_movie_recsys/README.md](./backend_fastapi_movie_recsys/README.md) — 설치, MySQL 세팅, 실행 명령어, 전체 API 목록
- [frontend_react_movie_recsys/README.md](./frontend_react_movie_recsys/README.md) — 설치, 실행, 화면 구성, 폴더 구조

## 기술 스택

| | |
|---|---|
| 백엔드 | FastAPI, SQLAlchemy, PyMySQL, scikit-learn |
| 프론트엔드 | React 18, Vite, react-router-dom, axios |
| DB | MySQL |

## 주요 기능

- 회원 CRUD, 영화 CRUD
- 회원의 영화별 평점 등록·수정·삭제 (CSV 내보내기 포함)
- 회원별 (영화번호/영화이름/평점) 조회
- 영화별 평점 평균 검색
- 콘텐츠 기반(TF-IDF) + 협업 필터링을 블렌딩한 하이브리드 개인화 추천
- 실시간 평점 기준 트렌딩, 콘텐츠 유사도 기반 유사 영화 추천
- 제목/장르 검색, 정렬, 페이지네이션

## 빠른 시작

```powershell
# 1) 백엔드
cd backend_fastapi_movie_recsys
uv sync
Copy-Item .env.example .env
uv run uvicorn app.main:app --reload --port 9000

# 2) 프론트엔드 (다른 터미널)
cd frontend_react_movie_recsys
npm install
npm run dev
```

자세한 내용(환경변수, MySQL 스키마·시드 데이터, 전체 API 명세)은 [backend_fastapi_movie_recsys/README.md](./backend_fastapi_movie_recsys/README.md)를,
프론트엔드 화면 구성과 폴더 구조는 [frontend_react_movie_recsys/README.md](./frontend_react_movie_recsys/README.md)를 참고하세요.