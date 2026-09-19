import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Calendar,
  DollarSign,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Repeat
} from 'lucide-react';
import { ExpenseService, CategoryService, DataService } from '../utils/api';
import CategoryIcon from '../components/CategoryIcon';
import ImportModal from '../components/ImportModal';

export default function Expenses({ onAddExpense, onEditExpense, refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [datePreset, setDatePreset] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchExpensesAndCategories = async () => {
    try {
      setLoading(true);
      const params = {
        sort_by: sortBy,
        sort_dir: sortDir,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedPaymentMethod !== 'All') params.payment_method = selectedPaymentMethod;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minAmount) params.min_amount = minAmount;
      if (maxAmount) params.max_amount = maxAmount;

      const [expRes, catRes] = await Promise.all([
        ExpenseService.getAll(params),
        CategoryService.getAll(),
      ]);

      setExpenses(expRes.data);
      setCategories(catRes.data);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndCategories();
  }, [sortBy, sortDir, selectedCategory, selectedPaymentMethod, startDate, endDate, minAmount, maxAmount, refreshTrigger]);

  // Handle Date Preset Changes
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === 'All') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'This Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'Last 30 Days') {
      const prior = new Date();
      prior.setDate(today.getDate() - 30);
      setStartDate(prior.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'This Year') {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExpensesAndCategories();
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await ExpenseService.delete(id);
        fetchExpensesAndCategories();
      } catch (err) {
        alert('Failed to delete expense.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected expenses?`)) {
      try {
        await ExpenseService.bulkDelete(Array.from(selectedIds));
        fetchExpensesAndCategories();
      } catch (err) {
        alert('Failed to delete selected expenses.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedExpenses.length && paginatedExpenses.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedExpenses.map((e) => e.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Pagination calculations
  const totalItems = expenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);
  const totalFilteredSum = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Expense Records</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {totalItems} transactions totaling{' '}
            <strong className="text-emerald-500 font-bold">${totalFilteredSum.toFixed(2)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={DataService.getExportCsvUrl()}
            download
            className="btn-secondary text-xs"
            title="Download CSV"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Export CSV</span>
          </a>

          <a
            href={DataService.getExportExcelUrl()}
            download
            className="btn-secondary text-xs"
            title="Download Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export Excel</span>
          </a>

          <button
            onClick={() => setIsImportOpen(true)}
            className="btn-secondary text-xs"
          >
            <Upload className="w-3.5 h-3.5 text-purple-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onAddExpense}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, merchant, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs shrink-0">
            Filter
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field py-1.5"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => {
                setSelectedPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field py-1.5"
            >
              <option value="All">All Methods</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date Preset</label>
            <select
              value={datePreset}
              onChange={(e) => {
                handleDatePreset(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field py-1.5"
            >
              <option value="All">All Time</option>
              <option value="This Month">This Month</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Year">This Year</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('Custom');
                setCurrentPage(1);
              }}
              className="input-field py-1.5"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('Custom');
                setCurrentPage(1);
              }}
              className="input-field py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs animate-fade-in">
          <span className="font-semibold">{selectedIds.size} transactions selected</span>
          <button
            onClick={handleBulkDelete}
            className="btn-danger text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Expenses Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold select-none">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedExpenses.length && paginatedExpenses.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('category')}
                  className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('description')}
                  className="p-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Description / Merchant</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4">Payment</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="p-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((expense) => {
                  const cat = categories.find((c) => c.name === expense.category);
                  const isChecked = selectedIds.has(expense.id);
                  return (
                    <tr
                      key={expense.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isChecked ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(expense.id)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {expense.date}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={cat?.icon || 'Tag'} color={cat?.color} className="w-3.5 h-3.5" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {expense.category}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span>{expense.description || '—'}</span>
                          {expense.is_recurring && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <Repeat className="w-2.5 h-2.5" /> {expense.recurring_interval}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {expense.payment_method}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ${Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditExpense(expense)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages} ({totalItems} total entries)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          fetchExpensesAndCategories();
        }}
      />
    </div>
  );
}
