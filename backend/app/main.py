from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import init_db
from app.routes import router
from app.config import settings

import time
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ChainPay API starting...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("ChainPay API shutting down")


app = FastAPI(
    title="ChainPay API",
    description="Web3 Payment Infrastructure — Accept crypto payments on ETH/BSC/Polygon",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS — read from config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Simple in-memory rate limiter
_rate_cache: dict[str, list[float]] = {}
RATE_WINDOW = 60  # seconds


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/docs") or request.url.path.startswith("/api/openapi"):
        return await call_next(request)
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = _rate_cache.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < RATE_WINDOW]
    if len(timestamps) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again later."})
    timestamps.append(now)
    _rate_cache[client_ip] = timestamps
    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(settings.RATE_LIMIT_PER_MINUTE - len(timestamps))
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "service": "chainpay", "version": "1.0.0"}


@app.get("/api/v1/health")
async def api_health():
    return {"status": "ok", "service": "chainpay-api", "version": "1.0.0"}


app.include_router(router, prefix="/api/v1")
