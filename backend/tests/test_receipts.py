import pytest
from app.services.receipt_service import ReceiptProcessingService

def test_category_from_merchant_food():
    service = ReceiptProcessingService()
    category = service._predict_category("McDonalds")
    assert category == "Food"

def test_category_from_merchant_transport():
    service = ReceiptProcessingService()
    cat_uber = service._predict_category("Uber")
    cat_ola = service._predict_category("Ola")
    assert cat_uber == "Transportation"
    assert cat_ola == "Transportation"

def test_category_from_merchant_medical():
    service = ReceiptProcessingService()
    category = service._predict_category("Apollo Pharmacy")
    assert category == "Medical"

def test_category_from_merchant_shopping():
    service = ReceiptProcessingService()
    category = service._predict_category("Amazon")
    assert category == "Shopping"

def test_process_receipt_endpoint_missing_image(client, auth_headers):
    response = client.post("/receipts/process", json={}, headers=auth_headers)
    assert response.status_code in [400, 422]

def test_get_receipts_requires_auth(client):
    response = client.get("/receipts/")
    assert response.status_code == 401

def test_get_receipts_authenticated(client, auth_headers):
    response = client.get("/receipts/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "receipts" in data
    assert isinstance(data["receipts"], list)
