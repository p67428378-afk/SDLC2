# Apex Bank Mortgage Payment System

This repository contains the "Mortgage Payment from Online Banking" feature for Apex Bank. It allows authenticated customers to pay their mortgage directly from a linked deposit account (DDA or Savings).

## Features

- **Mortgage Details**: View outstanding balance, next payment due date, interest rate, escrow balance, and loan term.
- **Make Payment**: Select eligible source accounts (DDA/Savings), input payment amount and date.
- **Payment Review**: Review payment details before submission.
- **Confirmation**: View unique confirmation number, updated mortgage balance, and print receipt.
- **Scheduled Payments**: View, modify, or cancel upcoming and recurring mortgage payments.
- **Transactional Consistency**: Saga pattern orchestrates Fiserv debit and Cenlar payment posting with automatic compensation/reversal on partial failure.
- **Idempotency**: Prevents duplicate payments and double-submits.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.x, SQLite (local/tests)
- **Frontend**: React 18, Vite, Tailwind CSS

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   uvicorn server.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`. You can view the interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.

### Running Tests

To run the backend test suite:
```bash
pytest
```

## Test Credentials

- **Regular User**:
  - Email: `test@example.com`
  - Username: `testuser`
  - Password: `testpassword`

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

