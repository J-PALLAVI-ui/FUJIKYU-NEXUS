from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
from backend.app.database import get_db
from backend.app.models.entities import BusinessInsight, DetectedAnomaly

router = APIRouter(prefix="/api/discovery", tags=["Autonomous Business Discovery Engine"])

@router.get("/insights")
def list_business_insights(
    division_code: str = Query("all"),
    db: Session = Depends(get_db)
):
    query = db.query(BusinessInsight)
    if division_code != "all":
        query = query.filter_by(division_code=division_code)
    
    insights = query.order_by(BusinessInsight.detection_date.desc()).all()

    return [{
        "id": ins.id,
        "title": ins.title,
        "division_code": ins.division_code,
        "detection_date": ins.detection_date.strftime("%Y-%m-%d") if ins.detection_date else "",
        "severity": ins.severity,
        "supporting_data": ins.supporting_data_json,
        "historical_comparison": ins.historical_comparison,
        "possible_factors": ins.possible_factors_json,
        "business_impact_yen": ins.business_impact_yen,
        "confidence_level": ins.confidence_level,
        "suggested_investigation": ins.suggested_investigation,
        "recommended_improvement": ins.recommended_improvement,
        "is_hypothesis": ins.is_hypothesis,
        "created_at": ins.created_at.isoformat() if ins.created_at else ""
    } for ins in insights]

@router.get("/anomalies")
def list_anomalies(db: Session = Depends(get_db)):
    anomalies = db.query(DetectedAnomaly).order_by(DetectedAnomaly.detected_at.desc()).all()
    return [{
        "id": a.id,
        "division_code": a.division_code,
        "metric_name": a.metric_name,
        "anomaly_date": a.anomaly_date.strftime("%Y-%m-%d"),
        "actual_value": a.actual_value,
        "expected_value": a.expected_value,
        "deviation_pct": a.deviation_pct,
        "z_score": a.z_score,
        "severity": a.severity,
        "explanation": a.explanation,
        "status": a.status
    } for a in anomalies]
