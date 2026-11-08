from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from typing import Dict, Any, List
from backend.app.database import get_db
from backend.app.models.entities import ReportHistory, BusinessRecord
from backend.app.schemas.api_schemas import ReportGenerateRequest

router = APIRouter(prefix="/api/reports", tags=["AI-Generated Reports"])

@router.get("/history")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(ReportHistory).order_by(ReportHistory.generated_at.desc()).all()
    if not reports:
        # Generate initial reports
        now = datetime.utcnow()
        sample_reports = [
            ReportHistory(
                title="Executive Daily Operations Brief",
                report_type="daily",
                division_code="all",
                period_start=now - timedelta(days=1),
                period_end=now,
                format="pdf",
                status="ready",
                metadata_json={"source": "Consolidated ERP & Telemetry", "highlights": "All 8 divisions operational with 99.8% turnstile and sensor uptime."}
            ),
            ReportHistory(
                title="Weekly Cross-Division Performance & Synergy Review",
                report_type="weekly",
                division_code="all",
                period_start=now - timedelta(days=7),
                period_end=now,
                format="pdf",
                status="ready",
                metadata_json={"source": "Cross-Business Intelligence Engine", "highlights": "Fuji-Q attendance spike strongly elevated Otsuki-Kawaguchiko line ridership (+18%)."}
            ),
            ReportHistory(
                title="Monthly Retail & Confectionery Sales Optimization Report",
                report_type="sales",
                division_code="retail",
                period_start=now - timedelta(days=30),
                period_end=now,
                format="csv",
                status="ready",
                metadata_json={"source": "Fujiyama Bazaar POS Ingestion Feed", "highlights": "Top product Fujiyama Cookie Box generated ¥14.8M revenue."}
            )
        ]
        db.add_all(sample_reports)
        db.commit()
        reports = db.query(ReportHistory).order_by(ReportHistory.generated_at.desc()).all()

    return [{
        "id": r.id,
        "title": r.title,
        "report_type": r.report_type,
        "division_code": r.division_code,
        "period": f"{r.period_start.strftime('%Y-%m-%d') if r.period_start else ''} to {r.period_end.strftime('%Y-%m-%d') if r.period_end else ''}",
        "format": r.format,
        "status": r.status,
        "metadata": r.metadata_json,
        "generated_at": r.generated_at.strftime("%Y-%m-%d %H:%M") if r.generated_at else ""
    } for r in reports]

@router.post("/generate")
def generate_report(payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    new_rep = ReportHistory(
        title=payload.title,
        report_type=payload.report_type,
        division_code=payload.division_code,
        period_start=now - timedelta(days=14),
        period_end=now,
        format=payload.format,
        status="ready",
        metadata_json={
            "source": f"Fujikyu Nexus Enterprise Pipeline ({payload.division_code.upper()})",
            "generation_trigger": "Manual Request / Scheduled Batch",
            "kpi_summary": "1,823 validated business records integrated."
        }
    )
    db.add(new_rep)
    db.commit()
    db.refresh(new_rep)

    return {
        "status": "success",
        "message": f"Report '{new_rep.title}' successfully generated.",
        "report_id": new_rep.id,
        "download_url": f"/api/reports/{new_rep.id}/download"
    }

@router.get("/{report_id}/download")
def download_report_csv(report_id: int, db: Session = Depends(get_db)):
    rep = db.query(ReportHistory).filter_by(id=report_id).first()
    title = rep.title if rep else "fujikyu_nexus_report"
    
    # Query sample records for CSV export
    records = db.query(BusinessRecord).limit(100).all()
    csv_lines = ["record_id,division_code,record_date,entity_name,category,metric_name,metric_value,secondary_value,currency"]
    for r in records:
        csv_lines.append(f"{r.id},{r.division_code},{r.record_date.strftime('%Y-%m-%d')},\"{r.entity_name}\",\"{r.category}\",{r.metric_name},{r.metric_value},{r.secondary_value},{r.currency}")
    
    csv_content = "\n".join(csv_lines)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={title.replace(' ', '_').lower()}.csv"}
    )
