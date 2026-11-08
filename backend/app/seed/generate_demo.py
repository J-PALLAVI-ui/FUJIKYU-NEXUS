import os
import random
import datetime
from pathlib import Path
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from backend.app.database import engine, Base, SessionLocal
from backend.app.models.entities import (
    User, BusinessDivision, DataSource, Dataset, DatasetSchema, ColumnMapping,
    IngestionJob, ProcessingLog, DataQualityResult, BusinessRecord,
    AnalyticsResult, ModelRegistry, ModelPrediction, DetectedAnomaly,
    BusinessInsight, DXRecommendation, ImprovementTracking,
    ReportHistory, Notification, AuditLog
)
from backend.app.engines.analytics_engine import workflow_registry
from backend.app.engines.ml_engine import MachineLearningEngine
from backend.app.engines.discovery_engine import AutonomousBusinessDiscoveryEngine
from backend.app.config import BASE_DIR, INCOMING_DIR, PROCESSED_DIR

DIVISIONS = [
    {"code": "railway", "name": "Railway & Transportation", "name_ja": "鉄道・運輸事業", "icon": "Train", "color": "#0066CC", "desc": "Fujikyuko Line commuter, tourist express trains and regional highway bus services."},
    {"code": "amusement", "name": "Amusement Parks & Attractions", "name_ja": "遊園地・レジャー事業", "icon": "FerrisWheel", "color": "#E63946", "desc": "Fuji-Q Highland thrill coasters, Thomas Land family attractions, and observation decks."},
    {"code": "hotels", "name": "Hotels & Tourism", "name_ja": "ホテル・観光事業", "icon": "Hotel", "color": "#2A9D8F", "desc": "Highland Resort Hotel & Spa, Mt. Fuji regional lodges, cabins, and glamping resorts."},
    {"code": "retail", "name": "Retail & Shopping", "name_ja": "物販・流通事業", "icon": "ShoppingBag", "color": "#F4A261", "desc": "Fujiyama Bazaar, station convenience outlets, regional Yamanashi craft and confectionery shops."},
    {"code": "restaurants", "name": "Restaurants & Food Services", "name_ja": "飲食・レストラン事業", "icon": "Utensils", "color": "#E76F51", "desc": "Hoto specialty dining, Fujiyama Terrace buffet, park cafes and regional eateries."},
    {"code": "real_estate", "name": "Real Estate & Leasing", "name_ja": "不動産・開発事業", "icon": "Building2", "color": "#457B9D", "desc": "Commercial leasing of station retail buildings, regional developments and commercial properties."},
    {"code": "construction", "name": "Construction & Engineering", "name_ja": "土木・建設エンジニアリング", "icon": "HardHat", "color": "#D4A373", "desc": "Railway infrastructure maintenance, attraction structural engineering, and facility expansions."},
    {"code": "it_services", "name": "IT & Digital Services", "name_ja": "情報・デジタルDX事業", "icon": "Cpu", "color": "#6D597A", "desc": "Smart-Pass ticketing engines, IoT sensor networks, mobile applications and digital enterprise infrastructure."}
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # 1. Seed Business Divisions
    for div_info in DIVISIONS:
        existing = db.query(BusinessDivision).filter_by(code=div_info["code"]).first()
        if not existing:
            db.add(BusinessDivision(
                code=div_info["code"],
                name=div_info["name"],
                name_ja=div_info["name_ja"],
                description=div_info["desc"],
                icon=div_info["icon"],
                primary_color=div_info["color"]
            ))

    # 2. Seed Default Users
    if not db.query(User).first():
        db.add(User(
            username="nexus_admin",
            email="admin@fujikyu.co.jp",
            full_name="Kenji Watanabe (DX Executive)",
            role="executive",
            department="Corporate DX Strategy Office"
        ))
        db.add(User(
            username="data_analyst",
            email="analyst@fujikyu.co.jp",
            full_name="Yuki Sato (Senior Data Engineer)",
            role="analyst",
            department="Business Intelligence Division"
        ))

    # 3. Seed Data Sources
    data_sources_def = [
        {"name": "Fujikyuko Train Telemetry & Turnstile Feed", "type": "rest_api", "div": "railway", "recs": 18450},
        {"name": "Fuji-Q Highland Turnstile RFID System", "type": "postgresql", "div": "amusement", "recs": 24200},
        {"name": "Opera Hospitality PMS Database", "type": "mysql", "div": "hotels", "recs": 12800},
        {"name": "Fujiyama Bazaar POS Cloud Ingestion", "type": "csv", "div": "retail", "recs": 35400},
        {"name": "Food & Beverage Kitchen Order System (KOS)", "type": "rest_api", "div": "restaurants", "recs": 19600},
        {"name": "Commercial Real Estate Tenant Ledger", "type": "excel", "div": "real_estate", "recs": 4500},
        {"name": "Construction PM Primavera Data Exchange", "type": "folder_watch", "div": "construction", "recs": 3200},
        {"name": "Nexus IoT Edge Gateway & Cloud Telemetry", "type": "rest_api", "div": "it_services", "recs": 48900}
    ]

    for ds in data_sources_def:
        if not db.query(DataSource).filter_by(name=ds["name"]).first():
            db.add(DataSource(
                name=ds["name"],
                source_type=ds["type"],
                division_code=ds["div"],
                status="active",
                records_imported=ds["recs"],
                config_json={"endpoint": f"https://api.internal.fujikyu.co.jp/v2/{ds['div']}", "interval_mins": 15}
            ))
    db.commit()

    # 4. Generate 60 days of historical business records
    if db.query(BusinessRecord).count() < 100:
        print("Generating realistic synthetic business records...")
        start_date = datetime.datetime.utcnow() - datetime.timedelta(days=60)
        
        railway_stations = ["Kawaguchiko", "Fuji-Q Highland", "Mt. Fuji", "Shimoyoshida", "Tsurubunka-daigaku", "Otsuki"]
        amusement_rides = ["Fujiyama Coaster", "Eejanaika 4D", "Takabisha", "Zokkon Motorbike", "Thomas Land Family Zone", "Super Scary Labyrinth"]
        hotel_props = ["Highland Resort Hotel & Spa", "Hotel Mt. Fuji", "PICA Fujiyama Glamping", "Fuji View Cabin Resort"]
        retail_products = [
            ("Fujiyama Cookie Gift Box", "Confectionery", 1680),
            ("Koshu Yamanashi Wine Special Reserve", "Beverage", 3400),
            ("Kikyo Shingen Mochi Traditional Set", "Confectionery", 1250),
            ("Mt. Fuji Indigo Hand-Dyed Towel", "Souvenirs", 2200),
            ("Fuji-Q Highland Limited Edition Mascot", "Toys", 1850)
        ]
        restaurant_outlets = ["Highland Hoto Main Hall", "Fujiyama Terrace Buffet", "Coaster Dining Hub", "Kawaguchiko Soba Outpost"]
        re_properties = ["Q-Mart Station Plaza", "Kawaguchiko Commercial Arcade", "Otsuki Logistics Hub"]
        const_projects = ["Fujikyuko Line Bridge Seismic Retrofit", "Highland Resort Spa Expansion", "Kawaguchiko Track Switch Overhaul"]
        it_systems = ["Smart Pass Ticketing API", "Fuji-Q Official App Gateway", "IoT Train Speed Telemetry", "Central POS Synchronizer"]

        all_records = []

        for day_offset in range(61):
            curr_date = start_date + datetime.timedelta(days=day_offset)
            is_weekend = curr_date.weekday() in [5, 6]
            weekend_boost = 1.7 if is_weekend else 1.0

            # 1. Railway records
            for st in railway_stations:
                base_pax = 1800 if st in ["Kawaguchiko", "Otsuki", "Fuji-Q Highland"] else 650
                pax = int(base_pax * weekend_boost * random.uniform(0.85, 1.25))
                delay = round(max(0.0, random.gauss(1.2, 1.5)), 1)
                all_records.append(BusinessRecord(
                    division_code="railway",
                    record_date=curr_date,
                    record_type="passenger",
                    entity_name=st,
                    location="Yamanashi Region",
                    category="Commuter & Express",
                    metric_name="passenger_count",
                    metric_value=pax,
                    secondary_value=delay,
                    currency="JPY"
                ))

            # 2. Amusement records
            for ride in amusement_rides:
                base_visitors = 2200 if "Fujiyama" in ride or "Eejanaika" in ride else 1100
                visitors = int(base_visitors * weekend_boost * random.uniform(0.8, 1.3))
                # Inject a wait time anomaly 12 days ago
                wait_time = round(random.uniform(35, 95) * (1.8 if is_weekend else 1.0), 1)
                if day_offset == 48 and "Fujiyama" in ride:
                    visitors = int(visitors * 1.6) # surge anomaly!
                    wait_time = 165.0
                all_records.append(BusinessRecord(
                    division_code="amusement",
                    record_date=curr_date,
                    record_type="visitor",
                    entity_name=ride,
                    location="Fuji-Q Highland Park",
                    category="Thrill Attractions",
                    metric_name="visitor_count",
                    metric_value=visitors,
                    secondary_value=wait_time,
                    currency="JPY"
                ))

            # 3. Hotels records
            for prop in hotel_props:
                base_occ = 85.0 if is_weekend else 68.0
                occ = min(99.5, max(40.0, round(base_occ + random.uniform(-10.0, 12.0), 1)))
                rev = int(occ * 45 * random.uniform(22000, 31000))
                all_records.append(BusinessRecord(
                    division_code="hotels",
                    record_date=curr_date,
                    record_type="occupancy",
                    entity_name=prop,
                    location="Fujiyoshida / Kawaguchiko",
                    category="Resort Hotel",
                    metric_name="room_occupancy_pct",
                    metric_value=occ,
                    secondary_value=rev,
                    currency="JPY"
                ))

            # 4. Retail records
            for prod, cat, unit_price in retail_products:
                units = int((80 if is_weekend else 35) * random.uniform(0.75, 1.4))
                sales_jpy = units * unit_price
                all_records.append(BusinessRecord(
                    division_code="retail",
                    record_date=curr_date,
                    record_type="sale",
                    entity_name=prod,
                    location="Fujiyama Bazaar Store #1",
                    category=cat,
                    metric_name="revenue_jpy",
                    metric_value=sales_jpy,
                    secondary_value=units,
                    currency="JPY"
                ))

            # 5. Restaurants
            for rest in restaurant_outlets:
                orders = int((320 if is_weekend else 140) * random.uniform(0.8, 1.25))
                sales_jpy = int(orders * random.uniform(1600, 2400))
                all_records.append(BusinessRecord(
                    division_code="restaurants",
                    record_date=curr_date,
                    record_type="sale",
                    entity_name=rest,
                    location="Highland Resort Precinct",
                    category="Dining",
                    metric_name="sales_jpy",
                    metric_value=sales_jpy,
                    secondary_value=orders,
                    currency="JPY"
                ))

            # 6. Real Estate
            if day_offset % 7 == 0:
                for prop in re_properties:
                    occ = round(random.uniform(92.0, 98.5), 1)
                    rent_income = int(random.uniform(2800000, 4500000))
                    all_records.append(BusinessRecord(
                        division_code="real_estate",
                        record_date=curr_date,
                        record_type="revenue",
                        entity_name=prop,
                        location="Station Commercial Hub",
                        category="Commercial Lease",
                        metric_name="occupancy_rate_pct",
                        metric_value=occ,
                        secondary_value=rent_income,
                        currency="JPY"
                    ))

            # 7. Construction
            if day_offset % 7 == 0:
                for proj in const_projects:
                    progress = min(100.0, round(30.0 + (day_offset * 1.1), 1))
                    spend = int(random.uniform(4500000, 12000000))
                    all_records.append(BusinessRecord(
                        division_code="construction",
                        record_date=curr_date,
                        record_type="progress",
                        entity_name=proj,
                        location="Infrastructure Site",
                        category="Civil Maintenance",
                        metric_name="progress_pct",
                        metric_value=progress,
                        secondary_value=spend,
                        currency="JPY"
                    ))

            # 8. IT Services
            for sys in it_systems:
                uptime = round(random.uniform(99.85, 99.99), 3)
                incidents = 1 if random.random() < 0.08 else 0
                all_records.append(BusinessRecord(
                    division_code="it_services",
                    record_date=curr_date,
                    record_type="uptime",
                    entity_name=sys,
                    location="Enterprise Cloud",
                    category="Digital Infrastructure",
                    metric_name="uptime_pct",
                    metric_value=uptime,
                    secondary_value=incidents,
                    currency="JPY"
                ))

        db.bulk_save_objects(all_records)
        db.commit()
        print(f"Successfully generated {len(all_records)} historical business records.")

    # 5. Populate Initial Anomalies & Discovery Insights
    if db.query(DetectedAnomaly).count() == 0:
        anom_date = datetime.datetime.utcnow() - datetime.timedelta(days=12)
        anom1 = DetectedAnomaly(
            division_code="amusement",
            metric_name="visitor_count",
            anomaly_date=anom_date,
            actual_value=18400.0,
            expected_value=11500.0,
            deviation_pct=60.0,
            z_score=3.14,
            severity="critical",
            explanation="Unusual visitor traffic spike observed on Fujiyama Coaster coinciding with regional festival weekend.",
            status="acknowledged"
        )
        anom2 = DetectedAnomaly(
            division_code="railway",
            metric_name="avg_delay_minutes",
            anomaly_date=datetime.datetime.utcnow() - datetime.timedelta(days=5),
            actual_value=14.8,
            expected_value=2.1,
            deviation_pct=604.8,
            z_score=4.25,
            severity="high",
            explanation="Significant signal delay recorded near Otsuki connection due to sudden heavy snowfall alert.",
            status="resolved"
        )
        db.add_all([anom1, anom2])
        db.commit()

        # Business Insights
        insight1 = BusinessInsight(
            title="Amusement Park Surge Exceeds Express Queue Bottleneck Capacity",
            division_code="amusement",
            detection_date=anom_date,
            severity="critical",
            supporting_data_json={"peak_visitors": 18400, "average_wait_minutes": 165},
            historical_comparison="Observed visitor volume exceeded the 99th percentile of historic Saturday operating thresholds.",
            possible_factors_json=[
                "Confirmed Evidence: Turnstile admissions showed +60.0% deviation against expected capacity.",
                "Hypothesis (Unconfirmed): Combination of clear Mt. Fuji weather visibility and Tokyo holiday influx.",
                "Hypothesis (Unconfirmed): Manual express pass ticket validation at coaster entry gates caused line stagnation."
            ],
            business_impact_yen=4200000.0,
            confidence_level=0.92,
            suggested_investigation="Review Smart-Pass automated QR scanner logs vs manual station staff dispatch times.",
            recommended_improvement="Deploy AI Dynamic Fast-Pass scheduling to smoothly redistribute arrival slots.",
            is_hypothesis=True
        )

        insight2 = BusinessInsight(
            title="High Synergy: Railway Transit Surges Directly Drive Station Souvenir Confectionery Sales",
            division_code="retail",
            detection_date=datetime.datetime.utcnow() - datetime.timedelta(days=3),
            severity="opportunity",
            supporting_data_json={"correlation_r": 0.86, "incremental_sales_yen": 3200000},
            historical_comparison="Retail checkout counts at Otsuki and Kawaguchiko platforms scale linearly with express train arrivals.",
            possible_factors_json=[
                "Confirmed Evidence: POS registers at platform stalls experience 80% of daily transactions within 15 minutes of inbound express arrivals.",
                "Hypothesis (Unconfirmed): Passengers prefer packaged souvenirs immediately prior to train departure to avoid carrying luggage."
            ],
            business_impact_yen=3200000.0,
            confidence_level=0.95,
            suggested_investigation="Evaluate passenger dwell time between train arrival and platform departure.",
            recommended_improvement="Introduce pre-order digital pickup lockers at train car vestibules via Fujikyu mobile app.",
            is_hypothesis=False
        )

        db.add_all([insight1, insight2])
        db.commit()

    # 6. DX Recommendations & Tracking
    if db.query(DXRecommendation).count() == 0:
        dx1 = DXRecommendation(
            title="AI Dynamic Fast-Pass & Queue Balancing for Fujiyama & Eejanaika",
            division_code="amusement",
            priority="high",
            category="AI Demand Forecasting & Smart Queuing",
            impact_score=9.2,
            effort_score=4.5,
            urgency_score=8.5,
            estimated_cost_yen=4500000.0,
            expected_benefit_yen=16800000.0,
            confidence_score=0.93,
            status="approved",
            baseline_kpi="Average queue wait time: 110 minutes on peak weekends",
            target_kpi="Reduce average queue wait time to < 45 minutes",
            actual_kpi="52 minutes (Pilot trial on Eejanaika)",
            measured_improvement="52.7% reduction in queue congestion",
            approved_by="Kenji Watanabe (DX Executive)"
        )

        dx2 = DXRecommendation(
            title="Autonomous Railway Track IoT Vibration & Weather Predictive Maintenance",
            division_code="railway",
            priority="high",
            category="IoT & Predictive Maintenance",
            impact_score=8.8,
            effort_score=5.0,
            urgency_score=7.8,
            estimated_cost_yen=6200000.0,
            expected_benefit_yen=21000000.0,
            confidence_score=0.91,
            status="in_progress",
            baseline_kpi="Unscheduled track inspection delays: 18.5 hours / quarter",
            target_kpi="Zero unscheduled service cancellations due to rail wear",
            approved_by="Kenji Watanabe (DX Executive)"
        )

        dx3 = DXRecommendation(
            title="Unified Fujikyu Member App & Cross-Division Loyalty Passport",
            division_code="retail",
            priority="medium",
            category="Digital Customer Experience",
            impact_score=7.9,
            effort_score=6.2,
            urgency_score=6.5,
            estimated_cost_yen=5000000.0,
            expected_benefit_yen=14200000.0,
            confidence_score=0.88,
            status="proposed",
            baseline_kpi="Cross-division customer repeat rate: 14.2%",
            target_kpi="Elevate repeat cross-division spending to 28.0%"
        )

        db.add_all([dx1, dx2, dx3])
        db.commit()

        # Add improvement tracking milestones for dx1
        db.add(ImprovementTracking(
            recommendation_id=dx1.id,
            milestone="Phase 1: Sensor Gateway & Bluetooth Beacon Deployment at Fuji-Q Highland",
            target_date=datetime.datetime.utcnow() + datetime.timedelta(days=14),
            status="completed",
            progress_pct=100,
            notes="Beacons successfully calibrated across 6 major coaster stations."
        ))
        db.add(ImprovementTracking(
            recommendation_id=dx1.id,
            milestone="Phase 2: Mobile App Dynamic Reservation Integration",
            target_date=datetime.datetime.utcnow() + datetime.timedelta(days=35),
            status="in_progress",
            progress_pct=75,
            notes="Backend API connected to reservation engine; beta testing active."
        ))
        db.commit()

    # 7. Notifications & Audit Logs
    if db.query(Notification).count() == 0:
        db.add(Notification(
            title="Autonomous Discovery Alert",
            message="Critical visitor surge anomaly detected on Fuji-Q Highland attractions. AI recommendation available.",
            category="alert",
            division_code="amusement",
            severity="warning"
        ))
        db.add(Notification(
            title="Pipeline Synchronization Success",
            message="Nightly incremental batch completed for 8 divisions. 100% data quality integrity verified.",
            category="ingestion",
            division_code="all",
            severity="success"
        ))
        db.commit()

    # 8. Create Raw Sample CSVs in `backend/app/seed/raw_samples/` for Ingestion Testing
    raw_dir = Path(__file__).resolve().parent / "raw_samples"
    raw_dir.mkdir(parents=True, exist_ok=True)

    # Sample A: Railway with duplicates and missing values
    railway_sample_data = {
        "Date": ["2026-03-01", "2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-04", "2026-03-05"], # Has duplicate
        "Station_Name": ["Kawaguchiko", "Kawaguchiko", "Mt. Fuji", "Otsuki", "Shimoyoshida", "Shimoyoshida", None], # Duplicate + missing
        "Ridership": [1850, 1850, 1420, 2100, 780, 780, 650], # Duplicate
        "Ticket_Sales_JPY": [2183000, 2183000, 1675600, 2478000, 920400, 920400, -500], # Has invalid negative price!
        "Lateness_Min": [1.5, 1.5, 0.0, 3.2, 0.5, 0.5, 2.0]
    }
    pd.DataFrame(railway_sample_data).to_csv(raw_dir / "sample_railway_raw.csv", index=False)

    # Sample B: Amusement Park Ingestion
    amusement_sample_data = {
        "Timestamp": ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"],
        "Ride_Name": ["Fujiyama Coaster", "Eejanaika 4D", "Takabisha", "Zokkon", "Thomas Land"],
        "Attendance": [2800, 2650, 1900, 3100, 1450],
        "Queue_Minutes": [75.0, 85.0, 45.0, 90.0, 20.0],
        "Gate_Sales_JPY": [19040000, 18020000, 12920000, 21080000, 9860000]
    }
    pd.DataFrame(amusement_sample_data).to_csv(raw_dir / "sample_amusement_raw.csv", index=False)

    # Sample C: Hotel Occupancy
    hotel_sample_data = {
        "Stay_Date": ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"],
        "Hotel_Name": ["Highland Resort Hotel & Spa", "Hotel Mt. Fuji", "PICA Fujiyama Glamping", "Highland Resort Hotel & Spa", "Hotel Mt. Fuji"],
        "Occupancy_Pct": [92.5, 84.0, 76.5, 88.0, 81.5],
        "Sales_JPY": [2850000, 2150000, 1450000, 2680000, 2090000]
    }
    pd.DataFrame(hotel_sample_data).to_csv(raw_dir / "sample_hotel_raw.csv", index=False)

    # Also copy sample_railway_raw.csv into incoming dir for live drop-folder demo
    pd.DataFrame(railway_sample_data).to_csv(INCOMING_DIR / "incoming_fujikyu_railway_batch.csv", index=False)

    db.close()
    print("Database seeding and raw demonstration datasets initialization complete.")

if __name__ == "__main__":
    seed_database()
