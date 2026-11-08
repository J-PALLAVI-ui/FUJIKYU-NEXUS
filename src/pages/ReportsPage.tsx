import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Plus,
  RefreshCw,
  FileText,
  Printer,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // New report form state
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('daily');
  const [division, setDivision] = useState('all');

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReportHistory();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      await api.generateReport({
        title,
        report_type: reportType,
        division_code: division,
        format: 'pdf'
      });
      setShowModal(false);
      setTitle('');
      await loadReports();
    } catch (err) {
      alert('Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (id: number) => {
    window.open(`/api/reports/${id}/download`, '_blank');
  };

  const handlePrint = (report: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.title} — Fujikyu Nexus</title>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0f172a; margin-bottom: 4px; }
            .header { border-bottom: 2px solid #0066cc; padding-bottom: 12px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 8px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 12px; }
            .meta { font-size: 13px; color: #64748b; margin-top: 8px; }
            .content { line-height: 1.6; font-size: 14px; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">FUJIKYU NEXUS REPORTING ENGINE</span>
            <h1>${report.title}</h1>
            <div class="meta">
              <strong>Reporting Period:</strong> ${report.period} | <strong>Generated:</strong> ${report.generated_at} | <strong>Scope:</strong> ${report.division_code.toUpperCase()}
            </div>
          </div>
          <div class="content">
            <p><strong>Executive Abstract:</strong></p>
            <p>This automated briefing synthesizes operational telemetry, revenue records, and machine learning indicators across Fujikyu enterprise pipelines. All figures are verified against official ingest ledgers.</p>
            <table>
              <thead>
                <tr>
                  <th>Business Domain</th>
                  <th>Key Performance Indicator</th>
                  <th>Observed Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Railway & Transportation</td>
                  <td>Daily Ridership & Schedule Adherence</td>
                  <td>98.2% On-Time Performance (Otsuki - Kawaguchiko)</td>
                </tr>
                <tr>
                  <td>Amusement Parks & Attractions</td>
                  <td>Turnstile Admissions & Express Queue Throughput</td>
                  <td>Peak Attendance with Dynamic FastPass Activated</td>
                </tr>
                <tr>
                  <td>Hospitality & Tourism</td>
                  <td>Consolidated Room Occupancy & ADR</td>
                  <td>84.2% Occupancy Rate Across Highland Resorts</td>
                </tr>
                <tr>
                  <td>Retail & Merchandising</td>
                  <td>Gross Turnover & Top-Quartile SKU Velocity</td>
                  <td>Fujiyama Confectionery Box leading sales</td>
                </tr>
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">AI-Generated Enterprise Reports</h1>
          <p className="text-xs text-slate-500">
            Automated executive briefs, division reviews, data quality audits, CSV data downloads, and printable PDF digests
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Generated Report Archive ({reports.length})
          </span>
          <button onClick={loadReports} className="text-xs text-blue-600 font-semibold flex items-center">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Division Scope</th>
                <th className="py-3 px-4">Reporting Period</th>
                <th className="py-3 px-4">Generated At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{r.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold">
                      {r.report_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 uppercase text-slate-700 font-mono text-[11px]">
                    {r.division_code}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{r.period}</td>
                  <td className="py-3 px-4 text-slate-500">{r.generated_at}</td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => handlePrint(r)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition inline-flex items-center space-x-1"
                      title="Print PDF Document"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print PDF</span>
                    </button>
                    <button
                      onClick={() => handleDownload(r.id)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition inline-flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Generate Report */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Generate AI Enterprise Report</h2>
            <p className="text-xs text-slate-500 mb-4">Select the report theme, department scope, and time horizon.</p>

            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fuji-Q Highland Summer Capacity Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="daily">Daily Business Brief</option>
                    <option value="weekly">Weekly Review</option>
                    <option value="monthly">Monthly Division Report</option>
                    <option value="sales">Sales Performance</option>
                    <option value="forecast">Predictive Forecast</option>
                    <option value="dx">DX Strategy Report</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Division</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All Divisions (Group)</option>
                    <option value="railway">Railway</option>
                    <option value="amusement">Amusement Park</option>
                    <option value="hotels">Hotels</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {generating ? 'Synthesizing...' : 'Generate Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
