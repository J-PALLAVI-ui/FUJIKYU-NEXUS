import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';

export const CrossBusinessPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>('rail_vs_park');
  const [loading, setLoading] = useState(true);

  const loadCorrelations = async () => {
    try {
      setLoading(true);
      const res = await api.getCrossCorrelations();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCorrelations();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm">Calculating cross-division Pearson correlations and temporal matrices...</span>
      </div>
    );
  }

  const activePairData =
    selectedPair === 'rail_vs_park'
      ? data.railway_vs_amusement
      : selectedPair === 'hotel_vs_park'
      ? data.hotels_vs_amusement
      : data.retail_vs_railway;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Cross-Business Intelligence</h1>
          <p className="text-xs text-slate-500">
            Evaluating multi-division operational synergies, footfall transfer rates, and joint commercial bundling opportunities
          </p>
        </div>

        {/* Pair Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="rail_vs_park">Railway Passengers ↔ Amusement Park Visitors</option>
            <option value="hotel_vs_park">Hotel Occupancy ↔ Park Visitors</option>
            <option value="retail_vs_rail">Retail Souvenir Sales ↔ Railway Ridership</option>
          </select>
        </div>
      </div>

      {/* Cross-Division Synergy Matrix Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
          Fujikyu Multi-Division Strategic Synergy Matrix
        </h2>
        <p className="text-xs text-slate-500 mb-3">Pearson correlation coefficients calculated across synchronized daily timestamps</p>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Division A</th>
                <th className="py-2.5 px-3">Division B</th>
                <th className="py-2.5 px-3">Correlation (r)</th>
                <th className="py-2.5 px-3">Synergy Assessment & Opportunity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.cross_matrix.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.division_a}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.division_b}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                    r = {row.correlation.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{row.synergy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concurrent Timeline Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Synchronized Multi-Division Comparative Trend
            </h3>
            <p className="text-xs text-slate-500">
              Comparative normalized curves demonstrating synchronized fluctuations across matching operating days
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              Correlation: r = {activePairData.correlation}
            </span>
          </div>
        </div>

        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activePairData.paired_data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1C2541', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {activePairData.paired_data.length > 0 &&
                Object.keys(activePairData.paired_data[0])
                  .filter((k) => k !== 'date')
                  .map((k, idx) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={k.replace(/_/g, ' ').toUpperCase()}
                      stroke={idx === 0 ? '#0066CC' : '#E63946'}
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                    />
                  ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Qualitative Findings & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePairData.insights.map((ins: any, idx: number) => (
          <React.Fragment key={idx}>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Strategic Commercial Opportunity</h3>
              <p className="text-slate-700 leading-relaxed">{ins.strategic_opportunity}</p>
              <div className="pt-2">
                <span className="font-semibold text-slate-500">Supporting Evidence:</span>
                <p className="text-slate-600 mt-0.5">{ins.evidence}</p>
              </div>
            </div>

            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 shadow-xs space-y-2 text-xs">
              <h3 className="font-bold text-amber-900 text-sm flex items-center">
                <Info className="w-4 h-4 mr-1 text-amber-600" /> Analytical Disclaimers & Scope Limitations
              </h3>
              <p className="text-amber-800 leading-relaxed">{ins.limitations_and_disclaimers}</p>
              <p className="text-amber-700 text-[11px] pt-1">{activePairData.limitations}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
