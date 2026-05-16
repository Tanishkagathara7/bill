import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  ClipboardList, FileText, BarChart2, Sparkles, Settings,
  ChevronLeft, ChevronRight, Zap, LogOut, Users, X,
  ChevronDown, User as UserIcon
} from 'lucide-react';
import { USER_ROLES } from '../../utils/userManager';

// ── Navigation items (unchanged) ────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard, roles: ['all'] },
  { id: 'billing',     label: 'POS Billing', icon: ShoppingCart,     roles: ['all'] },
  { id: 'products',    label: 'Products',    icon: Package,           roles: [USER_ROLES.OWNER] },
  { id: 'inventory',   label: 'Inventory',   icon: Warehouse,         roles: [USER_ROLES.OWNER] },
  { id: 'orders',      label: 'Orders',      icon: ClipboardList,     roles: ['all'] },
  { id: 'reports',     label: 'Reports',     icon: BarChart2,         roles: [USER_ROLES.OWNER] },
  { id: 'ai-insights', label: 'AI Insights', icon: Sparkles,          roles: [USER_ROLES.OWNER] },
  { id: 'staff',       label: 'Staff',       icon: Users,             roles: [USER_ROLES.OWNER] },
  { id: 'settings',    label: 'Settings',    icon: Settings,          roles: ['all'] },
];

// ── Tooltip wrapper ──────────────────────────────────────────────────────────
function Tooltip({ label, children, show }) {
  if (!show) return children;
  return (
    <div className="relative group/tip flex justify-center">
      {children}
      <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[200]
        opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 whitespace-nowrap">
        <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium
          px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 dark:border-slate-600">
          {label}
          {/* Arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4
            border-transparent border-r-slate-900 dark:border-r-slate-700" />
        </div>
      </div>
    </div>
  );
}

// ── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ item, isActive, collapsed, onClick }) {
  const Icon = item.icon;

  return (
    <Tooltip label={item.label} show={collapsed}>
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.01, x: collapsed ? 0 : 2 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5
          text-sm font-medium transition-colors duration-150 cursor-pointer
          ${collapsed ? 'justify-center' : ''}
          ${isActive
            ? 'text-indigo-700 dark:text-indigo-300'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}
        `}
        style={{ outline: 'none' }}
      >
        {/* Active background */}
        {isActive && (
          <motion.div
            layoutId="activeNavBg"
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.10) 100%)',
              border: '1px solid rgba(165,180,252,0.4)',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 2px 8px rgba(99,102,241,0.12)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
        )}

        {/* Hover background (non-active) */}
        {!isActive && (
          <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-150"
            style={{ background: 'rgba(148,163,184,0.08)' }} />
        )}

        {/* Icon */}
        <div className={`relative flex-shrink-0 w-5 h-5 flex items-center justify-center
          ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
          <Icon className="h-4 w-4" />
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                transform: 'scale(2.2)',
              }}
            />
          )}
        </div>

        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              className="relative flex-1 text-left font-medium tracking-[-0.01em]"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Active dot indicator */}
        <AnimatePresence>
          {isActive && !collapsed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="relative ml-auto flex-shrink-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              <motion.div
                className="absolute inset-0 rounded-full bg-indigo-400"
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </Tooltip>
  );
}

// ── User profile card ─────────────────────────────────────────────────────────
function ProfileCard({ currentUser, onSignOut, collapsed, onSettingsClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (currentUser?.name || 'U').charAt(0).toUpperCase();

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (collapsed) {
    return (
      <Tooltip label={currentUser?.name || 'User'} show>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSignOut}
          title="Sign out"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm
            shadow-md hover:shadow-lg transition-shadow"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          {initial}
        </motion.button>
      </Tooltip>
    );
  }

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        className="profile-card-btn w-full rounded-2xl p-3 flex items-center gap-3 text-left
          border border-slate-200/80 dark:border-slate-700/60
          transition-all duration-200 hover:shadow-md group"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm
          flex-shrink-0 shadow-md"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
          {initial}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {currentUser?.name || 'User'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
            {currentUser?.role}
          </p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="profile-dropdown absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden
              border border-slate-200 dark:border-slate-700
              shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentUser?.email}
              </p>
            </div>

            {/* Actions */}
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={() => { setOpen(false); onSettingsClick?.(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                  text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40
                  hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-150 font-medium"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
              <button
                onClick={() => { setOpen(false); onSignOut(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                  text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40
                  transition-colors duration-150 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sidebar inner content ─────────────────────────────────────────────────────
function SidebarContent({ collapsed, activeTab, setActiveTab, currentUser, onSignOut, onMobileClose }) {
  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes('all') || item.roles.includes(currentUser?.role)
  );

  const navigate = (id) => { setActiveTab(id); onMobileClose?.(); };

  return (
    <div className="flex flex-col h-full">

      {/* ── Branding ── */}
      <div className={`flex items-center gap-3 px-4 py-5 flex-shrink-0
        ${collapsed ? 'justify-center px-3' : ''}`}>

        {/* Logo icon */}
        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.3), 0 4px 14px rgba(99,102,241,0.35)',
          }}
          onClick={() => navigate('dashboard')}
        >
          <Zap className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
        </motion.div>

        {/* Brand text */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <p className="font-bold text-[17px] leading-tight tracking-tight text-slate-900 dark:text-slate-100"
                style={{ letterSpacing: '-0.02em' }}>
                QuickBill
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5">
                Smart POS
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-100 dark:bg-slate-800 flex-shrink-0" />

      {/* ── Navigation ── */}
      <nav className={`flex-1 p-3 space-y-0.5 overflow-y-auto
        scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700`}>

        {/* Group label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest
                text-slate-400 dark:text-slate-600"
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {visibleItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
          >
            <NavItem
              item={item}
              isActive={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => navigate(item.id)}
            />
          </motion.div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-100 dark:bg-slate-800 flex-shrink-0" />

      {/* ── Profile card ── */}
      <div className={`p-3 flex-shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        <ProfileCard
          currentUser={currentUser}
          onSignOut={onSignOut}
          collapsed={collapsed}
          onSettingsClick={() => navigate('settings')}
        />
      </div>
    </div>
  );
}

// ── Main Sidebar export ──────────────────────────────────────────────────────
export default function Sidebar({ activeTab, setActiveTab, currentUser, onSignOut, mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <motion.div
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="sidebar-shell hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 z-30 relative"
      >
        <SidebarContent
          collapsed={collapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onSignOut={onSignOut}
        />

        {/* ── Floating collapse button ── */}
        <motion.button
          onClick={() => setCollapsed(c => !c)}
          whileHover={{ scale: 1.12, boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}
          whileTap={{ scale: 0.92 }}
          className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full
            flex items-center justify-center z-50
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            shadow-md dark:shadow-slate-900/60
            text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400
            transition-colors duration-150"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={onMobileClose}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              className="sidebar-shell absolute left-0 top-0 h-full w-[272px] flex flex-col overflow-hidden"
            >
              {/* Mobile close header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-[17px] text-slate-900 dark:text-slate-100" style={{ letterSpacing: '-0.02em' }}>
                    QuickBill
                  </span>
                </div>
                <motion.button
                  onClick={onMobileClose}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(241,245,249,1)' }}
                  whileTap={{ scale: 0.92 }}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <SidebarContent
                collapsed={false}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onSignOut={onSignOut}
                onMobileClose={onMobileClose}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
