from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://web3pay:web3pay_secret_2026@postgres:5432/web3pay"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "chainpay-secret-key-change-in-production-2026"
    RPC_URL_ETH: str = "https://eth.llamarpc.com"
    RPC_URL_BSC: str = "https://bsc-dataseed.binance.org"
    RPC_URL_POLYGON: str = "https://polygon-rpc.com"
    ADMIN_ADDRESSES: list[str] = []
    CONFIRMATIONS_REQUIRED: int = 1
    ORDER_EXPIRY_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
