import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createConfiguredAuthActions } from '@/lib/insforge';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('insforge_code') || requestUrl.searchParams.get('code');
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value;

  if (code && codeVerifier) {
    try {
      const auth = createConfiguredAuthActions({ cookies: cookieStore });
      const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);

      cookieStore.delete('oauth_code_verifier');

      if (!error && data?.user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (err) {
      console.error('OAuth exchange error:', err);
    }
  }

  return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
}
