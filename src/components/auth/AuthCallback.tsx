import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { insforge } from '@/lib/insforge';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('Memproses otentikasi...');

  useEffect(() => {
    let isMounted = true;

    async function handleCallback() {
      const code = searchParams.get('insforge_code') || searchParams.get('code');
      let codeVerifier: string | null = null;

      try {
        codeVerifier = sessionStorage.getItem('oauth_code_verifier');
      } catch {}

      if (!codeVerifier && typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)oauth_code_verifier=([^;]+)/);
        if (match && match[1]) {
          codeVerifier = decodeURIComponent(match[1]);
        }
      }

      if (code && codeVerifier) {
        try {
          const { data, error: exchangeErr } = await insforge.auth.exchangeOAuthCode(code, codeVerifier);
          try {
            sessionStorage.removeItem('oauth_code_verifier');
          } catch {}
          if (typeof document !== 'undefined') {
            document.cookie = 'oauth_code_verifier=; path=/; max-age=0; SameSite=Lax';
          }

          if (!exchangeErr && data?.user) {
            if (isMounted) {
              navigate('/dashboard', { replace: true });
            }
            return;
          }
          if (isMounted) {
            setStatus('Gagal menyelesaikan otentikasi. Mengarahkan kembali ke halaman login...');
          }
        } catch (err: any) {
          if (isMounted) {
            setStatus('Error saat pertukaran token: ' + (err?.message || 'OAuth exchange failed'));
          }
        }
      } else {
        // Fallback: check if session is already active
        try {
          const { data } = await insforge.auth.getCurrentUser();
          if (data?.user) {
            if (isMounted) {
              navigate('/dashboard', { replace: true });
            }
            return;
          }
        } catch {}
      }

      setTimeout(() => {
        if (isMounted) {
          navigate('/login?error=oauth_failed', { replace: true });
        }
      }, 1500);
    }

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#080B0E] flex flex-col items-center justify-center p-4 text-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 border-2 border-[#00F2C2] border-t-transparent rounded-full animate-spin" />
        <div className="font-display font-bold text-sm tracking-widest uppercase text-[#F8FAFC]">
          Fynence
        </div>
        <p className="font-mono text-xs text-slate-400">
          {status}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
