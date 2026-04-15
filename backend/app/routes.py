import uuid
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Order, OrderStatus, ChainType, TokenType, AddressPool, AuditLog
from app.auth import (
    generate_nonce, create_siwe_message, verify_signature,
    verify_nonce, create_token, get_current_user, get_admin_user
)
from app.config import settings

router = APIRouter()

# ─── SIWE Auth ───

class NonceRequest(BaseModel):
    address: str

class VerifyRequest(BaseModel):
    address: str
    message: str
    signature: str

@router.get("/auth/nonce")
async def get_nonce(address: str):
    nonce = generate_nonce()
    message = create_siwe_message(address, nonce)
    return {"nonce": nonce, "message": message}

@router.post("/auth/verify")
async def verify_login(req: VerifyRequest, db: AsyncSession = Depends(get_db)):
    # Verify signature
    if not verify_signature(req.message, req.signature, req.address):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Extract nonce from message
    nonce = None
    for line in req.message.split("\n"):
        if line.startswith("Nonce:"):
            nonce = line.split(":", 1)[1].strip()
    if not nonce or not verify_nonce(nonce):
        raise HTTPException(status_code=401, detail="Invalid or expired nonce")

    # Upsert user
    result = await db.execute(select(User).where(User.wallet_address == req.address.lower()))
    user = result.scalar_one_or_none()
    if not user:
        user = User(wallet_address=req.address.lower())
        db.add(user)
        await db.commit()

    token = create_token(req.address)
    return {"token": token, "address": req.address.lower(), "is_admin": user.is_admin}

# ─── Orders ───

class CreateOrderRequest(BaseModel):
    chain: ChainType
    token: TokenType
    amount: str
    amount_usd: str = "0"
    webhook_url: str | None = None
    metadata: dict | None = None

class OrderResponse(BaseModel):
    id: str
    order_no: str
    chain: str
    token: str
    amount: str
    amount_usd: str
    pay_address: str
    status: str
    tx_hash: str | None
    confirmations: int
    expired_at: str | None
    created_at: str

def order_to_dict(o: Order) -> dict:
    return {
        "id": str(o.id),
        "order_no": o.order_no,
        "chain": o.chain.value,
        "token": o.token.value,
        "amount": o.amount,
        "amount_usd": o.amount_usd,
        "pay_address": o.pay_address,
        "status": o.status.value,
        "tx_hash": o.tx_hash,
        "confirmations": o.confirmations,
        "expired_at": o.expired_at.isoformat() if o.expired_at else None,
        "created_at": o.created_at.isoformat(),
    }

@router.post("/orders")
async def create_order(req: CreateOrderRequest, address: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Generate order number
    order_no = f"CP{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    # Use company wallet address for all orders
    COMPANY_ADDRESS = "0xaB66da4936C51FfBC96F4cb0230A2D8a79F97d35"

    order = Order(
        order_no=order_no,
        user_address=address,
        chain=req.chain,
        token=req.token,
        amount=req.amount,
        amount_usd=req.amount_usd,
        pay_address=COMPANY_ADDRESS,
        status=OrderStatus.PENDING,
        webhook_url=req.webhook_url,
        metadata_json=json.dumps(req.metadata) if req.metadata else None,
        expired_at=datetime.utcnow() + timedelta(minutes=settings.ORDER_EXPIRY_MINUTES),
    )
    db.add(order)

    log = AuditLog(action="order.create", actor=address, target=order_no, detail=f"Amount: {req.amount} {req.token.value}")
    db.add(log)
    await db.commit()

    return order_to_dict(order)

@router.get("/orders/{order_no}")
async def get_order(order_no: str, address: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.order_no == order_no))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_address != address.lower():
        raise HTTPException(status_code=403, detail="Not your order")
    return order_to_dict(order)

@router.get("/orders")
async def list_orders(address: str = Depends(get_current_user), db: AsyncSession = Depends(get_db), page: int = 1, limit: int = 20):
    offset = (page - 1) * limit
    result = await db.execute(
        select(Order).where(Order.user_address == address.lower()).order_by(Order.created_at.desc()).offset(offset).limit(limit)
    )
    orders = result.scalars().all()
    return [order_to_dict(o) for o in orders]

# ─── Admin ───

@router.get("/admin/stats")
async def admin_stats(address: str = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Order.id)))).scalar()
    completed = (await db.execute(select(func.count(Order.id)).where(Order.status == OrderStatus.COMPLETED))).scalar()
    pending = (await db.execute(select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING))).scalar()
    return {"total_orders": total, "completed": completed, "pending": pending}

@router.get("/admin/orders")
async def admin_list_orders(address: str = Depends(get_admin_user), db: AsyncSession = Depends(get_db),
                            status: str | None = None, page: int = 1, limit: int = 50):
    offset = (page - 1) * limit
    q = select(Order).order_by(Order.created_at.desc()).offset(offset).limit(limit)
    if status:
        q = q.where(Order.status == status)
    result = await db.execute(q)
    return [order_to_dict(o) for o in result.scalars().all()]

@router.get("/admin/addresses")
async def admin_addresses(address: str = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AddressPool).order_by(AddressPool.created_at.desc()))
    addrs = result.scalars().all()
    return [{"id": str(a.id), "address": a.address, "chain": a.chain.value, "is_active": a.is_active, "assigned_order": a.assigned_order} for a in addrs]

@router.post("/admin/addresses")
async def admin_add_address(chain: ChainType, address_param: str, address: str = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    pool = AddressPool(address=address_param, chain=chain)
    db.add(pool)
    log = AuditLog(action="address.add", actor=address, target=address_param)
    db.add(log)
    await db.commit()
    return {"ok": True}

# ─── Health ───

@router.get("/health")
async def health():
    return {"status": "ok", "service": "ChainPay API"}
