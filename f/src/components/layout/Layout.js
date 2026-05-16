import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ children, activeTab, setActiveTab, currentUser, onSignOut, darkMode, setDarkMode, products, notifications }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSignOut={onSignOut}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onSignOut={onSignOut}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onMenuClick={() => setMobileOpen(true)}
          products={products}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 scrollbar-thin">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
