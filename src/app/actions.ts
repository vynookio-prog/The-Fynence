import { insforge, INSFORGE_CONFIG } from '@/lib/insforge';
import type {
  Trade,
  Transaction,
  TradingAccount,
  FinancialAccount,
  TradeScreenshot,
  TradeImageType,
  SupportedForexPair,
  MarketIntelligenceData,
} from '@/types';

async function getServerClient() {
  return insforge;
}

async function getAuthActions() {
  return insforge.auth;
}

export async function signInAction(email: string, password: string) {
  try {
    const auth = await getAuthActions();
    
    const { data, error } = await auth.signInWithPassword({
      email,
      password,
    });


    if (error) {
      const isUnverified = error.message?.toLowerCase().includes('verify') || 
                           error.message?.toLowerCase().includes('verification');
      return { 
        error: error.message,
        isUnverified,
      };
    }
    
    return { user: data?.user ?? null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    return { error: message };
  }
}

export async function signInWithOAuthAction(
  provider: 'google' | 'github' | 'microsoft' | 'apple',
  origin: string
) {
  try {
    const auth = await getAuthActions();
    const redirectTo = `${origin}/auth/callback`;

    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo,
      skipBrowserRedirect: true,
    });

    if (error || !data?.url) {
      return { error: error?.message || `Failed to initiate ${provider} login` };
    }

    if (data.codeVerifier && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('oauth_code_verifier', data.codeVerifier);
      } catch {}
      if (typeof document !== 'undefined') {
        document.cookie = `oauth_code_verifier=${encodeURIComponent(data.codeVerifier)}; path=/; max-age=600; SameSite=Lax`;
      }
    }

    return { url: data.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OAuth request failed';
    return { error: message };
  }
}

export async function checkUsernameAvailabilityAction(username: string): Promise<{
  available: boolean;
  reason?: string;
}> {
  const trimmed = (username || '').trim().toLowerCase();
  if (!trimmed) {
    return { available: false, reason: 'Username tidak boleh kosong.' };
  }

  if (trimmed.length < 3) {
    return { available: false, reason: 'Username minimal 3 karakter.' };
  }

  if (trimmed.length > 20) {
    return { available: false, reason: 'Username maksimal 20 karakter.' };
  }

  const validFormat = /^[a-z0-9_]+$/.test(trimmed);
  if (!validFormat) {
    return { available: false, reason: 'Hanya huruf kecil, angka, dan underscore (_).' };
  }

  const reserved = [
    'admin', 'administrator', 'root', 'system', 'fynence', 'support',
    'help', 'api', 'bot', 'official', 'null', 'undefined', 'mod',
    'moderator', 'staff', 'operator', 'test', 'security', 'billing',
    'superuser', 'master', 'fynence_admin'
  ];
  if (reserved.includes(trimmed)) {
    return { available: false, reason: 'Username ini dilindungi oleh sistem.' };
  }

  try {
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.database
      .from('profiles')
      .select('id')
      .ilike('display_name', trimmed)
      .limit(1);

    if (error) {
      // If error (such as table empty or restricted RLS), allow if format is valid
      return { available: true };
    }

    if (data && data.length > 0) {
      return { available: false, reason: 'Username ini sudah digunakan operator lain.' };
    }

    return { available: true };
  } catch {
    return { available: true };
  }
}

export async function signUpAction(
  email: string,
  password: string,
  metadata?: {
    username?: string;
    displayName?: string;
    currency?: string;
    timezone?: string;
  }
) {
  try {
    const auth = await getAuthActions();
    const effectiveName = metadata?.displayName || metadata?.username || undefined;
    
    const { data, error } = await auth.signUp({
      email,
      password,
      ...(effectiveName ? { name: effectiveName } : {}),
    });

    if (error) {
      return { error: error.message };
    }
    
    if (data?.requireEmailVerification) {
      return { 
        requireEmailVerification: true,
        email,
        message: 'A 6-digit verification code has been sent to your email.',
      };
    }

    // If user account is immediately initialized, upsert profile in public.profiles table
    if (data?.user?.id) {
      try {
        const serverClient = await getServerClient();
        await serverClient.database.from('profiles').upsert([{
          id: data.user.id,
          display_name: effectiveName || 'Operator',
          default_currency: metadata?.currency || 'USD',
          timezone: metadata?.timezone || 'UTC',
          tier: 'FREE',
        }]);
      } catch (profileErr) {
        console.warn('Initial profile upsert note:', profileErr);
      }
    }
    
    return { user: data?.user ?? null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sign up failed';
    return { error: message };
  }
}

export async function verifyEmailAction(email: string, otp: string) {
  try {
    const auth = await getAuthActions();
    
    const { data, error } = await auth.verifyEmail({
      email,
      otp,
    });

    if (error) {
      return { error: error.message };
    }
    
    return { user: data?.user ?? null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return { error: message };
  }
}

export async function resendVerificationAction(email: string) {
  try {
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.auth.resendVerificationEmail({ email });
    
    if (error) {
      return { error: error.message };
    }
    
    return { 
      success: true, 
      message: data?.message || 'Verification code resent. Please check your inbox.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resend verification code';
    return { error: message };
  }
}

export async function sendPasswordResetEmailAction(email: string) {
  try {
    if (!email || !email.includes('@')) {
      return { error: 'Masukkan alamat email yang valid' };
    }
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.auth.sendResetPasswordEmail({ email: email.trim() });
    
    if (error) {
      return { error: error.message };
    }
    
    return { 
      success: true, 
      message: data?.message || 'Kode OTP untuk reset password telah dikirim ke email Anda.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengirim kode reset password';
    return { error: message };
  }
}

export async function resetPasswordWithOtpAction({
  email,
  otp,
  newPassword,
}: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  try {
    const cleanEmail = email?.trim();
    const cleanOtp = otp?.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Masukkan alamat email yang valid' };
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      return { error: 'Masukkan 6 digit kode OTP yang valid' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { error: 'Password baru minimal 6 karakter' };
    }

    const serverClient = await getServerClient();

    // Step 1: Exchange 6-digit OTP code for reset token
    const exchangeRes = await serverClient.auth.exchangeResetPasswordToken({
      email: cleanEmail,
      code: cleanOtp,
    });

    if (exchangeRes.error || !exchangeRes.data?.token) {
      return {
        error: exchangeRes.error?.message || 'Kode OTP salah atau telah kadaluarsa',
      };
    }

    // Step 2: Reset password using the obtained token
    const resetRes = await serverClient.auth.resetPassword({
      otp: exchangeRes.data.token,
      newPassword,
    });

    if (resetRes.error) {
      return {
        error: resetRes.error?.message || 'Gagal mengubah password',
      };
    }

    return {
      success: true,
      message: resetRes.data?.message || 'Password berhasil diubah. Silakan login kembali dengan password baru.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses reset password';
    return { error: message };
  }
}

export async function getCurrentUserAction() {
  try {
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.auth.getCurrentUser();

    if (data?.user) {
      return { user: data.user, error: null };
    }

    return { user: null, error: error?.message || null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve current user';
    return { user: null, error: message };
  }
}

export async function signOutAction() {
  try {
    const auth = await getAuthActions();
    await auth.signOut();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('insforge_access_token');
      } catch {}
      if (typeof document !== 'undefined') {
        document.cookie = 'insforge_access_token=; path=/; max-age=0; SameSite=Lax';
      }
    }
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to sign out' };
  }
}

export async function updateProfileAction({ name, avatar_url, timezone }: { name?: string; avatar_url?: string; timezone?: string }) {
  try {
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.auth.setProfile({
      ...(name !== undefined ? { name } : {}),
      ...(avatar_url !== undefined ? { avatar_url } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
    });

    if (error) {
      return { error: error.message };
    }

    return { data, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return { error: message };
  }
}

export async function uploadAvatarAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    const serverClient = await getServerClient();

    const ext = file.name.split('.').pop() || 'png';
    const filename = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await serverClient.storage
      .from('avatars')
      .upload(filename, file);

    if (error) {
      return { error: error.message };
    }

    return { url: data?.url, key: data?.key };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return { error: message };
  }
}

export async function uploadTradeScreenshotAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    const tradeId = (formData.get('tradeId') as string) || '';
    const imageType = ((formData.get('imageType') as string) || 'before') as TradeImageType;

    const serverClient = await getServerClient();
    const { data: userData } = await serverClient.auth.getCurrentUser();
    const userId = userData?.user?.id || 'anonymous';

    const ext = file.name.split('.').pop() || 'png';
    const filename = `chart-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // PRD Section 16 structure: trading-screenshots/{user_id}/{trade_id}/{image_type}/{filename}
    const cleanTradeId = tradeId && tradeId !== 'undefined' ? tradeId : 'pending';
    const storagePath = `${userId}/${cleanTradeId}/${imageType}/${filename}`;

    const { data, error } = await serverClient.storage
      .from('trading-screenshots')
      .upload(storagePath, file);

    if (error) {
      return { error: error.message };
    }

    let screenshotRecord: TradeScreenshot | null = null;

    // If tradeId is an existing UUID, immediately persist record in public.trade_screenshots
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tradeId);
    if (isUUID && userId !== 'anonymous') {
      try {
        const { data: insertedData, error: dbError } = await serverClient.database
          .from('trade_screenshots')
          .insert([{
            trade_id: tradeId,
            user_id: userId,
            file_path: data?.url || storagePath,
            image_type: imageType,
          }])
          .select();

        if (!dbError && insertedData?.[0]) {
          screenshotRecord = insertedData[0] as unknown as TradeScreenshot;
        }
      } catch (dbErr) {
        console.warn('[uploadTradeScreenshotAction] Could not insert screenshot metadata:', dbErr);
      }
    }

    return {
      url: data?.url,
      key: data?.key || storagePath,
      screenshot: screenshotRecord,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Screenshot upload failed';
    return { error: message };
  }
}

export async function deleteTradeScreenshotAction(screenshotId: string, storageKey?: string) {
  try {
    const serverClient = await getServerClient();

    let keyToDelete = storageKey;
    if (!keyToDelete) {
      try {
        const { data: existing } = await serverClient.database
          .from('trade_screenshots')
          .select()
          .eq('id', screenshotId)
          .single();
        if (existing?.file_path) {
          const match = existing.file_path.match(/\/objects\/(.+)$/);
          keyToDelete = match ? decodeURIComponent(match[1]) : existing.file_path;
        }
      } catch {
        // ignore
      }
    }

    if (keyToDelete) {
      try {
        await serverClient.storage.from('trading-screenshots').remove(keyToDelete);
      } catch (storageErr) {
        console.warn('[deleteTradeScreenshotAction] Storage remove warning:', storageErr);
      }
    }

    const { error } = await serverClient.database
      .from('trade_screenshots')
      .delete()
      .eq('id', screenshotId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete screenshot';
    return { success: false, error: message };
  }
}

export async function getTradeScreenshotsAction(tradeId: string) {
  try {
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.database
      .from('trade_screenshots')
      .select()
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data || []) as TradeScreenshot[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get screenshots';
    return { data: [], error: message };
  }
}

export async function syncMT5AccountAction(tradingAccountId: string) {
  try {
    const { mt5SyncService } = await import('@/services/mt5SyncService');
    const serverClient = await getServerClient();
    const { data: userData, error: userError } = await serverClient.auth.getCurrentUser();

    if (userError || !userData?.user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const result = await mt5SyncService.syncAccount(tradingAccountId, userData.user.id, serverClient);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync action failed';
    return { success: false, error: message };
  }
}

export async function connectMT5AccountAction(payload: {
  name: string;
  broker: string;
  account_type: 'prop' | 'broker' | 'demo' | 'personal';
  currency: string;
  initial_balance: number;
  mt5_login: string;
  mt5_server: string;
  investor_password?: string;
  profit_target?: number;
  max_drawdown_limit?: number;
}) {
  try {
    const { mt5SyncService } = await import('@/services/mt5SyncService');
    const serverClient = await getServerClient();
    const { data: userData, error: userError } = await serverClient.auth.getCurrentUser();

    if (userError || !userData?.user) {
      return { error: 'Unauthorized session' };
    }

    const { data, error } = await serverClient.database
      .from('trading_accounts')
      .insert([{
        user_id: userData.user.id,
        name: payload.name,
        broker: payload.broker,
        account_type: payload.account_type,
        currency: payload.currency,
        initial_balance: payload.initial_balance,
        current_balance: payload.initial_balance,
        current_equity: payload.initial_balance,
        profit_target: payload.profit_target || null,
        max_drawdown_limit: payload.max_drawdown_limit || null,
        mt5_login: payload.mt5_login,
        mt5_server: payload.mt5_server,
        investor_password_encrypted: payload.investor_password || null,
        connection_status: 'connected',
        is_mt5_synced: true,
      }])
      .select();

    if (error || !data || data.length === 0) {
      return { error: error?.message || 'Failed to create MT5 trading account' };
    }

    const newAccount = data[0];

    // Trigger initial sync using serverClient
    const syncRes = await mt5SyncService.syncAccount(newAccount.id, userData.user.id, serverClient);

    return { success: true, account: newAccount, syncResult: syncRes };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connect MT5 account failed';
    return { error: message };
  }
}

export async function syncForexCalendarAction(
  optionsOrPeriod:
    | 'today'
    | 'tomorrow'
    | 'this_week'
    | 'previous_week'
    | 'custom'
    | {
        period?: 'today' | 'tomorrow' | 'this_week' | 'previous_week' | 'custom';
        startDate?: string;
        endDate?: string;
        provider?: string;
      } = 'this_week'
) {
  try {
    const { calendarSyncService } = await import('@/services/calendarSyncService');
    const res = await calendarSyncService.syncForexCalendar(optionsOrPeriod);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Forex calendar sync failed';
    return { success: false, syncedCount: 0, newCount: 0, error: message };
  }
}

export async function getMT5SyncHistoryAction(tradingAccountId: string) {
  try {
    const { mt5SyncService } = await import('@/services/mt5SyncService');
    const serverClient = await getServerClient();
    const { data, error } = await mt5SyncService.getSyncHistory(tradingAccountId, 10, serverClient);
    if (error) return { data: [], error: error.message };
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sync history';
    return { data: [], error: message };
  }
}

export async function registerMT5ConnectorAction(
  tradingAccountId: string,
  options?: { connectorType?: 'builtin' | 'metaapi' | 'ea'; customServer?: string; customLogin?: string }
) {
  try {
    const { mt5SyncService } = await import('@/services/mt5SyncService');
    const serverClient = await getServerClient();
    const res = await mt5SyncService.registerMT5Connector(tradingAccountId, options, serverClient);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register connector';
    return { success: false, error: message };
  }
}

export async function deleteTradeAction(id: string) {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      return { success: true, localOnly: true };
    }

    const serverClient = await getServerClient();

    // Clean up dependent psychology records if any
    try {
      await serverClient.database
        .from('trade_psychology')
        .delete()
        .eq('trade_id', id);
    } catch {
      // Ignore if table not present or no dependent
    }

    // Clean up dependent screenshot records if any
    try {
      await serverClient.database
        .from('trade_screenshots')
        .delete()
        .eq('trade_id', id);
    } catch {
      // Ignore
    }

    const { error } = await serverClient.database
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete trade';
    return { success: false, error: message };
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      return { success: true, localOnly: true };
    }

    const serverClient = await getServerClient();
    const { error } = await serverClient.database
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete transaction';
    return { success: false, error: message };
  }
}

export async function getTradingAccountsAction() {
  try {
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.database
      .from('trading_accounts')
      .select()
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: (data || []) as TradingAccount[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get trading accounts';
    return { data: null, error: message };
  }
}

export async function createTradingAccountAction(accountData: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const userId = authRes.data?.user?.id;

    if (!userId) {
      return { data: null, error: 'Unauthorized session' };
    }

    const {
      id,
      created_at,
      updated_at,
      margin,
      free_margin,
      ea_token,
      last_sync_time,
      external_account_id,
      ...cleanData
    } = accountData;

    const payload: Record<string, any> = {
      name: cleanData.name,
      broker: cleanData.broker,
      account_type: cleanData.account_type || 'demo',
      currency: cleanData.currency || 'USD',
      initial_balance: Number(cleanData.initial_balance) || 0,
      current_balance: Number(cleanData.current_balance ?? cleanData.initial_balance) || 0,
      current_equity: Number(cleanData.current_equity ?? cleanData.initial_balance) || 0,
      profit_target: cleanData.profit_target ? Number(cleanData.profit_target) : null,
      max_drawdown_limit: cleanData.max_drawdown_limit ? Number(cleanData.max_drawdown_limit) : null,
      mt5_login: cleanData.mt5_login || null,
      mt5_server: cleanData.mt5_server || null,
      investor_password_encrypted:
        cleanData.investor_password_encrypted ||
        cleanData.investor_password ||
        ea_token ||
        null,
      connection_status: cleanData.connection_status || (cleanData.is_mt5_synced ? 'connected' : 'disconnected'),
      is_mt5_synced: Boolean(cleanData.is_mt5_synced),
      last_synced_at: cleanData.last_synced_at || last_sync_time || null,
      sync_error: cleanData.sync_error || null,
      is_active: cleanData.is_active !== undefined ? Boolean(cleanData.is_active) : true,
      user_id: userId,
    };

    const { data, error } = await serverClient.database
      .from('trading_accounts')
      .insert([payload])
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data?.[0] || null) as TradingAccount, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create trading account';
    return { data: null, error: message };
  }
}

export async function updateTradingAccountAction(id: string, updates: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const {
      id: _id,
      created_at,
      updated_at,
      user_id,
      margin,
      free_margin,
      ea_token,
      external_account_id,
      last_sync_time,
      ...cleanUpdates
    } = updates;

    const payload: Record<string, any> = { ...cleanUpdates };
    if (last_sync_time && !payload.last_synced_at) {
      payload.last_synced_at = last_sync_time;
    }
    if (ea_token && !payload.investor_password_encrypted) {
      payload.investor_password_encrypted = ea_token;
    }

    const { data, error } = await serverClient.database
      .from('trading_accounts')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data?.[0] || null) as TradingAccount, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update trading account';
    return { data: null, error: message };
  }
}

export async function deleteTradingAccountAction(id: string) {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      return { success: true, localOnly: true };
    }

    const serverClient = await getServerClient();

    // Clean up dependent sync records if any
    try {
      await serverClient.database
        .from('trade_sync_records')
        .delete()
        .eq('trading_account_id', id);
    } catch {
      // Ignore
    }

    const { error } = await serverClient.database
      .from('trading_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete trading account';
    return { success: false, error: message };
  }
}

export async function getFinancialAccountsAction() {
  try {
    const serverClient = await getServerClient();
    const { data, error } = await serverClient.database
      .from('financial_accounts')
      .select()
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: (data || []) as FinancialAccount[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get financial accounts';
    return { data: null, error: message };
  }
}

export async function createFinancialAccountAction(accountData: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const userId = authRes.data?.user?.id;

    const { id, created_at, updated_at, ...cleanData } = accountData;
    const payload = {
      ...cleanData,
      ...(userId ? { user_id: userId } : {}),
    };

    const { data, error } = await serverClient.database
      .from('financial_accounts')
      .insert([payload])
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data?.[0] || null) as FinancialAccount, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create financial account';
    return { data: null, error: message };
  }
}

export async function updateFinancialAccountAction(id: string, updates: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const { id: _id, created_at, updated_at, user_id, ...cleanUpdates } = updates;

    const { data, error } = await serverClient.database
      .from('financial_accounts')
      .update(cleanUpdates)
      .eq('id', id)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data?.[0] || null) as FinancialAccount, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update financial account';
    return { data: null, error: message };
  }
}

export async function deleteFinancialAccountAction(id: string) {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      return { success: true, localOnly: true };
    }

    const serverClient = await getServerClient();
    const { error } = await serverClient.database
      .from('financial_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete financial account';
    return { success: false, error: message };
  }
}

export async function clearMT5SyncHistoryAction(tradingAccountId: string) {
  try {
    const serverClient = await getServerClient();
    const { error } = await serverClient.database
      .from('trade_sync_records')
      .delete()
      .eq('trading_account_id', tradingAccountId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to clear sync history';
    return { success: false, error: message };
  }
}

export async function scheduledMT5SyncAction() {
  try {
    const { mt5SyncService } = await import('@/services/mt5SyncService');
    const res = await mt5SyncService.syncAllActiveAccounts();
    return { success: true, ...res };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scheduled sync failed';
    return { success: false, error: message };
  }
}

export async function getTradesAction(filters?: {
  tradingAccountId?: string;
  symbol?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  strategyId?: string;
}) {
  try {
    const serverClient = await getServerClient();
    let query = serverClient.database
      .from('trades')
      .select()
      .order('entry_time', { ascending: false });

    if (filters?.tradingAccountId) query = query.eq('trading_account_id', filters.tradingAccountId);
    if (filters?.symbol) query = query.eq('symbol', filters.symbol);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.strategyId) query = query.eq('strategy_id', filters.strategyId);
    if (filters?.startDate) query = query.gte('entry_time', filters.startDate);
    if (filters?.endDate) query = query.lte('entry_time', filters.endDate);

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: (data || []) as Trade[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get trades';
    return { data: null, error: message };
  }
}

export async function createTradeAction(tradeData: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const userId = authRes.data?.user?.id;

    const { id, created_at, updated_at, screenshots, ...cleanData } = tradeData;
    const payload = {
      ...cleanData,
      source: cleanData.source || 'manual',
      ...(userId ? { user_id: userId } : {}),
    };

    const { data, error } = await serverClient.database
      .from('trades')
      .insert([payload])
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    const createdTrade = (data?.[0] || null) as Trade | null;

    if (createdTrade && tradeData.psychology) {
      try {
        await serverClient.database
          .from('trade_psychology')
          .insert([{
            ...tradeData.psychology,
            trade_id: createdTrade.id,
            ...(userId ? { user_id: userId } : {}),
          }]);
      } catch {
        // Ignore psychology table optional write
      }
    }

    if (createdTrade && Array.isArray(tradeData.screenshots) && tradeData.screenshots.length > 0) {
      try {
        const screenshotRecords = tradeData.screenshots.map((s: any) => ({
          trade_id: createdTrade.id,
          user_id: userId || createdTrade.user_id,
          file_path: s.file_path || s.url,
          image_type: s.image_type || 'before',
        }));
        await serverClient.database
          .from('trade_screenshots')
          .insert(screenshotRecords);
      } catch (screenshotErr) {
        console.warn('[createTradeAction] Failed to insert screenshots batch:', screenshotErr);
      }
    } else if (createdTrade && tradeData.screenshot_url) {
      try {
        await serverClient.database
          .from('trade_screenshots')
          .insert([{
            trade_id: createdTrade.id,
            user_id: userId || createdTrade.user_id,
            file_path: tradeData.screenshot_url,
            image_type: 'before',
          }]);
      } catch (screenshotErr) {
        console.warn('[createTradeAction] Failed to insert fallback screenshot:', screenshotErr);
      }
    }

    if (createdTrade && createdTrade.trading_account_id) {
      try {
        const { data: accData } = await serverClient.database
          .from('trading_accounts')
          .select()
          .eq('id', createdTrade.trading_account_id)
          .single();

        if (accData) {
          const newBal = (Number(accData.current_balance) || 0) + Number(createdTrade.net_profit_loss || 0);
          const newEq = (Number(accData.current_equity ?? accData.current_balance) || 0) + Number(createdTrade.net_profit_loss || 0);
          await serverClient.database
            .from('trading_accounts')
            .update({ current_balance: newBal, current_equity: newEq })
            .eq('id', createdTrade.trading_account_id);
        }
      } catch {
        // Ignore account balance sync error
      }
    }

    return { data: createdTrade, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create trade';
    return { data: null, error: message };
  }
}

export async function updateTradeAction(id: string, updates: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const { id: _id, created_at, updated_at, user_id, ...cleanUpdates } = updates;

    const { data, error } = await serverClient.database
      .from('trades')
      .update(cleanUpdates)
      .eq('id', id)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    const updatedTrade = (data?.[0] || null) as Trade | null;

    if (updates.psychology) {
      try {
        const { data: existingPsych } = await serverClient.database
          .from('trade_psychology')
          .select('id')
          .eq('trade_id', id)
          .single();

        if (existingPsych?.id) {
          await serverClient.database
            .from('trade_psychology')
            .update(updates.psychology)
            .eq('id', existingPsych.id);
        } else {
          const authRes = await serverClient.auth.getCurrentUser();
          await serverClient.database
            .from('trade_psychology')
            .insert([{
              ...updates.psychology,
              trade_id: id,
              ...(authRes.data?.user?.id ? { user_id: authRes.data.user.id } : {}),
            }]);
        }
      } catch {
        // Ignore
      }
    }

    return { data: updatedTrade, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update trade';
    return { data: null, error: message };
  }
}

export async function getTransactionsAction(filters?: {
  accountId?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
}) {
  try {
    const serverClient = await getServerClient();
    let query = serverClient.database
      .from('transactions')
      .select()
      .order('transaction_date', { ascending: false });

    if (filters?.accountId) query = query.eq('account_id', filters.accountId);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.startDate) query = query.gte('transaction_date', filters.startDate);
    if (filters?.endDate) query = query.lte('transaction_date', filters.endDate);

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: (data || []) as Transaction[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get transactions';
    return { data: null, error: message };
  }
}

export async function createTransactionAction(txData: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const userId = authRes.data?.user?.id;

    const payload = {
      account_id: txData.account_id,
      category_id: txData.category_id,
      type: txData.type,
      amount: txData.amount,
      currency: txData.currency,
      description: txData.description,
      transaction_date: txData.transaction_date,
      ...(txData.attachment_url ? { attachment_url: txData.attachment_url } : {}),
      ...(userId ? { user_id: userId } : {}),
    };

    const { data, error } = await serverClient.database
      .from('transactions')
      .insert([payload])
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    const createdTx = (data?.[0] || null) as Transaction | null;

    if (createdTx && createdTx.account_id) {
      try {
        const { data: accData } = await serverClient.database
          .from('financial_accounts')
          .select()
          .eq('id', createdTx.account_id)
          .single();

        if (accData) {
          const modifier = createdTx.type === 'income' ? 1 : -1;
          let amt = Number(createdTx.amount);
          if (createdTx.currency === 'USD' && accData.currency === 'IDR') amt *= 16000;
          else if (createdTx.currency === 'IDR' && accData.currency === 'USD') amt /= 16000;
          const newBal = Number(accData.current_balance) + amt * modifier;
          await serverClient.database
            .from('financial_accounts')
            .update({ current_balance: newBal })
            .eq('id', createdTx.account_id);
        }
      } catch {
        // Ignore balance sync error
      }
    }

    return { data: createdTx, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create transaction';
    return { data: null, error: message };
  }
}

export async function updateTransactionAction(id: string, updates: Record<string, any>) {
  try {
    const serverClient = await getServerClient();
    const { id: _id, created_at, updated_at, user_id, category_name, is_recurring, ...cleanUpdates } = updates;

    const { data, error } = await serverClient.database
      .from('transactions')
      .update(cleanUpdates)
      .eq('id', id)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data?.[0] || null) as Transaction, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update transaction';
    return { data: null, error: message };
  }
}

export async function seedInitialUserDataAction() {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const [finRes, trRes, stRes] = await Promise.all([
      serverClient.database.from('financial_accounts').select().limit(1),
      serverClient.database.from('trading_accounts').select().limit(1),
      serverClient.database.from('strategies').select().limit(1),
    ]);

    let finAccounts = finRes.data || [];
    let tradingAccounts = trRes.data || [];
    let strategies = stRes.data || [];

    if (finAccounts.length === 0) {
      const seedFin = [
        {
          name: 'BCA Main Checking',
          institution: 'Bank Central Asia',
          account_number: '•••• 8920',
          account_type: 'bank',
          currency: 'IDR',
          initial_balance: 35000000,
          current_balance: 48250000,
          is_active: true,
          user_id: user.id,
        },
        {
          name: 'USD Reserve & Crypto',
          institution: 'Wise & Binance',
          account_number: 'alex.p@wise',
          account_type: 'investment',
          currency: 'USD',
          initial_balance: 4000,
          current_balance: 6240,
          is_active: true,
          user_id: user.id,
        },
      ];
      const res = await serverClient.database.from('financial_accounts').insert(seedFin).select();
      finAccounts = res.data || [];
    }

    if (tradingAccounts.length === 0) {
      const seedTrading = [
        {
          name: 'FTMO $100K Funded',
          broker: 'FTMO EU Server',
          account_type: 'prop',
          currency: 'USD',
          initial_balance: 100000,
          current_balance: 106420,
          current_equity: 106635,
          mt5_login: '1084201',
          mt5_server: 'FTMO-Server2',
          connection_status: 'connected',
          is_mt5_synced: true,
          is_active: true,
          profit_target: 10000,
          max_drawdown_limit: 10000,
          user_id: user.id,
        },
        {
          name: 'IC Markets Raw ECN',
          broker: 'IC Markets Global',
          account_type: 'broker',
          currency: 'USD',
          initial_balance: 10000,
          current_balance: 13840,
          current_equity: 13840,
          mt5_login: '5029148',
          mt5_server: 'ICMarketsSC-Live01',
          connection_status: 'connected',
          is_mt5_synced: true,
          is_active: true,
          user_id: user.id,
        },
      ];
      const res = await serverClient.database.from('trading_accounts').insert(seedTrading).select();
      tradingAccounts = res.data || [];
    }

    if (strategies.length === 0) {
      const seedStrategies = [
        {
          name: 'Liquidity Sweep + MSS',
          description: 'Purge of previous Asian high/low followed by Market Structure Shift on M5.',
          rules: ['Asian low sweep', 'Confirm displacement', 'Stop loss behind sweep wick', 'Min RR 1:2.5'],
          is_active: true,
          win_rate: 72.7,
          total_trades: 22,
          pnl: 5840,
          user_id: user.id,
        },
      ];
      const res = await serverClient.database.from('strategies').insert(seedStrategies).select();
      strategies = res.data || [];
    }

    return { success: true, seeded: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Seeding failed';
    return { success: false, error: message };
  }
}

export async function analyzeTradeAction(tradeId: string) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const { analyzeTradeWithGemini } = await import('@/services/ai/tradingAiService');
    return await analyzeTradeWithGemini(tradeId, serverClient, user.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to analyze trade';
    return { success: false, error: message };
  }
}

export async function analyzePsychologyAction() {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const { analyzePsychologyWithGemini } = await import('@/services/ai/tradingAiService');
    return await analyzePsychologyWithGemini(serverClient, user.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to analyze psychology';
    return { success: false, error: message };
  }
}

export async function generateDailyTradingSummaryAction(targetDate?: string) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const { generateDailySummaryWithGemini } = await import('@/services/ai/tradingAiService');
    return await generateDailySummaryWithGemini(serverClient, user.id, targetDate);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate daily summary';
    return { success: false, error: message };
  }
}

export async function getAiInsightsAction(type?: string) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;
    if (!user) return { data: [], error: 'Unauthorized' };

    let query = serverClient.database
      .from('ai_insights')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('insight_type', type);
    }

    const res = await query;
    return { data: res.data || [], error: res.error ? res.error.message : null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch AI insights';
    return { data: [], error: message };
  }
}

export async function sendAIChatMessageAction({
  domain,
  message,
}: {
  domain: 'financial' | 'psychology';
  message: string;
}) {
  try {
    const serverClient = await getServerClient();
    const authRes = await serverClient.auth.getCurrentUser();
    const user = authRes.data?.user;
    if (!user) return { reply: '', error: 'Unauthorized: Harap login terlebih dahulu.' };

    const { callGemini } = await import('@/services/ai/geminiService');

    if (domain === 'psychology') {
      const [trRes, psRes] = await Promise.all([
        serverClient.database
          .from('trades')
          .select('symbol, direction, net_profit_loss, r_multiple, status')
          .eq('user_id', user.id)
          .limit(20),
        serverClient.database
          .from('trade_psychology')
          .select('emotion, confidence, discipline_score, fomo, revenge_trading, followed_plan')
          .eq('user_id', user.id)
          .limit(20),
      ]);

      const trades = trRes.data || [];
      const psych = psRes.data || [];
      const fomoCount = psych.filter((p: any) => p.fomo).length;
      const revengeCount = psych.filter((p: any) => p.revenge_trading).length;

      const systemPrompt = `Anda adalah Vyno Finance Head of Trading Psychology Coach yang menggunakan Google Gemini.
Prinsip PRD #28: DILARANG memberikan rekomendasi BUY/SELL atau prediksi pergerakan pasar.
Fokus pada refleksi emosi, pengendalian impuls FOMO/revenge trading, manajemen risiko, dan disiplin eksekusi.
Konteks operator:
- Total Trade Tercatat: ${trades.length}
- Catatan FOMO: ${fomoCount} trade
- Catatan Revenge: ${revengeCount} trade
Jawab secara analitis, menenangkan, bijak, dan membimbing operator ke pola pikir disiplin dalam Bahasa Indonesia.`;

      const res = await callGemini(message, {
        systemInstruction: systemPrompt,
        temperature: 0.4,
      });

      return { reply: res.text || '', error: res.error };
    } else {
      const [accRes, txRes, bgRes] = await Promise.all([
        serverClient.database
          .from('financial_accounts')
          .select('name, current_balance, currency')
          .eq('user_id', user.id),
        serverClient.database
          .from('transactions')
          .select('type, amount, currency, description, transaction_date')
          .eq('user_id', user.id)
          .limit(30),
        serverClient.database
          .from('budgets')
          .select('amount, spent, period')
          .eq('user_id', user.id),
      ]);

      const accounts = accRes.data || [];
      const txs = txRes.data || [];
      const budgets = bgRes.data || [];

      const systemPrompt = `Anda adalah Vyno Finance AI Financial Assistant yang menggunakan Google Gemini.
Jawab pertanyaan finansial operator secara objektif berdasarkan data akun, transaksi, dan budget mereka.
Konteks operator:
- Akun Finansial: ${accounts.map((a: any) => `${a.name}: ${a.currency} ${a.current_balance}`).join(', ') || 'Belum ada akun'}
- Total Transaksi Terakhir: ${txs.length} transaksi
- Budget Terpasang: ${budgets.length} budget
Jawab secara ringkas, jelas, dan solutif dalam Bahasa Indonesia. Dilarang mengarang angka fiktif.`;

      const res = await callGemini(message, {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      });

      return { reply: res.text || '', error: res.error };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses pesan AI';
    return { reply: '', error: message };
  }
}

export async function getForexMarketIntelligenceAction(
  pair: SupportedForexPair,
  includeAiReport = false,
  forceRefresh = false
) {
  try {
    const { marketIntelligenceService } = await import('@/services/market/marketIntelligenceService');
    const serverClient = await getServerClient();
    const { data: userData } = await serverClient.auth.getCurrentUser();
    const userId = userData?.user?.id;

    const data = await marketIntelligenceService.getMarketIntelligence(pair, {
      includeAiReport,
      userId,
      forceRefresh,
    });

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get market intelligence';
    return { success: false, error: message };
  }
}

export async function getAllForexOverviewAction(forceRefresh = false) {
  try {
    const { marketIntelligenceService } = await import('@/services/market/marketIntelligenceService');
    const data = await marketIntelligenceService.getAllPairsOverview({ forceRefresh });
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch forex overview';
    return { success: false, error: message };
  }
}

export async function generateForexAiReportAction(pair: SupportedForexPair) {
  try {
    const { marketIntelligenceService } = await import('@/services/market/marketIntelligenceService');
    const serverClient = await getServerClient();
    const { data: userData } = await serverClient.auth.getCurrentUser();
    const userId = userData?.user?.id;

    const data = await marketIntelligenceService.getMarketIntelligence(pair, {
      includeAiReport: true,
      userId,
    });

    return { success: true, report: data.aiReport || '', data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate AI report';
    return { success: false, error: message };
  }
}

export async function getFynencePulseAction(forceRefresh = false) {
  try {
    const { pulseService } = await import('@/services/pulse');
    const data = await pulseService.getFynencePulse(forceRefresh);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load Fynence Pulse';
    return { success: false, error: message };
  }
}

export async function askFynenceAiQuickAction(prompt: string) {
  try {
    const { callGemini } = await import('@/services/ai/geminiService');
    const systemPrompt = `Anda adalah Fynence AI Assistant, asisten kecerdasan finansial, psikologi trading, dan analisis makro pasar.
Jawab secara ringkas, lugas, tajam, dan solutif dalam Bahasa Indonesia.
DILARANG memberikan sinyal trading eksplisit (beli/jual di harga spesifik).
Fokus pada manajemen risiko, psikologi trading, disiplin eksekusi, serta dinamika makro pasar.`;

    const res = await callGemini(prompt, {
      systemInstruction: systemPrompt,
      temperature: 0.4,
    });

    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true, reply: res.text || '' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses pertanyaan AI';
    return { success: false, error: message };
  }
}

export async function getMacroNewsReportAction(forceLive = false) {
  try {
    const { generateMacroReportWithAi } = await import('@/services/news/newsAiReportService');
    const data = await generateMacroReportWithAi(forceLive);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat laporan makro AI';
    return { success: false, error: message };
  }
}

export async function generateNewspaperPdfAction(options: {
  editionType?: string;
  sections?: string[];
  theme?: string;
  format?: 'newspaper' | 'a4' | 'a3' | 'letter';
  mockMode?: boolean;
} = {}) {
  try {
    const { editionComposer } = await import('@/fynence/composer');
    const { pdfRenderer } = await import('@/fynence/pdf');
    const doc = editionComposer.composeDocument({
      editionType: (options.editionType as any) || 'daily',
      sections: options.sections as any,
      theme: options.theme as any,
      mockMode: options.mockMode ?? true,
      pageSize: 'auto',
    });

    const result = await pdfRenderer.render(doc, {
      format: options.format || 'newspaper',
      theme: options.theme,
    });

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return {
      success: true,
      fileName: result.fileName,
      pageCount: result.pageCount,
      fileSizeBytes: result.fileSizeBytes,
      width: result.width,
      height: result.height,
      generatedAt: result.generatedAt,
      metadata: result.metadata,
      base64Pdf: result.buffer.toString('base64'),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compile broadsheet PDF';
    return { success: false, error: message };
  }
}



