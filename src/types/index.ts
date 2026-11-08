export interface Division {
  id: number;
  code: string;
  name: string;
  name_ja: string;
  description: string;
  icon: string;
  primary_color: string;
}

export interface OverviewMetrics {
  kpis: {
    total_revenue_jpy: number;
    revenue_growth_pct: number;
    total_passengers_30d: number;
    total_visitors_30d: number;
    avg_hotel_occupancy_pct: number;
    active_anomalies: number;
    connected_data_sources: string;
    active_dx_projects: number;
    data_health_score: number;
  };
  divisions: Array<{
    code: string;
    name: string;
    status: string;
    pax_or_rev: string;
    color: string;
  }>;
}

export interface DataSource {
  id: number;
  name: string;
  source_type: string;
  division_code: string;
  status: string;
  last_sync: string;
  records_imported: number;
  config_json: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export interface IngestionJob {
  id: number;
  dataset_id?: number;
  division_code: string;
  source_type: string;
  status: string;
  started_at: string;
  duration_ms: number;
  records_total: number;
  records_valid: number;
  records_invalid: number;
  records_duplicate: number;
  quality_score: number;
}

export interface RejectedRecord {
  row_index: number;
  data: Record<string, any>;
  rejection_reasons: string[];
}

export interface BusinessInsight {
  id: number;
  title: string;
  division_code: string;
  detection_date: string;
  severity: string;
  supporting_data: Record<string, any>;
  historical_comparison: string;
  possible_factors: string[];
  business_impact_yen: number;
  confidence_level: number;
  suggested_investigation: string;
  recommended_improvement: string;
  is_hypothesis: boolean;
  created_at: string;
}

export interface DXRecommendation {
  id: number;
  title: string;
  division_code: string;
  priority: string;
  category: string;
  impact_score: number;
  effort_score: number;
  urgency_score: number;
  estimated_cost_yen: number;
  expected_benefit_yen: number;
  roi_ratio: number;
  confidence_score: number;
  status: string;
  baseline_kpi: string;
  target_kpi: string;
  actual_kpi?: string;
  measured_improvement?: string;
  approved_by?: string;
  created_at: string;
  milestones: Array<{
    milestone: string;
    target_date: string;
    status: string;
    progress_pct: number;
    notes?: string;
  }>;
}

export interface NaturalLanguageResponse {
  query: string;
  answer: string;
  sql_executed?: string;
  data_source: string;
  date_range: string;
  chart_type?: string;
  chart_data: any[];
  columns: string[];
  confidence: number;
  is_demo_data: boolean;
}
