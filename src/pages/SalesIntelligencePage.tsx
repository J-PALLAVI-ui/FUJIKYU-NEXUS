import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Filter,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';

export const SalesIntelligencePage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await api.getSalesOverview(category === 'all' ? undefined : category, days);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [category, days]);

  return (
    <div className="space-y-6">
      {/* Page Title & Interactive Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">AI Sales Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500">Autonomous retail & merchandise revenue tracking, basket economics, and AI causal explanations</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Merchandise Categories</option>
            <option value="Confectionery">Confectionery & Sweets</option>
            <option value="Beverage">Beverages & Koshu Wine</option>
            <option value="Souvenirs">Mt. Fuji Crafts & Textiles</option>
            <option value="Toys">Park Mascots & Collectibles</option>
          </select>

          {/* Time Horizon Filter */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={60}>Last 60 Days</option>
          </select>

          <button
            onClick={loadSales}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex items-center justify-center h-64 text-slate-500 space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Synthesizing sales metrics and running AI commentary...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Retail Sales (JPY)"
              value={`¥${data.kpis.total_sales_jpy.toLocaleString()}`}
              subtitle="Consolidated Retail Turnout"
              trend={data.kpis.revenue_growth_pct}
              badge="Top Revenue"
            />
            <MetricCard
              title="Verified Transactions"
              value={data.kpis.transactions_count.toLocaleString()}
              subtitle="POS Register Checkout Count"
              trend={5.4}
              badge="Healthy"
            />
            <MetricCard
              title="Average Basket Size"
              value={`¥${data.kpis.avg_transaction_value_jpy.toLocaleString()}`}
              subtitle="Average Spend Per Customer"
              trend={2.8}
              badge="Above Target"
              badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
            />
            <MetricCard
              title="Total Units Sold"
              value={data.kpis.total_units_sold.toLocaleString()}
              subtitle="Physical SKUs Dispatched"
              trend={8.1}
            />
          </div>

          {/* AI Sales Explanation & Causal Evidence Box */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md border border-blue-800">
            <div className="flex items-center space-x-2 mb-2">
              <span className="p-1.5 bg-blue-500/30 rounded-lg text-blue-300 border border-blue-400/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold tracking-wide">
                AI Autonomous Sales Commentary & Evidence Analysis
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
              <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <p className="font-semibold text-blue-200">Revenue Driver Summary:</p>
                <p className="text-slate-200 leading-relaxed">{data.ai_commentary.revenue_driver_summary}</p>
                <p className="font-semibold text-blue-200 pt-1">Category Health:</p>
                <p className="text-slate-200">{data.ai_commentary.category_health}</p>
              </div>

              <div className="space-y-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <p className="font-semibold text-blue-200">Causal Dynamics (Evidence vs Hypothesis):</p>
                <p className="text-slate-200 leading-relaxed">{data.ai_commentary.ai_explanation}</p>
                <p className="font-semibold text-blue-200 pt-1">Predictive Outlook:</p>
                <p className="text-slate-200">{data.ai_commentary.forecast_outlook}</p>
              </div>
            </div>
          </div>

          {/* Daily Sales Trend & 7-Day ML Forecast */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Historical Sales Trend vs Predictive ML Forecast</h3>
                <p className="text-xs text-slate-500">Historical POS receipts (solid) and Ridge Auto-Seasonal forward outlook (dashed)</p>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                ¥ Japanese Yen
              </span>
            </div>

            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  ...data.daily_trend.map((d: any) => ({ ...d, is_forecast: false })),
                  ...data.forecast.map((f: any) => ({ date: f.date, sales_jpy: f.predicted, is_forecast: true }))
                ]}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066CC" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0066CC" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#94A3B8"
                    tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: any) => [`¥${Number(v).toLocaleString()}`, 'Daily Sales']}
                    contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1C2541', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="sales_jpy" name="Sales (JPY)" stroke="#0066CC" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Performance Table & Category Share */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Top Revenue Generating Products
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Units Sold</th>
                      <th className="py-2.5 px-3 text-right">Revenue (JPY)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {data.top_products.map((p: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{p.product}</td>
                        <td className="py-2.5 px-3 text-slate-500">{p.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{p.units.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ¥{p.sales_jpy.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Sales by Category
              </h3>
              <div className="space-y-3 mt-4 text-xs">
                {data.category_performance.map((c: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1 font-semibold text-slate-800">
                      <span>{c.category}</span>
                      <span>¥{c.sales_jpy.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (c.sales_jpy / maxCategoryValue(data.category_performance)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function maxCategoryValue(cats: any[]) {
  if (!cats || cats.length === 0) return 1;
  return Math.max(...cats.map((c) => c.sales_jpy));
}
