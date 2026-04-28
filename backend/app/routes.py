import uuid
import json
import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from pydantic import BaseModel, Field

from app.database import get_db
from app.models import User, Order, OrderStatus, ChainType, TokenType, AddressPool, AuditLog
from app.auth import (
    generate_nonce, create_siwe_message, verify_signature,
    verify_nonce, create_token, get_current_user, get_admin_user
)
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ══════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════

@router.get("/auth/nonce")
async def auth_nonce(address: str = Query(...)):
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    nonce = await generate_nonce(address)
    message = create_siwe_message(address, nonce)
    return {"nonce": nonce, "message": message}


@router.post("/auth/verify")
async def auth_verify(
    address: str = Query(...),
    nonce: str = Query(...),
    signature: str = ...,
    db: AsyncSession = Depends(get_db),
):
    if not await verify_nonce(nonce, address):
        raise HTTPException(status_code=400, detail="Invalid or expired nonce")

    # Get the message that was signed
    message = create_siwe_message(address, nonce)
    if not verify_signature(message, signature, address):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Upsert user
    result = await db.execute(select(User).where(User.wallet_address == address.lower()))
    user = result.scalar_one_or_none()
    if not user:
        user = User(wallet_address=address.lower(), is_admin=False)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    is_admin = address.lower() in settings.admin_list
    token = create_token(address, is_admin)
    return {"token": token, "address": address.lower(), "is_admin": is_admin}


# ══════════════════════════════════════════════════════════════
# ORDER ROUTES
# ══════════════════════════════════════════════════════════════

class CreateOrderRequest(BaseModel):
    chain: ChainType
    token: TokenType
    amount: str = Field(..., description="Amount in wei (native) or smallest unit (ERC20)")
    amount_usd: Optional[str] = None
    webhook_url: Optional[str] = None
    metadata: Optional[dict] = None


@router.post("/orders")
async def create_order(
    req: CreateOrderRequest,
    address: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find available pay address from pool
    result = await db.execute(
        select(AddressPool)
        .where(AddressPool.chain == req.chain)
        .where(AddressPool.is_active == True)
        .where(AddressPool.assigned_order.is_(None))
        .limit(1)
    )
    pool_addr = result.scalar_one_or_none()
    if not pool_addr:
        raise HTTPException(status_code=503, detail="No available payment addresses. Please try later.")

    # Create order
    order_no = f"CP{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:8].upper()}"
    order = Order(
        order_no=order_no,
        user_address=address.lower(),
        chain=req.chain,
        token=req.token,
        amount=req.amount,
        amount_usd=req.amount_usd or "0",
        pay_address=pool_addr.address,
        status=OrderStatus.PENDING,
        webhook_url=req.webhook_url,
        metadata_json=json.dumps(req.metadata) if req.metadata else None,
        expired_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ORDER_EXPIRY_MINUTES),
    )
    db.add(order)

    # Mark address as assigned
    pool_addr.assigned_order = order_no

    # Audit log
    log = AuditLog(
        action="order_created",
        actor=address.lower(),
        target=order_no,
        detail=json.dumps({"chain": req.chain.value, "token": req.token.value, "amount": req.amount}),
    )
    db.add(log)

    await db.commit()
    await db.refresh(order)

    return {
        "order_no": order.order_no,
        "pay_address": order.pay_address,
        "chain": order.chain.value,
        "token": order.token.value,
        "amount": order.amount,
        "amount_usd": order.amount_usd,
        "status": order.status.value,
        "expired_at": order.expired_at.isoformat() if order.expired_at else None,
        "qr_code": f"ethereum:{order.pay_address}?value={order.amount}" if order.token.value == "native" else None,
    }


@router.get("/orders")
async def list_orders(
    address: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_address == address.lower())
        .order_by(Order.created_at.desc())
        .limit(50)
    )
    orders = result.scalars().all()
    return [
        {
            "order_no": o.order_no,
            "chain": o.chain.value,
            "token": o.token.value,
            "amount": o.amount,
            "amount_usd": o.amount_usd,
            "status": o.status.value,
            "tx_hash": o.tx_hash,
            "confirmations": o.confirmations,
            "pay_address": o.pay_address,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "expired_at": o.expired_at.isoformat() if o.expired_at else None,
            "confirmed_at": o.confirmed_at.isoformat() if o.confirmed_at else None,
        }
        for o in orders
    ]


@router.get("/orders/{order_no}")
async def get_order(
    order_no: str,
    address: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.order_no == order_no, Order.user_address == address.lower())
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "order_no": order.order_no,
        "chain": order.chain.value,
        "token": order.token.value,
        "amount": order.amount,
        "amount_usd": order.amount_usd,
        "status": order.status.value,
        "tx_hash": order.tx_hash,
        "confirmations": order.confirmations,
        "pay_address": order.pay_address,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "expired_at": order.expired_at.isoformat() if order.expired_at else None,
        "confirmed_at": order.confirmed_at.isoformat() if order.confirmed_at else None,
    }


# ══════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ══════════════════════════════════════════════════════════════

class AddAddressRequest(BaseModel):
    chain: ChainType
    address: str
    is_hot_wallet: bool = False


@router.get("/admin/stats")
async def admin_stats(
    address: str = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total = await db.execute(select(func.count(Order.id)))
    pending = await db.execute(select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING))
    completed = await db.execute(select(func.count(Order.id)).where(Order.status == OrderStatus.COMPLETED))
    addrs = await db.execute(select(func.count(AddressPool.id)).where(AddressPool.is_active == True))
    return {
        "total_orders": total.scalar() or 0,
        "pending_orders": pending.scalar() or 0,
        "completed_orders": completed.scalar() or 0,
        "active_addresses": addrs.scalar() or 0,
    }


@router.get("/admin/orders")
async def admin_orders(
    address: str = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).order_by(Order.created_at.desc()).limit(100))
    orders = result.scalars().all()
    return [
        {
            "order_no": o.order_no,
            "user_address": o.user_address,
            "chain": o.chain.value,
            "token": o.token.value,
            "amount": o.amount,
            "status": o.status.value,
            "tx_hash": o.tx_hash,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.get("/admin/addresses")
async def admin_addresses(
    address: str = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AddressPool).order_by(AddressPool.created_at.desc()))
    addrs = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "address": a.address,
            "chain": a.chain.value,
            "is_hot_wallet": a.is_hot_wallet,
            "is_active": a.is_active,
            "assigned_order": a.assigned_order,
        }
        for a in addrs
    ]


@router.post("/admin/addresses")
async def admin_add_address(
    req: AddAddressRequest,
    address: str = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    pool = AddressPool(
        address=req.address.lower(),
        chain=req.chain,
        is_hot_wallet=req.is_hot_wallet,
        is_active=True,
    )
    db.add(pool)
    log = AuditLog(action="address_added", actor=address.lower(), target=req.address, detail=req.chain.value)
    db.add(log)
    await db.commit()
    return {"ok": True, "address": req.address}


@router.delete("/admin/addresses/{addr_id}")
async def admin_remove_address(
    addr_id: str,
    address: str = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AddressPool).where(AddressPool.id == uuid.UUID(addr_id)))
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    addr.is_active = False
    log = AuditLog(action="address_removed", actor=address.lower(), target=addr.address)
    db.add(log)
    await db.commit()
    return {"ok": True}
