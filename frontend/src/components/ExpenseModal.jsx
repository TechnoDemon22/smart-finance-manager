import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, CreditCard, Repeat, FileText } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function ExpenseModal({ isOpen, onClose, onSave, expenseToEdit, categories = [] }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount || '');
      setCategory(expenseToEdit.category || (categories[0]?.name || 'Food & Dining'));
      setDate(expenseToEdit.date || new Date().toISOString().split('T')[0]);
      setDescription(expenseToEdit.description || '');
      setPaymentMethod(expenseToEdit.payment_method || 'Credit Card');
      setIsRecurring(Boolean(expenseToEdit.is_recurring));
      setRecurringInterval(expenseToEdit.recurring_interval || 'monthly');
    } else {
      setAmount('');
      setCategory(categories[0]?.name || 'Food & Dining');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setPaymentMethod('Credit Card');
      setIsRecurring(false);
      setRecurringInterval('monthly');
    }
    setError('');
  }, [expenseToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than $0.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (!date) {
      setError('Please choose a transaction date.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave({
        id: expenseToEdit?.id,
        amount: parseFloat(amount),
        category,
        date,
        description: description.trim(),
        payment_method: paymentMethod,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-surface">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {expenseToEdit ? 'Update transaction details' : 'Record an outflow or subscription'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field text-base font-semibold"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-500" /> Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Description / Merchant
            </label>
            <input
              type="text"
              placeholder="e.g. Starbucks, Grocery Store, Uber"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" /> Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Credit Card', 'Debit Card', 'Cash', 'UPI', 'Bank Transfer', 'Other'].map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    paymentMethod === method
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring Expense Checkbox */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" /> Recurring Subscription / Expense
              </span>
            </label>

            {isRecurring && (
              <div className="mt-3 pl-6 flex items-center gap-3">
                <span className="text-xs text-slate-500">Repeats:</span>
                {['daily', 'weekly', 'monthly'].map((freq) => (
                  <label key={freq} className="inline-flex items-center gap-1 text-xs capitalize cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value={freq}
                      checked={recurringInterval === freq}
                      onChange={(e) => setRecurringInterval(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">{freq}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
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
              {loading ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
