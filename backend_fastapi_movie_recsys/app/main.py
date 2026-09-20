from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import movies, users, recommend, stats

app = FastAPI(title="Movie Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # 페이지네이션 총 개수를 프론트에서 axios/fetch로 읽으려면 노출이 필요함
    expose_headers=["X-Total-Count"],
)

app.include_router(movies.router)
app.include_router(users.router)
app.include_router(recommend.router)
app.include_router(stats.router)

@app.get("/")
def root():
    return {"ok": True, "service": "movie-recommender"}
