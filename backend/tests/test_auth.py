import pytest

def test_register_user(client):
    response = client.post(
        "/auth/signup",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "test@example.com"
    assert "access_token" in response.json()

def test_register_existing_user(client):
    # Register first time
    client.post(
        "/auth/signup",
        json={"email": "test2@example.com", "password": "password123"}
    )
    # Register second time
    response = client.post(
        "/auth/signup",
        json={"email": "test2@example.com", "password": "password123"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_user(client):
    # Register
    client.post(
        "/auth/signup",
        json={"email": "test3@example.com", "password": "password123"}
    )
    
    # Login
    response = client.post(
        "/auth/login",
        json={"email": "test3@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={"email": "test4@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"
