import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Calendar,
  AlertTriangle,
  CreditCard,
  Plus,
  Repeat,
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { AnalyticsService, ExpenseService } from '../utils/api';
import CategoryIcon from '../components/CategoryIcon';

export default function Dashboard({ onAddExpense, refreshTrigger }) {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, trendRes, expRes] = await Promise.all([
        AnalyticsService.getSummary(),
        AnalyticsService.getTrends(6),
        ExpenseService.getAll({ sort_by: 'date', sort_dir: 'desc' })
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data);
      setRecentExpenses(expRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  if (loading && !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Crunching your financial data...</p>
        </div>
      </div>
    );
  }

  const thisMonthSpent = summary?.this_month_spent || 0;
  const totalBudget = summary?.total_budget || 0;
  const budgetUtilization = summary?.budget_utilization_pct || 0;
  const momChange = summary?.mom_change_pct || 0;
  const categoryBreakdown = summary?.category_breakdown || [];
  const topMerchants = summary?.top_merchants || [];

  // Determine budget status badge
  let budgetColorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  let budgetText = 'On Track';
  if (budgetUtilization >= 120) {
    budgetColorClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse';
    budgetText = 'Critical Overrun';
  } else if (budgetUtilization >= 100) {
    budgetColorClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    budgetText = 'Budget Exceeded';
  } else if (budgetUtilization >= 80) {
    budgetColorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    budgetText = 'Near Limit';
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Spent This Month */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Spent This Month</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ${thisMonthSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            {momChange > 0 ? (
              <span className="inline-flex items-center text-rose-500 font-semibold gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +{momChange}%
              </span>
            ) : (
              <span className="inline-flex items-center text-emerald-500 font-semibold gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> {momChange}%
              </span>
            )}
            <span className="text-slate-400 dark:text-slate-500">vs last month</span>
          </div>
        </div>

        {/* Card 2: Total Budget */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Budget</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Remaining:</span>
            <strong className={`font-semibold ${totalBudget - thisMonthSpent < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              ${(totalBudget - thisMonthSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Card 3: Budget Utilization */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Budget Utilization</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${budgetColorClass}`}>
              {budgetText}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {budgetUtilization}%
            </h3>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUtilization > 100 ? 'bg-rose-500' : budgetUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Subscriptions & Recurring */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Recurring Monthly</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ${(summary?.recurring_total_monthly || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 dark:text-slate-500">
            <span>{summary?.total_transactions || 0} transactions this month</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Spending Donut Chart */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Spending by Category</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current month distribution</p>
              </div>
            </div>

            {categoryBreakdown.length > 0 ? (
              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spent']}
                      contentStyle={{
                        backgroundColor: '#111726',
                        borderColor: '#202b42',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Total</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ${thisMonthSpent.toFixed(0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                No spending data for this month yet.
              </div>
            )}
          </div>

          {/* Category List Mini */}
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
            {categoryBreakdown.slice(0, 4).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]">
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-white font-semibold">${cat.total.toFixed(2)}</span>
                  <span className="text-slate-400 text-[10px] w-8 text-right">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Month Spending Trend Bar Chart */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Monthly Spending (Last 6 Months)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Month-by-month financial comparison</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.monthly_comparison || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#202b42" opacity={0.5} vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Total Spent']}
                  contentStyle={{
                    backgroundColor: '#111726',
                    borderColor: '#202b42',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Trends Area Chart */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Daily Spending Velocity (Last 30 Days)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track expenditure rhythm and daily spikes</p>
          </div>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends?.daily_spending || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#202b42" opacity={0.5} vertical={false} />
              <XAxis dataKey="display" stroke="#64748b" fontSize={10} tickLine={false} interval={3} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: '#111726',
                  borderColor: '#202b42',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#spendingGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Top Merchants and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Merchants Card */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Top Merchants & Vendors</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Where most of your money goes this month</p>
            </div>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {topMerchants.length > 0 ? (
              topMerchants.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{m.merchant}</p>
                      <p className="text-[10px] text-slate-400">{m.category} • {m.count} txns</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">${m.total.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No merchant records available yet.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recent Transactions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest recorded purchases</p>
            </div>
            {onAddExpense && (
              <button
                onClick={onAddExpense}
                className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
              >
                <span>Add</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon name="Tag" className="w-3.5 h-3.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {e.description || e.category}
                      </p>
                      <p className="text-[10px] text-slate-400">{e.date} • {e.payment_method}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    -${Number(e.amount).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No transactions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
