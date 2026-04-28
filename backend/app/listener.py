import asyncio
import json
import hashlib
import hmac
import logging
from datetime import datetime, timezone

import httpx
from web3 import AsyncWeb3, AsyncHTTPProvider
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import settings
from app.models import Order, OrderStatus, AddressPool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("listener")

CHAINS = {
    "eth": {"rpc": settings.RPC_URL_ETH, "chain_id": 1},
    "bsc": {"rpc": settings.RPC_URL_BSC, "chain_id": 56},
    "polygon": {"rpc": settings.RPC_URL_POLYGON, "chain_id": 137},
}

TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

TOKEN_CONTRACTS = {
    "eth": {
        "usdt": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "usdc": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    "bsc": {
        "usdt": "0x55d398326f99059fF775485246999027B3197955",
        "usdc": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    },
    "polygon": {
        "usdt": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        "usdc": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    },
}


async def dispatch_webhook(order: Order):
    """Send webhook notification when payment is confirmed."""
    if not order.webhook_url:
        return

    payload = {
        "event": "payment.confirmed",
        "order_no": order.order_no,
        "chain": order.chain.value,
        "token": order.token.value,
        "amount": order.amount,
        "amount_usd": order.amount_usd,
        "pay_address": order.pay_address,
        "tx_hash": order.tx_hash,
        "confirmations": order.confirmations,
        "confirmed_at": order.confirmed_at.isoformat() if order.confirmed_at else None,
    }

    body = json.dumps(payload, separators=(",", ":"))
    signature = hmac.new(
        settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-ChainPay-Signature": f"sha256={signature}",
        "X-ChainPay-Event": "payment.confirmed",
    }

    for attempt in range(settings.WEBHOOK_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT) as client:
                resp = await client.post(order.webhook_url, content=body, headers=headers)
                if resp.status_code < 400:
                    logger.info(f"Webhook delivered for {order.order_no} (attempt {attempt+1})")
                    return
                logger.warning(f"Webhook {resp.status_code} for {order.order_no} (attempt {attempt+1})")
        except Exception as e:
            logger.error(f"Webhook error for {order.order_no}: {e}")

    logger.error(f"Webhook failed after {settings.WEBHOOK_RETRIES} attempts for {order.order_no}")


async def check_native_payment(w3: AsyncWeb3, address: str, expected_amount: str, since_block: int):
    try:
        checksum = w3.to_checksum_address(address)
        latest = await w3.eth.block_number
        for block_num in range(max(since_block, latest - 100), latest + 1):
            block = await w3.eth.get_block(block_num, full_transactions=True)
            for tx in block.transactions:
                if tx.get("to") and tx["to"].lower() == checksum.lower():
                    if int(tx.get("value", 0)) >= int(expected_amount):
                        return tx["hash"].hex(), str(block_num)
    except Exception as e:
        logger.error(f"Error checking native payment: {e}")
    return None


async def check_erc20_payment(w3: AsyncWeb3, address: str, token_address: str, expected_amount: str, since_block: int):
    try:
        checksum = w3.to_checksum_address(address)
        latest = await w3.eth.block_number
        topic_to = "0x" + checksum.lower().replace("0x", "").zfill(64)
        logs = await w3.eth.get_logs({
            "fromBlock": max(since_block, latest - 50),
            "toBlock": "latest",
            "address": token_address,
            "topics": [TRANSFER_TOPIC, None, topic_to],
        })
        for log in logs:
            if int(log["data"], 16) >= int(expected_amount):
                return log["transactionHash"].hex(), str(log["blockNumber"])
    except Exception as e:
        logger.error(f"Error checking ERC20 payment: {e}")
    return None


async def process_order(session: AsyncSession, order: Order):
    chain_cfg = CHAINS.get(order.chain.value)
    if not chain_cfg:
        return

    w3 = AsyncWeb3(AsyncHTTPProvider(chain_cfg["rpc"]))

    if order.expired_at and order.expired_at < datetime.now(timezone.utc):
        order.status = OrderStatus.EXPIRED
        # Release the pay address
        result = await session.execute(
            select(AddressPool).where(AddressPool.assigned_order == order.order_no)
        )
        addr = result.scalar_one_or_none()
        if addr:
            addr.assigned_order = None
        await session.commit()
        logger.info(f"Order {order.order_no} expired")
        return

    if order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMING):
        return

    since_block = 0
    result = None
    if order.token.value == "native":
        result = await check_native_payment(w3, order.pay_address, order.amount, since_block)
    else:
        contract = TOKEN_CONTRACTS.get(order.chain.value, {}).get(order.token.value)
        if contract:
            result = await check_erc20_payment(w3, order.pay_address, contract, order.amount, since_block)

    if result:
        tx_hash, block_num = result
        order.tx_hash = tx_hash

        if order.status == OrderStatus.PENDING:
            order.status = OrderStatus.CONFIRMING
            order.confirmations = 1
            logger.info(f"Order {order.order_no} payment detected! TX: {tx_hash}")
        elif order.status == OrderStatus.CONFIRMING:
            order.confirmations = (order.confirmations or 0) + 1

        if order.confirmations >= settings.CONFIRMATIONS_REQUIRED:
            order.status = OrderStatus.COMPLETED
            order.confirmed_at = datetime.now(timezone.utc)
            logger.info(f"Order {order.order_no} COMPLETED! TX: {tx_hash}")

            # Release pay address
            addr_result = await session.execute(
                select(AddressPool).where(AddressPool.assigned_order == order.order_no)
            )
            addr = addr_result.scalar_one_or_none()
            if addr:
                addr.assigned_order = None

            # Dispatch webhook
            await dispatch_webhook(order)

        await session.commit()


async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    logger.info("Chain listener started — checking every 10s")

    while True:
        try:
            async with session_factory() as session:
                result = await session.execute(
                    select(Order).where(Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMING]))
                )
                orders = result.scalars().all()
                for order in orders:
                    await process_order(session, order)
        except Exception as e:
            logger.error(f"Listener error: {e}")

        await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
