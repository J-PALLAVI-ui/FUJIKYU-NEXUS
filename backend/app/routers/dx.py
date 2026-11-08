from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
from backend.app.database import get_db
from backend.app.models.entities import DXRecommendation, ImprovementTracking
from backend.app.schemas.api_schemas import DXRecommendationUpdate

router = APIRouter(prefix="/api/dx", tags=["DX Recommendation Engine"])

@router.get("/recommendations")
def list_recommendations(db: Session = Depends(get_db)):
    recs = db.query(DXRecommendation).order_by(DXRecommendation.impact_score.desc()).all()
    result = []
    for r in recs:
        # Load milestones
        milestones = db.query(ImprovementTracking).filter_by(recommendation_id=r.id).all()
        result.append({
            "id": r.id,
            "title": r.title,
            "division_code": r.division_code,
            "priority": r.priority,
            "category": r.category,
            "impact_score": r.impact_score,
            "effort_score": r.effort_score,
            "urgency_score": r.urgency_score,
            "estimated_cost_yen": r.estimated_cost_yen,
            "expected_benefit_yen": r.expected_benefit_yen,
            "roi_ratio": round(r.expected_benefit_yen / max(1, r.estimated_cost_yen), 1),
            "confidence_score": r.confidence_score,
            "status": r.status,
            "baseline_kpi": r.baseline_kpi,
            "target_kpi": r.target_kpi,
            "actual_kpi": r.actual_kpi,
            "measured_improvement": r.measured_improvement,
            "approved_by": r.approved_by,
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
            "milestones": [{
                "milestone": m.milestone,
                "target_date": m.target_date.strftime("%Y-%m-%d"),
                "status": m.status,
                "progress_pct": m.progress_pct,
                "notes": m.notes
            } for m in milestones]
        })
    return result

@router.put("/recommendations/{rec_id}")
def update_recommendation_status(
    rec_id: int,
    payload: DXRecommendationUpdate,
    db: Session = Depends(get_db)
):
    rec = db.query(DXRecommendation).filter_by(id=rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = payload.status
    if payload.approved_by:
        rec.approved_by = payload.approved_by
    if payload.target_kpi:
        rec.target_kpi = payload.target_kpi
    if payload.actual_kpi:
        rec.actual_kpi = payload.actual_kpi
    if payload.measured_improvement:
        rec.measured_improvement = payload.measured_improvement
    rec.updated_at = datetime.utcnow()

    db.commit()
    return {
        "status": "success",
        "message": f"Recommendation '{rec.title}' updated to status '{rec.status}'.",
        "approved_by": rec.approved_by,
        "current_status": rec.status
    }
