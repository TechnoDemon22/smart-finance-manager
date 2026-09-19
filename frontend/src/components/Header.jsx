import React from 'react';
import { Plus, RotateCw } from 'lucide-react';

export default function Header({ title, subtitle, onAddExpense, onRefresh, isRefreshing }) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 px-8 flex items-center justify-between glass-card sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Data"
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        )}

        {onAddExpense && (
          <button
            onClick={onAddExpense}
            className="btn-primary text-sm shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        )}
      </div>
    </header>
  );
}
