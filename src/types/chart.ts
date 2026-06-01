import type { DisplayCurrency } from '@/lib/format';

/**
 * 차트 range 옵션. 백엔드 ChartRange enum 의 query param code 와 1:1 매칭.
 */
export type ChartRange = '1d' | '7d' | '30d' | '1y';

export const CHART_RANGES: ChartRange[] = ['1d', '7d', '30d', '1y'];

/**
 * 백엔드 CoinChartResponse 와 1:1 매칭.
 *
 * <p>{@code timestamp} 는 ISO Instant 문자열 (예: "2026-04-30T08:12:53.281Z").
 * recharts X축은 number/string 모두 받지만 dateTime 처리는 호출부에서 변환.
 */
export type CoinChart = {
  range: 'ONE_DAY' | 'SEVEN_DAYS' | 'THIRTY_DAYS' | 'ONE_YEAR';
  currency: DisplayCurrency;
  prices: ChartPoint[];
};

export type ChartPoint = {
  timestamp: string;
  price: number;
};
