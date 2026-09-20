from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Movie, Rating
from ..schemas import StatsOut

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    """대시보드용 요약 통계 (회원수/영화수/평점수/전체 평균 평점)."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_movies = db.query(func.count(Movie.id)).scalar() or 0
    total_ratings = db.query(func.count(Rating.user_id)).scalar() or 0
    avg_rating = db.query(func.avg(Rating.rating)).scalar()
    return {
        "total_users": total_users,
        "total_movies": total_movies,
        "total_ratings": total_ratings,
        "avg_rating": float(avg_rating) if avg_rating is not None else None,
    }
