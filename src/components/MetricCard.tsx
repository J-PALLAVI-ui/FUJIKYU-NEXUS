import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel = 'vs last period',
  icon,
  badge,
  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-blue-400' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend !== undefined) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
          {trend !== undefined ? (
            <div className="flex items-center space-x-1">
              {trend > 0 ? (
                <span className="flex items-center text-emerald-600 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{trend}%
                </span>
              ) : trend < 0 ? (
                <span className="flex items-center text-rose-600 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {trend}%
                </span>
              ) : (
                <span className="flex items-center text-slate-500">
                  <Minus className="w-3.5 h-3.5 mr-0.5" /> 0%
                </span>
              )}
              <span className="text-slate-400 text-[11px]">{trendLabel}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
