from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models.project import Project
from server.models.time_entry import TimeEntry
from server.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    """List all active projects."""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return projects


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project with unique name and #RRGGBB hex color code validation."""
    # Check for duplicate project name (case-insensitive)
    existing = db.query(Project).filter(Project.name.ilike(project_in.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with name '{project_in.name}' already exists",
        )

    project = Project(name=project_in.name, color_code=project_in.color_code)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str, project_in: ProjectUpdate, db: Session = Depends(get_db)
):
    """Update existing project details."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if project_in.name is not None and project_in.name.lower() != project.name.lower():
        existing = (
            db.query(Project)
            .filter(Project.name.ilike(project_in.name), Project.id != project_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project with name '{project_in.name}' already exists",
            )
        project.name = project_in.name

    if project_in.color_code is not None:
        project.color_code = project_in.color_code

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete project (returns HTTP 400 Bad Request if linked time entries exist)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    # Check for dependent time entries
    linked_count = (
        db.query(TimeEntry).filter(TimeEntry.project_id == project_id).count()
    )
    if linked_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete project '{project.name}' because it has existing time entries linked to it.",
        )

    db.delete(project)
    db.commit()
    return None
