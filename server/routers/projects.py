from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import schemas, crud

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("", response_model=List[schemas.ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return crud.get_projects(db)


@router.post(
    "", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED
)
def create_project(project_in: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db, project_in)


@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: str, project_in: schemas.ProjectUpdate, db: Session = Depends(get_db)
):
    return crud.update_project(db, project_id, project_in)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    crud.delete_project(db, project_id)
    return None
