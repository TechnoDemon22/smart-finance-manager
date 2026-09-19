import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Sparkles,
  Settings,
  Sun,
  Moon,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: ReceiptText },
  { path: '/budgets', label: 'Budgets', icon: PieChart },
  { path: '/insights', label: 'Smart Insights', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ darkMode, setDarkMode, isConnected }) {
  return (
    <aside className="w-64 h-screen flex flex-col glass-surface select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
              SmartFinance
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Desktop Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / System Status & Theme Switcher */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        {/* Backend Connection Indicator */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/40 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Backend Server</span>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            {darkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-300/60 dark:bg-slate-700/60">
            Toggle
          </span>
        </button>
      </div>
    </aside>
  );
}
