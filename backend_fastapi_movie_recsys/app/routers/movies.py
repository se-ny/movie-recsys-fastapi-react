from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, asc, desc
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Movie, Rating
from ..schemas import (
    MovieOut, MovieIn, MovieUpdate,
    SimilarMovieOut, TrendingMovieOut, MovieRatingSummaryOut,
)
from ..recommender import similar_movies

router = APIRouter(prefix="/api/movies", tags=["movies"])

SORT_FIELDS = {
    "id": Movie.id,
    "title": Movie.title,
    "year": Movie.year,
    "popularity": Movie.popularity,
}


# ---------------- 조회 (목록 검색 / 정렬 / 페이지네이션 / 트렌딩) ----------------
# 주의: 리터럴 경로("/trending")는 파라미터 경로("/{movie_id}")보다 먼저 등록해야
# "/api/movies/trending" 요청이 movie_id=trending으로 오인되지 않음.

@router.get("", response_model=List[MovieOut])
def list_movies(
    response: Response,
    skip: int = 0,
    limit: int = Query(50, le=200),
    q: Optional[str] = Query(None, description="제목 부분 검색"),
    genre: Optional[str] = Query(None, description="장르 부분 검색"),
    sort: str = Query("id", description="정렬 기준: id | title | year | popularity"),
    order: str = Query("asc", description="asc | desc"),
    db: Session = Depends(get_db),
):
    query = db.query(Movie)
    if q:
        query = query.filter(Movie.title.ilike(f"%{q}%"))
    if genre:
        query = query.filter(Movie.genres.ilike(f"%{genre}%"))

    total = query.count()
    response.headers["X-Total-Count"] = str(total)

    sort_col = SORT_FIELDS.get(sort, Movie.id)
    order_fn = desc if order == "desc" else asc
    query = query.order_by(order_fn(sort_col))

    return query.offset(skip).limit(limit).all()


@router.get("/trending", response_model=List[TrendingMovieOut])
def trending_movies(limit: int = Query(10, le=100), db: Session = Depends(get_db)):
    rows = (
        db.query(
            Movie,
            func.avg(Rating.rating).label("avg_rating"),
            func.count(Rating.rating).label("rating_count"),
        )
        .join(Rating, Rating.movie_id == Movie.id)
        .group_by(Movie.id)
        .order_by(func.avg(Rating.rating).desc(), func.count(Rating.rating).desc())
        .limit(limit)
        .all()
    )
    return [
        {"movie": MovieOut.model_validate(m), "avg_rating": float(avg), "rating_count": int(cnt)}
        for m, avg, cnt in rows
    ]


# ---------------- 영화 CRUD (입력 / 수정 / 삭제 / 조회) ----------------

@router.get("/{movie_id}", response_model=MovieOut)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@router.post("", response_model=MovieOut, status_code=201)
def create_movie(payload: MovieIn, db: Session = Depends(get_db)):
    movie = Movie(**payload.model_dump())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@router.put("/{movie_id}", response_model=MovieOut)
def update_movie(movie_id: int, payload: MovieUpdate, db: Session = Depends(get_db)):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(movie, field, value)
    db.commit()
    db.refresh(movie)
    return movie


@router.delete("/{movie_id}", status_code=204)
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    db.delete(movie)  # ratings cascade 삭제
    db.commit()
    return Response(status_code=204)


# ---------------- 영화별 평점 평균 검색 ----------------

@router.get("/{movie_id}/rating-summary", response_model=MovieRatingSummaryOut)
def movie_rating_summary(movie_id: int, db: Session = Depends(get_db)):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    avg, cnt = (
        db.query(func.avg(Rating.rating), func.count(Rating.rating))
        .filter(Rating.movie_id == movie_id)
        .one()
    )
    return {
        "movie": MovieOut.model_validate(movie),
        "avg_rating": float(avg) if avg is not None else None,
        "rating_count": int(cnt or 0),
    }


# ---------------- 비슷한 영화 (기존 추가 기능 유지) ----------------

@router.get("/{movie_id}/similar", response_model=List[SimilarMovieOut])
def get_similar_movies(movie_id: int, limit: int = Query(10, le=50), db: Session = Depends(get_db)):
    results = similar_movies(db, movie_id=movie_id, limit=limit)
    if not results:
        raise HTTPException(status_code=404, detail="No similar movies found")
    return [{"movie": MovieOut.model_validate(m), "similarity": float(s)} for m, s in results]
