import type { DisplayCurrency } from '@/lib/format';

/**
 * 카테고리 통계 — 백엔드 CategoryStatsResponse 와 1:1.
 *
 * <p>{@code marketCap}, {@code volume24h} 는 요청 currency 단위로 환산된 값.
 * {@code marketCapChange24hPct} 는 통화 무관 퍼센트.
 *
 * <p>BigDecimal → number 직렬화 시 큰 수 (조 단위) 정밀도 일부 손실 가능하지만
 * 표시용이라 무시 가능.
 */
export type CategoryStats = {
  id: string;
  name: string;
  marketCap: number;
  marketCapChange24hPct: number;
  volume24h: number;
  currency: DisplayCurrency;
};

/**
 * 카테고리 내 24h 상승률 상위 코인 — 백엔드 TopGainerResponse 와 1:1.
 * 가격 필드 없음 (메인 테이블에서 실시간으로 보면 됨).
 */
export type TopGainer = {
  symbol: string;
  name: string;
  imageUrl: string | null;
  coingeckoId: string | null;
  priceChange24hPct: number;
};
