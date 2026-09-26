'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  TrendingUp,
  Globe2,
  FileText,
  Activity,
} from 'lucide-react';
import { ActiveTab } from '@/types';

export const MobileNav: React.FC = () => {
  const { setActiveTab } = useApp();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollY.current;

          // Always visible when near top of the page
          if (currentScrollY <= 30) {
            setIsVisible(true);
          } else if (scrollDelta > 8) {
            // Scrolling DOWN -> Hide bottom nav
            setIsVisible(false);
          } else if (scrollDelta < -8) {
            // Scrolling UP -> Show bottom nav
            setIsVisible(true);
          }

          lastScrollY.current = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'dashboard', href: '/dashboard', label: 'HOME', icon: LayoutDashboard },
    { id: 'market', href: '/market', label: 'MARKET', icon: Activity },
    { id: 'trading', href: '/trading', label: 'JOURNAL', icon: TrendingUp },
    { id: 'news', href: '/news', label: 'NEWS', icon: Globe2 },
    { id: 'report', href: '/report', label: 'REPORT', icon: FileText },
  ];

  return (
    <nav
      aria-label="Navigasi mobile"
      className={`md:hidden fixed bottom-2.5 inset-x-2.5 z-40 rounded-2xl border border-white/[0.08] bg-[#06090D]/90 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] p-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-in-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <div className="grid grid-cols-5 gap-0.5 items-center w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/'
              : pathname?.startsWith(tab.href);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex min-h-[44px] flex-col items-center justify-center py-1 rounded-xl transition ${
                isActive
                  ? 'text-[#00F2C2] bg-[#1E293B]/80 font-bold shadow-inner border border-white/[0.06]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.6} />
              <span className="text-[9px] font-mono leading-tight tracking-tight mt-0.5">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
