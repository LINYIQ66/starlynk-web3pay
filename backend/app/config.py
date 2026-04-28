from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://web3pay:web3pay_secret_2026@postgres:5432/web3pay"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "chainpay-secret-key-change-in-production"

    # RPC Endpoints
    RPC_URL_ETH: str = "https://eth.llamarpc.com"
    RPC_URL_BSC: str = "https://bsc-dataseed.binance.org"
    RPC_URL_POLYGON: str = "https://polygon-rpc.com"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    # Admin
    ADMIN_ADDRESSES: str = ""

    # Order
    CONFIRMATIONS_REQUIRED: int = 2
    ORDER_EXPIRY_MINUTES: int = 30

    # Webhook
    WEBHOOK_TIMEOUT: int = 10
    WEBHOOK_RETRIES: int = 3

    # Rate Limit
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def admin_list(self) -> list[str]:
        return [a.strip().lower() for a in self.ADMIN_ADDRESSES.split(",") if a.strip()]


settings = Settings()
