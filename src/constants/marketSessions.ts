import { MarketSessionId } from '@/types/market';

export interface DailySessionConfig {
  id: MarketSessionId;
  name: string;
  startHourUtc: number;
  startMinuteUtc: number;
  endHourUtc: number;
  endMinuteUtc: number;
  utcTimeLabel: string;
  wibTimeLabel: string;
  sessionNumber: number;
  description: string;
  isNewYork: boolean;
}

export const DAILY_MARKET_SESSIONS: DailySessionConfig[] = [
  {
    id: 'TOKYO_OPEN',
    name: 'Tokyo Open (Asian Session)',
    startHourUtc: 0,
    startMinuteUtc: 0,
    endHourUtc: 7,
    endMinuteUtc: 0,
    utcTimeLabel: '00:00 UTC',
    wibTimeLabel: '07:00 WIB',
    sessionNumber: 1,
    description: 'Asian liquidity baseline & Tokyo equities open.',
    isNewYork: false,
  },
  {
    id: 'LONDON_OPEN',
    name: 'London Open (European Surge)',
    startHourUtc: 7,
    startMinuteUtc: 0,
    endHourUtc: 13,
    endMinuteUtc: 30,
    utcTimeLabel: '07:00 UTC',
    wibTimeLabel: '14:00 WIB',
    sessionNumber: 2,
    description: 'European market open & Frankfurt/London volume surge.',
    isNewYork: false,
  },
  {
    id: 'NEW_YORK_OPEN',
    name: 'New York Open (NY #1 - Cash & Macro)',
    startHourUtc: 13,
    startMinuteUtc: 30,
    endHourUtc: 17,
    endMinuteUtc: 0,
    utcTimeLabel: '13:30 UTC',
    wibTimeLabel: '20:30 WIB',
    sessionNumber: 3,
    description: 'Wall Street cash open & high-impact US macro releases (CPI, NFP, PPI). Peak volatility.',
    isNewYork: true,
  },
  {
    id: 'NEW_YORK_MIDDAY',
    name: 'New York Midday (NY #2 - London Fix)',
    startHourUtc: 17,
    startMinuteUtc: 0,
    endHourUtc: 21,
    endMinuteUtc: 0,
    utcTimeLabel: '17:00 UTC',
    wibTimeLabel: '00:00 WIB',
    sessionNumber: 4,
    description: 'London 4 PM benchmark fixing & US institutional afternoon trend continuation.',
    isNewYork: true,
  },
  {
    id: 'NEW_YORK_CLOSE',
    name: 'New York Close (Day Settlement)',
    startHourUtc: 21,
    startMinuteUtc: 0,
    endHourUtc: 24,
    endMinuteUtc: 0,
    utcTimeLabel: '21:00 UTC',
    wibTimeLabel: '04:00 WIB',
    sessionNumber: 5,
    description: 'Daily candle close, rollover swap calculations & handover to Asia.',
    isNewYork: false,
  },
];
