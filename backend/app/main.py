import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import PROJECT_NAME, TAGLINE, APP_VERSION, INCOMING_DIR, PROCESSED_DIR
from backend.app.database import engine, Base
from backend.app.seed.generate_demo import seed_database
from backend.app.routers import (
    overview, data_sources, data_automation, division_analytics,
    sales_intelligence, predictive, discovery, cross_business,
    assistant, dx, reports, health
)

# Background file watcher for incoming drop folder
def process_incoming_files_sync():
    import pandas as pd
    from backend.app.database import SessionLocal
    from backend.app.models.entities import Dataset, DatasetSchema, IngestionJob, DataQualityResult, BusinessRecord
    from backend.app.engines.adaptive_cleaner import SelfAdaptiveCleaner
    import time
    import datetime

    for file_path in INCOMING_DIR.glob("*.csv"):
        if file_path.name.startswith("."):
            continue

        db = SessionLocal()
        try:
            existing = db.query(Dataset).filter_by(name=file_path.name).first()
            if not existing:
                df = pd.read_csv(file_path)
                suggested_div, conf = SelfAdaptiveCleaner.infer_division(df.columns.tolist())
                
                dataset = Dataset(
                    name=file_path.name,
                    division_code=suggested_div,
                    file_format="csv",
                    row_count=len(df),
                    column_count=len(df.columns),
                    file_size_bytes=file_path.stat().st_size,
                    status="completed",
                    is_demo=False
                )
                db.add(dataset)
                db.commit()
                db.refresh(dataset)

                start_t = time.time()
                results = SelfAdaptiveCleaner.clean_and_validate(df, suggested_div)
                duration = int((time.time() - start_t) * 1000)

                job = IngestionJob(
                    dataset_id=dataset.id,
                    source_type="incoming_folder_watch",
                    division_code=suggested_div,
                    status="completed",
                    started_at=datetime.datetime.utcnow() - datetime.timedelta(milliseconds=duration),
                    completed_at=datetime.datetime.utcnow(),
                    duration_ms=duration,
                    records_total=results["total_incoming"],
                    records_valid=results["valid_count"],
                    records_invalid=results["invalid_count"],
                    records_duplicate=results["duplicate_count"],
                    records_missing_values=results["missing_values_count"],
                    quality_score=results["quality_score"]
                )
                db.add(job)
                db.commit()

                dq = DataQualityResult(
                    dataset_id=dataset.id,
                    job_id=job.id,
                    quality_score=results["quality_score"],
                    total_checks=len(results["checks_detail"]),
                    passed_checks=sum(1 for c in results["checks_detail"] if c["status"] == "PASSED"),
                    failed_checks=sum(1 for c in results["checks_detail"] if c["status"] != "PASSED"),
                    checks_detail_json=results["checks_detail"],
                    rejected_records_json=results["rejected_records"]
                )
                db.add(dq)
                db.commit()
                print(f"[NEXUS WATCHER] Auto-ingested new incoming file '{file_path.name}' -> Division: {suggested_div} (Quality: {results['quality_score']}%)")
        except Exception:
            pass
        finally:
            db.close()

async def incoming_folder_poll_worker():
    # Initial pause to let server finish bootstrap
    await asyncio.sleep(5)
    while True:
        try:
            await asyncio.to_thread(process_incoming_files_sync)
        except asyncio.CancelledError:
            break
        except Exception:
            pass

        try:
            await asyncio.sleep(20)
        except asyncio.CancelledError:
            break

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database is created and seeded
    Base.metadata.create_all(bind=engine)
    seed_database()
    
    # Start background folder watcher if enabled
    import os
    watcher_task = None
    if os.getenv("NEXUS_ENABLE_WATCHER", "1") == "1" and not os.getenv("NEXUS_TESTING"):
        watcher_task = asyncio.create_task(incoming_folder_poll_worker())
    
    yield
    
    if watcher_task:
        watcher_task.cancel()
        try:
            await watcher_task
        except asyncio.CancelledError:
            pass

app = FastAPI(
    title=PROJECT_NAME,
    description=f"### {TAGLINE}\nAutonomous enterprise data intelligence & analytics platform for Fujikyu.",
    version=APP_VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All Subsystem Routers
app.include_router(overview.router)
app.include_router(data_sources.router)
app.include_router(data_automation.router)
app.include_router(division_analytics.router)
app.include_router(sales_intelligence.router)
app.include_router(predictive.router)
app.include_router(discovery.router)
app.include_router(cross_business.router)
app.include_router(assistant.router)
app.include_router(dx.router)
app.include_router(reports.router)
app.include_router(health.router)

# Serve compiled React SPA
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    # Mount assets directory
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path in ["docs", "openapi.json", "redoc"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def get_root_info():
        return {
            "platform": PROJECT_NAME,
            "tagline": TAGLINE,
            "version": APP_VERSION,
            "status": "Operational",
            "demo_mode": True,
            "divisions_supported": [
                "Railway & Transportation",
                "Amusement Parks & Attractions",
                "Hotels & Tourism",
                "Retail & Shopping",
                "Restaurants & Food Services",
                "Real Estate & Property",
                "Construction & Engineering",
                "IT & Digital Services"
            ],
            "api_docs": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
