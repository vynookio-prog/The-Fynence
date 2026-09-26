'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  DollarSign,
  Check,
  Sparkles,
} from 'lucide-react';
import { checkUsernameAvailabilityAction, signUpAction } from '@/app/actions';
import { TIMEZONE_OPTIONS, getTimezoneShort, getStoredTimezone } from '@/lib/timezone';
import { Currency, UserProfile } from '@/types';

interface SignUpWizardProps {
  onReturnToLogin: () => void;
  onSuccessfulAuth: (user: UserProfile) => void;
  onRequireVerification: (email: string) => void;
  onOAuthLogin: (provider: 'google' | 'github' | 'microsoft' | 'apple') => Promise<void>;
  oauthLoading: string | null;
}

export const SignUpWizard: React.FC<SignUpWizardProps> = ({
  onReturnToLogin,
  onSuccessfulAuth,
  onRequireVerification,
  onOAuthLogin,
  oauthLoading,
}) => {
  // Step State: 1 = Account, 2 = Security, 3 = Profile, 4 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Form Fields
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [timezone, setTimezone] = useState<string>(() => {
    const stored = getStoredTimezone();
    return (stored && stored !== 'UTC') ? stored : 'Asia/Jakarta';
  });

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email validation regex
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Password strength calculation
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Debounced username availability check
  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Minimal 3 karakter.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Hanya huruf kecil, angka, dan underscore (_).');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Memeriksa ketersediaan handle...');

    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailabilityAction(cleanUsername);
        if (result.available) {
          setUsernameStatus('available');
          setUsernameMessage(`@${cleanUsername} siap digunakan.`);
        } else {
          setUsernameStatus('taken');
          setUsernameMessage(result.reason || 'Username tidak tersedia.');
        }
      } catch {
        setUsernameStatus('available');
        setUsernameMessage(`@${cleanUsername} siap digunakan.`);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  // Step Navigations
  const goToNextStep = () => {
    setErrorMessage(null);
    setDirection('next');
    if (step === 1) {
      if (!isEmailValid) {
        setEmailTouched(true);
        setErrorMessage('Masukkan alamat email yang valid untuk melanjutkan.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (password.length < 6) {
        setErrorMessage('Kunci otorisasi (password) minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (username.length < 3 || usernameStatus === 'taken' || usernameStatus === 'invalid') {
        setErrorMessage('Pilih username operator yang valid dan tersedia.');
        return;
      }
      setStep(4);
    }
  };

  const goToPrevStep = () => {
    setErrorMessage(null);
    setDirection('prev');
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // Final submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const finalDisplayName = displayName.trim() || username.trim();
      const result = await signUpAction(email.trim(), password, {
        username: username.trim().toLowerCase(),
        displayName: finalDisplayName,
        currency,
        timezone,
      });

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      if (result.requireEmailVerification) {
        onRequireVerification(email.trim());
        return;
      }

      if (result.user) {
        onSuccessfulAuth({
          id: result.user.id,
          email: result.user.email || email.trim(),
          display_name: finalDisplayName,
          avatar_url: 'https://i.pravatar.cc/150?u=fynence',
          default_currency: currency,
          timezone,
          tier: 'FREE',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat pendaftaran akun.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step Title helper
  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return '01 ACCOUNT SETUP';
      case 2:
        return '02 SECURITY KEY';
      case 3:
        return '03 OPERATOR PROFILE';
      case 4:
        return '04 CONFIRMATION';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-data font-bold tracking-wider uppercase text-[var(--color-muted)]">
          <div className="flex items-center space-x-1.5 text-[var(--color-rust)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-rust)] animate-pulse"></span>
            <span>{step <= 3 ? `LANGKAH ${step} DARI 3` : 'KONFIRMASI AKHIR'}</span>
          </div>
          <span className="font-mono text-[var(--color-ink)]">
            {getStepSubtitle()}
          </span>
        </div>

        {/* 3-Segment Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              step >= 1 ? 'bg-[var(--color-rust)] shadow-xs' : 'bg-[var(--color-line)]'
            }`}
          />
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              step >= 2 ? 'bg-[var(--color-rust)] shadow-xs' : 'bg-[var(--color-line)]'
            }`}
          />
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              step >= 3 ? 'bg-[var(--color-rust)] shadow-xs' : 'bg-[var(--color-line)]'
            }`}
          />
        </div>
      </div>

      {/* Inline Global Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-lg text-xs font-data border bg-[var(--color-rust)]/10 border-[var(--color-rust)]/30 text-[var(--color-rust)] flex items-start space-x-2 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: ACCOUNT SETUP */}
      {step === 1 && (
        <div
          className={`space-y-4 ${
            direction === 'next'
              ? 'animate-in fade-in slide-in-from-right-2 duration-200'
              : 'animate-in fade-in slide-in-from-left-2 duration-200'
          }`}
        >
          <div>
            <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => setEmailTouched(true)}
                required
                autoFocus
                className={`w-full bg-[var(--color-paper)] border rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--color-ink)] font-data focus:outline-none transition ${
                  emailTouched && email && !isEmailValid
                    ? 'border-[var(--color-rust)]'
                    : emailTouched && isEmailValid
                    ? 'border-[var(--color-olive)]'
                    : 'border-[var(--color-line)] focus:border-[var(--color-ink)]'
                }`}
                placeholder="operator@fynence.local"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isEmailValid ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-olive)]" />
                ) : (
                  <Mail className="h-4 w-4 text-[var(--color-muted)] opacity-60" />
                )}
              </div>
            </div>
            {emailTouched && email && !isEmailValid ? (
              <p className="text-[10px] font-data text-[var(--color-rust)] mt-1 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3 inline shrink-0" />
                <span>Format email tidak valid. Masukkan email aktif Anda.</span>
              </p>
            ) : (
              <p className="text-[10px] font-data text-[var(--color-muted)] mt-1">
                Email digunakan untuk login, pemulihan kunci, dan notifikasi keamanan akun.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={goToNextStep}
            disabled={!isEmailValid}
            className="w-full liquid-glass-card border-[var(--glass-border)] py-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg mt-2 disabled:opacity-40 flex items-center justify-center space-x-2"
          >
            <span>LANJUTKAN KE KEAMANAN</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Single Sign-On Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-line)]" />
            </div>
            <div className="relative bg-[var(--color-paper)] px-3 text-[10px] font-data text-[var(--color-muted)] uppercase tracking-wider">
              ATAU DAFTAR INSTAN DENGAN SSO
            </div>
          </div>

          {/* OAuth Provider Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOAuthLogin('google')}
              disabled={isLoading || oauthLoading !== null}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]/40 hover:bg-[var(--color-paper)] hover:border-[var(--color-ink)] text-[var(--color-ink)] transition disabled:opacity-50 text-xs font-data"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="truncate">{oauthLoading === 'google' ? 'WAIT...' : 'Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOAuthLogin('github')}
              disabled={isLoading || oauthLoading !== null}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]/40 hover:bg-[var(--color-paper)] hover:border-[var(--color-ink)] text-[var(--color-ink)] transition disabled:opacity-50 text-xs font-data"
            >
              <svg className="h-3.5 w-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span className="truncate">{oauthLoading === 'github' ? 'WAIT...' : 'GitHub'}</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onReturnToLogin}
              className="text-[10px] font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition border-b border-transparent hover:border-[var(--color-ink)]"
            >
              Sudah memiliki akun? Masuk ke Terminal
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SECURITY SETUP */}
      {step === 2 && (
        <div
          className={`space-y-4 ${
            direction === 'next'
              ? 'animate-in fade-in slide-in-from-right-2 duration-200'
              : 'animate-in fade-in slide-in-from-left-2 duration-200'
          }`}
        >
          <div>
            <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
              AUTHORIZATION KEY (PASSWORD)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                required
                autoFocus
                className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-data">
                  <span className="text-[var(--color-muted)]">Kekuatan Kunci:</span>
                  <span
                    className={`font-bold ${
                      passwordStrength <= 1
                        ? 'text-[var(--color-rust)]'
                        : passwordStrength === 2
                        ? 'text-[var(--color-orange,#f97316)]'
                        : passwordStrength === 3
                        ? 'text-[var(--color-gold)]'
                        : 'text-[var(--color-olive)]'
                    }`}
                  >
                    {passwordStrength <= 1
                      ? 'Lemah'
                      : passwordStrength === 2
                      ? 'Cukup'
                      : passwordStrength === 3
                      ? 'Kuat'
                      : 'Sangat Kuat'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1 w-full bg-[var(--color-paper)] rounded-full overflow-hidden border border-[var(--color-line)]">
                  <div
                    className={`h-full transition-colors ${
                      passwordStrength >= 1 ? 'bg-[var(--color-rust)]' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-colors ${
                      passwordStrength >= 2 ? 'bg-[var(--color-orange,#f97316)]' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-colors ${
                      passwordStrength >= 3 ? 'bg-[var(--color-gold)]' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-colors ${
                      passwordStrength >= 4 ? 'bg-[var(--color-olive)]' : 'bg-transparent'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
              KONFIRMASI AUTHORIZATION KEY
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                required
                className={`w-full bg-[var(--color-paper)] border rounded-lg pl-4 pr-10 py-2.5 text-sm text-[var(--color-ink)] font-data focus:outline-none transition ${
                  confirmPassword && !passwordsMatch
                    ? 'border-[var(--color-rust)]'
                    : confirmPassword && passwordsMatch
                    ? 'border-[var(--color-olive)]'
                    : 'border-[var(--color-line)] focus:border-[var(--color-ink)]'
                }`}
                placeholder="Ulangi password di atas"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-[10px] font-data text-[var(--color-rust)] mt-1">
                Konfirmasi password belum sesuai.
              </p>
            )}
          </div>

          {/* Inline Checklist */}
          <div className="p-3 rounded-xl bg-[var(--color-paper)]/70 border border-[var(--color-line)] space-y-1.5 text-[11px] font-data">
            <div className="flex items-center space-x-2">
              <Check
                className={`h-3.5 w-3.5 shrink-0 ${
                  password.length >= 6 ? 'text-[var(--color-olive)]' : 'text-[var(--color-muted)] opacity-40'
                }`}
              />
              <span className={password.length >= 6 ? 'text-[var(--color-ink)] font-medium' : 'text-[var(--color-muted)]'}>
                Minimal 6 karakter
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Check
                className={`h-3.5 w-3.5 shrink-0 ${
                  /[a-zA-Z]/.test(password) && /[\d\W]/.test(password)
                    ? 'text-[var(--color-olive)]'
                    : 'text-[var(--color-muted)] opacity-40'
                }`}
              />
              <span
                className={
                  /[a-zA-Z]/.test(password) && /[\d\W]/.test(password)
                    ? 'text-[var(--color-ink)] font-medium'
                    : 'text-[var(--color-muted)]'
                }
              >
                Kombinasi huruf dan angka atau simbol
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Check
                className={`h-3.5 w-3.5 shrink-0 ${
                  passwordsMatch ? 'text-[var(--color-olive)]' : 'text-[var(--color-muted)] opacity-40'
                }`}
              />
              <span className={passwordsMatch ? 'text-[var(--color-ink)] font-medium' : 'text-[var(--color-muted)]'}>
                Kedua password cocok
              </span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex-1 py-3 px-3 rounded-lg border border-[var(--color-line)] text-xs font-data font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>KEMBALI</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              disabled={password.length < 6 || !passwordsMatch}
              className="flex-1 liquid-glass-card border-[var(--glass-border)] py-3 px-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg disabled:opacity-40 flex items-center justify-center space-x-1.5"
            >
              <span>LANJUTKAN</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PROFILE SETUP */}
      {step === 3 && (
        <div
          className={`space-y-4 ${
            direction === 'next'
              ? 'animate-in fade-in slide-in-from-right-2 duration-200'
              : 'animate-in fade-in slide-in-from-left-2 duration-200'
          }`}
        >
          {/* Username Input with Live Availability */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase font-bold">
                OPERATOR HANDLE (USERNAME) <span className="text-[var(--color-rust)]">*</span>
              </label>
              <span className="text-[9px] font-mono text-[var(--color-muted)]">3-20 karakter</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-mono font-bold text-[var(--color-muted)]">
                @
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setUsername(cleaned);
                  if (errorMessage) setErrorMessage(null);
                }}
                maxLength={20}
                required
                autoFocus
                className={`w-full bg-[var(--color-paper)] border rounded-lg pl-8 pr-10 py-2.5 text-sm text-[var(--color-ink)] font-mono focus:outline-none transition ${
                  usernameStatus === 'available'
                    ? 'border-[var(--color-olive)]'
                    : usernameStatus === 'taken' || usernameStatus === 'invalid'
                    ? 'border-[var(--color-rust)]'
                    : 'border-[var(--color-line)] focus:border-[var(--color-ink)]'
                }`}
                placeholder="vynookio"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {usernameStatus === 'checking' && (
                  <RefreshCw className="h-4 w-4 animate-spin text-[var(--color-ocean)]" />
                )}
                {usernameStatus === 'available' && (
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-olive)]" />
                )}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                  <AlertCircle className="h-4 w-4 text-[var(--color-rust)]" />
                )}
              </div>
            </div>

            {/* Live Availability Feedback Badge */}
            {usernameMessage && (
              <p
                className={`text-[10px] font-data mt-1 flex items-center space-x-1 ${
                  usernameStatus === 'available'
                    ? 'text-[var(--color-olive)] font-medium'
                    : usernameStatus === 'taken' || usernameStatus === 'invalid'
                    ? 'text-[var(--color-rust)]'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                <span>{usernameMessage}</span>
              </p>
            )}
          </div>

          {/* Optional Display Name */}
          <div>
            <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
              NAMA TAMPILAN / ALIAS TRADER <span className="font-normal text-[var(--color-muted)]">(OPSIONAL)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition"
              placeholder="Contoh: Vynookio Pro"
            />
            <p className="text-[10px] font-data text-[var(--color-muted)] mt-1">
              Nama ini akan ditampilkan sebagai sapaan pada dashboard terminal.
            </p>
          </div>

          {/* Profile Preferences: Currency & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Currency Preference */}
            <div>
              <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
                MATA UANG BASIS
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[var(--color-paper)] p-1 rounded-lg border border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-1.5 px-2 rounded text-xs font-mono font-bold transition text-center ${
                    currency === 'USD'
                      ? 'bg-[var(--color-ink)] text-[var(--color-cream)] shadow-xs'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('IDR')}
                  className={`py-1.5 px-2 rounded text-xs font-mono font-bold transition text-center ${
                    currency === 'IDR'
                      ? 'bg-[var(--color-ink)] text-[var(--color-cream)] shadow-xs'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  IDR (Rp)
                </button>
              </div>
            </div>

            {/* Timezone Preference */}
            <div>
              <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1 font-bold">
                ZONA WAKTU
              </label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-2.5 py-2 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition appearance-none"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--color-muted)]">
                  <Globe className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex-1 py-3 px-3 rounded-lg border border-[var(--color-line)] text-xs font-data font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>KEMBALI</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              disabled={username.length < 3 || usernameStatus !== 'available'}
              className="flex-1 liquid-glass-card border-[var(--glass-border)] py-3 px-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg disabled:opacity-40 flex items-center justify-center space-x-1.5"
            >
              <span>TINJAU AKUN</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FINAL STEP 4: CONFIRMATION & ACCOUNT CREATION */}
      {step === 4 && (
        <form
          onSubmit={handleFinalSubmit}
          className={`space-y-4 ${
            direction === 'next'
              ? 'animate-in fade-in slide-in-from-right-2 duration-200'
              : 'animate-in fade-in slide-in-from-left-2 duration-200'
          }`}
        >
          {/* Review Summary Card */}
          <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--color-paper)]/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2.5">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-olive)]" />
                <span className="text-xs font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  Konfirmasi Akun Operator
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-olive)]/15 text-[var(--color-olive)] font-bold">
                SIAP TERDAFTAR
              </span>
            </div>

            <div className="space-y-2 text-xs font-data">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)] text-[11px]">Email Terdaftar:</span>
                <span className="font-mono font-bold text-[var(--color-ink)] truncate max-w-[210px]">
                  {email}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)] text-[11px]">Operator Handle:</span>
                <span className="font-mono font-bold text-[var(--color-ink)]">
                  @{username}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)] text-[11px]">Nama Tampilan:</span>
                <span className="font-data font-medium text-[var(--color-ink)] truncate max-w-[210px]">
                  {displayName || username}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)] text-[11px]">Mata Uang Basis:</span>
                <span className="font-mono font-bold text-[var(--color-ink)]">
                  {currency}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)] text-[11px]">Zona Waktu Global:</span>
                <span className="font-mono font-bold text-[var(--color-ink)]">
                  {getTimezoneShort(timezone)} <span className="font-normal text-[var(--color-muted)]">({timezone})</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[var(--color-line)]/50">
                <span className="text-[var(--color-muted)] text-[11px]">Enkripsi Sandi:</span>
                <span className="text-[var(--color-olive)] font-mono font-bold text-[11px] flex items-center space-x-1">
                  <Lock className="h-3 w-3" />
                  <span>PROTECTED (SHA-256)</span>
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-data text-[var(--color-muted)] text-center">
            Dengan mendaftar, Anda menyetujui seluruh protokol keamanan dan penyimpanan data lokal privat Fynence.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={isLoading}
              className="flex-1 py-3 px-3 rounded-lg border border-[var(--color-line)] text-xs font-data font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>UBAH DATA</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 liquid-glass-card border-[var(--glass-border)] py-3 px-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>MEMBUAT PROFIL...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)]" />
                  <span>BUAT AKUN OPERATOR</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
