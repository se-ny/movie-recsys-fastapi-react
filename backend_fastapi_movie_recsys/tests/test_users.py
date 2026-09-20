def test_list_users_empty(client):
    r = client.get("/api/users")
    assert r.status_code == 200
    assert r.json() == []


def test_create_get_update_delete_user(client):
    r = client.post("/api/users", json={"name": "Charlie"})
    assert r.status_code == 201
    user_id = r.json()["id"]

    r = client.get(f"/api/users/{user_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Charlie"

    r = client.put(f"/api/users/{user_id}", json={"name": "Chuck"})
    assert r.status_code == 200
    assert r.json()["name"] == "Chuck"

    r = client.delete(f"/api/users/{user_id}")
    assert r.status_code == 204

    r = client.get(f"/api/users/{user_id}")
    assert r.status_code == 404


def test_get_missing_user_is_404(client):
    r = client.get("/api/users/999")
    assert r.status_code == 404


def test_user_search_by_name(client, seeded):
    r = client.get("/api/users", params={"q": "ali"})
    assert r.status_code == 200
    names = [u["name"] for u in r.json()]
    assert "Alice" in names
    assert "Bob" not in names


def test_user_list_includes_rating_count(client, seeded):
    r = client.get("/api/users")
    body = {u["id"]: u["rating_count"] for u in r.json()}
    assert body[1] == 2  # Alice rated 2 movies
    assert body[2] == 1  # Bob rated 1 movie
