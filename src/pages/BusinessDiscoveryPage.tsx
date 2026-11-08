import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Info,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { BusinessInsight } from '../types';

export const BusinessDiscoveryPage: React.FC = () => {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [selectedDiv, setSelectedDiv] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await api.getInsights(selectedDiv);
      setInsights(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [selectedDiv]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase tracking-wider">
              Core Innovation
            </span>
            <h1 className="text-xl font-extrabold text-slate-900">
              Autonomous Business Discovery Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuously monitors enterprise telemetry, identifies operational bottlenecks, estimates financial impact (¥), and synthesizes investigation plans
          </p>
        </div>

        {/* Division Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedDiv}
            onChange={(e) => setSelectedDiv(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Divisions</option>
            <option value="railway">Railway</option>
            <option value="amusement">Amusement Park</option>
            <option value="hotels">Hotels</option>
            <option value="retail">Retail</option>
          </select>
        </div>
      </div>

      {/* Discovery Philosophy Banner */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Scientific Discovery Standard:</span>
            <p className="text-slate-400 mt-0.5">
              The platform strictly distinguishes confirmed empirical data from analytical hypotheses. Statistical correlation is highlighted as an operational pattern and is not claimed as proven physical causation.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Active AI Discoveries</span>
          <span className="text-lg font-black text-cyan-400">{insights.length} Identified</span>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="space-y-4">
        {insights.map((ins) => {
          const isCritical = ins.severity === 'critical';
          const isOpportunity = ins.severity === 'opportunity';

          return (
            <div
              key={ins.id}
              className={`p-6 bg-white rounded-2xl border shadow-xs transition hover:shadow-md ${
                isCritical
                  ? 'border-rose-300 ring-1 ring-rose-100'
                  : isOpportunity
                  ? 'border-emerald-300 ring-1 ring-emerald-100'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800'
                        : isOpportunity
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ins.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {ins.division_code.replace('_', ' ')} Division
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">Detected: {ins.detection_date}</span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400">Model Confidence:</span>
                  <span className="font-bold text-blue-600">{(ins.confidence_level * 100).toFixed(0)}%</span>
                  {ins.business_impact_yen > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                      Est. Financial Impact: ¥{ins.business_impact_yen.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Historical Comparison */}
              <div className="mt-4">
                <h2 className="text-base font-bold text-slate-900">{ins.title}</h2>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mt-2 font-mono">
                  {ins.historical_comparison}
                </div>
              </div>

              {/* Possible Factors (Confirmed Evidence vs Hypotheses) */}
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Causal Analysis & Factor Breakdown
                </h3>
                <div className="space-y-1.5 text-xs">
                  {ins.possible_factors.map((factor, fIdx) => {
                    const isConfirmed = factor.includes('Confirmed Evidence');
                    return (
                      <div
                        key={fIdx}
                        className={`p-2.5 rounded-lg flex items-start space-x-2 ${
                          isConfirmed
                            ? 'bg-blue-50/70 border border-blue-200 text-blue-900'
                            : 'bg-amber-50/70 border border-amber-200 text-amber-900'
                        }`}
                      >
                        {isConfirmed ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{factor}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Investigation & Recommended Improvement */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 mb-1 flex items-center">
                    <Search className="w-3.5 h-3.5 mr-1 text-slate-500" /> Suggested Department Investigation
                  </p>
                  <p className="text-slate-600 leading-relaxed">{ins.suggested_investigation}</p>
                </div>

                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
                  <p className="font-bold text-indigo-900 mb-1 flex items-center">
                    <ArrowRight className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Recommended Actionable DX Improvement
                  </p>
                  <p className="text-indigo-800 leading-relaxed">{ins.recommended_improvement}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
