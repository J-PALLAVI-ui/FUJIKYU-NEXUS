from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class DivisionResponse(BaseModel):
    id: int
    code: str
    name: str
    name_ja: str
    description: Optional[str] = None
    icon: str
    primary_color: str

class DataSourceCreate(BaseModel):
    name: str
    source_type: str
    division_code: str
    config_json: Optional[Dict[str, Any]] = None

class DataSourceResponse(BaseModel):
    id: int
    name: str
    source_type: str
    division_code: str
    status: str
    last_sync: Optional[datetime] = None
    records_imported: int
    config_json: Dict[str, Any]
    error_message: Optional[str] = None
    created_at: datetime

class DatasetResponse(BaseModel):
    id: int
    name: str
    source_id: Optional[int] = None
    division_code: str
    file_format: str
    row_count: int
    column_count: int
    file_size_bytes: int
    status: str
    is_demo: bool
    uploaded_at: datetime

class IngestionJobResponse(BaseModel):
    id: int
    dataset_id: Optional[int] = None
    source_type: str
    division_code: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: int
    records_total: int
    records_valid: int
    records_invalid: int
    records_duplicate: int
    records_missing_values: int
    quality_score: float
    error_log: Optional[str] = None

class DataQualityDetail(BaseModel):
    quality_score: float
    total_checks: int
    passed_checks: int
    failed_checks: int
    checks_detail: List[Dict[str, Any]]
    rejected_records: List[Dict[str, Any]]

class ColumnMappingRequest(BaseModel):
    dataset_id: int
    mappings: List[Dict[str, Any]] # [{ raw_column, mapped_field, data_type, transformation_rule }]

class NaturalLanguageQueryRequest(BaseModel):
    query: str
    division_code: Optional[str] = None
    context_filters: Optional[Dict[str, Any]] = None

class NaturalLanguageQueryResponse(BaseModel):
    query: str
    answer: str
    sql_executed: Optional[str] = None
    data_source: str
    date_range: str
    chart_type: Optional[str] = None # bar, line, area, pie, table
    chart_data: List[Dict[str, Any]] = []
    columns: List[str] = []
    confidence: float
    is_demo_data: bool = True

class DXRecommendationUpdate(BaseModel):
    status: str # proposed, under_review, approved, in_progress, completed, rejected
    approved_by: Optional[str] = None
    notes: Optional[str] = None
    target_kpi: Optional[str] = None
    actual_kpi: Optional[str] = None
    measured_improvement: Optional[str] = None

class ReportGenerateRequest(BaseModel):
    title: str
    report_type: str
    division_code: str = "all"
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    format: str = "pdf"
