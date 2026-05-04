import { apiGet } from '@/lib/api';
import type { Page } from '@/types/api';
import type { CoinSummary, CoinDetail } from '@/types/coin';

/**
 * 코인 리스트 — 시총 순 페이징.
 * page 0-based, size 1~250.
 */
export function fetchCoins(page = 0, size = 50): Promise<Page<CoinSummary>> {
  return apiGet<Page<CoinSummary>>(`/api/v1/coins?page=${page}&size=${size}`);
}

/**
 * 코인 단건 상세. identifier 는 coingecko_id ("bitcoin") 또는 symbol ("BTC").
 */
export function fetchCoinDetail(identifier: string): Promise<CoinDetail> {
  return apiGet<CoinDetail>(`/api/v1/coins/${encodeURIComponent(identifier)}`);
}
