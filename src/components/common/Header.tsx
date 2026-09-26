'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Plus,
  Bell,
  User,
  Settings,
  LogOut,
  CheckCheck,
  Trash2,
  AlertTriangle,
  TrendingDown,
  AlertCircle,
  Brain,
  Info,
  X,
  Globe,
  Clock,
  Palette,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { getTimezoneShort } from '@/lib/timezone';

export const Header: React.FC = () => {
  const { 
    user, 
    logout, 
    displayCurrency, 
    toggleCurrency, 
    setIsAddTransactionOpen, 
    setIsAddTradeOpen, 
    openProfileSettings,
    timezone,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    theme,
    resolvedTheme,
  } = useApp();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const profileRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (isQuickAddOpen && quickAddRef.current && !quickAddRef.current.contains(target)) {
        setIsQuickAddOpen(false);
      }
      if (isNotificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsQuickAddOpen(false);
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen || isQuickAddOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen, isQuickAddOpen, isNotificationsOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'news_proximity':
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case 'drawdown_alert':
        return <TrendingDown className="h-4 w-4 text-rose-400" />;
      case 'budget_warning':
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case 'psychology_pattern':
        return <Brain className="h-4 w-4 text-[#00F2C2]" />;
      default:
        return <Info className="h-4 w-4 text-[#00F2C2]" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'news_proximity':
      case 'drawdown_alert':
        return 'bg-rose-950/40 border-rose-800/40 text-rose-400';
      case 'budget_warning':
        return 'bg-amber-950/40 border-amber-800/40 text-amber-400';
      case 'psychology_pattern':
        return 'bg-[#00F2C2]/10 border-[#00F2C2]/30 text-[#00F2C2]';
      default:
        return 'bg-[#00F2C2]/10 border-[#00F2C2]/30 text-[#00F2C2]';
    }
  };

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'unread') {
      return notifications.filter((n) => !n.is_read);
    }
    return notifications;
  }, [notifications, notifFilter]);

  return (
    <header className="fixed top-2.5 inset-x-2.5 sm:inset-x-4 z-40 h-13 sm:h-14 rounded-full bg-[#06090D]/92 backdrop-blur-2xl border border-white/[0.1] shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.12)] px-3 sm:px-4 md:sticky md:top-0 md:inset-x-0 md:w-full md:h-[4.5rem] md:rounded-none md:border-x-0 md:border-t-0 md:border-b md:border-white/[0.05] md:bg-[#040609]/90 md:shadow-none md:px-8 transition-all duration-300 flex items-center justify-between">
      <div className="flex h-full w-full items-center justify-between">
        
        {/* Brand & Desktop Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Sidebar Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center h-9 w-9 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition cursor-pointer border border-white/[0.04]"
            title={isSidebarCollapsed ? "Tampilkan sidebar (Ctrl+B)" : "Sembunyikan sidebar (Ctrl+B)"}
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          {/* Desktop Collapsed Brand Logo */}
          <div className={`${isSidebarCollapsed ? 'hidden md:flex' : 'hidden'} items-center`}>
            <Link href="/dashboard" className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition" aria-label="Fynence dashboard">
              <span className="text-xl font-display font-bold text-[#F8FAFC] tracking-tight">
                Fynence<span className="text-[#00F2C2]">.</span>
              </span>
            </Link>
          </div>

          {/* Mobile Dynamic Island Brand Logo */}
          <div className="flex md:hidden items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 cursor-pointer group" aria-label="Fynence dashboard">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#00F2C2] to-[#2EFFCE] flex items-center justify-center shadow-[0_0_10px_rgba(0,242,194,0.35)] shrink-0">
                <span className="font-display font-black text-xs text-[#020406] tracking-tighter">F</span>
              </div>
              <span className="text-sm font-display font-bold text-[#F8FAFC] tracking-tight group-hover:text-[#00F2C2] transition">
                Fynence<span className="text-[#00F2C2]">.</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsQuickAddOpen(false);
                setIsProfileOpen(false);
              }}
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.08] transition cursor-pointer"
              title="Notifications"
              aria-label="Toggle notifications"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute 0.5 top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white shadow-md animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                {/* Backdrop overlay for closing on outside click on both mobile and desktop */}
                <div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
                  onClick={() => setIsNotificationsOpen(false)}
                  aria-hidden="true"
                />

                {/* Notifications container - full width on mobile, floating card on tablet/desktop */}
                <div
                  className="
                    fixed inset-x-3 top-16 max-h-[calc(100dvh-5.5rem)] z-50 max-w-md mx-auto
                    sm:inset-x-auto sm:right-4 sm:top-16 sm:w-96 sm:max-h-[560px] sm:mx-0
                    md:absolute md:top-full md:right-0 md:mt-2.5 md:inset-auto md:w-[410px] md:max-h-[540px]
                    rounded-2xl border border-white/[0.1] bg-[#06090D]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]
                    overflow-hidden font-data flex flex-col animate-in fade-in zoom-in-95 duration-200 text-[#F8FAFC]
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-[#00F2C2]/15 text-[#00F2C2]">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                        NOTIFICATIONS
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold font-mono">
                          {unreadNotificationsCount} NEW
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {notifications.length > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead()}
                          className="text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] px-2 py-1 rounded hover:bg-white/[0.05] flex items-center transition cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                          <span className="hidden sm:inline">Mark read</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition cursor-pointer"
                        title="Close notifications"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Sub-header */}
                  {notifications.length > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.06] bg-black/40 text-[11px] shrink-0">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setNotifFilter('all')}
                          className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                            notifFilter === 'all'
                              ? 'bg-white/15 text-white font-bold'
                              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                          }`}
                        >
                          All ({notifications.length})
                        </button>
                        <button
                          onClick={() => setNotifFilter('unread')}
                          className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center space-x-1.5 cursor-pointer ${
                            notifFilter === 'unread'
                              ? 'bg-rose-500 text-white font-bold'
                              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                          }`}
                        >
                          <span>Unread</span>
                          {unreadNotificationsCount > 0 && (
                            <span className={`px-1 rounded text-[9px] font-mono ${notifFilter === 'unread' ? 'bg-white/25 text-white' : 'bg-rose-500/20 text-rose-400'}`}>
                              {unreadNotificationsCount}
                            </span>
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        {unreadNotificationsCount} unread
                      </span>
                    </div>
                  )}

                  {/* Scrollable Notification List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] min-h-0 [overscroll-behavior:contain]">
                    {filteredNotifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#94A3B8]">
                        <Bell className="h-7 w-7 mx-auto mb-2 opacity-25" />
                        <p className="font-semibold text-[#F8FAFC]">
                          {notifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                        <p className="text-[10px] opacity-70 mt-1 max-w-[260px] mx-auto leading-relaxed">
                          {notifFilter === 'unread'
                            ? 'All caught up! Budget alerts and macro events will appear here when active.'
                            : 'Budget warnings, drawdown alerts, and upcoming macro news will appear here.'}
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.link_tab) {
                              setActiveTab(n.link_tab);
                              setIsNotificationsOpen(false);
                            }
                          }}
                          className={`p-3.5 text-xs hover:bg-white/[0.04] transition cursor-pointer flex items-start space-x-3 ${
                            !n.is_read ? 'bg-amber-500/[0.06]' : 'opacity-75 hover:opacity-100'
                          }`}
                        >
                          {/* Type Icon Badge */}
                          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getNotificationBg(n.type)}`}>
                            {getNotificationIcon(n.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <h4 className={`text-xs truncate ${!n.is_read ? 'font-bold text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                                {n.title}
                              </h4>
                              {!n.is_read && (
                                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
                              )}
                            </div>

                            <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed break-words">
                              {n.message}
                            </p>

                            <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#64748B]">
                              <span>
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>

                              {n.link_tab && (
                                <span className="text-[10px] text-[#00F2C2] font-medium flex items-center hover:underline ml-2 shrink-0">
                                  Go to {n.link_tab.toUpperCase()} →
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dismiss Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition p-2 rounded-lg shrink-0 -mr-1.5 cursor-pointer"
                            title="Dismiss notification"
                            aria-label="Dismiss"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-[11px] text-[#94A3B8] shrink-0">
                      <span className="font-mono text-[10px]">
                        {notifications.length} total · {unreadNotificationsCount} unread
                      </span>
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="px-3 py-1 rounded-lg border border-white/[0.1] bg-white/[0.05] text-[#F8FAFC] hover:bg-white/[0.1] transition font-medium text-xs cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="h-7 sm:h-8 text-[11px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-[#94A3B8] hover:text-[#00F2C2] hover:border-[#00F2C2]/40 transition flex items-center justify-center cursor-pointer"
            title={`Ubah mata uang (saat ini ${displayCurrency})`}
          >
            {displayCurrency}
          </button>

          {/* Quick Add */}
          <div className="relative" ref={quickAddRef}>
            <button
              onClick={() => { setIsQuickAddOpen(!isQuickAddOpen); setIsProfileOpen(false); setIsNotificationsOpen(false); }}
              className="flex h-7 sm:h-8 items-center space-x-1 border border-[#00F2C2]/30 bg-[#00F2C2] px-2.5 sm:px-3 text-xs font-bold font-data text-[#020406] hover:bg-[#2EFFCE] transition rounded-full shadow-[0_0_12px_rgba(0,242,194,0.25)] cursor-pointer"
              title="Tambah cepat"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="font-bold tracking-wider hidden sm:inline">ADD</span>
            </button>

            {isQuickAddOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
                  onClick={() => setIsQuickAddOpen(false)}
                />
                <div
                  className="
                    absolute right-0 top-full mt-2.5 z-50
                    w-52 max-w-[calc(100vw-1.75rem)]
                    rounded-2xl border border-white/[0.1] bg-[#06090D]/95 backdrop-blur-2xl text-[#F8FAFC] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-1.5
                    animate-in fade-in zoom-in-95 duration-150 font-data
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setIsQuickAddOpen(false);
                      setIsAddTradeOpen(true);
                    }}
                    className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-data hover:bg-white/[0.08] text-[#F8FAFC] hover:text-[#00F2C2] transition min-h-[42px] text-left cursor-pointer"
                  >
                    <span className="font-bold">TAMBAH TRADE</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsQuickAddOpen(false);
                      setIsAddTransactionOpen(true);
                    }}
                    className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-data hover:bg-white/[0.08] text-[#F8FAFC] hover:text-[#00F2C2] transition min-h-[42px] text-left cursor-pointer"
                  >
                    <span className="font-bold">TAMBAH TRANSAKSI</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-white/[0.1] mx-0.5 sm:mx-1"></div>
          
          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsQuickAddOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-[#00F2C2]/60 transition cursor-pointer"
              aria-label="Buka menu profil"
            >
              <img
                src={user?.avatar_url || 'https://i.pravatar.cc/150?u=fynence'}
                alt={user?.display_name}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-white/[0.15] object-cover shadow-xs"
              />
            </button>
            
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
                  onClick={() => setIsProfileOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="
                    absolute right-0 top-full mt-2.5 z-50
                    w-[calc(100vw-1.75rem)] max-w-[310px] sm:w-80 sm:max-w-none
                    max-h-[calc(100dvh-5.5rem)] overflow-y-auto
                    rounded-2xl border border-white/[0.1] bg-[#06090D]/95 backdrop-blur-2xl text-[#F8FAFC] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2.5 sm:p-3
                    animate-in fade-in zoom-in-95 duration-150 font-data
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Profile Header */}
                  <div className="px-2 py-2 border-b border-white/[0.08] mb-2 flex items-center space-x-3">
                    <img
                      src={user?.avatar_url || 'https://i.pravatar.cc/150?u=fynence'}
                      alt={user?.display_name}
                      className="h-10 w-10 rounded-full border border-white/[0.12] object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <p className="text-sm font-bold text-[#F8FAFC] truncate">{user?.display_name || 'Operator'}</p>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00F2C2]/20 text-[#00F2C2] font-bold shrink-0">
                          {user?.tier || 'FREE'}
                        </span>
                      </div>
                      <p className="text-[11px] font-data text-[#94A3B8] truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Timezone Status Card with quick link to settings */}
                  <div 
                    onClick={() => {
                      setIsProfileOpen(false);
                      openProfileSettings('settings');
                    }}
                    className="mx-0 mb-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#00F2C2]/50 cursor-pointer transition flex items-center justify-between group"
                    title="Klik untuk mengubah zona waktu global"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-data uppercase tracking-wider text-[#94A3B8] font-bold">
                          Zona Waktu Global
                        </p>
                        <p className="text-xs font-mono font-bold text-[#F8FAFC] truncate">
                          {getTimezoneShort(timezone)} <span className="font-normal text-[#94A3B8]">({timezone})</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-data text-[#00F2C2] group-hover:underline shrink-0 ml-1">
                      Ubah
                    </span>
                  </div>

                  {/* Navigation Actions */}
                  <div className="space-y-1">
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        openProfileSettings('profile');
                      }}
                      className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-data hover:bg-white/[0.06] text-[#F8FAFC] transition min-h-[42px] text-left cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-2.5 text-[#94A3B8] shrink-0" />
                      <span className="font-medium">Profil Operator</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        openProfileSettings('settings');
                      }}
                      className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-data hover:bg-white/[0.06] text-[#F8FAFC] transition min-h-[42px] text-left cursor-pointer"
                    >
                      <Globe className="h-4 w-4 mr-2.5 text-[#F59E0B] shrink-0" />
                      <span className="font-medium">Pengaturan & Zona Waktu</span>
                    </button>

                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        openProfileSettings('appearance');
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-data hover:bg-white/[0.06] text-[#F8FAFC] transition min-h-[42px] text-left cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Palette className="h-4 w-4 mr-2.5 text-[#00F2C2] shrink-0" />
                        <span className="font-medium">Tampilan & Tema</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#94A3B8] font-bold border border-white/[0.08]">
                        {theme === 'system' ? 'SYSTEM' : theme === 'dark' ? 'DARK' : 'LIGHT'}
                      </span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-1.5 mt-1.5 border-t border-white/[0.08]">
                    <button 
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-data hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 transition min-h-[42px] text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2.5 shrink-0" />
                      <span className="font-bold tracking-wider">LOGOUT</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
