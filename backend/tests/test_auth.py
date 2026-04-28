import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_get_nonce(client):
    response = client.get("/auth/nonce?address=0x742d35Cc6634C0532925a3b844Bc9e7595f8Ca33")
    assert response.status_code == 200
    assert "nonce" in response.json()
    assert "message" in response.json()

def test_invalid_address(client):
    response = client.get("/auth/nonce?address=invalid")
    assert response.status_code == 400
