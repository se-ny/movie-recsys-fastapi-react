# FastAPI Movie Recommender (MySQL)

## 1) Setup with uv and requirements.txt
```powershell
cd backend_fastapi_movie_recsys
uv python install 3.13
uv venv --python 3.13 .venv
.\.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
Copy-Item .env.example .env
```

This dependency set requires Python 3.12 or newer.

`.env` defaults:
```env
DB_USER=fastapiid
DB_PASSWORD=fastapipw
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=moviesdb
DEFAULT_LIMIT=12
```

## 2) Setup with uv sync
This project now includes `pyproject.toml`, so you can install dependencies with `uv sync` instead of `uv pip install`.

```powershell
cd backend_fastapi_movie_recsys
uv python install 3.13
uv venv --python 3.13 .venv
uv sync
Copy-Item .env.example .env
```

If you prefer activating the virtual environment first:
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 9000
```

If PowerShell activation is blocked or you want the most stable direct command on Windows:
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 9000
```

## 3) MySQL
Create the database, tables, and sample data:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS moviesdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p moviesdb < sql/schema.sql
mysql -u root -p moviesdb < sql/seed.sql
```

Database tables are created by `sql/schema.sql`. The API process still needs the database connection for endpoints that query MySQL.

## 4) Run
Recommended run command on Windows:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 9000
```

If activation works in your shell, this is also fine:
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 9000
```

Open:
- `http://127.0.0.1:9000/`
- `http://127.0.0.1:9000/docs` (Swagger UI — every endpoint below can be tried here directly)

## 5) API

### 영화 (Movies) — `/api/movies`
| Method | Path | 설명 | 요청 바디 | 응답 |
|---|---|---|---|---|
| GET | `/api/movies` | 목록 조회 — 검색(`q`, `genre`), 정렬(`sort`, `order`), 페이지네이션(`skip`, `limit`) | - | `MovieOut[]` (+ `X-Total-Count` 헤더) |
| GET | `/api/movies/trending` | 실제 사용자 평점 평균 기준 랭킹 (`limit`) | - | `TrendingMovieOut[]` (`movie`, `avg_rating`, `rating_count`) |
| GET | `/api/movies/{movie_id}` | 단일 영화 조회 | - | `MovieOut` |
| POST | `/api/movies` | 영화 등록 | `MovieIn` | `MovieOut` (201) |
| PUT | `/api/movies/{movie_id}` | 영화 수정 (부분 수정 가능) | `MovieUpdate` | `MovieOut` |
| DELETE | `/api/movies/{movie_id}` | 영화 삭제 (평점도 cascade 삭제) | - | 204 |
| GET | `/api/movies/{movie_id}/rating-summary` | 영화별 평점 평균 검색 | - | `MovieRatingSummaryOut` (`movie`, `avg_rating`, `rating_count`) |
| GET | `/api/movies/{movie_id}/similar` | 콘텐츠(장르·줄거리) 기준 유사 영화 (`limit`) | - | `SimilarMovieOut[]` (`movie`, `similarity`) |

### 회원 (Users) — `/api/users`
| Method | Path | 설명 | 요청 바디 | 응답 |
|---|---|---|---|---|
| GET | `/api/users` | 회원 목록 (이름 검색 `q`, 평점 개수 포함) | - | `UserOut[]` |
| GET | `/api/users/{user_id}` | 단일 회원 조회 | - | `UserOut` |
| POST | `/api/users` | 회원 등록 | `UserIn` | `UserOut` (201) |
| PUT | `/api/users/{user_id}` | 회원 정보 수정 | `UserUpdate` | `UserOut` |
| DELETE | `/api/users/{user_id}` | 회원 삭제 (평점도 cascade 삭제) | - | 204 |

### 회원의 영화별 평점 (Ratings) — `/api/users/{user_id}/ratings`
| Method | Path | 설명 | 요청 바디 | 응답 |
|---|---|---|---|---|
| GET | `/api/users/{user_id}/ratings` | 회원별 (영화번호/영화이름/평점) 조회 | - | `UserRatingDetailOut[]` |
| GET | `/api/users/{user_id}/ratings/export` | 평점 기록을 CSV 파일로 다운로드 | - | CSV 파일 |
| GET | `/api/users/{user_id}/ratings/{movie_id}` | 특정 영화 평점 단건 조회 | - | `RatingOut` |
| POST | `/api/users/{user_id}/ratings` | 평점 등록 (이미 있으면 자동 갱신 — upsert) | `RatingIn` | `RatingOut` (201) |
| PUT | `/api/users/{user_id}/ratings/{movie_id}` | 기존 평점만 명시적으로 수정 (없으면 404) | `RatingUpdate` | `RatingOut` |
| DELETE | `/api/users/{user_id}/ratings/{movie_id}` | 평점 삭제 | - | 204 |

### 추천 (Recommend) — `/api/recommend`
| Method | Path | 설명 | 응답 |
|---|---|---|---|
| GET | `/api/recommend?user_id=&limit=` | 콘텐츠 기반(TF-IDF) + 협업 필터링을 블렌딩한 개인화 추천. 평점 기록이 없는 회원은 인기도 기반으로 대체 | `RecommendationOut[]` (`movie`, `score`, `source`, `reason`) |

`source`는 `content`(콘텐츠 유사도) / `collaborative`(협업 필터링) / `popularity`(인기도 대체) 중 하나이고, `reason`은 왜 이 영화가 추천됐는지에 대한 한 줄 설명입니다.

### 통계 (Stats) — `/api/stats`
| Method | Path | 설명 | 응답 |
|---|---|---|---|
| GET | `/api/stats` | 대시보드용 요약 통계 | `StatsOut` (`total_users`, `total_movies`, `total_ratings`, `avg_rating`) |

### 추천 로직 요약
`recommend_for_user()`는 콘텐츠 기반 추천(`ContentRecommender`, TF-IDF + 코사인 유사도)과 협업 필터링(`CollaborativeRecommender`, item-based, 평점 행렬 코사인 유사도)의 점수를 각각 정규화한 뒤 `콘텐츠 0.5 : 협업 0.4 : 인기도 0.1` 비율로 블렌딩합니다. 평점 기록이 전혀 없는 회원은 콜드 스타트로 인기도 순위를 그대로 보여줍니다.

## 6) 테스트
pytest 기반 테스트가 `tests/`에 있습니다. 실제 MySQL 대신 인메모리 SQLite로 `app.db.get_db`를 오버라이드해서 동작하므로, 로컬 MySQL 없이도 실행할 수 있습니다.

```powershell
.\.venv\Scripts\Activate.ps1
pytest
```

또는 개발 의존성을 설치한 뒤:
```powershell
uv sync --group dev
uv run pytest
```
