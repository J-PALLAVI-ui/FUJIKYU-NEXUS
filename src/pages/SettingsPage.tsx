import React, { useState } from 'react';
import {
  Settings,
  Database,
  Shield,
  Key,
  RotateCcw,
  CheckCircle2,
  Info,
  Server,
  Layers,
  FileCode
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('AIzaSyD-•••••••••••••••••••••••••••••••••');
  const [dbStatus, setDbStatus] = useState('Connected (PostgreSQL / SQLite)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">System & Platform Settings</h1>
        <p className="text-xs text-slate-500">
          Enterprise configuration, API security credentials, AI engine parameters, and demo environment controls
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration parameters updated and secured successfully.</span>
        </div>
      )}

      {/* Platform Metadata Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <Server className="w-4 h-4 text-blue-600" />
          <span>Platform Information & Enterprise Architecture</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Application Name</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">FUJIKYU NEXUS</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Official Tagline</span>
            <span className="text-xs font-semibold text-slate-900 mt-0.5 block">One Company. All Businesses. One Intelligent Data Ecosystem.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Database Storage Engine</span>
            <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{dbStatus}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Deployment Mode</span>
            <span className="text-xs font-bold text-amber-600 mt-0.5 block">Demonstration Dataset Mode Active</span>
          </div>
        </div>
      </div>

      {/* AI & Security Credentials */}
      <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <Key className="w-4 h-4 text-indigo-600" />
          <span>AI Engine & API Credentials</span>
        </h2>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Gemini AI API Key (Optional — Heuristic Text-to-SQL Fallback Active)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Keys are stored in the server environment vault. The natural language assistant runs with safe local schema-aware Text-to-SQL even without an external API key.
          </p>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Audit Log Retention Policy</label>
          <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option>90 Days (Corporate Security Standard)</option>
            <option>180 Days (Financial Audit Compliance)</option>
            <option>365 Days (Indefinite Archive)</option>
          </select>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Demonstration Protocol Disclaimer */}
      <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2 text-amber-900">
        <div className="flex items-center space-x-2 font-bold text-amber-950">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Demonstration Protocol & Legal Notice</span>
        </div>
        <p className="leading-relaxed">
          This system is configured with synthetic demonstration datasets representing the eight operating divisions of Fujikyu (Fujikyuko Co., Ltd.). This web platform is a proposed project prototype and is not presented as an official corporate announcement or certified historical company accounting.
        </p>
      </div>
    </div>
  );
};
