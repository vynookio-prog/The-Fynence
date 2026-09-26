'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  User,
  Shield,
  AlertCircle,
  RefreshCw,
  Settings,
  Globe,
  Clock,
  CheckCircle2,
  Camera,
  Check,
  Mail,
  Calendar,
  Sparkles,
  Save,
  RotateCcw,
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
import { AVATAR_PRESETS, QUICK_TIMEZONES } from '@/components/modals/ProfileSettingsModal';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab: 'profile' | 'settings' | 'appearance' =
    rawTab === 'settings' ? 'settings' : rawTab === 'appearance' ? 'appearance' : 'profile';

  const {
    user,
    timezone,
    setTimezone,
    updateUserProfile,
    displayCurrency,
    theme,
    setTheme,
    resolvedTheme,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'appearance'>(initialTab);
  const [username, setUsername] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [selectedTz, setSelectedTz] = useState<string>(timezone || 'UTC');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [liveDate, setLiveDate] = useState<Date>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'settings' || tabParam === 'profile' || tabParam === 'appearance') {
      setActiveTab(tabParam as 'profile' | 'settings' | 'appearance');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) { setUsername(user.display_name || ''); setAvatarUrl(user.avatar_url || ''); }
    const preferredTz = (timezone && timezone !== 'UTC') ? timezone : (user?.timezone || timezone || 'UTC');
    setSelectedTz(preferredTz);
  }, [user, timezone]);

  useEffect(() => {
    const interval = setInterval(() => setLiveDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: 'profile' | 'settings' | 'appearance') => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setStatusMessage({ type: 'error', text: 'Ukuran foto maksimal 5MB.' }); return; }
    setIsUploading(true); setStatusMessage(null);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await uploadAvatarAction(formData);
      if (res.error || !res.url) throw new Error(res.error || 'Upload gagal');
      setAvatarUrl(res.url);
      setStatusMessage({ type: 'success', text: 'Foto profil berhasil diunggah! Klik "Simpan Perubahan" untuk menerapkan secara permanen.' });
    } catch (err: unknown) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengunggah foto profil.' });
    } finally { setIsUploading(false); }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setAvatarUrl(customUrlInput.trim());
    setStatusMessage({ type: 'success', text: 'URL foto diterapkan! Klik "Simpan Perubahan" untuk menyimpan.' });
    setCustomUrlInput('');
  };

  const handleReset = () => {
    if (user) { setUsername(user.display_name || ''); setAvatarUrl(user.avatar_url || ''); }
    setSelectedTz(timezone || 'UTC'); setCustomUrlInput(''); setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setStatusMessage({ type: 'error', text: 'Username atau nama tampilan tidak boleh kosong.' }); return; }
    setIsSaving(true); setStatusMessage(null);
    try {
      const result = await updateUserProfile({ display_name: username.trim(), avatar_url: avatarUrl || undefined, timezone: selectedTz });
      if (!result.success) throw new Error(result.error || 'Gagal menyimpan profil.');
      setTimezone(selectedTz);
      setStatusMessage({ type: 'success', text: 'Pengaturan profil dan zona waktu berhasil diperbarui ke seluruh ekosistem Fynence!' });
    } catch (err: unknown) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan pengaturan.' });
    } finally { setIsSaving(false); }
  };

  const liveTimeString = getFormattedTimeForTimezone(selectedTz, liveDate, true);
  const liveDateString = getFormattedDateForTimezone(selectedTz, liveDate);
  const currentTzShort = getTimezoneShort(selectedTz);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[var(--color-rust)] uppercase tracking-wider font-semibold">
            <User className="h-3.5 w-3.5" />
            <span>AKUN OPERATOR // PREFERENSI SISTEM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-ink)] mt-1">
            Profil &amp; Pengaturan
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] font-data mt-0.5">
            Kelola identitas trader, avatar personal, preferensi tampilan, dan zona waktu global akun Anda.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-1 bg-[var(--surface-tint)] p-1.5 rounded-2xl border border-[var(--color-line)] text-xs font-data shrink-0 shadow-xs">
          {(['profile', 'appearance', 'settings'] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => handleTabChange(tab)}
              className={`flex items-center space-x-2 py-2 px-3 sm:px-4 rounded-xl transition min-h-[40px] ${
                activeTab === tab
                  ? 'bg-[var(--color-ink)] text-[var(--color-cream)] font-bold shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/40'
              }`}>
              {tab === 'profile' && <User className="h-4 w-4" />}
              {tab === 'appearance' && <Palette className="h-4 w-4" />}
              {tab === 'settings' && <Globe className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {tab === 'profile' ? 'PROFIL SAYA' : tab === 'appearance' ? 'TAMPILAN' : 'ZONA WAKTU'}
              </span>
              <span className="sm:hidden">
                {tab === 'profile' ? 'PROFIL' : tab === 'appearance' ? 'TEMA' : 'WAKTU'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-data border flex items-center space-x-3 animate-in fade-in duration-200 ${
          statusMessage.type === 'error'
            ? 'bg-rose-950/15 border-rose-500/30 text-[var(--color-rust)] shadow-xs'
            : 'bg-emerald-950/15 border-emerald-500/30 text-[var(--color-olive)] shadow-xs'
        }`}>
          {statusMessage.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ────── TAB: PROFIL SAYA ────── */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Avatar Card */}
            <div className="liquid-glass-card rounded-2xl p-5 sm:p-7 border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6 shadow-sm">
              <div className="border-b border-[var(--color-line)] pb-4">
                <h2 className="text-base font-display font-bold uppercase tracking-wider text-[var(--color-ink)] flex items-center space-x-2">
                  <User className="h-4 w-4 text-[var(--color-rust)]" />
                  <span>Identitas &amp; Foto Avatar</span>
                </h2>
                <p className="text-xs text-[var(--color-muted)] font-data mt-0.5">
                  Foto ini akan tampil di seluruh dashboard, jurnal trading, dan header navigasi.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative shrink-0">
                  <img src={avatarUrl || 'https://i.pravatar.cc/150?u=fynence'} alt="Avatar Preview"
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-3 border-[var(--color-line)] object-cover shadow-lg ring-4 ring-[var(--glass-border)]" />
                  {isUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png, image/jpeg, image/webp, image/gif" className="hidden" />
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--color-ink)] text-[var(--color-cream)] hover:bg-[var(--color-rust)] text-xs font-data font-semibold transition min-h-[42px] shadow-xs">
                      <Camera className="h-4 w-4" />
                      <span>{isUploading ? 'MENGUNGGAH...' : 'UNGGAH FOTO DARI PERANGKAT'}</span>
                    </button>
                    {avatarUrl && (
                      <button type="button" onClick={() => { setAvatarUrl(''); setStatusMessage({ type: 'success', text: 'Avatar direset ke default. Klik "Simpan Perubahan".' }); }}
                        className="px-3.5 py-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--surface-tint)] text-xs font-data text-[var(--color-muted)] hover:text-[var(--color-rust)] transition min-h-[42px]">
                        Reset ke Default
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] font-data text-[var(--color-muted)]">Format file didukung: PNG, JPG, JPEG, WebP (maksimal 5MB).</p>
                </div>
              </div>
              {/* Preset Avatars */}
              <div className="pt-2">
                <label className="block text-[11px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold mb-2.5">
                  Pilihan Avatar Trader Terpopuler:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button key={preset.label} type="button" onClick={() => { setAvatarUrl(preset.url); setStatusMessage(null); }}
                        className={`relative rounded-xl overflow-hidden border transition p-1 group flex flex-col items-center text-center ${
                          isSelected ? 'border-[var(--color-ocean)] ring-2 ring-[var(--color-ocean)]/40 bg-[var(--surface-tint)]' : 'border-[var(--color-line)] hover:border-[var(--color-ink)] bg-[var(--glass-bg)]'
                        }`}>
                        <img src={preset.url} alt={preset.label} className="h-12 w-full rounded-lg object-cover" />
                        <div className="w-full flex items-center justify-center space-x-1 mt-1.5">
                          {isSelected && <Check className="h-3 w-3 text-[var(--color-ocean)]" />}
                          <span className="text-[10px] font-data font-medium text-[var(--color-ink)] truncate">{preset.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Direct URL */}
              <div className="pt-1">
                <label className="block text-[11px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold mb-1.5">
                  Atau Masukkan URL Gambar Eksternal:
                </label>
                <div className="flex space-x-2">
                  <input type="url" value={customUrlInput} onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... atau link foto online"
                    className="flex-1 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] min-h-[42px]" />
                  <button type="button" onClick={handleApplyCustomUrl}
                    className="px-4 py-2.5 border border-[var(--color-line)] rounded-xl text-xs font-data font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-cream)] transition min-h-[42px]">
                    Terapkan
                  </button>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="liquid-glass-card rounded-2xl p-5 sm:p-7 border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-5 shadow-sm">
              <div className="border-b border-[var(--color-line)] pb-4">
                <h2 className="text-base font-display font-bold uppercase tracking-wider text-[var(--color-ink)] flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-[var(--color-gold)]" />
                  <span>Informasi Akun &amp; Status Operator</span>
                </h2>
                <p className="text-xs text-[var(--color-muted)] font-data mt-0.5">Rincian akun terdaftar dan hak akses dalam platform Fynence.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold mb-1.5">Username / Nama Tampilan</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={50} placeholder="Contoh: Vynookio"
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl px-4 py-3 text-sm font-data text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition min-h-[44px]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/70 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[10px] font-data uppercase tracking-wider text-[var(--color-muted)] font-bold">
                      <Mail className="h-3 w-3" /><span>Email Terdaftar</span>
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-bold text-[var(--color-ink)] truncate">{user?.email || 'N/A'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/70 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[10px] font-data uppercase tracking-wider text-[var(--color-muted)] font-bold">
                      <Shield className="h-3 w-3 text-[var(--color-olive)]" /><span>Tier Status</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--color-olive)]/15 text-[var(--color-olive)] font-mono text-xs font-bold">{user?.tier || 'FREE'}</span>
                      <span className="text-xs font-data text-[var(--color-muted)]">OPERATOR</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/70 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[10px] font-data uppercase tracking-wider text-[var(--color-muted)] font-bold">
                      <Sparkles className="h-3 w-3 text-[var(--color-gold)]" /><span>Mata Uang Basis</span>
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-bold text-[var(--color-ink)]">
                      {displayCurrency} <span className="font-normal text-[var(--color-muted)] text-xs">(Global Standard)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────── TAB: TAMPILAN & TEMA ────── */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="liquid-glass-card rounded-2xl p-5 sm:p-7 border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6 shadow-sm">
              <div className="border-b border-[var(--color-line)] pb-4">
                <h2 className="text-base font-display font-bold uppercase tracking-wider text-[var(--color-ink)] flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-[var(--color-ocean)]" />
                  <span>Tampilan &amp; Preferensi Tema</span>
                </h2>
                <p className="text-xs text-[var(--color-muted)] font-data mt-0.5">
                  Pilih tema antarmuka Fynence Anda. Preferensi disimpan otomatis dan berlaku di seluruh sesi.
                </p>
              </div>

              {/* Active theme badge */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-line)] bg-[var(--surface-tint)]">
                <div className="flex items-center space-x-3">
                  {resolvedTheme === 'dark' ? <Moon className="h-5 w-5 text-[var(--color-ocean)]" /> : <Sun className="h-5 w-5 text-[var(--color-gold)]" />}
                  <div>
                    <div className="text-xs font-data font-bold text-[var(--color-ink)]">Tema Aktif Saat Ini</div>
                    <div className="text-[11px] font-data text-[var(--color-muted)] mt-0.5">
                      {resolvedTheme === 'dark' ? 'Mode gelap premium aktif' : 'Mode terang klasik aktif'}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full ${
                  resolvedTheme === 'dark' ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)]' : 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]'
                }`}>
                  {resolvedTheme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}
                </span>
              </div>

              {/* Theme option cards */}
              <div className="space-y-3">
                <label className="block text-[11px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold">
                  Pilih Preferensi Tema:
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Light Mode */}
                  <button type="button" onClick={() => setTheme('light')}
                    className={`group flex items-center space-x-5 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                      theme === 'light' ? 'border-[var(--color-gold)] shadow-sm' : 'border-[var(--color-line)] hover:border-[var(--color-gold)]/40 bg-[var(--surface-tint)]'
                    }`}>
                    <div className={`shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                      theme === 'light' ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]' : 'bg-[var(--surface-tint)] text-[var(--color-muted)] group-hover:text-[var(--color-gold)]'
                    }`}>
                      <Sun className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-data font-bold text-[var(--color-ink)] flex items-center space-x-2">
                        <span>Light Mode</span>
                        {theme === 'light' && <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-bold">AKTIF</span>}
                      </div>
                      <div className="text-xs font-data text-[var(--color-muted)] mt-1">Tampilan terang klasik Fynence: elegan, vintage, dan warm-toned.</div>
                    </div>
                    {theme === 'light' && <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--color-gold)] flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>}
                  </button>

                  {/* Dark Mode */}
                  <button type="button" onClick={() => setTheme('dark')}
                    className={`group flex items-center space-x-5 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                      theme === 'dark' ? 'border-[var(--color-ocean)] shadow-sm' : 'border-[var(--color-line)] hover:border-[var(--color-ocean)]/40 bg-[var(--surface-tint)]'
                    }`}>
                    <div className={`shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                      theme === 'dark' ? 'bg-[var(--color-ocean)]/20 text-[var(--color-ocean)]' : 'bg-[var(--surface-tint)] text-[var(--color-muted)] group-hover:text-[var(--color-ocean)]'
                    }`}>
                      <Moon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-data font-bold text-[var(--color-ink)] flex items-center space-x-2">
                        <span>Dark Mode</span>
                        {theme === 'dark' && <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[var(--color-ocean)]/20 text-[var(--color-ocean)] font-bold">AKTIF</span>}
                      </div>
                      <div className="text-xs font-data text-[var(--color-muted)] mt-1">Premium dark fintech: deep charcoal glass, ambient glow, Vision Pro-inspired.</div>
                    </div>
                    {theme === 'dark' && <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--color-ocean)] flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>}
                  </button>

                  {/* System Default */}
                  <button type="button" onClick={() => setTheme('system')}
                    className={`group flex items-center space-x-5 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                      theme === 'system' ? 'border-[var(--color-olive)] shadow-sm' : 'border-[var(--color-line)] hover:border-[var(--color-olive)]/40 bg-[var(--surface-tint)]'
                    }`}>
                    <div className={`shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                      theme === 'system' ? 'bg-[var(--color-olive)]/20 text-[var(--color-olive)]' : 'bg-[var(--surface-tint)] text-[var(--color-muted)] group-hover:text-[var(--color-olive)]'
                    }`}>
                      <Monitor className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-data font-bold text-[var(--color-ink)] flex items-center space-x-2">
                        <span>System Default</span>
                        {theme === 'system' && <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[var(--color-olive)]/20 text-[var(--color-olive)] font-bold">AKTIF</span>}
                      </div>
                      <div className="text-xs font-data text-[var(--color-muted)] mt-1">Mengikuti preferensi tema sistem operasi Anda secara otomatis.</div>
                    </div>
                    {theme === 'system' && <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--color-olive)] flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>}
                  </button>
                </div>
              </div>

              {/* Auto-save info */}
              <div className="p-4 rounded-xl bg-[var(--surface-tint)] border border-[var(--color-line)] text-xs font-data text-[var(--color-muted)] leading-relaxed space-y-1">
                <div className="font-semibold text-[var(--color-ink)] flex items-center space-x-1.5">
                  <Settings className="h-3.5 w-3.5 text-[var(--color-ocean)]" />
                  <span>Otomatis Tersimpan:</span>
                </div>
                <p>Preferensi tema Anda disimpan secara lokal di browser dan diterapkan langsung, tanpa perlu menekan tombol simpan. Perubahan berlaku secara instan di seluruh halaman Fynence.</p>
              </div>
            </div>
          </div>
        )}

        {/* ────── TAB: ZONA WAKTU & SETTING ────── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Live Clock */}
            <div className="liquid-glass-card rounded-2xl p-5 sm:p-7 border border-[var(--color-gold)]/40 bg-[var(--glass-bg)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[var(--color-gold)] uppercase tracking-wider">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Live Digital Clock &amp; Zona Waktu Terpilih</span>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-bold">{currentTzShort}</span>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--color-ink)]">{liveTimeString}</div>
                <div className="text-xs sm:text-sm font-data text-[var(--color-muted)] flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-[var(--color-muted)]" /><span>{liveDateString}</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--surface-tint)] border border-[var(--color-line)] text-xs font-data text-[var(--color-muted)] leading-relaxed space-y-1">
                <div className="font-semibold text-[var(--color-ink)] flex items-center space-x-1.5">
                  <Globe className="h-3.5 w-3.5 text-[var(--color-ocean)]" /><span>Integrasi Menyeluruh di Seluruh Aplikasi:</span>
                </div>
                <p>Zona waktu yang Anda simpan di sini otomatis sinkron dan menjadi acuan waktu di:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--color-ink)] font-mono pl-1">
                  <li>Dashboard Utama (Sapaan jam operasional Good Morning / Good Afternoon)</li>
                  <li>Kalender Ekonomi Makro (Unified Calendar) &amp; jam countdown rilis data</li>
                  <li>Berita Finansial &amp; Financial News Stream (timestamp publikasi)</li>
                  <li>Audit Transaksi &amp; Jurnal Trading MT5 (eksekusi trade open &amp; close)</li>
                </ul>
              </div>
            </div>

            {/* Timezone Selector */}
            <div className="liquid-glass-card rounded-2xl p-5 sm:p-7 border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6 shadow-sm">
              <div className="border-b border-[var(--color-line)] pb-4">
                <h2 className="text-base font-display font-bold uppercase tracking-wider text-[var(--color-ink)] flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-[var(--color-ocean)]" />
                  <span>Konfigurasi Zona Waktu (Global Timezone)</span>
                </h2>
                <p className="text-xs text-[var(--color-muted)] font-data mt-0.5">Tentukan zona waktu utama Anda untuk memastikan akurasi data pasar dan histori trading.</p>
              </div>
              <div className="space-y-4">
                <label className="block text-[11px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold">Daftar Zona Waktu Dunia:</label>
                <div className="relative">
                  <select value={selectedTz} onChange={(e) => { setSelectedTz(e.target.value); setStatusMessage(null); }}
                    className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-xl px-4 py-3 text-xs sm:text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition appearance-none min-h-[46px]">
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-[var(--color-paper)] text-[var(--color-ink)]">{tz.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-muted)]">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-2.5 pt-2">
                  <label className="block text-[11px] font-data text-[var(--color-muted)] uppercase tracking-wider font-bold">Pilihan Cepat Zona Waktu Pasar:</label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TIMEZONES.map((tz) => {
                      const isSelected = selectedTz === tz.value;
                      return (
                        <button key={tz.value} type="button" onClick={() => { setSelectedTz(tz.value); setStatusMessage(null); }}
                          className={`px-3.5 py-2 rounded-xl border text-xs font-mono transition min-h-[38px] ${
                            isSelected
                              ? 'bg-[var(--color-ink)] text-[var(--color-cream)] font-bold border-[var(--color-ink)] shadow-xs scale-102'
                              : 'border-[var(--color-line)] bg-[var(--glass-bg)] text-[var(--color-ink)] hover:bg-white/50'
                          }`}>
                          {tz.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Bar: hidden on Appearance tab */}
        {activeTab !== 'appearance' && (
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--glass-border)]">
            <button type="button" onClick={handleReset} disabled={isSaving || isUploading}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-[var(--color-line)] text-xs font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition min-h-[44px]">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>BATAL / RESET</span>
            </button>
            <button type="submit" disabled={isSaving || isUploading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[var(--color-ink)] text-[var(--color-cream)] hover:bg-[var(--color-rust)] text-xs font-data font-bold transition disabled:opacity-50 min-h-[44px] shadow-md">
              {isSaving
                ? <><RefreshCw className="h-4 w-4 animate-spin" /><span>MENYIMPAN PERUBAHAN...</span></>
                : <><Save className="h-4 w-4" /><span>SIMPAN PERUBAHAN</span></>
              }
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export const ProfileView: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <div className="h-8 w-64 bg-black/5 rounded-lg animate-pulse"></div>
        <div className="h-96 rounded-2xl bg-black/5 animate-pulse"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
};
