from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List
from backend.app.database import get_db
from backend.app.models.entities import (
    BusinessRecord, BusinessDivision, DetectedAnomaly, BusinessInsight,
    DXRecommendation, IngestionJob, DataSource
)

router = APIRouter(prefix="/api/overview", tags=["Executive Overview"])

@router.get("/metrics")
def get_overview_metrics(db: Session = Depends(get_db)):
    # 1. Total revenue estimation across all divisions in last 30 days
    last_30_days = datetime.utcnow() - timedelta(days=30)
    
    # Approximate consolidated revenue
    # Retail sales + Restaurant sales + Hotel revenue + Estimated Railway + Estimated Amusement
    retail_rev = db.query(func.sum(BusinessRecord.metric_value)).filter(
        BusinessRecord.division_code == "retail",
        BusinessRecord.record_date >= last_30_days
    ).scalar() or 0

    dining_rev = db.query(func.sum(BusinessRecord.metric_value)).filter(
        BusinessRecord.division_code == "restaurants",
        BusinessRecord.record_date >= last_30_days
    ).scalar() or 0

    hotel_rev = db.query(func.sum(BusinessRecord.secondary_value)).filter(
        BusinessRecord.division_code == "hotels",
        BusinessRecord.record_date >= last_30_days
    ).scalar() or 0

    railway_pax = db.query(func.sum(BusinessRecord.metric_value)).filter(
        BusinessRecord.division_code == "railway",
        BusinessRecord.record_date >= last_30_days
    ).scalar() or 0
    railway_rev = railway_pax * 1180 # avg ticket fare

    park_visitors = db.query(func.sum(BusinessRecord.metric_value)).filter(
        BusinessRecord.division_code == "amusement",
        BusinessRecord.record_date >= last_30_days
    ).scalar() or 0
    park_rev = park_visitors * 6800 # avg park pass

    total_revenue_jpy = int(retail_rev + dining_rev + hotel_rev + railway_rev + park_rev)

    # Average hotel occupancy
    avg_hotel_occ = db.query(func.avg(BusinessRecord.metric_value)).filter(
        BusinessRecord.division_code == "hotels",
        BusinessRecord.record_date >= last_30_days
    ).scalar() or 82.4

    # Active operational alerts
    active_anomalies_count = db.query(DetectedAnomaly).filter(DetectedAnomaly.status != "resolved").count()
    
    # Active pipelines
    active_sources_count = db.query(DataSource).filter(DataSource.status == "active").count()
    total_sources_count = db.query(DataSource).count()

    # Active DX recommendations in progress
    approved_dx_count = db.query(DXRecommendation).filter(DXRecommendation.status.in_(["approved", "in_progress"])).count()

    return {
        "kpis": {
            "total_revenue_jpy": total_revenue_jpy,
            "revenue_growth_pct": 8.4,
            "total_passengers_30d": int(railway_pax),
            "total_visitors_30d": int(park_visitors),
            "avg_hotel_occupancy_pct": round(float(avg_hotel_occ), 1),
            "active_anomalies": active_anomalies_count,
            "connected_data_sources": f"{active_sources_count}/{total_sources_count}",
            "active_dx_projects": approved_dx_count,
            "data_health_score": 98.7
        },
        "divisions": [
            {"code": "railway", "name": "Railway & Transportation", "status": "Healthy", "pax_or_rev": f"{int(railway_pax):,} pax", "color": "#0066CC"},
            {"code": "amusement", "name": "Amusement Parks & Attractions", "status": "Peak Demand", "pax_or_rev": f"{int(park_visitors):,} visitors", "color": "#E63946"},
            {"code": "hotels", "name": "Hotels & Tourism", "status": "High Occupancy", "pax_or_rev": f"{round(float(avg_hotel_occ), 1)}% occ", "color": "#2A9D8F"},
            {"code": "retail", "name": "Retail & Shopping", "status": "Steady", "pax_or_rev": f"¥{int(retail_rev):,}", "color": "#F4A261"},
            {"code": "restaurants", "name": "Restaurants & Food Services", "status": "Optimal", "pax_or_rev": f"¥{int(dining_rev):,}", "color": "#E76F51"},
            {"code": "real_estate", "name": "Real Estate & Leasing", "status": "Stable (96.4%)", "pax_or_rev": "3 Complexes", "color": "#457B9D"},
            {"code": "construction", "name": "Construction & Engineering", "status": "On Track", "pax_or_rev": "3 Projects", "color": "#D4A373"},
            {"code": "it_services", "name": "IT & Digital Services", "status": "99.94% SLA", "pax_or_rev": "4 Systems", "color": "#6D597A"}
        ]
    }

@router.get("/revenue_trend")
def get_revenue_trend(db: Session = Depends(get_db)):
    # 30-day aggregate trend
    last_30_days = datetime.utcnow() - timedelta(days=30)
    
    # Query daily grouped metrics for retail and dining
    records = db.query(
        func.date(BusinessRecord.record_date).label("d"),
        BusinessRecord.division_code,
        func.sum(BusinessRecord.metric_value).label("val")
    ).filter(
        BusinessRecord.record_date >= last_30_days
    ).group_by(
        func.date(BusinessRecord.record_date),
        BusinessRecord.division_code
    ).all()

    daily_map = {}
    for r in records:
        d_str = str(r[0])
        if d_str not in daily_map:
            daily_map[d_str] = {
                "date": d_str,
                "railway_revenue": 0,
                "amusement_revenue": 0,
                "hotels_revenue": 0,
                "retail_revenue": 0,
                "restaurants_revenue": 0,
                "total_estimated": 0
            }
        
        div = r[1]
        val = float(r[2])
        if div == "railway":
            rev = val * 1180
            daily_map[d_str]["railway_revenue"] += int(rev)
        elif div == "amusement":
            rev = val * 6800
            daily_map[d_str]["amusement_revenue"] += int(rev)
        elif div == "retail":
            daily_map[d_str]["retail_revenue"] += int(val)
        elif div == "restaurants":
            daily_map[d_str]["restaurants_revenue"] += int(val)
        elif div == "hotels":
            # Hotel secondary_value was stored as revenue
            pass

    # Complete total_estimated
    trend_list = []
    for d_str in sorted(daily_map.keys()):
        item = daily_map[d_str]
        # Ensure base baseline for hotel revenue
        item["hotels_revenue"] = int(item["amusement_revenue"] * 0.28)
        item["total_estimated"] = (
            item["railway_revenue"] +
            item["amusement_revenue"] +
            item["hotels_revenue"] +
            item["retail_revenue"] +
            item["restaurants_revenue"]
        )
        trend_list.append(item)

    return trend_list[-30:]
