import pytest


def test_movie_crud(client):
    r = client.post("/api/movies", json={"title": "New Movie", "genres": "Drama", "year": 2023})
    assert r.status_code == 201
    movie_id = r.json()["id"]

    r = client.put(f"/api/movies/{movie_id}", json={"popularity": 9.9})
    assert r.status_code == 200
    assert r.json()["popularity"] == 9.9

    r = client.delete(f"/api/movies/{movie_id}")
    assert r.status_code == 204

    r = client.get(f"/api/movies/{movie_id}")
    assert r.status_code == 404


def test_movie_create_requires_title(client):
    r = client.post("/api/movies", json={"genres": "Drama"})
    assert r.status_code == 422  # title is required


def test_movie_search_by_title(client, seeded):
    r = client.get("/api/movies", params={"q": "space"})
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["title"] == "Space Warriors"


def test_movie_search_by_genre(client, seeded):
    r = client.get("/api/movies", params={"genre": "Romance"})
    assert [m["title"] for m in r.json()] == ["Love in Paris"]


def test_movie_sort_and_total_count_header(client, seeded):
    r = client.get("/api/movies", params={"sort": "year", "order": "asc"})
    assert r.status_code == 200
    years = [m["year"] for m in r.json()]
    assert years == sorted(years)
    assert r.headers["x-total-count"] == "3"


def test_movie_rating_summary(client, seeded):
    r = client.get("/api/movies/1/rating-summary")
    assert r.status_code == 200
    body = r.json()
    assert body["rating_count"] == 2
    assert body["avg_rating"] == pytest.approx(4.75)


def test_movie_rating_summary_with_no_ratings(client, seeded):
    r = client.get("/api/movies/2/rating-summary")
    body = r.json()
    assert body["avg_rating"] is None
    assert body["rating_count"] == 0
