import { apiGet } from '@/lib/api';
import type { Page } from '@/types/api';
import type { Category } from '@/types/category';
import type { CategoryStats, TopGainer } from '@/types/category-stats';
import type { CoinSummary, CoinDetail } from '@/types/coin';
import type { CoinChart, ChartRange } from '@/types/chart';
import type { DisplayCurrency } from '@/lib/format';

/**
 * 코인 리스트 — 시총 순 페이징 + 통화 토글 + 카테고리 필터 (선택).
 * page 0-based, size 1~250, currency 기본 KRW.
 *
 * <p>categoryId 가 있으면 해당 카테고리에 매핑된 코인만 반환. 매핑은 OnDemand fetch +
 * 부팅 시 1회 sync 로 채워지므로 일부 코인은 카테고리 결과에서 빠질 수 있음.
 */
export function fetchCoins(
  page = 0,
  size = 50,
  currency: DisplayCurrency = 'KRW',
  categoryId?: string
): Promise<Page<CoinSummary>> {
  const categoryParam = categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : '';
  return apiGet<Page<CoinSummary>>(
    `/api/v1/coins?page=${page}&size=${size}&currency=${currency}${categoryParam}`
  );
}

/**
 * 카테고리 마스터 리스트 — CoinGecko 슬러그 + 표시명. 인증 불필요.
 */
export function fetchCategories(): Promise<Category[]> {
  return apiGet<Category[]>('/api/v1/categories');
}

/**
 * 카테고리 통계 (시총·24h 변동률·24h 거래대금) — 대시보드 카드용.
 *
 * <p>백엔드 Redis 캐시 10분 TTL. 카테고리 매칭 실패 시 404 → 호출부 catch.
 */
export function fetchCategoryStats(
  categoryId: string,
  currency: DisplayCurrency = 'KRW'
): Promise<CategoryStats> {
  return apiGet<CategoryStats>(
    `/api/v1/categories/${encodeURIComponent(categoryId)}/stats?currency=${currency}`
  );
}

/**
 * 카테고리 내 24h 상승률 상위 N — 대시보드 "상위 상승" 카드용.
 * 매핑된 코인 없거나 priceChange24h 가 모두 NULL 이면 빈 list.
 */
export function fetchCategoryTopGainers(
  categoryId: string,
  limit = 3
): Promise<TopGainer[]> {
  return apiGet<TopGainer[]>(
    `/api/v1/categories/${encodeURIComponent(categoryId)}/top-gainers?limit=${limit}`
  );
}

/**
 * 코인 단건 상세. identifier 는 coingecko_id ("bitcoin") 또는 symbol ("BTC").
 */
export function fetchCoinDetail(
  identifier: string,
  currency: DisplayCurrency = 'KRW'
): Promise<CoinDetail> {
  return apiGet<CoinDetail>(
    `/api/v1/coins/${encodeURIComponent(identifier)}?currency=${currency}`
  );
}

/**
 * 코인 시계열 가격 차트. 백엔드 CoinGecko proxy + Redis 캐시 (range별 TTL).
 * 빈 prices 는 placeholder 코인 또는 CoinGecko 일시 장애 — 호출부에서 "데이터 없음" 표시.
 */
export function fetchCoinChart(
  identifier: string,
  range: ChartRange = '1d',
  currency: DisplayCurrency = 'KRW'
): Promise<CoinChart> {
  return apiGet<CoinChart>(
    `/api/v1/coins/${encodeURIComponent(identifier)}/chart?range=${range}&currency=${currency}`
  );
}
