from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from server.database import get_db
from server import schemas, crud

router = APIRouter(prefix="/api/v1")


@router.get("/kpis", response_model=schemas.KPISchema)
def get_kpis(db: Session = Depends(get_db)):
    try:
        return crud.get_kpis(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs while fetching KPIs: {str(e)}",
        )


@router.get("/skus", response_model=List[schemas.SKUSchema])
def get_skus(
    sort_by: Optional[str] = Query(
        None, description="Sort field: sales, units_sold, sales_per_linear_ft"
    ),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by status: GROW, MAINTAIN, SWAP, REDUCE",
    ),
    db: Session = Depends(get_db),
):
    # Validate query parameters
    if sort_by and sort_by.lower() not in [
        "sales",
        "units_sold",
        "sales_per_linear_ft",
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort_by parameter. Allowed: sales, units_sold, sales_per_linear_ft",
        )
    if status_filter and status_filter.upper() not in [
        "GROW",
        "MAINTAIN",
        "SWAP",
        "REDUCE",
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status parameter. Allowed: GROW, MAINTAIN, SWAP, REDUCE",
        )

    try:
        return crud.get_skus(db, sort_by=sort_by, status=status_filter)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs while fetching SKUs: {str(e)}",
        )


@router.get("/scenarios/{scenario_name}", response_model=schemas.ScenarioSchema)
def get_scenario(scenario_name: str, db: Session = Depends(get_db)):
    try:
        scenario = crud.get_scenario(db, scenario_name)
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario '{scenario_name}' not found",
            )
        return scenario
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs while fetching scenario details: {str(e)}",
        )


@router.post(
    "/submissions",
    response_model=schemas.SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_submission(payload: schemas.SubmissionCreate, db: Session = Depends(get_db)):
    if not payload.scenario_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="scenario_name is required"
        )
    try:
        submission = crud.create_submission(db, payload.scenario_name)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid scenario name: '{payload.scenario_name}'",
            )
        return submission
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs during submission: {str(e)}",
        )


@router.get(
    "/submissions/{submission_id}", response_model=schemas.SubmissionDetailResponse
)
def get_submission(submission_id: str, db: Session = Depends(get_db)):
    try:
        submission = crud.get_submission(db, submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission ID '{submission_id}' not found",
            )
        return submission
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error occurs while fetching submission details: {str(e)}",
        )
