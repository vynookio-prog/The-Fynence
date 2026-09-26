'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { getStoredTimezone } from '@/lib/timezone';
import { SignUpWizard } from '@/components/auth/SignUpWizard';
import {
  signInAction,
  signUpAction,
  verifyEmailAction,
  resendVerificationAction,
  sendPasswordResetEmailAction,
  resetPasswordWithOtpAction,
} from '@/app/actions';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login' }) => {
  const router = useRouter();
  const { user, setUser, isLoadingAuth } = useApp();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request_otp' | 'reset_password'>('request_otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const navigateToDestination = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('redirect') || '/dashboard';
      router.push(target);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'oauth_failed') {
        setStatusMessage({ type: 'error', text: 'Autentikasi OAuth gagal atau dibatalkan. Silakan coba kembali.' });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && user && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/login' || path === '/signup') {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('redirect') || '/dashboard';
        router.replace(target);
      }
    }
  }, [user, isLoadingAuth, router]);

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'microsoft' | 'apple') => {
    setOauthLoading(provider);
    setStatusMessage(null);
    try {
      const { signInWithOAuthAction } = await import('@/app/actions');
      const result = await signInWithOAuthAction(provider, window.location.origin);
      if (result.error) {
        setStatusMessage({ type: 'error', text: result.error });
        setOauthLoading(null);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungkan ke penyedia OAuth';
      setStatusMessage({ type: 'error', text: msg });
      setOauthLoading(null);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (isLogin) {
        const result = await signInAction(email, password);
        if (result.error) {
          if (result.isUnverified) {
            setIsVerifying(true);
            setStatusMessage({
              type: 'info',
              text: 'Email belum terverifikasi. Masukkan 6 digit kode verifikasi yang telah dikirim ke email Anda.',
            });
            return;
          }
          setStatusMessage({ type: 'error', text: result.error });
          return;
        }

        if (result.user) {
          const profile = result.user.profile as Record<string, unknown> | null;
          const userMeta = (result.user as Record<string, unknown>).user_metadata as Record<string, unknown> | undefined;
          const serverTz = (typeof profile?.timezone === 'string' && profile.timezone)
            ? profile.timezone
            : ((typeof userMeta?.timezone === 'string' && userMeta.timezone) ? userMeta.timezone : null);
          const effectiveTimezone = (serverTz && serverTz !== 'UTC') ? serverTz : (getStoredTimezone() || serverTz || 'UTC');

          setUser({
            id: result.user.id,
            email: result.user.email || email,
            display_name: (typeof profile?.name === 'string' && profile.name) ? profile.name : 'Fynence User',
            avatar_url: (typeof profile?.avatar_url === 'string' && profile.avatar_url) ? profile.avatar_url : 'https://i.pravatar.cc/150?u=fynence',
            default_currency: 'USD',
            timezone: effectiveTimezone,
            tier: 'FREE',
          });
          navigateToDestination();
        }
      } else {
        const result = await signUpAction(email, password);
        if (result.error) {
          setStatusMessage({ type: 'error', text: result.error });
          return;
        }

        if (result.requireEmailVerification) {
          setIsVerifying(true);
          setStatusMessage({
            type: 'info',
            text: 'Kode verifikasi 6 digit telah dikirim ke email Anda. Silakan masukkan kode di bawah ini.',
          });
          return;
        }

        if (result.user) {
          const profile = result.user.profile as Record<string, unknown> | null;
          const userMeta = (result.user as Record<string, unknown>).user_metadata as Record<string, unknown> | undefined;
          const serverTz = (typeof profile?.timezone === 'string' && profile.timezone)
            ? profile.timezone
            : ((typeof userMeta?.timezone === 'string' && userMeta.timezone) ? userMeta.timezone : null);
          const effectiveTimezone = (serverTz && serverTz !== 'UTC') ? serverTz : (getStoredTimezone() || serverTz || 'UTC');

          setUser({
            id: result.user.id,
            email: result.user.email || email,
            display_name: (typeof profile?.name === 'string' && profile.name) ? profile.name : 'Fynence User',
            avatar_url: (typeof profile?.avatar_url === 'string' && profile.avatar_url) ? profile.avatar_url : 'https://i.pravatar.cc/150?u=fynence',
            default_currency: 'USD',
            timezone: effectiveTimezone,
            tier: 'FREE',
          });
          navigateToDestination();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Autentikasi gagal';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Masukkan 6 digit kode verifikasi yang valid.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await verifyEmailAction(email, otp);
      if (result.error) {
        setStatusMessage({ type: 'error', text: result.error });
        return;
      }

      if (result.user) {
        const profile = result.user.profile as Record<string, unknown> | null;
        const userMeta = (result.user as Record<string, unknown>).user_metadata as Record<string, unknown> | undefined;
        const serverTz = (typeof profile?.timezone === 'string' && profile.timezone)
          ? profile.timezone
          : ((typeof userMeta?.timezone === 'string' && userMeta.timezone) ? userMeta.timezone : null);
        const effectiveTimezone = (serverTz && serverTz !== 'UTC') ? serverTz : (getStoredTimezone() || serverTz || 'UTC');

        setUser({
          id: result.user.id,
          email: result.user.email || email,
          display_name: (typeof profile?.name === 'string' && profile.name) ? profile.name : 'Fynence User',
          avatar_url: (typeof profile?.avatar_url === 'string' && profile.avatar_url) ? profile.avatar_url : 'https://i.pravatar.cc/150?u=fynence',
          default_currency: 'USD',
          timezone: effectiveTimezone,
          tier: 'FREE',
        });
        navigateToDestination();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verifikasi gagal';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setStatusMessage({ type: 'error', text: 'Alamat email diperlukan untuk kirim ulang kode.' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await resendVerificationAction(email);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: res.message || 'Kode verifikasi berhasil dikirim ulang!' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal mengirim ulang kode verifikasi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Masukkan alamat email yang valid.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await sendPasswordResetEmailAction(email);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
        return;
      }

      setStatusMessage({
        type: 'info',
        text: `Kode OTP 6 digit telah dikirim ke ${email}. Masukkan kode OTP dan password baru Anda.`,
      });
      setForgotStep('reset_password');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal meminta kode reset password';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetOtp.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Masukkan 6 digit kode OTP verifikasi.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Konfirmasi password tidak cocok dengan password baru.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await resetPasswordWithOtpAction({
        email,
        otp: resetOtp,
        newPassword,
      });

      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: 'Password berhasil diubah! Silakan login menggunakan password baru.',
      });
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses reset password';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (!email) {
      setStatusMessage({ type: 'error', text: 'Alamat email diperlukan untuk kirim ulang kode OTP.' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await sendPasswordResetEmailAction(email);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: 'Kode OTP baru berhasil dikirim ulang ke email!' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal mengirim ulang kode OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoadingAuth && user && typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-2 border-[var(--color-rust)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-data text-[var(--color-muted)]">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative">
      <div className="absolute inset-0 retro-texture opacity-50"></div>
      
      <div className="liquid-glass-card border-[var(--glass-border)] p-7 sm:p-9 rounded-[2rem] w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <p className="terminal-badge mb-3 text-[var(--color-rust)]">Personal finance, privately held</p>
          <h1 className="text-4xl font-display font-bold tracking-[-0.06em] text-[var(--color-ink)]">
            Fynence<span className="text-[var(--color-orange,#f97316)]">.</span>
          </h1>
          <p className="text-xs font-data text-[var(--color-muted)] mt-2">
            {isVerifying
              ? 'SECURITY VERIFICATION REQUIRED'
              : isForgotPassword
              ? (forgotStep === 'request_otp' ? 'FORGOT PASSWORD RECOVERY' : 'VERIFY OTP & NEW PASSWORD')
              : isLogin
              ? 'TERMINAL ACCESS REQUIRED'
              : 'NEW OPERATOR REGISTRATION'}
          </p>
        </div>

        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs font-data border ${
              statusMessage.type === 'error'
                ? 'bg-[var(--color-rust)]/10 border-[var(--color-rust)]/30 text-[var(--color-rust)]'
                : statusMessage.type === 'success'
                ? 'bg-[var(--color-olive)]/10 border-[var(--color-olive)]/30 text-[var(--color-olive)]'
                : 'bg-[var(--color-ocean)]/10 border-[var(--color-ocean)]/30 text-[var(--color-ocean)]'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {isVerifying ? (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                TARGET ACCOUNT
              </label>
              <div className="text-xs font-data text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2 truncate">
                {email}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                6-DIGIT VERIFICATION CODE
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-3 text-center text-xl tracking-[0.4em] font-data text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
                placeholder="000000"
              />
              <p className="text-[10px] font-data text-[var(--color-muted)] mt-1 text-center">
                Periksa inbox atau folder spam email Anda untuk kode 6 digit.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full liquid-glass-card border-[var(--glass-border)] py-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg mt-4 disabled:opacity-50"
            >
              {isLoading ? 'VERIFYING...' : 'CONFIRM & INITIALIZE SESSION'}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-[10px] font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
              >
                KIRIM ULANG KODE
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setOtp('');
                  setStatusMessage(null);
                }}
                className="text-[10px] font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
              >
                KEMBALI KE LOGIN
              </button>
            </div>
          </form>
        ) : isForgotPassword ? (
          forgotStep === 'request_otp' ? (
            <form onSubmit={handleRequestResetOtp} className="space-y-4">
              <div>
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                  EMAIL ADDRESS TO RECOVER
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition"
                  placeholder="operator@fynence.local"
                />
                <p className="text-[10px] font-data text-[var(--color-muted)] mt-1">
                  Kode 6 digit OTP verifikasi reset password akan dikirimkan ke email ini.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full liquid-glass-card border-[var(--glass-border)] py-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg mt-4 disabled:opacity-50"
              >
                {isLoading ? 'MENGIRIM KODE OTP...' : 'MINTA KODE OTP'}
              </button>

              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setStatusMessage(null);
                  }}
                  className="text-[10px] font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                >
                  KEMBALI KE LOGIN
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                  TARGET ACCOUNT
                </label>
                <div className="flex items-center justify-between text-xs font-data text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2">
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request_otp');
                      setStatusMessage(null);
                    }}
                    className="text-[10px] text-[var(--color-ocean)] hover:underline shrink-0 ml-2"
                  >
                    UBAH EMAIL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                  6-DIGIT OTP VERIFICATION CODE
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={resetOtp}
                  onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-3 text-center text-xl tracking-[0.4em] font-data text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
                  placeholder="000000"
                />
                <p className="text-[10px] font-data text-[var(--color-muted)] mt-1 text-center">
                  Masukkan 6 digit kode OTP yang telah dikirim ke email Anda.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                  PASSWORD BARU
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                  KONFIRMASI PASSWORD BARU
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition"
                  placeholder="Ulangi password baru"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || resetOtp.length !== 6 || newPassword.length < 6 || confirmPassword.length < 6}
                className="w-full liquid-glass-card border-[var(--glass-border)] py-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg mt-4 disabled:opacity-50"
              >
                {isLoading ? 'MENYIMPAN PASSWORD...' : 'RESET & BUAT PASSWORD BARU'}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResendResetOtp}
                  disabled={isLoading}
                  className="text-[10px] font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                >
                  KIRIM ULANG OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setStatusMessage(null);
                  }}
                  className="text-[10px] font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                >
                  KEMBALI KE LOGIN
                </button>
              </div>
            </form>
          )
        ) : isLogin ? (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase mb-1">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition"
                placeholder="operator@fynence.local"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-data text-[var(--color-muted)] uppercase">
                  AUTHORIZATION KEY
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotStep('request_otp');
                    setStatusMessage(null);
                  }}
                  className="text-[10px] font-data text-[var(--color-ocean)] hover:underline"
                >
                  Lupa password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm text-[var(--color-ink)] font-data focus:outline-none focus:border-[var(--color-ink)] transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || oauthLoading !== null}
              className="w-full liquid-glass-card border-[var(--glass-border)] py-3 text-xs font-data font-bold text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition rounded-lg mt-4 disabled:opacity-50"
            >
              {isLoading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
            </button>
          </form>
        ) : (
          <SignUpWizard
            onReturnToLogin={() => {
              setIsLogin(true);
              setStatusMessage(null);
            }}
            onSuccessfulAuth={(verifiedUser) => {
              setUser(verifiedUser);
              navigateToDestination();
            }}
            onRequireVerification={(targetEmail) => {
              setEmail(targetEmail);
              setIsVerifying(true);
              setStatusMessage({
                type: 'info',
                text: 'Kode verifikasi 6 digit telah dikirim ke email Anda. Silakan masukkan kode di bawah ini.',
              });
            }}
            onOAuthLogin={handleOAuthLogin}
            oauthLoading={oauthLoading}
          />
        )}

        {!isVerifying && !isForgotPassword && isLogin && (
          <>
            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-line)]" />
              </div>
              <div className="relative bg-[var(--color-paper)] px-3 text-[10px] font-data text-[var(--color-muted)] uppercase tracking-wider">
                OR SINGLE SIGN-ON
              </div>
            </div>

            {/* OAuth Provider Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading || oauthLoading !== null}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]/40 hover:bg-[var(--color-paper)] hover:border-[var(--color-ink)] text-[var(--color-ink)] transition disabled:opacity-50 text-xs font-data"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="truncate">{oauthLoading === 'google' ? 'WAIT...' : 'Google'}</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading || oauthLoading !== null}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]/40 hover:bg-[var(--color-paper)] hover:border-[var(--color-ink)] text-[var(--color-ink)] transition disabled:opacity-50 text-xs font-data"
              >
                <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span className="truncate">{oauthLoading === 'github' ? 'WAIT...' : 'GitHub'}</span>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                onClick={() => handleOAuthLogin('microsoft')}
                disabled={isLoading || oauthLoading !== null}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]/40 hover:bg-[var(--color-paper)] hover:border-[var(--color-ink)] text-[var(--color-ink)] transition disabled:opacity-50 text-xs font-data"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span className="truncate">{oauthLoading === 'microsoft' ? 'WAIT...' : 'Microsoft'}</span>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => handleOAuthLogin('apple')}
                disabled={isLoading || oauthLoading !== null}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]/40 hover:bg-[var(--color-paper)] hover:border-[var(--color-ink)] text-[var(--color-ink)] transition disabled:opacity-50 text-xs font-data"
              >
                <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.65-.9 2.66 1 .08 2.03-.49 2.59-1.15z"/>
                </svg>
                <span className="truncate">{oauthLoading === 'apple' ? 'WAIT...' : 'Apple'}</span>
              </button>
            </div>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setStatusMessage(null);
                }}
                className="block w-full text-[10px] font-data text-[var(--color-muted)] hover:text-[var(--color-ink)] transition border-b border-transparent hover:border-[var(--color-ink)]"
              >
                CREATE NEW OPERATOR PROFILE
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setForgotStep('request_otp');
                  setStatusMessage(null);
                }}
                className="block w-full text-[10px] font-data text-[var(--color-muted)]/70 hover:text-[var(--color-ink)] transition"
              >
                Lupa password akun Anda?
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVerifying(true);
                  setStatusMessage({
                    type: 'info',
                    text: 'Masukkan email dan kode 6 digit verifikasi Anda.',
                  });
                }}
                className="block w-full text-[10px] font-data text-[var(--color-muted)]/70 hover:text-[var(--color-ink)] transition"
              >
                Sudah daftar tapi belum verifikasi kode?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
