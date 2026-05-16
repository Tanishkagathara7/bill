import React, { useState, useEffect, useCallback } from 'react';
import './index.css';

// Context
import { AppProvider } from './context/AppContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import Settings from './pages/Settings';

// Utils
import { getUserProducts, getUserBills, getCurrentUser, setCurrentUser, authenticateUser, signOutUser, USER_ROLES } from './utils/userManager';
import { productsApi, billsApi } from './utils/mockApi';
import { getSettings, saveSettings } from './utils/settings';

// Staff Management (keep existing for now, wrapped inside Settings)
import StaffManagement from './StaffManagement';

function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUserState] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── App state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [settings, setSettingsState] = useState(getSettings());
  const [notifications, setNotifications] = useState([]);

  // ── Init auth ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserState(user);
      setDarkMode(user.preferences?.darkMode || false);
    }
    setAuthLoading(false);
  }, []);

  // ── Dark mode class on html ─────────────────────────────────────────────────
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ── Load data when user changes ─────────────────────────────────────────────
  const refreshProducts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const p = await productsApi.getAll();
      setProducts(p || []);
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  }, [currentUser]);

  const refreshBills = useCallback(async () => {
    if (!currentUser) return;
    try {
      const b = await billsApi.getAll();
      setBills(b || []);
    } catch (e) {
      console.error('Failed to load bills:', e);
    }
  }, [currentUser]);

  const refreshSettings = useCallback(() => {
    setSettingsState(getSettings());
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshProducts();
      refreshBills();
    }
  }, [currentUser, refreshProducts, refreshBills]);

  // ── Auth handlers ───────────────────────────────────────────────────────────
  const handleLogin = async (email, password) => {
    const result = authenticateUser(email, password);
    if (!result.success) throw new Error(result.message || 'Invalid credentials');
    setCurrentUser(result.user);
    setCurrentUserState(result.user);
  };

  const handleSignOut = () => {
    signOutUser();
    setCurrentUserState(null);
    setProducts([]);
    setBills([]);
    setActiveTab('dashboard');
  };

  // ── Notification helper ─────────────────────────────────────────────────────
  const addNotification = (title, message) => {
    setNotifications(prev => [...prev, { title, message, id: Date.now() }]);
    setTimeout(() => setNotifications(prev => prev.slice(1)), 5000);
  };

  // ── Context value ───────────────────────────────────────────────────────────
  const contextValue = {
    currentUser,
    products,
    bills,
    settings,
    refreshProducts,
    refreshBills,
    refreshSettings,
    addNotification,
    darkMode,
    setDarkMode,
    setActiveTab,
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-glow">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading QuickBill...</p>
        </div>
      </div>
    );
  }

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  // ── Render page ─────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'billing':
        return <Billing onBillCreated={() => { refreshBills(); refreshProducts(); addNotification('Bill Created', 'Sale recorded successfully'); }} />;
      case 'products':
        return currentUser.role === USER_ROLES.OWNER ? <Products /> : <div className="card p-8 text-center"><p className="text-slate-500 dark:text-slate-400">Access restricted to Owners</p></div>;
      case 'inventory':
        return currentUser.role === USER_ROLES.OWNER ? <Inventory /> : <div className="card p-8 text-center"><p className="text-slate-500 dark:text-slate-400">Access restricted to Owners</p></div>;
      case 'orders':
        return <Orders setActiveTab={setActiveTab} />;
      case 'reports':
        return currentUser.role === USER_ROLES.OWNER ? <Reports /> : <div className="card p-8 text-center"><p className="text-slate-500 dark:text-slate-400">Access restricted to Owners</p></div>;
      case 'ai-insights':
        return currentUser.role === USER_ROLES.OWNER ? <AIInsights onGoToSettings={() => setActiveTab('settings')} /> : <div className="card p-8 text-center"><p className="text-slate-500 dark:text-slate-400">Access restricted to Owners</p></div>;
      case 'staff':
        return currentUser.role === USER_ROLES.OWNER ? <StaffManagement currentUser={currentUser} orders={bills} /> : null;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <AppProvider value={contextValue}>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        products={products}
        notifications={notifications}
      >
        {renderPage()}
      </Layout>
    </AppProvider>
  );
}

export default App;