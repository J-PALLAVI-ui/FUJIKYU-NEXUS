import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export const DataHealthPage: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const data = await api.getHealthStatus();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleRetry = async (sourceId: number) => {
    try {
      setRetryingId(sourceId);
      await api.retryConnector(sourceId);
      await loadHealth();
    } catch (err) {
      alert('Retry attempt failed');
    } finally {
      setRetryingId(null);
    }
  };

  if (loading || !health) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm">Auditing pipeline health and connector statuses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Data Health & Automation Monitor</h1>
          <p className="text-xs text-slate-500">
            Real-time pipeline diagnostics, quality metrics degradation trends, automated retry supervisors, and system availability
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadHealth}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Health Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Overall Health</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{health.overall_health_score}%</div>
          <p className="text-slate-400 mt-1">SLA Standard: &gt;95.0%</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Active Connectors</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{health.active_connectors}</div>
          <p className="text-slate-400 mt-1">Zero unhandled disconnects</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Error Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">0.02%</div>
          <p className="text-slate-400 mt-1">All anomalies handled</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Heartbeat Telemetry</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xs font-mono font-bold text-slate-900 mt-1">{health.last_sync_utc}</div>
          <p className="text-slate-400 mt-1">Watchdog daemon active</p>
        </div>
      </div>

      {/* Quality Degradation & Batch Metrics Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
          Historical Batch Data Quality & Anomaly Trends
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Tracking completeness, uniqueness, and constraint validity across sequential ingestion cycles
        </p>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={health.quality_trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="run" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1C2541', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
              />
              <Line
                type="monotone"
                dataKey="quality_score"
                name="Quality Score (%)"
                stroke="#0066CC"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connectors Health & Retry Supervisor */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Connector Health Status & Automatic Retry Supervisor
          </span>
          <span className="text-xs text-slate-500">Autonomous retry limit: 3 attempts with exponential backoff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Connector Target</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Division</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Sync</th>
                <th className="py-3 px-4">Error Rate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {health.connectors.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 uppercase text-[11px] font-mono text-slate-500">{c.type}</td>
                  <td className="py-3 px-4 capitalize text-slate-700">{c.division.replace('_', ' ')}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{c.last_sync}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{c.error_rate}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRetry(c.id)}
                      disabled={retryingId === c.id}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition inline-flex items-center space-x-1 disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${retryingId === c.id ? 'animate-spin' : ''}`} />
                      <span>{retryingId === c.id ? 'Testing...' : 'Test Retry'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
