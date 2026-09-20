def test_recommend_cold_start_uses_popularity(client, seeded):
    r = client.get("/api/recommend", params={"user_id": 999, "limit": 2})
    assert r.status_code == 200
    assert all(item["source"] == "popularity" for item in r.json())


def test_recommend_for_existing_user(client, seeded):
    r = client.get("/api/recommend", params={"user_id": 1, "limit": 2})
    assert r.status_code == 200
    assert len(r.json()) <= 2


def test_similar_movies(client, seeded):
    r = client.get("/api/movies/1/similar", params={"limit": 2})
    assert r.status_code == 200
    assert len(r.json()) <= 2


def test_trending(client, seeded):
    r = client.get("/api/movies/trending")
    assert r.status_code == 200
    titles = [row["movie"]["title"] for row in r.json()]
    assert "Space Warriors" in titles


def test_stats(client, seeded):
    r = client.get("/api/stats")
    assert r.status_code == 200
    body = r.json()
    assert body["total_users"] == 2
    assert body["total_movies"] == 3
    assert body["total_ratings"] == 3
    assert body["avg_rating"] is not None
