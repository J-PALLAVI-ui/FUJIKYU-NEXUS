import React, { useEffect, useState } from 'react';
import {
  Database,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Link,
  ShieldCheck,
  Send,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { DataSource } from '../types';

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<Record<number, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('postgresql');
  const [newDiv, setNewDiv] = useState('railway');
  const [newHost, setNewHost] = useState('db.internal.fujikyu.co.jp');

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await api.getDataSources();
      setSources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSync = async (id: number) => {
    try {
      setSyncingId(id);
      await api.syncDataSource(id);
      await loadSources();
    } catch (err) {
      alert('Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleTest = async (id: number) => {
    try {
      const res = await api.testConnection(id);
      setTestResult((prev) => ({ ...prev, [id]: `Verified (${res.latency_ms}ms latency)` }));
    } catch (err) {
      setTestResult((prev) => ({ ...prev, [id]: 'Connection timed out' }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDataSource({
        name: newName,
        source_type: newType,
        division_code: newDiv,
        config_json: { host: newHost, ssl: true }
      });
      setShowAddModal(false);
      setNewName('');
      loadSources();
    } catch (err) {
      alert('Failed to register source');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Data Source Management</h1>
          <p className="text-xs text-slate-500">Universal integration engine connecting ERPs, PMS, Turnstiles, POS systems, APIs, and folder watchers</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Data Connector</span>
          </button>
        </div>
      </div>

      {/* Integration Capabilities Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Database className="w-4 h-4" /></span>
          <div>
            <p className="font-bold text-slate-800">RDBMS Ingestion</p>
            <p className="text-[11px] text-slate-500">PostgreSQL, MySQL, Oracle</p>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Zap className="w-4 h-4" /></span>
          <div>
            <p className="font-bold text-slate-800">REST APIs</p>
            <p className="text-[11px] text-slate-500">Scheduled Polling & Webhooks</p>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5">
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
          <div>
            <p className="font-bold text-slate-800">Folder Watcher</p>
            <p className="text-[11px] text-slate-500">Automated Drop Directory</p>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5">
          <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></span>
          <div>
            <p className="font-bold text-slate-800">Security Vault</p>
            <p className="text-[11px] text-slate-500">Zero Credential Exposure</p>
          </div>
        </div>
      </div>

      {/* Sources Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Configured Enterprise Connectors ({sources.length})
          </span>
          <button onClick={loadSources} className="text-xs text-blue-600 font-semibold flex items-center">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Connector Name</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Division</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Records Imported</th>
                <th className="py-3 px-4">Latest Sync</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[11px] font-mono text-slate-600">
                    {s.source_type}
                  </td>
                  <td className="py-3.5 px-4 capitalize text-slate-700">
                    {s.division_code.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active & Healthy
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                    {s.records_imported.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {s.last_sync ? new Date(s.last_sync).toLocaleString() : 'Pending'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => handleTest(s.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                    >
                      {testResult[s.id] ? testResult[s.id] : 'Test'}
                    </button>
                    <button
                      onClick={() => handleSync(s.id)}
                      disabled={syncingId === s.id}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition disabled:opacity-50"
                    >
                      {syncingId === s.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Register Enterprise Data Connector</h2>
            <p className="text-xs text-slate-500 mb-4">Connect a database or API endpoint securely with incremental ingestion.</p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Connector Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fuji-Q Highland FastPass Gateway"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Protocol</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="postgresql">PostgreSQL DB</option>
                    <option value="mysql">MySQL DB</option>
                    <option value="rest_api">REST API</option>
                    <option value="folder_watch">Folder Watcher</option>
                    <option value="csv">CSV File Stream</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Division</label>
                  <select
                    value={newDiv}
                    onChange={(e) => setNewDiv(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="railway">Railway</option>
                    <option value="amusement">Amusement Park</option>
                    <option value="hotels">Hotels</option>
                    <option value="retail">Retail</option>
                    <option value="restaurants">Restaurants</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="construction">Construction</option>
                    <option value="it_services">IT Services</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Host Endpoint / URL</label>
                <input
                  type="text"
                  required
                  value={newHost}
                  onChange={(e) => setNewHost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-[11px] text-blue-700">
                Credentials and access keys are stored in the encrypted backend credentials vault and never transmitted to the browser client.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Connector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
