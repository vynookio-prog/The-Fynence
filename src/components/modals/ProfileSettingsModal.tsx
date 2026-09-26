'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Camera,
  Check,
  User,
  Shield,
  AlertCircle,
  RefreshCw,
  Settings,
  Globe,
  Clock,
  CheckCircle2,
  Palette,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { uploadAvatarAction } from '@/app/actions';
import {
  TIMEZONE_OPTIONS,
  getTimezoneShort,
  getFormattedTimeForTimezone,
  getFormattedDateForTimezone,
} from '@/lib/timezone';

// Preset avatar badges for quick selection
export const AVATAR_PRESETS = [
  { label: 'Satoshi', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80' },
  { label: 'Quant', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' },
  { label: 'Bull', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80' },
  { label: 'Gold', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Cyber', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { label: 'Alpha', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
];

export const QUICK_TIMEZONES = [
  { label: 'WIB (+7)', value: 'Asia/Jakarta' },
  { label: 'WITA (+8)', value: 'Asia/Makassar' },
  { label: 'WIT (+9)', value: 'Asia/Jayapura' },
  { label: 'SGT (+8)', value: 'Asia/Singapore' },
  { label: 'UTC (+0)', value: 'UTC' },
  { label: 'EST (-5)', value: 'America/New_York' },
  { label: 'PST (-8)', value: 'America/Los_Angeles' },
  { label: 'LDN (+0)', value: 'Europe/London' },
  { label: 'LOCAL', value: 'local' },
];

export const ProfileSettingsModal: React.FC = () => {
  const {
    user,
    isProfileSettingsOpen,
    setIsProfileSettingsOpen,
    profileSettingsTab,
    setProfileSettingsTab,
    timezone,
    setTimezone,
    updateUserProfile,
    theme,
    setTheme,
    resolvedTheme,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'appearance'>('profile');
  const [username, setUsername] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [selectedTz, setSelectedTz] = useState<string>(timezone || 'UTC');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live time in selected timezone
  const [liveDate, setLiveDate] = useState<Date>(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial tab and states whenever modal opens or tab prop changes
  useEffect(() => {
    if (isProfileSettingsOpen) {
      if (profileSettingsTab === 'profile' || profileSettingsTab === 'settings') {
        setActiveTab(profileSettingsTab);
      }
      const preferredTz = (timezone && timezone !== 'UTC')
        ? timezone
        : (user?.timezone || timezone || 'UTC');
      setSelectedTz(preferredTz);
      if (user) {
        setUsername(user.display_name || '');
        setAvatarUrl(user.avatar_url || '');
      }
      setCustomUrlInput('');
      setStatusMessage(null);
    }
  }, [user, isProfileSettingsOpen, profileSettingsTab, timezone]);

  // Live ticker for timezone preview
  useEffect(() => {
    if (!isProfileSettingsOpen) return;
    const interval = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isProfileSettingsOpen]);

  if (!isProfileSettingsOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Ukuran foto maksimal 5MB.' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadAvatarAction(formData);
      if (res.error || !res.url) {
        throw new Error(res.error || 'Upload gagal');
      }

      setAvatarUrl(res.url);
      setStatusMessage({ type: 'success', text: 'Foto profil berhasil diunggah! Tekan SIMPAN PERUBAHAN untuk menerapkan.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto profil.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setAvatarUrl(customUrlInput.trim());
    setStatusMessage({ type: 'success', text: 'URL foto diterapkan! Tekan SIMPAN PERUBAHAN untuk menerapkan.' });
    setCustomUrlInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Username tidak boleh kosong.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      // Save profile and timezone
      const result = await updateUserProfile({
        display_name: username.trim(),
        avatar_url: avatarUrl || undefined,
        timezone: selectedTz,
      });

      if (!result.success) {
        throw new Error(result.error || 'Gagal menyimpan profil.');
      }

      // Explicitly trigger global timezone save
      setTimezone(selectedTz);

      setStatusMessage({
        type: 'success',
        text: 'Pengaturan & Zona Waktu berhasil disimpan ke seluruh aplikasi Fynence!',
      });

      setTimeout(() => {
        setIsProfileSettingsOpen(false);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan pengaturan.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const liveTimeString = getFormattedTimeForTimezone(selectedTz, liveDate, true);
  const liveDateString = getFormattedDateForTimezone(selectedTz, liveDate);
  const currentTzShort = getTimezoneShort(selectedTz);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="min-h-full flex items-center justify-center">
        <div
          className="liquid-glass-card border-[var(--glass-border)] rounded-2xl w-full max-w-lg p-4 sm:p-6 relative z-10 space-y-5 text-[var(--color-ink)] shadow-2xl my-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-3">
          <div>
            <div className="flex items-center space-x-2">
              {activeTab === 'profile' ? (
                <User className="h-4 w-4 text-[var(--color-rust)]" />
              ) : activeTab === 'appearance' ? (
                <Palette className="h-4 w-4 text-[var(--color-ocean)]" />
              ) : (
                <Settings className="h-4 w-4 text-[var(--color-gold)]" />
              )}
              <h2 className="text-base font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                {activeTab === 'profile' ? 'Profil Pengguna' : activeTab === 'appearance' ? 'Tampilan & Tema' : 'Pengaturan & Zona Waktu'}
              </h2>
            </div>
            <p className="text-[11px] font-data text-[var(--color-muted)] mt-0.5">
              Kelola identitas, preferensi tampilan, dan zona waktu global akun Anda
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileSettingsOpen(false)}
            className="p-1.5 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--glass-bg)] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-[var(--surface-tint)] p-1 rounded-xl border border-[var(--color-line)] text-xs font-data">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setProfileSettingsTab('profile');
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg transition min-h-[36px] ${
              activeTab === 'profile'
                ? 'bg-[var(--color-ink)] text-[var(--color-cream)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">PROFIL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg transition min-h-[36px] ${
              activeTab === 'appearance'
                ? 'bg-[var(--color-ink)] text-[var(--color-cream)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <Palette className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">TAMPILAN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setProfileSettingsTab('settings');
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg transition min-h-[36px] ${
              activeTab === 'settings'
                ? 'bg-[var(--color-ink)] text-[var(--color-cream)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">ZONA WAKTU</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-data border flex items-center space-x-2 animate-in fade-in duration-200 ${
              statusMessage.type === 'error'
                ? 'bg-rose-950/20 border-rose-500/30 text-[var(--color-rust)]'
                : 'bg-emerald-950/20 border-emerald-500/30 text-[var(--color-olive)]'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TAB 1: PROFIL SAYA */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Avatar Section */}
              <div className="space-y-3">
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold">
                  Foto Profil / Avatar
                </label>

                <div className="flex items-center space-x-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={avatarUrl || 'https://i.pravatar.cc/150?u=fynence'}
                      alt="Avatar Preview"
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-[var(--color-line)] object-cover shadow-md ring-2 ring-[var(--glass-border)]"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center justify-center space-x-2 w-full sm:w-auto px-3 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--color-ink)] hover:text-[var(--color-cream)] text-xs font-data text-[var(--color-ink)] transition min-h-[40px]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>{isUploading ? 'MENGUNGGAH...' : 'UNGGAH FOTO DARI PERANGKAT'}</span>
                    </button>
                    <p className="text-[10px] font-data text-[var(--color-muted)]">
                      Format PNG, JPG, atau WebP (maks. 5MB)
                    </p>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="pt-2">
                  <span className="text-[10px] font-data text-[var(--color-muted)] uppercase block mb-2 font-bold">
                    Pilih Avatar Trader:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
                            setStatusMessage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden border transition p-0.5 group ${
                            isSelected
                              ? 'border-[var(--color-ocean)] ring-2 ring-[var(--color-ocean)]/40 scale-102'
                              : 'border-[var(--color-line)] hover:border-[var(--color-ink)]'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="h-10 w-full rounded-lg object-cover"
                          />
                          <span className="block text-[9px] font-data text-center text-[var(--color-muted)] truncate mt-1">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct URL Input */}
                <div className="pt-1">
                  <span className="text-[10px] font-data text-[var(--color-muted)] uppercase block mb-1">
                    Atau Masukkan URL Gambar:
                  </span>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="flex-1 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl px-3 py-2 text-xs text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] min-h-[40px]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3.5 py-2 border border-[var(--color-line)] rounded-xl text-xs font-data text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-cream)] transition min-h-[40px]"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[var(--color-line)]"></div>

              {/* Username Input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
                    Username / Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    maxLength={50}
                    placeholder="Contoh: Vynookio"
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition min-h-[42px]"
                  />
                </div>

                {/* Readonly info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
                      Email Terdaftar
                    </label>
                    <div className="text-xs font-data text-[var(--color-muted)] bg-[var(--color-paper)]/60 border border-[var(--color-line)] rounded-xl px-3 py-2 truncate">
                      {user?.email || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
                      Status Akun
                    </label>
                    <div className="flex items-center space-x-1.5 text-xs font-data text-[var(--color-olive)] bg-[var(--color-paper)]/60 border border-[var(--color-line)] rounded-xl px-3 py-2">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      <span>{user?.tier || 'FREE'} OPERATOR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENGATURAN & ZONA WAKTU */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Active Timezone Card with Live Clock */}
              <div className="liquid-glass-card p-4 rounded-xl border border-[var(--color-gold)]/30 bg-[var(--glass-bg)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-data font-bold text-[var(--color-gold)] uppercase tracking-wider">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Live Clock & Zona Waktu Aktif</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-bold">
                    {currentTzShort}
                  </span>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[var(--color-ink)]">
                    {liveTimeString}
                  </div>
                  <div className="text-xs font-data text-[var(--color-muted)]">
                    {liveDateString}
                  </div>
                </div>

                <p className="text-[11px] font-data text-[var(--color-muted)] leading-relaxed pt-1 border-t border-[var(--color-line)]/50">
                  💡 <span className="font-semibold text-[var(--color-ink)]">Pemberitahuan:</span> Zona waktu yang Anda pilih di sini akan disimpan dan digunakan secara menyeluruh di dashboard utama (ucapan sapaan Good Morning/Afternoon/Evening), kalender ekonomi makro, jam rilis berita finansial, dan audit transaksi.
                </p>
              </div>

              {/* Timezone Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold">
                  Pilih Zona Waktu (Global Timezone)
                </label>
                <div className="relative">
                  <select
                    value={selectedTz}
                    onChange={(e) => {
                      setSelectedTz(e.target.value);
                      setStatusMessage(null);
                    }}
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition appearance-none min-h-[44px]"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-[var(--color-paper)] text-[var(--color-ink)]">
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-muted)]">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold block">
                  Pilihan Cepat Zona Waktu Populer:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TIMEZONES.map((tz) => {
                    const isSelected = selectedTz === tz.value;
                    return (
                      <button
                        key={tz.value}
                        type="button"
                        onClick={() => {
                          setSelectedTz(tz.value);
                          setStatusMessage(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition min-h-[36px] ${
                          isSelected
                            ? 'bg-[var(--color-ink)] text-[var(--color-cream)] font-bold border-[var(--color-ink)] shadow-sm'
                            : 'border-[var(--color-line)] bg-[var(--glass-bg)] text-[var(--color-ink)] hover:bg-white/50'
                        }`}
                      >
                        {tz.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAMPILAN & TEMA */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Current resolved theme badge */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--surface-tint)]">
                <div className="flex items-center space-x-2 text-xs font-data text-[var(--color-muted)]">
                  {resolvedTheme === 'dark' ? (
                    <Moon className="h-4 w-4 text-[var(--color-ocean)]" />
                  ) : (
                    <Sun className="h-4 w-4 text-[var(--color-gold)]" />
                  )}
                  <span className="font-semibold text-[var(--color-ink)]">Tema Aktif Saat Ini:</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                  resolvedTheme === 'dark'
                    ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)]'
                    : 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]'
                }`}>
                  {resolvedTheme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}
                </span>
              </div>

              {/* Theme Options */}
              <div className="space-y-2">
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold">
                  Pilih Preferensi Tema:
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Light Mode Option */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`group relative flex items-center space-x-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      theme === 'light'
                        ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/8 shadow-sm'
                        : 'border-[var(--color-line)] hover:border-[var(--color-gold)]/40 bg-[var(--surface-tint)]'
                    }`}
                  >
                    <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                      theme === 'light'
                        ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]'
                        : 'bg-[var(--surface-tint)] text-[var(--color-muted)] group-hover:text-[var(--color-gold)]'
                    }`}>
                      <Sun className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-data font-bold text-[var(--color-ink)] flex items-center space-x-2">
                        <span>Light Mode</span>
                        {theme === 'light' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-bold">AKTIF</span>
                        )}
                      </div>
                      <div className="text-[11px] font-data text-[var(--color-muted)] mt-0.5">
                        Tampilan terang klasik Fynence: elegan dan vintage
                      </div>
                    </div>
                    {theme === 'light' && (
                      <div className="shrink-0 h-5 w-5 rounded-full bg-[var(--color-gold)] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Dark Mode Option */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`group relative flex items-center space-x-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-[var(--color-ocean)] bg-[var(--color-ocean)]/8 shadow-sm'
                        : 'border-[var(--color-line)] hover:border-[var(--color-ocean)]/40 bg-[var(--surface-tint)]'
                    }`}
                  >
                    <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                      theme === 'dark'
                        ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)]'
                        : 'bg-[var(--surface-tint)] text-[var(--color-muted)] group-hover:text-[var(--color-ocean)]'
                    }`}>
                      <Moon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-data font-bold text-[var(--color-ink)] flex items-center space-x-2">
                        <span>Dark Mode</span>
                        {theme === 'dark' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold">AKTIF</span>
                        )}
                      </div>
                      <div className="text-[11px] font-data text-[var(--color-muted)] mt-0.5">
                        Premium dark fintech: glassmorphism dan ambient glow
                      </div>
                    </div>
                    {theme === 'dark' && (
                      <div className="shrink-0 h-5 w-5 rounded-full bg-[var(--color-ocean)] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>

                  {/* System Default Option */}
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`group relative flex items-center space-x-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      theme === 'system'
                        ? 'border-[var(--color-olive)] bg-[var(--color-olive)]/8 shadow-sm'
                        : 'border-[var(--color-line)] hover:border-[var(--color-olive)]/40 bg-[var(--surface-tint)]'
                    }`}
                  >
                    <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                      theme === 'system'
                        ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)]'
                        : 'bg-[var(--surface-tint)] text-[var(--color-muted)] group-hover:text-[var(--color-olive)]'
                    }`}>
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-data font-bold text-[var(--color-ink)] flex items-center space-x-2">
                        <span>System Default</span>
                        {theme === 'system' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-olive)]/20 text-[var(--color-olive)] font-bold">AKTIF</span>
                        )}
                      </div>
                      <div className="text-[11px] font-data text-[var(--color-muted)] mt-0.5">
                        Ikuti pengaturan tema perangkat Anda secara otomatis
                      </div>
                    </div>
                    {theme === 'system' && (
                      <div className="shrink-0 h-5 w-5 rounded-full bg-[var(--color-olive)] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Info note */}
              <div className="p-3 rounded-xl bg-[var(--surface-tint)] border border-[var(--color-line)] text-[11px] font-data text-[var(--color-muted)] leading-relaxed">
                <span className="font-semibold text-[var(--color-ink)]">💾 Otomatis Tersimpan:</span>{' '}
                Preferensi tema Anda disimpan secara lokal dan diterapkan langsung tanpa perlu menekan tombol simpan.
              </div>
            </div>
          )}

          {/* Footer Actions: only show for profile/settings tabs */}
          {activeTab === 'appearance' ? (
            <div className="pt-3 flex items-center justify-end border-t border-[var(--color-line)]">
              <button
                type="button"
                onClick={() => setIsProfileSettingsOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-ink)] text-[var(--color-cream)] hover:bg-[var(--color-rust)] text-xs font-data font-bold transition min-h-[42px] shadow-md"
              >
                SELESAI
              </button>
            </div>
          ) : (
            <div className="pt-3 flex items-center justify-end space-x-2 sm:space-x-3 border-t border-[var(--color-line)]">
              <button
                type="button"
                onClick={() => setIsProfileSettingsOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[var(--color-line)] text-xs font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition min-h-[42px]"
              >
                BATAL
              </button>

              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-[var(--color-ink)] text-[var(--color-cream)] hover:bg-[var(--color-rust)] text-xs font-data font-bold transition disabled:opacity-50 min-h-[42px] shadow-md flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>MENYIMPAN...</span>
                  </>
                ) : (
                  <span>SIMPAN PERUBAHAN</span>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
      </div>
    </div>
  );
};
