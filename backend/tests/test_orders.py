import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_create_order_unauthorized(client):
    response = client.post("/orders", json={
        "chain": "eth",
        "token": "native",
        "amount": "1000000000000000000"
    })
    assert response.status_code == 401

def test_list_orders_unauthorized(client):
    response = client.get("/orders")
    assert response.status_code == 401
