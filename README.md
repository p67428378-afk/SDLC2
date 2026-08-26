# Timesheet Tracking Application

A full-stack timesheet tracking system built with FastAPI (Python 3.11) and React 18 with Vite and Tailwind CSS.

## Features
- **JWT-based Authentication & RBAC**: Roles for `Employee` (log hours, view weekly summary) and `Manager` (manage projects, review/approve/reject submissions, view team analytics).
- **Project Management**: Managers can create, update, and toggle active status on projects.
- **Timesheet Management**: Weekly calendar view to log daily work hours against active projects. Edit and delete pending entries. Read-only once approved or rejected.
- **Approval Workflow**: Single and bulk approve/reject workflows for managers with optional rejection feedback.
- **Hours Aggregation**: Aggregated analytics by project and status for weekly and monthly timeframes.
- **Database Migrations**: SQLAlchemy 2.x ORM models with Alembic migrations.

## Seed Test Accounts
The application automatically seeds default accounts upon startup:
- **Employee**: `email: test@example.com` | `password: testpassword` | Role: `Employee`
- **Manager**: `email: admin@example.com` | `password: adminpassword` | Role: `Manager`

---

### Prerequisites
- Python 3.11+
- virtualenv / venv

### Setup Instructions
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations:
   ```bash
   alembic upgrade head
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The interactive Swagger API documentation is available at `http://localhost:8000/docs`.

### Running Backend Tests
Execute pytest with test coverage:
```bash
cd server
pytest -v
```

---

## Full-Stack Local Development

1. **Start Backend**:
   ```bash
   cd server
   uvicorn main:app --reload --port 8000
   ```
2. **Start Frontend**:
   ```bash
   cd client
   npm install
   npm run dev -- --port 5173
   ```
3. Open `http://localhost:5173` in your browser.

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

