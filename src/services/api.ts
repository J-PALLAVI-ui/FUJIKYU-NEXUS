const API_BASE = '/api';

export const api = {
  // Overview
  getOverviewMetrics: async () => {
    const res = await fetch(`${API_BASE}/overview/metrics`);
    if (!res.ok) throw new Error('Failed to fetch overview metrics');
    return res.json();
  },
  getRevenueTrend: async () => {
    const res = await fetch(`${API_BASE}/overview/revenue_trend`);
    if (!res.ok) throw new Error('Failed to fetch revenue trend');
    return res.json();
  },

  // Data Sources
  getDataSources: async () => {
    const res = await fetch(`${API_BASE}/data-sources`);
    if (!res.ok) throw new Error('Failed to fetch data sources');
    return res.json();
  },
  syncDataSource: async (id: number) => {
    const res = await fetch(`${API_BASE}/data-sources/${id}/sync`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger sync');
    return res.json();
  },
  testConnection: async (id: number) => {
    const res = await fetch(`${API_BASE}/data-sources/${id}/test-connection`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to test connection');
    return res.json();
  },
  createDataSource: async (data: any) => {
    const res = await fetch(`${API_BASE}/data-sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create data source');
    return res.json();
  },

  // Data Automation & Adaptive Cleaner
  uploadAndAnalyze: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/data-automation/upload-and-analyze`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload and analyze dataset');
    return res.json();
  },
  executePipeline: async (datasetId: number, mappings?: any) => {
    const res = await fetch(`${API_BASE}/data-automation/execute-pipeline/${datasetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mappings ? { mappings } : {})
    });
    if (!res.ok) throw new Error('Failed to execute cleaning pipeline');
    return res.json();
  },
  getIngestionJobs: async () => {
    const res = await fetch(`${API_BASE}/data-automation/jobs`);
    if (!res.ok) throw new Error('Failed to fetch ingestion jobs');
    return res.json();
  },
  getRejectedRecords: async (jobId: number) => {
    const res = await fetch(`${API_BASE}/data-automation/rejected-records/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch rejected records');
    return res.json();
  },

  // Division Analytics
  getDivisions: async () => {
    const res = await fetch(`${API_BASE}/divisions`);
    if (!res.ok) throw new Error('Failed to fetch divisions');
    return res.json();
  },
  getDivisionAnalytics: async (code: string) => {
    const res = await fetch(`${API_BASE}/divisions/${code}/analytics`);
    if (!res.ok) throw new Error(`Failed to fetch analytics for ${code}`);
    return res.json();
  },

  // Sales Intelligence
  getSalesOverview: async (category?: string, days: number = 30) => {
    const url = new URL(`${window.location.origin}${API_BASE}/sales/overview`);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('days', days.toString());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch sales overview');
    return res.json();
  },

  // Predictive Analytics
  getForecast: async (division: string = 'railway', days: number = 14) => {
    const res = await fetch(`${API_BASE}/predictive/forecast?division_code=${division}&forecast_days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch predictive forecast');
    return res.json();
  },
  retrainModel: async (division: string = 'railway') => {
    const res = await fetch(`${API_BASE}/predictive/retrain?division_code=${division}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to retrain model');
    return res.json();
  },

  // Autonomous Business Discovery
  getInsights: async (division: string = 'all') => {
    const res = await fetch(`${API_BASE}/discovery/insights?division_code=${division}`);
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  },
  getAnomalies: async () => {
    const res = await fetch(`${API_BASE}/discovery/anomalies`);
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  // Cross-Business Intelligence
  getCrossCorrelations: async () => {
    const res = await fetch(`${API_BASE}/cross-business/correlations`);
    if (!res.ok) throw new Error('Failed to fetch cross-business correlations');
    return res.json();
  },

  // NEXUS AI Assistant
  queryAssistant: async (query: string, division?: string) => {
    const res = await fetch(`${API_BASE}/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, division_code: division })
    });
    if (!res.ok) throw new Error('Failed to query NEXUS AI');
    return res.json();
  },

  // DX Recommendations
  getRecommendations: async () => {
    const res = await fetch(`${API_BASE}/dx/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },
  updateRecommendationStatus: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/dx/recommendations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update recommendation');
    return res.json();
  },

  // Reports
  getReportHistory: async () => {
    const res = await fetch(`${API_BASE}/reports/history`);
    if (!res.ok) throw new Error('Failed to fetch report history');
    return res.json();
  },
  generateReport: async (data: any) => {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  // Health
  getHealthStatus: async () => {
    const res = await fetch(`${API_BASE}/health/status`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },
  retryConnector: async (sourceId: number) => {
    const res = await fetch(`${API_BASE}/health/retry/${sourceId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to retry connector');
    return res.json();
  },
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/health/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  }
};
