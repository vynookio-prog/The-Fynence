'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { MobileNav } from '@/components/common/MobileNav';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddTradeModal } from '@/components/modals/AddTradeModal';
import { TradeDetailModal } from '@/components/modals/TradeDetailModal';
import { ProfileSettingsModal } from '@/components/modals/ProfileSettingsModal';
import { AuthView } from '@/components/auth/AuthView';
import { ActiveTab } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, isLoadingAuth, activeTab, setActiveTab, isSidebarCollapsed } = useApp();
  const pathname = usePathname();

  // Keep activeTab context synchronized with current route pathname
  useEffect(() => {
    if (!pathname) return;
    let targetTab: ActiveTab = 'dashboard';
    if (pathname.startsWith('/trading')) targetTab = 'trading';
    else if (pathname.startsWith('/market')) targetTab = 'market';
    else if (pathname.startsWith('/news')) targetTab = 'news';
    else if (pathname.startsWith('/report')) targetTab = 'report';
    else if (pathname.startsWith('/profile')) targetTab = 'profile';
    else if (pathname === '/' || pathname.startsWith('/dashboard')) targetTab = 'dashboard';

    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }
  }, [pathname, activeTab, setActiveTab]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#0D1217] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-2 border-[#00F2C2] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center font-display font-bold text-sm tracking-widest uppercase text-[#F8FAFC]">
            Fynence
          </div>
          <p className="font-mono text-[11px] text-[#64748B]">
            Memeriksa status sesi...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-[#00F2C2]/20 selection:text-[#00F2C2] w-full max-w-full overflow-x-hidden bg-[#020406]">
      {/* Background ambient glow - subtle AMOLED deep space illumination */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_10%,rgba(0,242,194,0.035),transparent_65%),radial-gradient(circle_at_85%_75%,rgba(0,165,114,0.025),transparent_50%)] z-0" />

      {/* Left Fixed Full-Height Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Workspace Body: offset by w-72 on desktop when sidebar is open */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-0' : 'md:pl-72'}`}>
        {/* Top Header */}
        <Header />

        {/* Content Area */}
        <main className="flex-1 min-w-0 w-full px-3 pt-18 sm:pt-20 md:pt-6 sm:px-6 lg:px-8 pb-36 md:pb-12 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Interactive Modals */}
      <AddTransactionModal />
      <AddTradeModal />
      <TradeDetailModal />
      <ProfileSettingsModal />
    </div>
  );
};
