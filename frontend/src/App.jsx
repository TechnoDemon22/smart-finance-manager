import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ExpenseModal from './components/ExpenseModal';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import { SystemService, CategoryService, ExpenseService, setApiPort } from './utils/api';

function AppLayout() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('smart_finance_dark_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isConnected, setIsConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [categories, setCategories] = useState([]);

  // Apply dark mode class to <html>
  useEffect(() => {
    localStorage.setItem('smart_finance_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load Categories for Modal
  const loadCategories = async () => {
    try {
      const res = await CategoryService.getAll();
      setCategories(res.data);
    } catch (err) {
      console.warn('Could not fetch categories', err);
    }
  };

  // Health check & port resolution
  useEffect(() => {
    // Check if Electron provided port via window
    if (typeof window !== 'undefined' && window.__SMART_FINANCE_PORT__) {
      setApiPort(window.__SMART_FINANCE_PORT__);
    }

    const checkHealth = async () => {
      try {
        await SystemService.getHealth();
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      }
    };

    checkHealth();
    loadCategories();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    loadCategories();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (data) => {
    if (data.id) {
      await ExpenseService.update(data.id, data);
    } else {
      await ExpenseService.create(data);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  // Page header titles
  const getHeaderMeta = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard Overview', subtitle: 'Real-time financial pulse & spending breakdown' };
      case '/expenses':
        return { title: 'Expense Transactions', subtitle: 'Search, filter, and inspect detailed transactions' };
      case '/budgets':
        return { title: 'Category Budgets', subtitle: 'Monthly targets, utilization thresholds & alerts' };
      case '/insights':
        return { title: 'Smart Financial Insights', subtitle: 'Algorithmic trends, forecast & cash flow intelligence' };
      case '/settings':
        return { title: 'Preferences & Storage', subtitle: 'Custom categories, Excel/CSV exports & local backup' };
      default:
        return { title: 'Smart Finance Manager', subtitle: 'Personal wealth and expense management' };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} isConnected={isConnected} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onAddExpense={handleOpenAddExpense}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  onAddExpense={handleOpenAddExpense}
                  refreshTrigger={refreshTrigger}
                />
              }
            />
            <Route
              path="/expenses"
              element={
                <Expenses
                  onAddExpense={handleOpenAddExpense}
                  onEditExpense={handleOpenEditExpense}
                  refreshTrigger={refreshTrigger}
                />
              }
            />
            <Route
              path="/budgets"
              element={<Budgets refreshTrigger={refreshTrigger} />}
            />
            <Route
              path="/insights"
              element={<Insights refreshTrigger={refreshTrigger} />}
            />
            <Route
              path="/settings"
              element={
                <Settings
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  refreshTrigger={refreshTrigger}
                />
              }
            />
          </Routes>
        </main>
      </div>

      {/* Global Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        categories={categories}
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}
