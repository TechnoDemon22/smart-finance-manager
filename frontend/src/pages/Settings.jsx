import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Download,
  Upload,
  Database,
  RefreshCw,
  HardDrive,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Folder,
  Shield,
  Palette,
  Tag
} from 'lucide-react';
import { CategoryService, DataService } from '../utils/api';
import CategoryIcon from '../components/CategoryIcon';
import ImportModal from '../components/ImportModal';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#64748B', '#14B8A6', '#84CC16'
];

const AVAILABLE_ICONS = [
  'Utensils', 'Car', 'Film', 'ShoppingBag',
  'FileText', 'HeartPulse', 'GraduationCap', 'MoreHorizontal',
  'Home', 'Coffee', 'Plane', 'Gift',
  'Smartphone', 'Wifi', 'Activity', 'Tag'
];

export default function Settings({ darkMode, setDarkMode, refreshTrigger }) {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  // Backup state
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState(null);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [catRes, statRes] = await Promise.all([
        CategoryService.getAll(),
        DataService.getStats()
      ]);
      setCategories(catRes.data);
      setStats(statRes.data);
    } catch (err) {
      console.error('Failed to load settings data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, [refreshTrigger]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError('Category name cannot be empty.');
      return;
    }

    setCreatingCat(true);
    setCatError('');
    setCatSuccess('');

    try {
      await CategoryService.create({
        name: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon
      });
      setCatSuccess(`Category "${newCatName}" added!`);
      setNewCatName('');
      fetchSettingsData();
    } catch (err) {
      setCatError(err.response?.data?.error || 'Failed to create category.');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      await CategoryService.delete(id);
      fetchSettingsData();
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot delete category.');
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    setBackupMessage(null);
    try {
      const res = await DataService.createBackup();
      setBackupMessage({
        type: 'success',
        text: `Backup created: ${res.data.filename}`
      });
      fetchSettingsData();
    } catch (err) {
      setBackupMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to create backup'
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to restore "${filename}"? This replaces current database data.`)) {
      return;
    }

    setBackupLoading(true);
    setBackupMessage(null);
    try {
      await DataService.restoreBackup(filename);
      setBackupMessage({
        type: 'success',
        text: `Successfully restored database from ${filename}!`
      });
      fetchSettingsData();
    } catch (err) {
      setBackupMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to restore backup'
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = DataService.getExportCsvUrl();
  };

  const handleDownloadExcel = () => {
    window.location.href = DataService.getExportExcelUrl();
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto pb-16">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Application Settings & Data Management
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage spending categories, local database backups, and data imports/exports
        </p>
      </div>

      {/* Section 1: Data Management (Export & Import) */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Data Export & Import
            </h3>
            <p className="text-xs text-slate-500">
              Download your records for spreadsheets or import existing statements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Export CSV */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm mb-1">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Export to CSV</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Raw CSV format containing all expense dates, categories, amounts, and notes.
              </p>
            </div>
            <button
              onClick={handleDownloadCsv}
              className="btn-secondary text-xs mt-4 w-full justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Export Excel */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm mb-1">
                <FileSpreadsheet className="w-4 h-4 text-teal-500" />
                <span>Export to Excel (.xlsx)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-sheet workbook containing both detailed Expenses and Category Budgets.
              </p>
            </div>
            <button
              onClick={handleDownloadExcel}
              className="btn-secondary text-xs mt-4 w-full justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel</span>
            </button>
          </div>

          {/* Import CSV */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm mb-1">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>Import Statement (CSV)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload bank transactions with intelligent column header auto-detection.
              </p>
            </div>
            <button
              onClick={() => setIsImportOpen(true)}
              className="btn-primary text-xs mt-4 w-full justify-center"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Category Management */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Category Customization
            </h3>
            <p className="text-xs text-slate-500">
              Create and manage personalized spending buckets with custom colors and icons
            </p>
          </div>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 mb-6">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            Add New Custom Category
          </h4>

          {catError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium mb-3">
              {catError}
            </div>
          )}
          {catSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium mb-3">
              {catSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Category Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Subscriptions, Pet Care"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Theme Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newCatColor === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Associated Icon
              </label>
              <div className="flex items-center gap-2">
                <CategoryIcon name={newCatIcon} color={newCatColor} className="w-5 h-5" />
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {AVAILABLE_ICONS.map((iconName) => (
                    <option key={iconName} value={iconName}>
                      {iconName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creatingCat}
              className="btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{creatingCat ? 'Adding...' : 'Create Category'}</span>
            </button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-dark-card/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CategoryIcon name={c.icon} color={c.color} className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {c.name}
                </span>
              </div>
              <button
                onClick={() => handleDeleteCategory(c.id, c.name)}
                title="Delete Category"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: SQLite Database & Backup Management */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Database & Backup Management
              </h3>
              <p className="text-xs text-slate-500">
                Self-contained offline SQLite storage in your Windows user profile
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateBackup}
            disabled={backupLoading}
            className="btn-primary text-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{backupLoading ? 'Creating...' : 'Create Instant Backup'}</span>
          </button>
        </div>

        {backupMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
              backupMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-600'
            }`}
          >
            {backupMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{backupMessage.text}</span>
          </div>
        )}

        {/* Database Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Database File Path</span>
            <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1 block break-all">
              {stats?.database_path || '%APPDATA%/SmartFinanceManager/finance.db'}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Storage Size</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
              {stats?.size_bytes ? `${(stats.size_bytes / 1024).toFixed(1)} KB` : '0 KB'}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recorded Entities</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
              {stats?.expense_count || 0} expenses • {stats?.category_count || 0} categories
            </span>
          </div>
        </div>

        {/* Backup History Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Local Backup Archives
          </h4>

          {stats?.backups && stats.backups.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {stats.backups.map((b) => (
                  <div
                    key={b.filename}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {b.filename}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Created {new Date(b.created_at).toLocaleString()} • {(b.size_bytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreBackup(b.filename)}
                      disabled={backupLoading}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Restore This Snapshot</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No backups created yet. Click "Create Instant Backup" above to archive your current data.
            </div>
          )}
        </div>
      </div>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          fetchSettingsData();
        }}
      />
    </div>
  );
}
