import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..recommender import recommend_for_user
from ..schemas import RecommendationOut

DEFAULT_LIMIT = int(os.getenv("DEFAULT_LIMIT", "12"))

router = APIRouter(prefix="/api", tags=["recommend"])

@router.get("/recommend", response_model=List[RecommendationOut])
def recommend(user_id: int, limit: int = DEFAULT_LIMIT, db: Session = Depends(get_db)):
    recs = recommend_for_user(db, user_id=user_id, limit=limit)
    if not recs:
        raise HTTPException(status_code=404, detail="No recommendations available")
    return recs
