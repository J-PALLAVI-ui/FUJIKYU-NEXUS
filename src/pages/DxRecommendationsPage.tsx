import React, { useState, useEffect } from 'react';
import {
  Rocket,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { DXRecommendation } from '../types';

export const DxRecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<DXRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await api.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      setActionLoading(id);
      await api.updateRecommendationStatus(id, {
        status: newStatus,
        approved_by: 'Kenji Watanabe (DX Executive)'
      });
      await loadRecommendations();
    } catch (err) {
      alert('Status update failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">DX Recommendation Engine & Impact Tracker</h1>
          <p className="text-xs text-slate-500">
            Translates business discovery findings into prioritized digital transformation initiatives with ROI estimation and measurable KPI tracking
          </p>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 text-xs flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-white">Authorized Human Approval Protocol:</span>
            <p className="text-slate-400 mt-0.5">
              High-impact operational and architectural adjustments require authorized managerial sign-off before entering deployment pipelines.
            </p>
          </div>
        </div>
      </div>

      {/* Priority Matrix Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Proposed Initiatives</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {recommendations.filter((r) => r.status === 'proposed').length}
          </div>
          <p className="text-slate-400 mt-1">Pending committee review</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-500 uppercase text-[10px]">In Progress / Active</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {recommendations.filter((r) => ['approved', 'in_progress'].includes(r.status)).length}
          </div>
          <p className="text-slate-400 mt-1">Under active implementation</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Completed Initiatives</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {recommendations.filter((r) => r.status === 'completed').length}
          </div>
          <p className="text-slate-400 mt-1">Measured improvements validated</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const isApproved = ['approved', 'in_progress'].includes(rec.status);
          const isCompleted = rec.status === 'completed';

          return (
            <div
              key={rec.id}
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {rec.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    {rec.division_code.replace('_', ' ')}
                  </span>
                  {rec.approved_by && (
                    <span className="text-xs text-emerald-600 flex items-center font-medium">
                      <UserCheck className="w-3.5 h-3.5 mr-1" /> Approved by {rec.approved_by}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                    Est. Cost: ¥{rec.estimated_cost_yen.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 font-bold text-emerald-700 border border-emerald-200">
                    Expected Benefit: ¥{rec.expected_benefit_yen.toLocaleString()} (ROI: {rec.roi_ratio}x)
                  </span>
                </div>
              </div>

              {/* Title & Priority Scores */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{rec.title}</h2>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span>Impact: <strong className="text-slate-800">{rec.impact_score}/10</strong></span>
                    <span>Effort: <strong className="text-slate-800">{rec.effort_score}/10</strong></span>
                    <span>Urgency: <strong className="text-slate-800">{rec.urgency_score}/10</strong></span>
                    <span>Model Confidence: <strong className="text-blue-600">{(rec.confidence_score * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center space-x-2">
                  {rec.status === 'proposed' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'approved')}
                      disabled={actionLoading === rec.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      Authorize & Approve
                    </button>
                  )}
                  {rec.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'in_progress')}
                      disabled={actionLoading === rec.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      Advance to In Progress
                    </button>
                  )}
                  {rec.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'completed')}
                      disabled={actionLoading === rec.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      Mark Completed & Validate
                    </button>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Completed & Verified
                    </span>
                  )}
                </div>
              </div>

              {/* KPI Tracking Matrix */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Baseline Metric:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{rec.baseline_kpi}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Objective:</span>
                  <p className="font-semibold text-blue-700 mt-0.5">{rec.target_kpi}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Measured Outcome:</span>
                  <p className="font-semibold text-emerald-700 mt-0.5">
                    {rec.measured_improvement ? rec.measured_improvement : 'Monitoring in progress...'}
                  </p>
                </div>
              </div>

              {/* Milestones if present */}
              {rec.milestones && rec.milestones.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Implementation Milestones</h3>
                  <div className="space-y-1.5 text-xs">
                    {rec.milestones.map((m, mIdx) => (
                      <div key={mIdx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className={`w-4 h-4 ${m.progress_pct === 100 ? 'text-emerald-600' : 'text-blue-500'}`} />
                          <span className="font-medium text-slate-800">{m.milestone}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-slate-500">
                          <span>Target: {m.target_date}</span>
                          <span className="font-mono font-bold text-blue-600">{m.progress_pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
