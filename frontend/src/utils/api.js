import axios from 'axios';

// Resolve API URL (dynamic via Electron preload or fallback to localhost:5500)
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__SMART_FINANCE_PORT__) {
    return `http://127.0.0.1:${window.__SMART_FINANCE_PORT__}/api`;
  }
  // If running from file:// in Electron
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'http://127.0.0.1:5500/api';
  }
  // Otherwise default or Vite proxy
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update baseURL dynamically if port becomes known
export const setApiPort = (port) => {
  api.defaults.baseURL = `http://127.0.0.1:${port}/api`;
};

// API Services
export const ExpenseService = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  bulkDelete: (ids) => api.post('/expenses/bulk-delete', { ids }),
};

export const CategoryService = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const BudgetService = {
  getAll: () => api.get('/budgets'),
  set: (categoryName, data) => api.put(`/budgets/${encodeURIComponent(categoryName)}`, data),
};

export const AnalyticsService = {
  getSummary: () => api.get('/analytics/summary'),
  getTrends: (months = 6) => api.get('/analytics/trends', { params: { months } }),
  getInsights: () => api.get('/analytics/insights'),
};

export const DataService = {
  getStats: () => api.get('/data/stats'),
  createBackup: () => api.post('/data/backup'),
  restoreBackup: (filename) => api.post('/data/restore', { filename }),
  importCsv: (formData) => api.post('/data/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getExportCsvUrl: () => `${api.defaults.baseURL}/data/export/csv`,
  getExportExcelUrl: () => `${api.defaults.baseURL}/data/export/excel`,
};

export const SystemService = {
  getHealth: () => api.get('/health'),
};

export default api;
