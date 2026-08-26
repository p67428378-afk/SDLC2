# Project Features

## SCRUM-164 - Build Timesheet Tracking Application with Role-Based Access Control and Hours Aggregation

### Feature Summary
Allows employees to log, edit, and view weekly hours against active projects, and enables managers to create/manage projects, review pending timesheets across all employees, perform bulk approvals/rejections, and monitor aggregated team hours.

### Key Features
- JWT-based Authentication with Employee and Manager roles
- Manager CRUD operations for Projects
- Employee weekly calendar view to log, edit, and delete pending timesheet entries
- Manager Dashboard for single/bulk timesheet approval and rejection
- Weekly and monthly hours aggregation endpoints and analytics views
- SQLAlchemy 2.x database models and Alembic database migration setup
- Automated pytest API integration test suite
