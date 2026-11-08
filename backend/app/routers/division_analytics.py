from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.app.database import get_db
from backend.app.models.entities import BusinessRecord, BusinessDivision
from backend.app.engines.analytics_engine import workflow_registry

router = APIRouter(prefix="/api/divisions", tags=["Division-Specific Analytical Workflows"])

@router.get("")
def list_divisions(db: Session = Depends(get_db)):
    divs = db.query(BusinessDivision).all()
    return [{
        "id": d.id,
        "code": d.code,
        "name": d.name,
        "name_ja": d.name_ja,
        "description": d.description,
        "icon": d.icon,
        "primary_color": d.primary_color
    } for d in divs]

@router.get("/{division_code}/analytics")
def get_division_analytics(division_code: str, db: Session = Depends(get_db)):
    records = db.query(BusinessRecord).filter_by(division_code=division_code).all()
    if not records:
        raise HTTPException(status_code=404, detail=f"No analytical records for division '{division_code}'")

    rec_dicts = [{
        "record_date": r.record_date,
        "entity_name": r.entity_name,
        "location": r.location,
        "category": r.category,
        "metric_name": r.metric_name,
        "metric_value": r.metric_value,
        "secondary_value": r.secondary_value
    } for r in records]

    workflow_fn = workflow_registry.get_workflow(division_code)
    results = workflow_fn(rec_dicts)

    return {
        "division_code": division_code,
        "total_records_analyzed": len(records),
        "analytics": results
    }
