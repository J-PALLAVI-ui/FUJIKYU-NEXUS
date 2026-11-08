import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Eye,
  RefreshCw,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { IngestionJob, RejectedRecord } from '../types';
import { RejectedModal } from '../components/RejectedModal';

export const DataAutomationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  // Inspection modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectJobId, setInspectJobId] = useState<number | null>(null);
  const [inspectQuality, setInspectQuality] = useState<number>(100);
  const [rejectedList, setRejectedList] = useState<RejectedRecord[]>([]);
  const [checksDetail, setChecksDetail] = useState<any[]>([]);

  // Pipeline execution history
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const data = await api.getIngestionJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysisResult(null);
      setExecutionResult(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    try {
      setAnalyzing(true);
      const fd = new FormData();
      fd.append('file', file);
      if (selectedDivision) {
        fd.append('division_override', selectedDivision);
      }
      const res = await api.uploadAndAnalyze(fd);
      setAnalysisResult(res);
      setSelectedDivision(res.selected_division);
    } catch (err) {
      alert('Failed to analyze dataset structure');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecutePipeline = async () => {
    if (!analysisResult) return;
    try {
      setExecuting(true);
      const res = await api.executePipeline(analysisResult.dataset_id);
      setExecutionResult(res);
      await loadJobs();
    } catch (err) {
      alert('Pipeline execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const openInspector = async (jobId: number, quality: number) => {
    try {
      const data = await api.getRejectedRecords(jobId);
      setInspectJobId(jobId);
      setInspectQuality(quality);
      setRejectedList(data.rejected_records || []);
      setChecksDetail(data.checks_detail || []);
      setIsModalOpen(true);
    } catch (err) {
      alert('Could not load inspection data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Self-Adaptive Data Processing Engine
          </h1>
          <p className="text-xs text-slate-500">
            Metadata-driven automated schema detection, domain classification, duplicate filtering, constraint validation, and quality scoring
          </p>
        </div>
      </div>

      {/* Step 1: Upload & Drop Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <UploadCloud className="w-4 h-4 text-blue-600" />
          <span>Step 1: Upload Unprocessed Enterprise Dataset</span>
        </h2>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition cursor-pointer bg-slate-50/50">
          <input
            type="file"
            id="fileInput"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer block">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">
              {file ? file.name : 'Click to select CSV, Excel, or JSON dataset'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports raw POS dumps, turnout feeds, hotel booking registers, or IT telemetry files
            </p>
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{file.name}</span>
              <span>({(file.size / 1024).toFixed(1)} KB)</span>
            </div>

            <button
              onClick={handleUploadAndAnalyze}
              disabled={analyzing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{analyzing ? 'Analyzing Schema...' : 'Run Autonomous Schema Profiler'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Auto-Detection & Schema Analysis Results */}
      {analysisResult && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Step 2: Autonomous Schema Inference & Division Classification</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Inferred from column semantic tokens and empirical distribution signatures
              </p>
            </div>

            {/* AI Classification Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Inferred Division:</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs uppercase tracking-wide">
                {analysisResult.suggested_division} ({analysisResult.division_confidence}% confidence)
              </span>
            </div>
          </div>

          {/* Profile Overview Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 text-[11px]">Total Rows</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{analysisResult.row_count}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 text-[11px]">Total Columns</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{analysisResult.column_count}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 text-[11px]">Detected Date Columns</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{analysisResult.profile.date_columns.join(', ') || 'None'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 text-[11px]">Approved Target Schema</p>
              <p className="text-base font-bold text-blue-600 mt-0.5 capitalize">{selectedDivision}</p>
            </div>
          </div>

          {/* Canonical Column Mappings */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700">Column Mapping Matrix (Approved Standard Schema)</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Canonical Schema Field</th>
                    <th className="py-2.5 px-3">Raw Column In Dataset</th>
                    <th className="py-2.5 px-3">Inferred Data Type</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(analysisResult.suggested_mappings).map(([field, rawCol]: any) => (
                    <tr key={field} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-900 font-mono text-[11px]">{field}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{rawCol}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] uppercase font-mono">
                          {analysisResult.profile.detected_types[rawCol] || 'string'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved Mapping
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action to Execute Pipeline */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleExecutePipeline}
              disabled={executing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition disabled:opacity-50"
            >
              {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{executing ? 'Executing Cleaning & Ingestion Engine...' : 'Execute Adaptive Cleaning Pipeline & Store Clean Records'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Execution Result & Quality Scorecard */}
      {executionResult && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/30 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pipeline Execution Completed Successfully</h2>
                <p className="text-[11px] text-slate-500">Processed in {executionResult.processing_duration_ms}ms with self-adaptive validation rules</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">Data Quality Score</span>
              <span className="text-2xl font-black text-emerald-600">{executionResult.data_quality_score}%</span>
            </div>
          </div>

          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-500">Total Incoming</p>
              <p className="text-base font-bold text-slate-900">{executionResult.records_summary.total_incoming}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-[11px] text-emerald-700 font-semibold">Valid Records Stored</p>
              <p className="text-base font-bold text-emerald-700">{executionResult.records_summary.valid_records}</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-[11px] text-rose-700 font-semibold">Invalid / Rejected</p>
              <p className="text-base font-bold text-rose-700">{executionResult.records_summary.invalid_records}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-[11px] text-amber-700 font-semibold">Duplicates Filtered</p>
              <p className="text-base font-bold text-amber-700">{executionResult.records_summary.duplicate_records}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-[11px] text-blue-700 font-semibold">Missing Values Cleaned</p>
              <p className="text-base font-bold text-blue-700">{executionResult.records_summary.missing_values}</p>
            </div>
          </div>

          {/* Inspector trigger button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Cleaned records stored in <span className="font-mono font-semibold text-slate-700">business_records</span> table.
            </span>
            <button
              onClick={() => openInspector(executionResult.job_id, executionResult.data_quality_score)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Rejected Records & Validation Checks</span>
            </button>
          </div>
        </div>
      )}

      {/* Execution History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Pipeline Execution History
            </h3>
            <p className="text-[11px] text-slate-400">Complete data lineage and quality audit trails</p>
          </div>
          <button onClick={loadJobs} className="text-xs text-blue-600 font-semibold flex items-center">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Job ID</th>
                <th className="py-2.5 px-4">Division</th>
                <th className="py-2.5 px-4">Ingestion Source</th>
                <th className="py-2.5 px-4">Total Rows</th>
                <th className="py-2.5 px-4">Valid Stored</th>
                <th className="py-2.5 px-4">Rejected</th>
                <th className="py-2.5 px-4">Quality Score</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">#{j.id}</td>
                  <td className="py-3 px-4 capitalize font-medium text-slate-700">{j.division_code.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{j.source_type}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{j.records_total}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">{j.records_valid}</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">{j.records_invalid}</td>
                  <td className="py-3 px-4 font-bold text-blue-600">{j.quality_score}%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openInspector(j.id, j.quality_score)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                    >
                      Inspect Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejected Records Modal */}
      <RejectedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobId={inspectJobId}
        qualityScore={inspectQuality}
        rejectedRecords={rejectedList}
        checksDetail={checksDetail}
      />
    </div>
  );
};
