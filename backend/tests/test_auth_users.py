"""
Tests d'intégration des routes utilisateur (auth.py) ne nécessitant pas le flux
OAuth Google : mise à jour du nom d'utilisateur et suppression de compte.
"""


def test_update_username_success(client, make_user):
    uid = make_user("bob", "bob@example.com")
    resp = client.patch(f"/api/auth/users/{uid}", json={"username": "bobby"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["username"] == "bobby"
    assert body["email"] == "bob@example.com"


def test_update_username_not_found(client):
    resp = client.patch("/api/auth/users/424242", json={"username": "ghost"})
    assert resp.status_code == 404


def test_update_username_duplicate_rejected(client, make_user):
    make_user("carol", "carol@example.com")
    uid2 = make_user("dave", "dave@example.com")
    # dave essaie de prendre le nom 'carol' déjà utilisé
    resp = client.patch(f"/api/auth/users/{uid2}", json={"username": "carol"})
    assert resp.status_code == 400


def test_delete_user_success(client, make_user):
    uid = make_user("erin", "erin@example.com")
    resp = client.delete(f"/api/auth/users/{uid}")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    # Vérifie qu'il a bien disparu
    assert client.patch(f"/api/auth/users/{uid}", json={"username": "x"}).status_code == 404


def test_delete_user_not_found(client):
    assert client.delete("/api/auth/users/424242").status_code == 404
