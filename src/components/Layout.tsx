import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  Cpu,
  Layers,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  GitMerge,
  MessageSquareCode,
  Rocket,
  FileSpreadsheet,
  Activity,
  Settings,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
  { id: 'data_sources', label: 'Data Sources', icon: Database, badge: '8 Connected' },
  { id: 'data_automation', label: 'Data Automation', icon: Cpu, badge: 'Adaptive' },
  { id: 'division_analytics', label: 'Division Analytics', icon: Layers, badge: '8 Divisions' },
  { id: 'sales_intelligence', label: 'Sales Intelligence', icon: TrendingUp, badge: '¥ Insights' },
  { id: 'predictive', label: 'Predictive Analytics', icon: BrainCircuit, badge: 'ML' },
  { id: 'discovery', label: 'Business Discovery', icon: Sparkles, badge: 'Core AI' },
  { id: 'cross_business', label: 'Cross-Business Insights', icon: GitMerge, badge: 'Synergy' },
  { id: 'assistant', label: 'NEXUS AI Assistant', icon: MessageSquareCode, badge: 'Text-to-SQL' },
  { id: 'dx', label: 'DX Recommendations', icon: Rocket, badge: 'ROI Track' },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet, badge: 'PDF/CSV' },
  { id: 'health', label: 'Data Health', icon: Activity, badge: '98.7%' },
  { id: 'settings', label: 'Settings', icon: Settings, badge: null },
];

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  useEffect(() => {
    api.getNotifications()
      .then(setNotifications)
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-[#F4F6F9] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col flex-shrink-0 border-r border-[#1C2541] select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2zm0 5l5.5 11h-11L12 7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-wider text-white text-base">FUJIKYU</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">NEXUS</span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight font-medium">Enterprise Data Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Platform Modules
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-700/25'
                    : 'text-slate-300 hover:bg-[#1C2541] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User & Environment Footer */}
        <div className="p-3 bg-[#070D1E] border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-900 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-200">
                KW
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">Kenji Watanabe</p>
                <p className="text-[10px] text-slate-400 leading-none mt-1">Corporate DX Strategy</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected to PostgreSQL" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs z-10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FUJIKYU NEXUS</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <h1 className="text-sm font-bold text-slate-800 capitalize">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mandatory Demonstration Data Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Demonstration Dataset Mode</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some((n) => !n.is_read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>

              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-800">Operational Alerts</span>
                    <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{n.created_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200" />

            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">Fujikyu Group</div>
              <div className="text-[10px] text-slate-400">富士急行株式会社</div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
