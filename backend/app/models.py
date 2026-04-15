import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, BigInteger, DateTime, Boolean, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMING = "confirming"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    EXPIRED = "expired"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ChainType(str, enum.Enum):
    ETH = "eth"
    BSC = "bsc"
    POLYGON = "polygon"

class TokenType(str, enum.Enum):
    NATIVE = "native"
    USDT = "usdt"
    USDC = "usdc"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_address: Mapped[str] = mapped_column(String(42), unique=True, index=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_no: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    user_address: Mapped[str] = mapped_column(String(42), index=True)
    chain: Mapped[ChainType] = mapped_column(SAEnum(ChainType))
    token: Mapped[TokenType] = mapped_column(SAEnum(TokenType))
    amount: Mapped[str] = mapped_column(String(78))  # Wei string
    amount_usd: Mapped[str] = mapped_column(String(20), default="0")
    pay_address: Mapped[str] = mapped_column(String(42))
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus), default=OrderStatus.PENDING)
    tx_hash: Mapped[str] = mapped_column(String(66), nullable=True)
    confirmations: Mapped[int] = mapped_column(Integer, default=0)
    webhook_url: Mapped[str] = mapped_column(Text, nullable=True)
    webhook_status: Mapped[str] = mapped_column(String(20), nullable=True)
    metadata_json: Mapped[str] = mapped_column(Text, nullable=True)
    expired_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    confirmed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AddressPool(Base):
    __tablename__ = "address_pool"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address: Mapped[str] = mapped_column(String(42), unique=True, index=True)
    chain: Mapped[ChainType] = mapped_column(SAEnum(ChainType))
    is_hot_wallet: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    assigned_order: Mapped[str] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action: Mapped[str] = mapped_column(String(50))
    actor: Mapped[str] = mapped_column(String(42))
    target: Mapped[str] = mapped_column(String(100), nullable=True)
    detail: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
