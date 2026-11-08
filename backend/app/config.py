import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
INCOMING_DIR = BASE_DIR / "data_incoming"
PROCESSED_DIR = BASE_DIR / "data_processed"
REPORTS_DIR = BASE_DIR / "reports"

# Ensure runtime directories exist
INCOMING_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Database Configuration: SQLite default for zero-friction local run; PostgreSQL via env
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'fujikyu_nexus.db'}")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SECRET_KEY = os.getenv("SECRET_KEY", "nexus-enterprise-secret-key-2026-fujikyu")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_DEMO_MODE = True
PROJECT_NAME = "FUJIKYU NEXUS"
TAGLINE = "One Company. All Businesses. One Intelligent Data Ecosystem."
APP_VERSION = "2.4.0-enterprise"
