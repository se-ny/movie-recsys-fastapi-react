def test_rating_full_crud(client, seeded):
    r = client.post("/api/users/2/ratings", json={"movie_id": 2, "rating": 4.0})
    assert r.status_code == 201

    r = client.get("/api/users/2/ratings/2")
    assert r.status_code == 200
    assert r.json()["rating"] == 4.0

    r = client.put("/api/users/2/ratings/2", json={"rating": 3.0})
    assert r.status_code == 200
    assert r.json()["rating"] == 3.0

    r = client.delete("/api/users/2/ratings/2")
    assert r.status_code == 204

    r = client.get("/api/users/2/ratings/2")
    assert r.status_code == 404


def test_update_nonexistent_rating_is_404(client, seeded):
    r = client.put("/api/users/2/ratings/3", json={"rating": 3.0})
    assert r.status_code == 404


def test_rating_out_of_range_is_rejected(client, seeded):
    r = client.post("/api/users/1/ratings", json={"movie_id": 2, "rating": 7.5})
    assert r.status_code == 422


def test_user_ratings_include_movie_title(client, seeded):
    r = client.get("/api/users/1/ratings")
    assert r.status_code == 200
    by_movie = {row["movie_id"]: row["movie_title"] for row in r.json()}
    assert by_movie[1] == "Space Warriors"
    assert by_movie[3] == "Love in Paris"


def test_export_ratings_csv(client, seeded):
    r = client.get("/api/users/1/ratings/export")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "Space Warriors" in r.text
    assert "Love in Paris" in r.text
