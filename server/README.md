# Timesheet Tracking API (Server)

FastAPI-powered backend service for managing timesheets, projects, user authentication, and hours aggregation.

## Setup & Running

### 1. Environment Setup
Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r server/requirements.txt
```

### 2. Running Migrations
```bash
cd server
alembic upgrade head
cd ..
```

### 3. Running the Server
Run from the repository root:
```bash
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

### 4. Running Tests
```bash
pytest server/tests
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Register a new user (Employee or Manager)
- `POST /api/v1/auth/login` - Authenticate and retrieve JWT bearer access token
- `GET /api/v1/auth/me` - Get current authenticated user profile

### Projects (`/api/v1/projects`)
- `GET /api/v1/projects` - List active projects (Accessible by all authenticated users)
- `POST /api/v1/projects` - Create a project (Manager only)
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project details (Manager only)
- `DELETE /api/v1/projects/{id}` - Deactivate / delete project (Manager only)

### Timesheets (`/api/v1/timesheets`)
- `GET /api/v1/timesheets` - List timesheets (User's own for Employee; all for Manager)
- `POST /api/v1/timesheets` - Create a timesheet entry (Status: pending)
- `GET /api/v1/timesheets/{id}` - Get timesheet entry details
- `PUT /api/v1/timesheets/{id}` - Update pending entry (Owner only)
- `DELETE /api/v1/timesheets/{id}` - Delete pending entry (Owner only)
- `PUT /api/v1/timesheets/{id}/approve` - Approve or reject timesheet entry (Manager only)
- `PUT /api/v1/timesheets/bulk-approve` - Bulk approve/reject timesheet entries (Manager only)
- `GET /api/v1/timesheets/summary` - Aggregated hours summary (weekly/monthly)

## Test Credentials
- **Employee**: `employee@example.com` / `employee123`
- **Manager**: `manager@example.com` / `manager123`
- **Test User**: `test@example.com` / `testpassword`
- **Admin**: `admin@example.com` / `adminpassword`
