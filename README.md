# Payment Gateway Service & Full-Stack Application (SCRUM-241)

PCI-compliant Payment Gateway Service providing RESTful APIs for checkout sessions, digital wallets (Apple Pay & Google Pay), multi-currency conversion, automated refunds, Stripe webhooks, and masked audit logging, integrated with a modern React 18 / Vite / Tailwind CSS frontend client.

---

## Architecture Overview

- **Backend (`server/`)**: Python 3.11, FastAPI, SQLAlchemy 2.0, SQLite (dev/test) / PostgreSQL (prod), Pydantic v2.
- **Frontend (`client/`)**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios.

---

## Full-Stack Local Development

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 2. Backend Setup (`server/`)
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install -r server/requirements.txt

# Run backend tests
pytest server/tests/ -v

# Start FastAPI development server (runs on port 8000)
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup (`client/`)
```bash
cd client
npm install
npm run dev  # Starts Vite dev server on http://localhost:5173
```

### 4. Default Ports & Configuration
- Backend REST API: `http://localhost:8000`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Frontend UI: `http://localhost:5173`

### 5. Pre-Seeded Test Credentials
The database automatically seeds the following credentials on startup:
- **Regular Customer**: `test@example.com` / `testpassword`
- **Operations Admin**: `admin@example.com` / `adminpassword`

## Server

### Prerequisites
- Python 3.9+
- pip and venv

### Setup

1. Create and activate virtual environment:
```bash
python -m venv server/.venv
# On Windows:
server\.venv\Scripts\activate
# On macOS/Linux:
source server/.venv/bin/activate
```

2. Install dependencies:
```bash
cd server
pip install -r requirements.txt
cd ..
```

### Running Tests
```bash
cd server
python -m pytest -v
cd ..
```

### Starting the Development Server
```bash
# Run from the repo root so that `from server.X` imports resolve correctly
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Full-Stack Local Development

To run both backend and frontend together locally:

### 1. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Start the Backend (Terminal 1)
```bash
python -m venv server/.venv
source server/.venv/bin/activate  # On Windows: server\.venv\Scripts\activate
pip install -r server/requirements.txt
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API: `http://localhost:8000` | API Docs: `http://localhost:8000/docs`

### 3. Start the Frontend (Terminal 2)
```bash
cd client
npm install
npm run dev
```
Frontend: `http://localhost:5173`

The frontend connects to the backend API at `http://localhost:8000` by default via the `VITE_API_BASE_URL` environment variable.

### 4. Test Credentials
If the app has authentication, the backend seeds ready-to-use accounts on startup
(idempotent). These are guaranteed logged-in-able — every activation/verification
gate (`is_active`, `is_verified`, `email_verified`, `disabled`) is set to the
permissive value, so no manual DB step is needed:
- **Regular user** — Email: `test@example.com`, Password: `testpassword`
- **Admin user** (only when the app has roles/RBAC) — Email: `admin@example.com`, Password: `adminpassword`, role: `admin`

Passwords are stored hashed with the app's own hashing utility (never in plaintext).

### Port Reference
| Service  | Port | URL                        |
|----------|------|----------------------------|
| Backend  | 8000 | http://localhost:8000      |
| Frontend | 5173 | http://localhost:5173      |
| API Docs | 8000 | http://localhost:8000/docs |

