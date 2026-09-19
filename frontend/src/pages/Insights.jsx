import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  Clock,
  Compass,
  CreditCard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { AnalyticsService } from '../utils/api';
import CategoryIcon from '../components/CategoryIcon';

export default function Insights({ refreshTrigger }) {
  const [insights, setInsights] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      const [insRes, sumRes] = await Promise.all([
        AnalyticsService.getInsights(),
        AnalyticsService.getSummary()
      ]);
      setInsights(insRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error('Failed to load insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsData();
  }, [refreshTrigger]);

  if (loading && !insights) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Analyzing spending patterns & generating forecasts...</p>
        </div>
      </div>
    );
  }

  const patterns = insights?.patterns || {};
  const forecast = insights?.forecast || {};
  const outliers = insights?.outliers || [];
  const recommendations = insights?.recommendations || [];

  const weekendPct = patterns.weekend_percentage || 0;
  const weekdayPct = (100 - weekendPct).toFixed(1);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 glass-card border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Intelligence Engine</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Health & Behavior Analysis
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Our algorithmic engine continuously evaluates your transaction history to detect outliers,
            predict your end-of-month cash flow, and discover hidden optimization opportunities.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none hidden md:block"></div>
      </div>

      {/* Cash Flow Forecast Card & Month-Over-Month Pace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Card */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Cash Flow Forecast ({summary?.current_month_str || 'This Month'})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Projected month-end spending based on current daily velocity
                </p>
              </div>
            </div>

            {/* Forecast Status Badge */}
            {forecast.projected_status === 'on_track' && (
              <span className="badge bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pacing On Budget
              </span>
            )}
            {forecast.projected_status === 'warning' && (
              <span className="badge bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> High Velocity
              </span>
            )}
            {forecast.projected_status === 'danger' && (
              <span className="badge bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-3.5 h-3.5" /> Overrun Warning
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Spent Month-to-Date
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                ${forecast.current_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Avg ${(forecast.daily_average || 0).toFixed(2)} / day
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Projected Month-End
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                ${forecast.projected_month_end?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Target: ${(forecast.total_budget || 0).toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Projected Variance
              </span>
              <span
                className={`text-xl font-bold mt-1 block ${
                  (forecast.total_budget || 0) >= (forecast.projected_month_end || 0)
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {(forecast.total_budget || 0) >= (forecast.projected_month_end || 0) ? '+' : '-'}$
                {Math.abs((forecast.total_budget || 0) - (forecast.projected_month_end || 0)).toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {(forecast.total_budget || 0) >= (forecast.projected_month_end || 0)
                  ? 'Anticipated Surplus'
                  : 'Projected Over Budget'}
              </span>
            </div>
          </div>
        </div>

        {/* Month-over-Month Velocity Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span>Month-over-Month</span>
              {summary?.mom_change_pct >= 0 ? (
                <TrendingUp className="w-4 h-4 text-rose-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {summary?.mom_change_pct >= 0 ? '+' : ''}{summary?.mom_change_pct}%
              </span>
              <span className="text-xs text-slate-500 font-medium">vs last month</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Last month total was ${summary?.last_month_spent?.toFixed(2)}. Current pace is{' '}
              {summary?.mom_change_pct > 0 ? 'higher' : 'lower'} than the preceding period.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Recurring Commitments</span>
            <span className="font-bold text-slate-900 dark:text-white">
              ${summary?.recurring_total_monthly?.toFixed(2)} / mo
            </span>
          </div>
        </div>
      </div>

      {/* Spending Patterns: Weekday vs Weekend & Day Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday vs Weekend Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Weekday vs. Weekend Spending Split
              </h3>
              <p className="text-xs text-slate-500">Based on past 90 days of transactions</p>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10">
              Peak: {patterns.busiest_day}
            </div>
          </div>

          {/* Visual Proportion Bar */}
          <div className="space-y-3">
            <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full transition-all duration-700"
                style={{ width: `${weekdayPct}%` }}
              ></div>
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-r-full transition-all duration-700"
                style={{ width: `${weekendPct}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Weekdays (Mon–Fri)
                  </span>
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-200">
                    {weekdayPct}%
                  </span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  ${patterns.weekday_spend?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Weekends (Sat–Sun)
                  </span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                    {weekendPct}%
                  </span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  ${patterns.weekend_spend?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day-of-Week Distribution Chart */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Day-of-Week Distribution
              </h3>
              <p className="text-xs text-slate-500">Cumulative expenditure by day</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patterns.day_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => val.slice(0, 3)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Total Spent']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {(patterns.day_distribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.day === patterns.busiest_day ? '#10B981' : '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Smart Recommendations Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span>Personalized Saving Recommendations</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Actionable tips derived from your spending trajectory and recurring commitments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, i) => {
            let borderClass = 'border-slate-200 dark:border-slate-800';
            let bgClass = 'bg-slate-50/50 dark:bg-dark-card/50';
            let icon = <Lightbulb className="w-5 h-5 text-amber-500" />;

            if (rec.type === 'danger') {
              borderClass = 'border-rose-500/30';
              bgClass = 'bg-rose-500/5 dark:bg-rose-500/10';
              icon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
            } else if (rec.type === 'warning') {
              borderClass = 'border-amber-500/30';
              bgClass = 'bg-amber-500/5 dark:bg-amber-500/10';
              icon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
            } else if (rec.type === 'success') {
              borderClass = 'border-emerald-500/30';
              bgClass = 'bg-emerald-500/5 dark:bg-emerald-500/10';
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            } else if (rec.type === 'saving') {
              borderClass = 'border-teal-500/30';
              bgClass = 'bg-teal-500/5 dark:bg-teal-500/10';
              icon = <Zap className="w-5 h-5 text-teal-500" />;
            }

            return (
              <div
                key={i}
                className={`glass-card rounded-2xl p-5 border ${borderClass} ${bgClass} transition-all duration-200`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-white dark:bg-dark-surface shadow-sm shrink-0">
                    {icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {rec.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outlier & Unusual Spending Detection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>Unusual Spending Detection (Outliers)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transactions that significantly exceed the standard variance (IQR &gt; 1.5x) for their category
          </p>
        </div>

        {outliers.length > 0 ? (
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {outliers.map((o) => (
                <div
                  key={o.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {o.description}
                        </span>
                        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                          {o.category}
                        </span>
                        {o.severity === 'high' ? (
                          <span className="badge bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px]">
                            High Deviation
                          </span>
                        ) : (
                          <span className="badge bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px]">
                            Moderate Spike
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        Date: {o.date} • Typical maximum for category: ${o.typical_max.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                      ${o.amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      +${(o.amount - o.typical_max).toFixed(2)} above norm
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center glass-card rounded-2xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">No unusual spending spikes detected</p>
            <p className="text-xs text-slate-500 mt-1">All transactions fall within normal statistical distribution.</p>
          </div>
        )}
      </div>
    </div>
  );
}
