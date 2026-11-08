import React from 'react';
import { X, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { RejectedRecord } from '../types';

interface RejectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number | null;
  qualityScore: number;
  rejectedRecords: RejectedRecord[];
  checksDetail?: Array<{ check: string; status: string; message: string }>;
}

export const RejectedModal: React.FC<RejectedModalProps> = ({
  isOpen,
  onClose,
  jobId,
  qualityScore,
  rejectedRecords,
  checksDetail = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Data Quality & Rejected Records Inspector
              </h2>
              <p className="text-xs text-slate-500">
                Pipeline Job #{jobId || 'Latest'} — Verified Quality Score: <span className="font-bold text-blue-600">{qualityScore}%</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quality Checks Summary */}
          {checksDetail.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Automated Verification Checks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {checksDetail.map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2 font-semibold">
                      {c.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      <span className="text-slate-800 truncate">{c.check}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-6">{c.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Records Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Rejected Records ({rejectedRecords.length} Rows Filtered)
              </h3>
              <span className="text-xs text-slate-400">Preserved in lineage store for compliance audit</span>
            </div>

            {rejectedRecords.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                No records were rejected in this pipeline execution. All rows satisfied schema and business constraint rules.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-16">Row #</th>
                      <th className="py-2.5 px-3">Rejection Violations</th>
                      <th className="py-2.5 px-3">Raw Incoming Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {rejectedRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-rose-50/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-500">#{r.row_index}</td>
                        <td className="py-2.5 px-3 font-sans">
                          {r.rejection_reasons.map((reason, ri) => (
                            <span
                              key={ri}
                              className="inline-block px-2 py-0.5 mr-1 mb-1 bg-rose-100 text-rose-800 rounded font-medium text-[10px]"
                            >
                              {reason}
                            </span>
                          ))}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-md truncate">
                          {JSON.stringify(r.data)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
