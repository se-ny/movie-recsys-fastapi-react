from typing import List, Optional
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Rating, Movie
from ..schemas import (
    UserOut, UserIn, UserUpdate,
    RatingIn, RatingOut, RatingUpdate, UserRatingDetailOut,
)

router = APIRouter(prefix="/api/users", tags=["users"])


# ---------------- 회원 CRUD (입력 / 수정 / 삭제 / 조회) ----------------

@router.get("", response_model=List[UserOut])
def list_users(q: Optional[str] = Query(None, description="이름 부분 검색"), db: Session = Depends(get_db)):
    query = (
        db.query(User, func.count(Rating.movie_id).label("rating_count"))
        .outerjoin(Rating, Rating.user_id == User.id)
        .group_by(User.id)
    )
    if q:
        query = query.filter(User.name.ilike(f"%{q}%"))
    rows = query.order_by(User.id).all()
    return [{"id": u.id, "name": u.name, "rating_count": int(cnt)} for u, cnt in rows]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserIn, db: Session = Depends(get_db)):
    user = User(name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.name is not None:
        user.name = payload.name
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)  # ratings cascade 삭제 (models.py 관계 설정에 따름)
    db.commit()
    return Response(status_code=204)


# ---------------- 회원의 영화별 평점 CRUD ----------------

@router.get("/{user_id}/ratings", response_model=List[UserRatingDetailOut])
def get_user_ratings(user_id: int, db: Session = Depends(get_db)):
    """회원별로 (영화번호, 영화이름, 평점) 조회."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    rows = (
        db.query(Rating.movie_id, Movie.title, Rating.rating)
        .join(Movie, Movie.id == Rating.movie_id)
        .filter(Rating.user_id == user_id)
        .order_by(Rating.movie_id)
        .all()
    )
    return [{"movie_id": mid, "movie_title": title, "rating": rating} for mid, title, rating in rows]


@router.get("/{user_id}/ratings/export")
def export_user_ratings(user_id: int, db: Session = Depends(get_db)):
    """회원의 평점 기록을 CSV 파일로 내보내기."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    rows = (
        db.query(Rating.movie_id, Movie.title, Rating.rating)
        .join(Movie, Movie.id == Rating.movie_id)
        .filter(Rating.user_id == user_id)
        .order_by(Rating.movie_id)
        .all()
    )
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["movie_id", "movie_title", "rating"])
    for mid, title, rating in rows:
        writer.writerow([mid, title, rating])
    buffer.seek(0)
    filename = f"user_{user_id}_ratings.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{user_id}/ratings/{movie_id}", response_model=RatingOut)
def get_rating(user_id: int, movie_id: int, db: Session = Depends(get_db)):
    r = db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == movie_id).one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Rating not found")
    return r


@router.post("/{user_id}/ratings", response_model=RatingOut, status_code=201)
def upsert_rating(user_id: int, payload: RatingIn, db: Session = Depends(get_db)):
    """평점 등록. 이미 있으면 갱신(간편 등록/수정 겸용)."""
    user = db.get(User, user_id)
    movie = db.get(Movie, payload.movie_id)
    if not user or not movie:
        raise HTTPException(status_code=404, detail="User or movie not found")
    r = db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == payload.movie_id).one_or_none()
    if r:
        r.rating = payload.rating
    else:
        r = Rating(user_id=user_id, movie_id=payload.movie_id, rating=payload.rating)
        db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/{user_id}/ratings/{movie_id}", response_model=RatingOut)
def update_rating(user_id: int, movie_id: int, payload: RatingUpdate, db: Session = Depends(get_db)):
    """이미 존재하는 평점만 명시적으로 수정."""
    r = db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == movie_id).one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Rating not found. Use POST to create one.")
    r.rating = payload.rating
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{user_id}/ratings/{movie_id}", status_code=204)
def delete_rating(user_id: int, movie_id: int, db: Session = Depends(get_db)):
    r = db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == movie_id).one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Rating not found")
    db.delete(r)
    db.commit()
    return Response(status_code=204)
