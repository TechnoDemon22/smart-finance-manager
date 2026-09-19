import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
];

const PRESET_ICONS = [
  'Tag', 'Utensils', 'Car', 'Film', 'ShoppingBag', 'FileText',
  'HeartPulse', 'GraduationCap', 'Home', 'Coffee', 'Plane',
  'Gift', 'Smartphone', 'Wifi', 'Activity', 'MoreHorizontal'
];

export default function CategoryModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('Tag');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        color,
        icon,
      });
      setName('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-surface">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <CategoryIcon name={icon} color={color} />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Custom Category</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add an expense bucket</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vacation, Gym, Subscriptions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Select Icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              {PRESET_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <CategoryIcon name={ic} color={icon === ic ? color : undefined} />
                </button>
              ))}
            </div>
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
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
