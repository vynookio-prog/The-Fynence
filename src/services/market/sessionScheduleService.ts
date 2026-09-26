import 'server-only';
import { MarketSessionTelemetry, SupportedInstrument } from '@/types/market';
import { DAILY_MARKET_SESSIONS, DailySessionConfig } from '@/constants/marketSessions';

export { DAILY_MARKET_SESSIONS, type DailySessionConfig };

export const sessionScheduleService = {
  /**
   * Identifies current market session telemetry based on current UTC time.
   */
  getCurrentSession(date: Date = new Date()): MarketSessionTelemetry {
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const currentMins = utcHours * 60 + utcMinutes;

    let activeSession = DAILY_MARKET_SESSIONS[0];
    let nextSession = DAILY_MARKET_SESSIONS[1];

    for (let i = 0; i < DAILY_MARKET_SESSIONS.length; i++) {
      const sess = DAILY_MARKET_SESSIONS[i];
      const startMins = sess.startHourUtc * 60 + sess.startMinuteUtc;
      const endMins = sess.endHourUtc * 60 + sess.endMinuteUtc;

      if (currentMins >= startMins && currentMins < endMins) {
        activeSession = sess;
        nextSession = DAILY_MARKET_SESSIONS[(i + 1) % DAILY_MARKET_SESSIONS.length];
        break;
      }
    }

    const dateStr = date.toISOString().split('T')[0];

    return {
      currentSessionId: activeSession.id,
      currentSessionName: activeSession.name,
      sessionNumber: activeSession.sessionNumber,
      totalSessions: DAILY_MARKET_SESSIONS.length,
      sessionWindow: `${activeSession.utcTimeLabel} - ${nextSession.utcTimeLabel}`,
      lastSyncTime: `${dateStr} ${activeSession.utcTimeLabel} (${activeSession.wibTimeLabel})`,
      nextSyncTime: `${nextSession.utcTimeLabel} (${nextSession.wibTimeLabel})`,
      nextSyncSessionName: nextSession.name,
      isNewYorkSession: activeSession.isNewYork,
    };
  },

  /**
   * Generates a unique cache key per instrument per session window.
   * e.g., "2026-09-10_NEW_YORK_OPEN_XAUUSD"
   */
  getSessionCacheKey(symbol: SupportedInstrument, date: Date = new Date()): string {
    const session = this.getCurrentSession(date);
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}_${session.currentSessionId}_${symbol}`;
  },

  /**
   * Returns all 5 daily sessions configuration.
   */
  getAllDailySessions(): DailySessionConfig[] {
    return DAILY_MARKET_SESSIONS;
  },
};
