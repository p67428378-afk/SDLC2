# Project Features

## SCRUM-166 - Build Timesheet Tracking Application with JWT Auth, Role-Based Access, Project & Timesheet CRUD, Approval Workflows, and Aggregation

### Feature Summary
A web application that allows Employees to log work hours against active projects via a weekly calendar dashboard, while Managers can manage projects, review and bulk approve/reject pending timesheet entries, and view aggregated hours summaries.

### Key Features
- JWT Authentication & Role-Based Access Control (Employee and Manager roles)
- Database Models for User, Project, and TimesheetEntry
- REST API for Projects (Manager CRUD), Timesheets (Employee CRUD for pending entries, Manager approval endpoint), and Summary aggregations (weekly/monthly)
- Responsive React 18 UI with Login/Registration, role-based navigation, Employee Weekly Calendar view, and Manager Dashboard for bulk approvals/rejections
- Database migrations with Alembic (init) and automated API testing with pytest
