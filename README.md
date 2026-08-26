# Timesheet Tracking Application

A full-stack timesheet tracking system built with FastAPI (Python 3.11) and React 18 (Vite + Tailwind CSS).

## Features
- **JWT Authentication & RBAC**: Roles for `Employee` (logs hours) and `Manager` (approves hours, manages projects).
- **Project Management**: Manager CRUD operations for projects, active status toggling.
- **Timesheet Management**: Weekly calendar hour logging, pending entry modifications, approval/rejection workflows.
- **Aggregation Summaries**: Weekly and monthly aggregated hours breakdown.
- **Database Migrations**: Managed via Alembic.

## Full-Stack Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Backend Setup (Server)
```bash
# Navigate to server directory or root
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r server/requirements.txt

# Start backend server (runs on port 8000)
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup (Client)
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Default Ports
- Backend API: `http://localhost:8000` (Swagger docs at `/docs`)
- Frontend Dev Server: `http://localhost:5173`

### Seed Test Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Employee** | `employee@example.com` | `employee123` |
| **Manager** | `manager@example.com` | `manager123` |
| **Test User (Alt)** | `test@example.com` | `testpassword` |
| **Admin (Manager Alt)** | `admin@example.com` | `adminpassword` |

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

