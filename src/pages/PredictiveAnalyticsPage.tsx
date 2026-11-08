import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';

export const PredictiveAnalyticsPage: React.FC = () => {
  const [division, setDivision] = useState('railway');
  const [forecastDays, setForecastDays] = useState(14);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getForecast(division, forecastDays);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [division, forecastDays]);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      const res = await api.retrainModel(division);
      setRetrainMsg(res.message);
      await loadForecast();
      setTimeout(() => setRetrainMsg(null), 5000);
    } catch (err) {
      alert('Retrain failed');
    } finally {
      setRetraining(false);
    }
  };

  // Combine historical and forecasted for timeline
  const combinedTimeline = data
    ? [
        ...data.historical.map((h: any) => ({
          date: h.date,
          historical_actual: h.actual,
          predicted: null,
          lower_bound: null,
          upper_bound: null
        })),
        ...data.forecast.map((f: any) => ({
          date: f.date,
          historical_actual: null,
          predicted: f.predicted,
          lower_bound: f.lower_bound,
          upper_bound: f.upper_bound
        }))
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Automated Machine Learning Engine</h1>
          <p className="text-xs text-slate-500">
            Time-series forecasting, multi-seasonal Ridge regression, 95% uncertainty intervals, and model performance metrics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="railway">Railway Passenger Demand</option>
            <option value="amusement">Fuji-Q Park Attendance</option>
            <option value="hotels">Hotel Room Occupancy</option>
            <option value="retail">Retail Souvenir Sales</option>
          </select>

          <select
            value={forecastDays}
            onChange={(e) => setForecastDays(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>7-Day Forecast</option>
            <option value={14}>14-Day Forecast</option>
            <option value={30}>30-Day Forecast</option>
          </select>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Training...' : 'Retrain Model'}</span>
          </button>
        </div>
      </div>

      {retrainMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{retrainMsg}</span>
        </div>
      )}

      {loading || !data ? (
        <div className="flex items-center justify-center h-64 text-slate-500 space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Evaluating machine learning model registry and computing forecasts...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Model Registry Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              title="Coefficient of Det. (R²)"
              value={data.metrics.r2}
              subtitle="Goodness of fit on test fold"
              badge="High Accuracy"
              badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
            />
            <MetricCard
              title="Mean Absolute Error (MAE)"
              value={data.metrics.mae}
              subtitle="Average absolute deviation"
              badge="Validated"
            />
            <MetricCard
              title="Root Mean Squared Error"
              value={data.metrics.rmse}
              subtitle="Sensitivity to large outliers"
            />
            <MetricCard
              title="Confidence Interval"
              value="95.0%"
              subtitle="Multi-horizon error propagation"
              badge="Gaussian Bands"
            />
          </div>

          {/* Forecasting Chart with Historical + Prediction + Uncertainty Bands */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Historical Observed vs Predictive Outlook with 95% Confidence Intervals
                </h3>
                <p className="text-xs text-slate-500">
                  Solid blue: verified historical records; Dashed purple: predicted mean; Shaded band: upper and lower bounds
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                  Algorithm: {data.metrics.model_algorithm || 'Ridge Time-Series'}
                </span>
              </div>
            </div>

            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedTimeline}>
                  <defs>
                    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1C2541', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {/* Confidence Interval Upper/Lower Band */}
                  <Area
                    type="monotone"
                    dataKey="upper_bound"
                    name="95% Upper Bound"
                    stroke="transparent"
                    fillOpacity={1}
                    fill="url(#bandGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower_bound"
                    name="95% Lower Bound"
                    stroke="transparent"
                    fill="transparent"
                  />
                  {/* Historical Observed */}
                  <Line
                    type="monotone"
                    dataKey="historical_actual"
                    name="Historical Observed Actual"
                    stroke="#0066CC"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  {/* Forecast Mean */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    name="Predicted Mean"
                    stroke="#9333EA"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-2 text-slate-500 text-[11px]">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>{data.disclaimer}</span>
            </div>
          </div>

          {/* Model Registry Details & Detected Outliers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Registry Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Active Model Registry Governance
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Model Deployment ID:</span>
                  <span className="font-mono font-semibold text-slate-900">nexus-forecaster-{division}-{data.model_version}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Validation Method:</span>
                  <span className="font-semibold text-slate-900">Walk-Forward Temporal Split (No Leakage)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Feature Engineering:</span>
                  <span className="font-semibold text-slate-900">Calendar Seasonality, Day-of-Week, Holiday Terms</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Production Status:</span>
                  <span className="font-bold text-emerald-600">Active (Serving Endpoints)</span>
                </div>
              </div>
            </div>

            {/* Historical Anomalies in Training Set */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Detected Training Outliers & Fluctuations ({data.anomalies.length})
              </h3>
              {data.anomalies.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No statistical outliers exceeding 2.2 Z-scores found in recent historical window.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {data.anomalies.map((a: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{a.date}</span>
                        <span className="text-rose-600 font-bold">
                          {a.deviation_pct > 0 ? `+${a.deviation_pct}%` : `${a.deviation_pct}%`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{a.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
