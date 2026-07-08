import pytest
from datetime import datetime

@pytest.fixture
def auth_token(client):
    # Register and login a user to get a token
    client.post(
        "/auth/signup",
        json={"email": "transaction_user@example.com", "password": "password123"}
    )
    response = client.post(
        "/auth/login",
        json={"email": "transaction_user@example.com", "password": "password123"}
    )
    return response.json()["access_token"]

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture
def category_id(client, auth_headers):
    # Create a category
    response = client.post(
        "/categories/",
        json={"name": "Food", "color": "#ff0000", "budget_limit": 500.0},
        headers=auth_headers
    )
    return response.json()["id"]

def test_create_transaction(client, auth_headers, category_id):
    response = client.post(
        "/transactions/",
        json={
            "amount": 15.50,
            "description": "Lunch",
            "category_id": category_id,
            "date": datetime.utcnow().isoformat()
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 15.50
    assert data["description"] == "Lunch"

def test_get_transactions(client, auth_headers, category_id):
    # Create a transaction
    client.post(
        "/transactions/",
        json={
            "amount": 20.00,
            "description": "Dinner",
            "category_id": category_id,
            "date": datetime.utcnow().isoformat()
        },
        headers=auth_headers
    )
    
    # Get all transactions
    response = client.get("/transactions/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(t["description"] == "Dinner" for t in data)

def test_get_dashboard_summary(client, auth_headers, category_id):
    client.post(
        "/transactions/",
        json={
            "amount": 50.00,
            "description": "Groceries",
            "category_id": category_id,
            "date": datetime.utcnow().isoformat()
        },
        headers=auth_headers
    )
    
    response = client.get("/transactions/dashboard/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_spent" in data
    assert "by_category" in data
    assert data["total_spent"] >= 50.00
