import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst") # executive, manager, analyst, engineer, admin
    department = Column(String(100), default="Corporate DX & Data Strategy")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BusinessDivision(Base):
    __tablename__ = "business_divisions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    name_ja = Column(String(255), nullable=False)
    description = Column(Text)
    icon = Column(String(50), default="Building")
    primary_color = Column(String(20), default="#0066CC")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False) # csv, excel, postgresql, mysql, rest_api, folder_watch
    division_code = Column(String(50), default="railway")
    status = Column(String(50), default="active") # active, connected, warning, error
    last_sync = Column(DateTime, default=datetime.datetime.utcnow)
    records_imported = Column(Integer, default=0)
    config_json = Column(JSON, default=dict) # connection params or schema options (NO plain secrets exposed to frontend)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=True)
    division_code = Column(String(50), nullable=False, index=True)
    file_path = Column(String(500), nullable=True)
    file_format = Column(String(20), default="csv")
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(50), default="pending") # pending, validating, processing, completed, error
    is_demo = Column(Boolean, default=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

class DatasetSchema(Base):
    __tablename__ = "dataset_schemas"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False, unique=True)
    columns_json = Column(JSON, default=list) # [{ name, type, sample_values, null_count }]
    detected_types_json = Column(JSON, default=dict)
    date_columns_json = Column(JSON, default=list)
    numeric_columns_json = Column(JSON, default=list)
    categorical_columns_json = Column(JSON, default=list)
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ColumnMapping(Base):
    __tablename__ = "column_mappings"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    raw_column = Column(String(255), nullable=False)
    mapped_field = Column(String(255), nullable=False)
    data_type = Column(String(50), nullable=False)
    transformation_rule = Column(String(100), default="direct")
    is_verified = Column(Boolean, default=True)

class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    source_type = Column(String(50), default="csv_upload")
    division_code = Column(String(50), default="railway")
    status = Column(String(50), default="completed") # pending, running, completed, failed
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, default=0)
    records_total = Column(Integer, default=0)
    records_valid = Column(Integer, default=0)
    records_invalid = Column(Integer, default=0)
    records_duplicate = Column(Integer, default=0)
    records_missing_values = Column(Integer, default=0)
    quality_score = Column(Float, default=98.5) # 0 to 100
    error_log = Column(Text, nullable=True)

class ProcessingLog(Base):
    __tablename__ = "processing_logs"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("ingestion_jobs.id"), nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    level = Column(String(20), default="INFO") # INFO, WARN, ERROR
    stage = Column(String(100), default="ingestion")
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class DataQualityResult(Base):
    __tablename__ = "data_quality_results"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("ingestion_jobs.id"), nullable=True)
    quality_score = Column(Float, default=100.0)
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    checks_detail_json = Column(JSON, default=list) # [{ check_name, status, details }]
    rejected_records_json = Column(JSON, default=list) # sample of invalid or rejected rows
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BusinessRecord(Base):
    __tablename__ = "business_records"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    division_code = Column(String(50), nullable=False, index=True)
    record_date = Column(DateTime, nullable=False, index=True)
    record_type = Column(String(50), default="metric") # revenue, passenger, visitor, occupancy, sale, delay, progress
    entity_id = Column(String(100), nullable=True)
    entity_name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    secondary_value = Column(Float, nullable=True)
    currency = Column(String(10), default="JPY")
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("idx_division_date", "division_code", "record_date"),
        Index("idx_division_metric", "division_code", "metric_name"),
    )

class AnalyticsResult(Base):
    __tablename__ = "analytics_results"
    id = Column(Integer, primary_key=True, index=True)
    division_code = Column(String(50), nullable=False, index=True)
    analysis_type = Column(String(50), nullable=False) # kpi, trend, pareto, correlation, distribution, period_comparison
    summary_json = Column(JSON, default=dict)
    metrics_json = Column(JSON, default=dict)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

class ModelRegistry(Base):
    __tablename__ = "model_registry"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(100), unique=True, index=True, nullable=False)
    model_name = Column(String(255), nullable=False)
    division_code = Column(String(50), nullable=False)
    target_variable = Column(String(100), nullable=False)
    algorithm = Column(String(100), nullable=False) # XGBoost, Random Forest, ARIMA/AutoRegressive, Polynomial
    parameters_json = Column(JSON, default=dict)
    metrics_json = Column(JSON, default=dict) # {"mae": 12.4, "rmse": 18.2, "r2": 0.942, "mape": 4.1}
    version = Column(String(20), default="v1.0.0")
    status = Column(String(50), default="active")
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)

class ModelPrediction(Base):
    __tablename__ = "model_predictions"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(100), ForeignKey("model_registry.model_id"), nullable=False)
    division_code = Column(String(50), nullable=False, index=True)
    prediction_date = Column(DateTime, nullable=False, index=True)
    actual_value = Column(Float, nullable=True)
    predicted_value = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    confidence_interval = Column(Float, default=0.95)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DetectedAnomaly(Base):
    __tablename__ = "detected_anomalies"
    id = Column(Integer, primary_key=True, index=True)
    division_code = Column(String(50), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    anomaly_date = Column(DateTime, nullable=False)
    actual_value = Column(Float, nullable=False)
    expected_value = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    z_score = Column(Float, default=0.0)
    severity = Column(String(20), default="medium") # low, medium, high, critical
    explanation = Column(Text, nullable=False)
    status = Column(String(50), default="new") # new, acknowledged, resolved
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

class BusinessInsight(Base):
    __tablename__ = "business_insights"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    division_code = Column(String(50), nullable=False, index=True)
    detection_date = Column(DateTime, default=datetime.datetime.utcnow)
    severity = Column(String(20), default="medium") # opportunity, warning, critical, optimization
    supporting_data_json = Column(JSON, default=dict)
    historical_comparison = Column(Text, nullable=True)
    possible_factors_json = Column(JSON, default=list)
    business_impact_yen = Column(Float, default=0.0)
    confidence_level = Column(Float, default=0.88)
    suggested_investigation = Column(Text, nullable=True)
    recommended_improvement = Column(Text, nullable=True)
    is_hypothesis = Column(Boolean, default=True) # Distinguishes confirmed evidence from hypotheses
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DXRecommendation(Base):
    __tablename__ = "dx_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    division_code = Column(String(50), nullable=False, index=True)
    insight_id = Column(Integer, ForeignKey("business_insights.id"), nullable=True)
    priority = Column(String(20), default="high") # high, medium, low
    category = Column(String(100), default="Process Automation") # AI Forecasting, Automation, Smart Ticketing, IoT, etc.
    impact_score = Column(Float, default=8.5) # 1 - 10
    effort_score = Column(Float, default=4.0) # 1 - 10
    urgency_score = Column(Float, default=7.5) # 1 - 10
    estimated_cost_yen = Column(Float, default=3500000)
    expected_benefit_yen = Column(Float, default=12800000)
    confidence_score = Column(Float, default=0.91)
    status = Column(String(50), default="proposed") # proposed, under_review, approved, in_progress, completed, rejected
    baseline_kpi = Column(String(100), default="Manual processing delay: 4.2 days")
    target_kpi = Column(String(100), default="Real-time automated sync < 5 mins")
    actual_kpi = Column(String(100), nullable=True)
    measured_improvement = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class ImprovementTracking(Base):
    __tablename__ = "improvement_tracking"
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("dx_recommendations.id"), nullable=False)
    milestone = Column(String(255), nullable=False)
    target_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="in_progress") # pending, in_progress, completed
    progress_pct = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReportHistory(Base):
    __tablename__ = "report_history"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False) # daily, weekly, monthly, sales, forecast, quality, dx
    division_code = Column(String(50), default="all")
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    format = Column(String(20), default="pdf")
    file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="generated")
    metadata_json = Column(JSON, default=dict)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="alert") # alert, insight, ingestion, dx
    division_code = Column(String(50), default="all")
    severity = Column(String(20), default="info") # info, warning, critical, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="analyst@fujikyu.co.jp")
    action = Column(String(100), nullable=False)
    target_resource = Column(String(255), nullable=False)
    details_json = Column(JSON, default=dict)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
