import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Menu, LogOut, Settings, User, AlertTriangle, CheckCircle } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  billing: 'POS Billing',
  products: 'Products',
  inventory: 'Inventory',
  orders: 'Orders',
  invoices: 'Invoices',
  reports: 'Reports',
  'ai-insights': 'AI Insights',
  staff: 'Staff',
  settings: 'Settings',
};

export default function TopNav({ activeTab, setActiveTab, currentUser, onSignOut, darkMode, setDarkMode, onMenuClick, products = [], notifications = [] }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const lowStockCount = products.filter(p => p.units > 0 && p.units < 10).length;
  const outOfStockCount = products.filter(p => p.units === 0).length;
  const totalAlerts = lowStockCount + outOfStockCount + notifications.length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 flex-shrink-0"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <div className="hidden sm:block flex-shrink-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {PAGE_TITLES[activeTab] || 'QuickBill'}
        </h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search hint */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('openCommandPalette'))}
        className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 border
          ${searchFocused
            ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700'
            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          } text-slate-400 dark:text-slate-500`}
        style={{ minWidth: 200 }}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 relative"
        >
          <Bell className="h-4 w-4" />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 card shadow-lg z-50 animate-slideDown overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</h3>
              {totalAlerts > 0 && (
                <span className="badge badge-red">{totalAlerts} alerts</span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {outOfStockCount > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Out of Stock</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{outOfStockCount} product{outOfStockCount !== 1 ? 's' : ''} need restocking</p>
                  </div>
                </div>
              )}
              {lowStockCount > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Low Stock Warning</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{lowStockCount} product{lowStockCount !== 1 ? 's' : ''} running low</p>
                  </div>
                </div>
              )}
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                  </div>
                </div>
              ))}
              {totalAlerts === 0 && (
                <div className="px-4 py-8 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">All clear! No alerts.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {(currentUser?.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
            {currentUser?.name?.split(' ')[0]}
          </span>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 card shadow-lg z-50 overflow-hidden animate-slideDown">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
              <span className="badge badge-violet mt-1">{currentUser?.role}</span>
            </div>
            <div className="p-2">
              <button
                onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </button>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
