from pydantic import BaseModel, Field
from typing import Optional, List

class MovieOut(BaseModel):
    id: int
    title: str
    genres: Optional[str] = None
    overview: Optional[str] = None
    year: Optional[int] = None
    poster_url: Optional[str] = None
    popularity: Optional[float] = 0

    class Config:
        from_attributes = True

class MovieIn(BaseModel):
    """영화 등록(입력)용."""
    title: str
    genres: Optional[str] = None
    overview: Optional[str] = None
    year: Optional[int] = None
    poster_url: Optional[str] = None
    popularity: Optional[float] = 0.0

class MovieUpdate(BaseModel):
    """영화 수정용 — 넘어온 필드만 반영."""
    title: Optional[str] = None
    genres: Optional[str] = None
    overview: Optional[str] = None
    year: Optional[int] = None
    poster_url: Optional[str] = None
    popularity: Optional[float] = None

class UserOut(BaseModel):
    id: int
    name: str
    rating_count: Optional[int] = None
    class Config:
        from_attributes = True

class UserIn(BaseModel):
    """회원 등록(입력)용."""
    name: str

class UserUpdate(BaseModel):
    """회원 수정용."""
    name: Optional[str] = None

class RatingIn(BaseModel):
    movie_id: int
    rating: float = Field(ge=0, le=5)

class RatingUpdate(BaseModel):
    rating: float = Field(ge=0, le=5)

class RatingOut(BaseModel):
    user_id: int
    movie_id: int
    rating: float

    class Config:
        from_attributes = True

class UserRatingDetailOut(BaseModel):
    """회원별 (영화번호, 영화이름, 평점) 조회용."""
    movie_id: int
    movie_title: str
    rating: float

class RecommendationOut(BaseModel):
    movie: MovieOut
    score: float
    source: Optional[str] = None
    reason: Optional[str] = None

class SimilarMovieOut(BaseModel):
    movie: MovieOut
    similarity: float

class TrendingMovieOut(BaseModel):
    movie: MovieOut
    avg_rating: float
    rating_count: int

class MovieRatingSummaryOut(BaseModel):
    """영화별 평점 평균 검색용."""
    movie: MovieOut
    avg_rating: Optional[float] = None
    rating_count: int = 0

class StatsOut(BaseModel):
    """대시보드 요약 통계."""
    total_users: int
    total_movies: int
    total_ratings: int
    avg_rating: Optional[float] = None
