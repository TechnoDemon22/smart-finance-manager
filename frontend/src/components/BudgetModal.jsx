import React, { useState, useEffect } from 'react';
import { X, DollarSign, ArrowRightLeft } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function BudgetModal({ isOpen, onClose, onSave, budgetToEdit, categories = [] }) {
  const [category, setCategory] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [carryForward, setCarryForward] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budgetToEdit) {
      setCategory(budgetToEdit.category || '');
      setMonthlyLimit(budgetToEdit.monthly_limit || '');
      setCarryForward(Boolean(budgetToEdit.carry_forward));
    } else {
      setCategory(categories[0]?.name || '');
      setMonthlyLimit('');
      setCarryForward(false);
    }
    setError('');
  }, [budgetToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      setError('Please choose a category.');
      return;
    }
    if (monthlyLimit === '' || parseFloat(monthlyLimit) < 0) {
      setError('Please provide a non-negative monthly limit.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave(category, {
        monthly_limit: parseFloat(monthlyLimit),
        carry_forward: carryForward,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save budget.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = categories.find((c) => c.name === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-surface">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <CategoryIcon name={selectedCat?.icon || 'PieChart'} color={selectedCat?.color} />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {budgetToEdit ? `Edit ${category} Budget` : 'Set Category Budget'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly spending target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {!budgetToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Monthly Spending Limit ($)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              placeholder="e.g. 500"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              className="input-field font-semibold text-base"
              autoFocus
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={carryForward}
                onChange={(e) => setCarryForward(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3 text-indigo-500" /> Carry-forward unused budget
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Surplus budget from previous months rolls over into future available funds.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs"
            >
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
