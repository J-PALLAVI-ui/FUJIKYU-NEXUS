import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Building,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { OverviewMetrics } from '../types';

interface OverviewPageProps {
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, t] = await Promise.all([
        api.getOverviewMetrics(),
        api.getRevenueTrend()
      ]);
      setMetrics(m);
      setRevenueTrend(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm">Synthesizing enterprise data across 8 divisions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Status Banner */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0066CC] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
                Fujikyu Nexus Enterprise v2.4
              </span>
              <span className="text-xs text-blue-200">Autonomous Business Intelligence Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">
              One Company. All Businesses. One Intelligent Data Ecosystem.
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Consolidated real-time operational telemetry and predictive machine learning across railway transport, Fuji-Q amusement, resort hotels, retail merchandise, dining, commercial leasing, civil engineering, and IT services.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('discovery')}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore AI Discoveries</span>
            </button>
            <button
              onClick={loadData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium backdrop-blur-xs transition"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Consolidated Volume (30D)"
          value={`¥${(metrics.kpis.total_revenue_jpy / 100000000).toFixed(2)} 億`}
          subtitle={`¥${metrics.kpis.total_revenue_jpy.toLocaleString()} JPY Total`}
          trend={metrics.kpis.revenue_growth_pct}
          trendLabel="MoM growth"
          badge="Healthy"
          badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          onClick={() => onNavigate('sales_intelligence')}
        />
        <MetricCard
          title="Railway Ridership (30D)"
          value={metrics.kpis.total_passengers_30d.toLocaleString()}
          subtitle="Fujikyuko Express & Commuter Line"
          trend={6.8}
          trendLabel="vs last month"
          badge="98.2% On-Time"
          onClick={() => onNavigate('division_analytics')}
        />
        <MetricCard
          title="Fuji-Q Park Visitors (30D)"
          value={metrics.kpis.total_visitors_30d.toLocaleString()}
          subtitle="Highland Thrill Attractions & Family"
          trend={12.4}
          trendLabel="peak weekend influx"
          badge="High Attendance"
          badgeColor="bg-rose-50 text-rose-700 border-rose-200"
          onClick={() => onNavigate('division_analytics')}
        />
        <MetricCard
          title="Hotel Occupancy Average"
          value={`${metrics.kpis.avg_hotel_occupancy_pct}%`}
          subtitle="Highland Resort & Fuji View Cabins"
          trend={4.2}
          trendLabel="ADR ¥26,800"
          badge="Strong Yield"
          badgeColor="bg-cyan-50 text-cyan-700 border-cyan-200"
          onClick={() => onNavigate('division_analytics')}
        />
      </div>

      {/* Secondary Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('discovery')}
          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Operational Anomalies</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{metrics.kpis.active_anomalies} Active</p>
          </div>
          <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('data_sources')}
          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Data Pipelines</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{metrics.kpis.connected_data_sources} Sources</p>
          </div>
          <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Building className="w-4 h-4" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('dx')}
          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Active DX Initiatives</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{metrics.kpis.active_dx_projects} Approved</p>
          </div>
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('health')}
          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Data Quality Score</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{metrics.kpis.data_health_score}%</p>
          </div>
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Main Consolidated Trend Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Consolidated Cross-Division Revenue Performance</h2>
            <p className="text-xs text-slate-500">Synchronized daily financial contribution from transportation, attractions, retail, and hospitality</p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
              30-Day Window
            </span>
            <button
              onClick={() => onNavigate('cross_business')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
            >
              Cross Analysis <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorPark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E63946" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#E63946" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066CC" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0066CC" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F4A261" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F4A261" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#94A3B8"
                tickFormatter={(v) => `¥${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, 'Estimated Revenue']}
                contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1C2541', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="amusement_revenue" name="Amusement Park" stroke="#E63946" fillOpacity={1} fill="url(#colorPark)" />
              <Area type="monotone" dataKey="railway_revenue" name="Railway Transit" stroke="#0066CC" fillOpacity={1} fill="url(#colorRail)" />
              <Area type="monotone" dataKey="retail_revenue" name="Retail & Souvenirs" stroke="#F4A261" fillOpacity={1} fill="url(#colorRetail)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8 Business Divisions Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            All 8 Business Divisions Operational Status
          </h2>
          <span className="text-xs text-blue-600 font-semibold cursor-pointer" onClick={() => onNavigate('division_analytics')}>
            Open Division Analytics &rarr;
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.divisions.map((div) => (
            <div
              key={div.code}
              onClick={() => onNavigate('division_analytics')}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: div.color }}
                />
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {div.status}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                {div.name}
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-1">{div.pax_or_rev}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
