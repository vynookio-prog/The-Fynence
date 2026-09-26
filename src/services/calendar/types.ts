import { NewsImpact } from '@/types';

export type CalendarPeriod = 'today' | 'tomorrow' | 'this_week' | 'previous_week' | 'custom';

export interface CalendarFilterOptions {
  period?: CalendarPeriod;
  startDate?: string;
  endDate?: string;
  currency?: string;
  country?: string;
  impact?: NewsImpact | 'all';
}

export interface NormalizedMarketEvent {
  id?: string;
  external_event_id: string;
  source_event_id?: string;
  event_name: string;
  currency: string;
  country: string;
  event_time: string;
  impact: NewsImpact;
  actual?: string;
  forecast?: string;
  previous?: string;
  description?: string;
  source: string;
  source_url?: string;
  timezone: string;
}

export interface ForexCalendarProvider {
  readonly providerName: string;
  getEvents(options?: CalendarFilterOptions): Promise<NormalizedMarketEvent[]>;
  getEventById(id: string): Promise<NormalizedMarketEvent | null>;
  getEventsByDateRange(startDate: string, endDate: string): Promise<NormalizedMarketEvent[]>;
}
