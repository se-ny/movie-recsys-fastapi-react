from __future__ import annotations
from typing import List, Tuple, Dict, Optional
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .models import Movie, Rating


class ContentRecommender:
    """장르/줄거리 텍스트 기반 콘텐츠 추천 엔진 (기존 TF-IDF 로직)."""

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=20000,
            ngram_range=(1, 2)
        )
        self.movie_ids: List[int] = []
        self.tfidf_matrix = None
        self.feature_names: List[str] = []

    def _build_corpus_row(self, m: Movie) -> str:
        fields = [m.title or "", m.genres or "", (m.overview or "")]
        return " ".join(fields)

    def fit(self, movies: List[Movie]):
        self.movie_ids = [m.id for m in movies]
        corpus = [self._build_corpus_row(m) for m in movies]
        if len(corpus) == 0:
            self.tfidf_matrix = None
            self.feature_names = []
        else:
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
            self.feature_names = list(self.vectorizer.get_feature_names_out())

    def _index_of(self, movie_id: int) -> Optional[int]:
        try:
            return self.movie_ids.index(movie_id)
        except ValueError:
            return None

    def scores_for_movies(self, liked_movie_ids: List[int], weights: List[float] | None = None) -> Dict[int, float]:
        if self.tfidf_matrix is None or not self.movie_ids:
            return {}
        id_to_index = {mid: idx for idx, mid in enumerate(self.movie_ids)}
        indices = [id_to_index[mid] for mid in liked_movie_ids if mid in id_to_index]
        if not indices:
            return {}
        sims = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix[indices])
        if weights is None:
            weights = [1.0] * len(indices)
        w = np.array(weights) / (np.sum(weights) + 1e-12)
        scores = sims @ w
        result = {mid: float(scores[i]) for i, mid in enumerate(self.movie_ids)}
        for mid in liked_movie_ids:
            result.pop(mid, None)
        return result

    def similar_to(self, movie_id: int, top_n: int = 10) -> List[Tuple[int, float]]:
        """단일 영화 기준 콘텐츠 유사 영화 (item-to-item)."""
        idx = self._index_of(movie_id)
        if idx is None or self.tfidf_matrix is None:
            return []
        sims = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
        order = np.argsort(-sims)
        out: List[Tuple[int, float]] = []
        for i in order:
            mid = self.movie_ids[i]
            if mid == movie_id:
                continue
            out.append((mid, float(sims[i])))
            if len(out) >= top_n:
                break
        return out

    def top_shared_terms(self, movie_id_a: int, movie_id_b: int, top_k: int = 3) -> List[str]:
        """두 영화 사이에서 유사도에 가장 크게 기여한 키워드 (추천 이유용)."""
        idx_a = self._index_of(movie_id_a)
        idx_b = self._index_of(movie_id_b)
        if idx_a is None or idx_b is None or self.tfidf_matrix is None or not self.feature_names:
            return []
        row_a = self.tfidf_matrix[idx_a].toarray().flatten()
        row_b = self.tfidf_matrix[idx_b].toarray().flatten()
        product = row_a * row_b
        if not np.any(product > 0):
            return []
        top_idx = np.argsort(-product)[:top_k]
        return [self.feature_names[i] for i in top_idx if product[i] > 0]


class CollaborativeRecommender:
    """평점(ratings) 데이터만으로 만든 item-based 협업 필터링 엔진. DB 스키마 변경 없음."""

    def __init__(self):
        self.movie_ids: List[int] = []
        self.item_sim = None  # (n_movies, n_movies) numpy array

    def fit(self, ratings: List[Rating]):
        if not ratings:
            self.movie_ids = []
            self.item_sim = None
            return
        user_ids = sorted({r.user_id for r in ratings})
        movie_ids = sorted({r.movie_id for r in ratings})
        u_idx = {u: i for i, u in enumerate(user_ids)}
        m_idx = {m: i for i, m in enumerate(movie_ids)}

        mat = np.zeros((len(user_ids), len(movie_ids)))
        for r in ratings:
            mat[u_idx[r.user_id], m_idx[r.movie_id]] = r.rating

        col_norms = np.linalg.norm(mat, axis=0)
        col_norms[col_norms == 0] = 1e-12
        normalized = mat / col_norms
        self.item_sim = normalized.T @ normalized  # movie x movie cosine similarity
        self.movie_ids = movie_ids

    def scores_for_movies(self, liked_movie_ids: List[int], weights: List[float] | None = None) -> Dict[int, float]:
        if self.item_sim is None or not self.movie_ids:
            return {}
        id_to_idx = {mid: i for i, mid in enumerate(self.movie_ids)}
        indices = [id_to_idx[mid] for mid in liked_movie_ids if mid in id_to_idx]
        if not indices:
            return {}
        if weights is None:
            weights = [1.0] * len(indices)
        w = np.array(weights)
        w = w / (np.sum(w) + 1e-12)
        sims = self.item_sim[:, indices]
        scores = sims @ w
        result = {mid: float(scores[i]) for i, mid in enumerate(self.movie_ids)}
        for mid in liked_movie_ids:
            result.pop(mid, None)
        return result


_content_recommender = ContentRecommender()
_cf_recommender = CollaborativeRecommender()


def ensure_model(db: Session) -> ContentRecommender:
    movies = db.query(Movie).all()
    if (_content_recommender.tfidf_matrix is None) or (len(_content_recommender.movie_ids) != len(movies)):
        _content_recommender.fit(movies)
    return _content_recommender


def ensure_cf_model(db: Session) -> CollaborativeRecommender:
    ratings = db.query(Rating).all()
    rated_movie_count = len({r.movie_id for r in ratings})
    if (_cf_recommender.item_sim is None) or (len(_cf_recommender.movie_ids) != rated_movie_count):
        _cf_recommender.fit(ratings)
    return _cf_recommender


def _normalize(scores: Dict[int, float]) -> Dict[int, float]:
    if not scores:
        return {}
    vals = np.array(list(scores.values()))
    lo, hi = vals.min(), vals.max()
    if hi - lo < 1e-9:
        return {k: 0.5 for k in scores}
    return {k: float((v - lo) / (hi - lo)) for k, v in scores.items()}


def recommend_for_user(db: Session, user_id: int, limit: int = 12) -> List[dict]:
    """콘텐츠 기반 + 협업 필터링을 블렌딩한 하이브리드 추천. 각 결과에 source/reason 포함."""
    ratings = db.query(Rating).filter(Rating.user_id == user_id).all()

    if not ratings:
        movies = db.query(Movie).order_by(Movie.popularity.desc()).limit(limit).all()
        return [
            {
                "movie": m,
                "score": float(m.popularity or 0.0),
                "source": "popularity",
                "reason": "아직 평점 기록이 없어 인기 영화를 보여드려요.",
            }
            for m in movies
        ]

    ratings_sorted = sorted(ratings, key=lambda r: r.rating, reverse=True)
    top = ratings_sorted[: min(10, len(ratings_sorted))]
    liked_ids = [r.movie_id for r in top]
    weights = [r.rating for r in top]

    content_rec = ensure_model(db)
    content_scores = content_rec.scores_for_movies(liked_ids, weights)

    cf_rec = ensure_cf_model(db)
    cf_scores = cf_rec.scores_for_movies(liked_ids, weights)

    if not content_scores and not cf_scores:
        movies = db.query(Movie).order_by(Movie.popularity.desc()).limit(limit).all()
        return [
            {"movie": m, "score": float(m.popularity or 0.0), "source": "popularity", "reason": "인기도 기반 추천이에요."}
            for m in movies
        ]

    pop_map = {m.id: (m.popularity or 0.0) for m in db.query(Movie).all()}
    content_norm = _normalize(content_scores)
    cf_norm = _normalize(cf_scores)

    W_CONTENT, W_CF, W_POP = 0.5, 0.4, 0.1
    all_ids = set(content_norm) | set(cf_norm)
    blended = []
    for mid in all_ids:
        c = content_norm.get(mid, 0.0)
        cf = cf_norm.get(mid, 0.0)
        pop = pop_map.get(mid, 0.0)
        score = c * W_CONTENT + cf * W_CF + pop * W_POP
        blended.append((mid, score, c, cf))
    blended.sort(key=lambda x: x[1], reverse=True)
    top_blended = blended[:limit]

    id_to_movie = {m.id: m for m in db.query(Movie).filter(Movie.id.in_([b[0] for b in top_blended])).all()}

    out: List[dict] = []
    for mid, score, c, cf in top_blended:
        movie = id_to_movie.get(mid)
        if movie is None:
            continue

        source = "content" if c >= cf else "collaborative"

        reason = None
        if c > 0:
            best_terms: List[str] = []
            for lid in liked_ids:
                terms = content_rec.top_shared_terms(lid, mid, top_k=3)
                if len(terms) > len(best_terms):
                    best_terms = terms
            if best_terms:
                reason = f"공통 키워드: {', '.join(best_terms)}"
        if reason is None and cf > 0:
            reason = "비슷한 취향의 다른 사용자들이 함께 좋아한 영화예요."
        if reason is None:
            reason = "인기도 기반 추천이에요."

        out.append({"movie": movie, "score": float(score), "source": source, "reason": reason})

    return out


def similar_movies(db: Session, movie_id: int, limit: int = 10) -> List[Tuple[Movie, float]]:
    """특정 영화와 콘텐츠 기준 비슷한 영화 목록 (item-to-item)."""
    rec = ensure_model(db)
    sims = rec.similar_to(movie_id, top_n=limit)
    if not sims:
        return []
    ids = [mid for mid, _ in sims]
    id_to_movie = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(ids)).all()}
    return [(id_to_movie[mid], score) for mid, score in sims if mid in id_to_movie]
