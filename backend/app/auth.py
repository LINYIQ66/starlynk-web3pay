import time
import secrets
from datetime import datetime, timedelta, timezone

import redis.asyncio as aioredis
from jose import jwt, JWTError
from eth_account.messages import encode_defunct
from eth_account import Account
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer
from app.config import settings

bearer_scheme = HTTPBearer()

# Redis-backed nonce store
_redis: aioredis.Redis | None = None


async def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def generate_nonce(address: str) -> str:
    nonce = secrets.token_hex(16)
    r = await _get_redis()
    await r.setex(f"nonce:{nonce}", 300, address.lower())
    return nonce


async def verify_nonce(nonce: str, address: str) -> bool:
    r = await _get_redis()
    stored = await r.get(f"nonce:{nonce}")
    if stored and stored == address.lower():
        await r.delete(f"nonce:{nonce}")
        return True
    return False


def create_siwe_message(address: str, nonce: str, domain: str = "chainpay.starlynk.io") -> str:
    now = datetime.now(timezone.utc)
    issued_at = now.isoformat()
    expiry = (now + timedelta(hours=24)).isoformat()
    return (
        f"{domain} wants you to sign in with your Ethereum account:\n"
        f"{address}\n\n"
        f"Sign in to ChainPay.\n\n"
        f"URI: https://{domain}\n"
        f"Version: 1\n"
        f"Chain ID: 1\n"
        f"Nonce: {nonce}\n"
        f"Issued At: {issued_at}\n"
        f"Expiration Time: {expiry}"
    )


def verify_signature(message: str, signature: str, expected_address: str) -> bool:
    try:
        msg = encode_defunct(text=message)
        recovered = Account.recover_message(msg, signature=signature)
        return recovered.lower() == expected_address.lower()
    except Exception:
        return False


def create_token(address: str, is_admin: bool = False) -> str:
    payload = {
        "sub": address.lower(),
        "admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_token(auth[7:])
    return payload.get("sub", "")


async def get_admin_user(request: Request) -> str:
    address = await get_current_user(request)
    if settings.admin_list and address.lower() not in settings.admin_list:
        raise HTTPException(status_code=403, detail="Admin access required")
    return address
