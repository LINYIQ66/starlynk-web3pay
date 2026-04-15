import time
import secrets
from datetime import datetime, timedelta
from jose import jwt, JWTError
from eth_account.messages import encode_defunct
from eth_account import Account
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer
from app.config import settings

bearer_scheme = HTTPBearer()
NONCE_STORE: dict[str, float] = {}  # In production, use Redis

def generate_nonce() -> str:
    nonce = secrets.token_hex(16)
    NONCE_STORE[nonce] = time.time() + 300  # 5 min expiry
    return nonce

def verify_nonce(nonce: str) -> bool:
    if nonce in NONCE_STORE and NONCE_STORE[nonce] > time.time():
        del NONCE_STORE[nonce]
        return True
    return False

def create_siwe_message(address: str, nonce: str, domain: str = "Starlynk.io") -> str:
    issued_at = datetime.utcnow().isoformat() + "Z"
    expiry = (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"
    return f"{domain} wants you to sign in with your Ethereum account:\n{address}\n\nSign in to Starlynk.\n\nURI: https://{domain}\nVersion: 1\nChain ID: 1\nNonce: {nonce}\nIssued At: {issued_at}\nExpiration Time: {expiry}"

def verify_signature(message: str, signature: str, expected_address: str) -> bool:
    try:
        msg = encode_defunct(text=message)
        recovered = Account.recover_message(msg, signature=signature)
        return recovered.lower() == expected_address.lower()
    except Exception:
        return False

def create_token(address: str) -> str:
    payload = {
        "sub": address.lower(),
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials=Depends(bearer_scheme)) -> str:
    return verify_token(credentials.credentials)

async def get_admin_user(address: str = Depends(get_current_user)) -> str:
    if settings.ADMIN_ADDRESSES and address.lower() not in [a.lower() for a in settings.ADMIN_ADDRESSES]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return address
