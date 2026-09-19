import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Edit3,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { BudgetService } from '../utils/api';
import CategoryIcon from '../components/CategoryIcon';

export default function Budgets({ refreshTrigger }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [carryForward, setCarryForward] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all, warning, exceeded, safe

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await BudgetService.getAll();
      setBudgets(res.data);
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [refreshTrigger]);

  const handleEditClick = (b) => {
    setEditingBudget(b);
    setNewLimit(b.monthly_limit.toString());
    setCarryForward(Boolean(b.carry_forward));
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!editingBudget) return;

    setSaving(true);
    try {
      await BudgetService.set(editingBudget.category, {
        monthly_limit: parseFloat(newLimit),
        carry_forward: carryForward
      });
      setEditingBudget(null);
      fetchBudgets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const totalBudget = budgets.reduce((acc, b) => acc + (b.monthly_limit || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallUtilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

  const warningCount = budgets.filter((b) => b.status === 'warning').length;
  const exceededCount = budgets.filter((b) => b.status === 'exceeded' || b.status === 'danger').length;

  const filteredBudgets = budgets.filter((b) => {
    if (filter === 'warning') return b.status === 'warning';
    if (filter === 'exceeded') return b.status === 'exceeded' || b.status === 'danger';
    if (filter === 'safe') return b.status === 'normal';
    return true;
  });

  const getStatusBadge = (status, utilization) => {
    switch (status) {
      case 'danger':
        return (
          <span className="badge bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> Critical ({utilization}%)
          </span>
        );
      case 'exceeded':
        return (
          <span className="badge bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertTriangle className="w-3 h-3" /> Over Budget ({utilization}%)
          </span>
        );
      case 'warning':
        return (
          <span className="badge bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Near Limit ({utilization}%)
          </span>
        );
      default:
        return (
          <span className="badge bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> On Track ({utilization}%)
          </span>
        );
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'exceeded':
        return 'bg-gradient-to-r from-amber-500 to-rose-500';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500';
      default:
        return 'bg-gradient-to-r from-emerald-400 to-teal-500';
    }
  };

  if (loading && budgets.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading budget allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Monthly Budget */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Budget</span>
            <PieIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Across {budgets.length} active categories
          </p>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Total Spent */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Spent This Month</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallUtilization >= 100 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(overallUtilization, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {overallUtilization}%
            </span>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Remaining Buffer</span>
            <DollarSign className="w-4 h-4 text-teal-500" />
          </div>
          <div
            className={`text-2xl font-extrabold ${
              totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {totalRemaining < 0 ? '-' : ''}$
            {Math.abs(totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {totalRemaining >= 0 ? 'Available for discretionary spend' : 'Over planned limit'}
          </p>
        </div>

        {/* Alert Summary */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Budget Health</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {budgets.length - exceededCount - warningCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {budgets.length} Safe</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
            {exceededCount > 0 && (
              <span className="text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {exceededCount} exceeded
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {warningCount} near limit
              </span>
            )}
            {exceededCount === 0 && warningCount === 0 && (
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All budgets healthy
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs and Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Category Budgets</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set and track monthly spending targets per category
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-medium">
          {[
            { key: 'all', label: 'All Budgets' },
            { key: 'safe', label: 'On Track' },
            { key: 'warning', label: 'Near Limit (80%)' },
            { key: 'exceeded', label: 'Exceeded (100%+)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === tab.key
                  ? 'bg-white dark:bg-dark-card text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBudgets.map((b) => (
          <div
            key={b.id || b.category}
            className={`glass-card rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between ${
              b.status === 'danger'
                ? 'border-rose-500/40 bg-rose-500/[0.02]'
                : b.status === 'exceeded'
                ? 'border-red-500/30'
                : b.status === 'warning'
                ? 'border-amber-500/30'
                : 'border-slate-200 dark:border-slate-800/80'
            }`}
          >
            <div>
              {/* Category Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <CategoryIcon name={b.icon} color={b.color} className="w-5 h-5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {b.category}
                    </h4>
                    {b.carry_forward ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Auto Carry-Forward
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Standard monthly</span>
                    )}
                  </div>
                </div>

                {getStatusBadge(b.status, b.utilization)}
              </div>

              {/* Spend Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Spent this month</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    ${b.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Limit</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    ${b.monthly_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800/90 rounded-full h-2.5 overflow-hidden mt-2 p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(b.status)}`}
                    style={{ width: `${Math.min(b.utilization, 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 font-medium">
                  <span className={b.remaining >= 0 ? 'text-slate-500 dark:text-slate-400' : 'text-rose-500 font-semibold'}>
                    {b.remaining >= 0 ? `$${b.remaining.toFixed(2)} remaining` : `$${Math.abs(b.remaining).toFixed(2)} over budget`}
                  </span>
                  <span className="text-slate-400">{b.utilization}% used</span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Alerts: 80% • 100% • 120%
              </span>
              <button
                onClick={() => handleEditClick(b)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Limit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBudgets.length === 0 && (
        <div className="p-12 text-center glass-card rounded-2xl">
          <PieIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No budgets found in this category filter</p>
          <p className="text-xs text-slate-500 mt-1">Select "All Budgets" to view all category limits.</p>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-surface">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <CategoryIcon name={editingBudget.icon} color={editingBudget.color} className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Set Budget for {editingBudget.category}
                  </h3>
                  <p className="text-xs text-slate-500">Configure monthly limit & carry forward rule</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Monthly Budget Limit ($)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="input-field text-lg font-bold"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Current spend this month: ${editingBudget.spent.toFixed(2)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={carryForward}
                    onChange={(e) => setCarryForward(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Auto Carry-Forward Unused Budget
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                      If enabled, any leftover amount from this month's budget will be added to next month's spending allowance.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  disabled={saving}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs"
                >
                  {saving ? 'Saving...' : 'Update Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
