import React, { useState, useEffect } from 'react';
import {
  Train,
  FerrisWheel,
  Hotel,
  ShoppingBag,
  Utensils,
  Building2,
  HardHat,
  Cpu,
  RefreshCw,
  TrendingUp,
  BarChart2,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';

const DIVISIONS_CONFIG = [
  { code: 'railway', label: 'Railway & Transport', icon: Train, color: '#0066CC' },
  { code: 'amusement', label: 'Amusement Parks', icon: FerrisWheel, color: '#E63946' },
  { code: 'hotels', label: 'Hotels & Tourism', icon: Hotel, color: '#2A9D8F' },
  { code: 'retail', label: 'Retail & Shopping', icon: ShoppingBag, color: '#F4A261' },
  { code: 'restaurants', label: 'Restaurants & Dining', icon: Utensils, color: '#E76F51' },
  { code: 'real_estate', label: 'Real Estate & Leasing', icon: Building2, color: '#457B9D' },
  { code: 'construction', label: 'Civil Construction', icon: HardHat, color: '#D4A373' },
  { code: 'it_services', label: 'IT & Digital DX', icon: Cpu, color: '#6D597A' }
];

export const DivisionAnalyticsPage: React.FC = () => {
  const [selectedDiv, setSelectedDiv] = useState('railway');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDivisionAnalytics = async (code: string) => {
    try {
      setLoading(true);
      const data = await api.getDivisionAnalytics(code);
      setAnalytics(data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDivisionAnalytics(selectedDiv);
  }, [selectedDiv]);

  return (
    <div className="space-y-6">
      {/* Title & Division Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Division-Specific Analytical Workflows</h1>
          <p className="text-xs text-slate-500">Autonomous analytical registry tailoring KPIs, statistical distributions, and Pareto curves to each business domain</p>
        </div>

        {/* Division Tab Selector */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/80 rounded-xl">
          {DIVISIONS_CONFIG.map((d) => {
            const Icon = d.icon;
            const isSelected = selectedDiv === d.code;
            return (
              <button
                key={d.code}
                onClick={() => setSelectedDiv(d.code)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading || !analytics ? (
        <div className="flex items-center justify-center h-64 text-slate-500 space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Executing division analytics workflow...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dynamic KPI Cards Based on Division */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.kpis || {}).map(([key, val]: any) => {
              const formattedTitle = key.replace(/_/g, ' ').toUpperCase();
              let displayVal = val;
              if (typeof val === 'number') {
                if (key.includes('jpy')) {
                  displayVal = `¥${val.toLocaleString()}`;
                } else if (key.includes('pct')) {
                  displayVal = `${val}%`;
                } else {
                  displayVal = val.toLocaleString();
                }
              }
              return (
                <MetricCard
                  key={key}
                  title={formattedTitle}
                  value={displayVal}
                  badge="Verified"
                  badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                />
              );
            })}
          </div>

          {/* Dynamic Primary Trend Chart */}
          {analytics.trend && analytics.trend.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedDiv.replace('_', ' ').toUpperCase()} — Operational Trend Timeline
                  </h3>
                  <p className="text-xs text-slate-500">30-day verified time-series data</p>
                </div>
              </div>

              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1C2541', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {Object.keys(analytics.trend[0] || {})
                      .filter((k) => k !== 'date')
                      .map((metricKey, idx) => (
                        <Line
                          key={metricKey}
                          type="monotone"
                          dataKey={metricKey}
                          name={metricKey.replace(/_/g, ' ').toUpperCase()}
                          stroke={idx === 0 ? '#0066CC' : idx === 1 ? '#E63946' : '#2A9D8F'}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sub-Entity Breakdown / Performance Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Breakdown Table */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Sub-Entity Performance Breakdown
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Entity Name</th>
                      <th className="py-2.5 px-3 text-right">Primary Metric</th>
                      <th className="py-2.5 px-3 text-right">Secondary Metric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(
                      analytics.route_performance ||
                      analytics.attraction_performance ||
                      analytics.property_performance ||
                      analytics.product_performance ||
                      analytics.outlet_performance ||
                      analytics.project_performance ||
                      analytics.system_performance ||
                      []
                    ).map((item: any, idx: number) => {
                      const keys = Object.keys(item);
                      const labelKey = keys[0];
                      const val1Key = keys[1];
                      const val2Key = keys[2] || keys[1];
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item[labelKey]}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {typeof item[val1Key] === 'number' ? item[val1Key].toLocaleString() : item[val1Key]}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                            {typeof item[val2Key] === 'number' ? item[val2Key].toLocaleString() : item[val2Key]}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pareto Distribution Analysis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Pareto (80/20) Cumulative Contribution
              </h3>
              <p className="text-xs text-slate-500 mb-3">Evaluates concentration risk and core revenue/visitor drivers</p>

              {analytics.pareto && analytics.pareto.length > 0 ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.pareto}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 10 }}
                        stroke="#0066CC"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                        stroke="#E63946"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1C2541', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                      />
                      <Bar yAxisId="left" dataKey="value" name="Volume" fill="#0066CC" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" name="Cumulative %" stroke="#E63946" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Pareto distribution curve computed for high-cardinality divisions (Railway, Amusement, Retail).
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
