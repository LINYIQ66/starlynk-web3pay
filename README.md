# ⛓️ Starlynk Web3 Payment Infrastructure

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

Web3 Payment Infrastructure — Accept crypto payments. Monitor on-chain transactions. Built for developers.

## ✨ Features

- 🔗 **Multi-Chain Support** — Ethereum, BSC, Polygon
- 🔐 **SIWE Authentication** — Sign-In with Ethereum (EIP-4361)
- 📡 **Real-time Monitoring** — Detect payments on-chain
- 🎨 **QR Code Generation** — Easy payment scanning
- 🔔 **Webhook Callbacks** — Auto-notify when payments confirmed
- 📊 **Admin Dashboard** — Orders, address pool, audit logs
- 🚀 **API First** — RESTful API with OpenAPI docs
- 🐳 **Docker Deploy** — One-command deployment

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │   Listener   │  │
│  │  (Next.js)   │  │  (FastAPI)   │  │   (Python)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                    ┌───────┴───────┐                    │
│                    │   Database    │                    │
│                    │  (PostgreSQL) │                    │
│                    └───────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### One-Command Deploy

```bash
# Clone repository
git clone https://github.com/LINYIQ66/starlynk-web3pay.git
cd starlynk-web3pay

# Start all services
docker compose -f docker/docker-compose.yml up -d
```

### Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/starlynk

# SIWE
SIWE_DOMAIN=luis.amt.land
SIWE_URI=https://luis.amt.land/chainpay/

# RPC Endpoints
ETH_RPC=https://eth.llamarpc.com
BSC_RPC=https://bsc-dataseed.binance.org
POLYGON_RPC=https://polygon-rpc.com

# Payment
RECEIVING_ADDRESS=0xaB66da4936C51FfBC96F4cb0230A2D8a79F97d35
CONFIRMATIONS_REQUIRED=3

# API
CORS_ORIGINS=https://luis.amt.land,http://localhost:3000
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://luis.amt.land/chainpay/api
NEXT_PUBLIC_SIWE_DOMAIN=luis.amt.land
NEXT_PUBLIC_SIWE_URI=https://luis.amt.land/chainpay/
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/nonce` | Get SIWE nonce |
| `POST` | `/auth/verify` | Verify SIWE signature |
| `POST` | `/orders` | Create payment order |
| `GET` | `/orders` | List user orders |
| `GET` | `/orders/{id}` | Get order details |
| `GET` | `/admin/stats` | Get admin statistics |
| `GET` | `/admin/orders` | List all orders |

## 🔐 Authentication

Starlynk uses **SIWE (Sign-In with Ethereum)** for authentication:

1. Frontend requests nonce from `/auth/nonce`
2. User signs message with MetaMask
3. Frontend sends signature to `/auth/verify`
4. Backend verifies signature and returns JWT token
5. Token is used for subsequent API calls

## 💳 Payment Flow

1. User creates order via `POST /orders`
2. Backend generates deposit address
3. User sends crypto to deposit address
4. Listener detects on-chain transaction
5. Order status updates: `pending` → `confirming` → `completed`
6. Webhook notification sent (if configured)

## 🐳 Docker Deployment

### Production

```bash
# Build and start
docker compose -f docker/docker-compose.yml up -d --build

# View logs
docker compose -f docker/docker-compose.yml logs -f

# Stop
docker compose -f docker/docker-compose.yml down
```

### Environment Variables

Create `docker/.env`:

```env
POSTGRES_USER=starlynk
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=starlynk
ETH_RPC=https://eth.llamarpc.com
RECEIVING_ADDRESS=0xaB66da4936C51FfBC96F4cb0230A2D8a79F97d35
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📦 Tech Stack

### Backend
- **FastAPI** — Modern Python web framework
- **SQLAlchemy** — SQL toolkit and ORM
- **Pydantic** — Data validation
- **Web3.py** — Ethereum interaction
- **SIWE** — Sign-In with Ethereum

### Frontend
- **Next.js 14** — React framework
- **TailwindCSS** — Utility-first CSS
- **Wagmi** — React hooks for Ethereum
- **ConnectKit** — Wallet connection UI
- **RainbowKit** — Wallet modal

### Infrastructure
- **Docker** — Containerization
- **Nginx** — Reverse proxy
- **PostgreSQL** — Database
- **GitHub Actions** — CI/CD

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Luis Lin** — *Initial work* — [LINYIQ66](https://github.com/LINYIQ66)
- **Hermes Agent** — *AI Assistant* — Built with ❤️

## 🙏 Acknowledgments

- [Ethereum](https://ethereum.org/) — For the blockchain
- [SIWE](https://login.xyz/) — For the authentication standard
- [FastAPI](https://fastapi.tiangolo.com/) — For the amazing framework
- [Next.js](https://nextjs.org/) — For the React framework

---

**Starlynk** — Web3 Payment Infrastructure · Built by Luis Lin & Hermes Agent
