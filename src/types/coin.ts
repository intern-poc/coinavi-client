import type { DisplayCurrency } from '@/lib/format';

/**
 * 코인 리스트용 요약 정보. 백엔드 CoinSummaryResponse 와 1:1 매칭.
 *
 * <p>가격·변동률·거래량은 PriceResolver 가 결정 — Upbit hit / Binance×환율 / CoinGecko
 * fallback 3단 우선순위. {@code currency} 는 응답 단위 (KRW 또는 USD). priceChange %
 * 는 통화 무관.
 *
 * <p>백엔드 BigDecimal 이 JSON number 로 직렬화 — 큰 시총 등 정밀도 손실 가능성
 * 있으면 string 으로 전환.
 */
export type CoinSummary = {
  id: number;
  symbol: string;
  name: string | null;
  imageUrl: string | null;
  coingeckoId: string | null;
  marketCapRank: number | null;
  currency: DisplayCurrency;
  currentPrice: number | null;
  marketCap: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
};

/**
 * 코인 상세 페이지용. Summary + description, supply, lastSyncedAt.
 */
export type CoinDetail = CoinSummary & {
  description: string | null;
  circulatingSupply: number | null;
  lastSyncedAt: string;        // ISO Instant (예: "2026-04-30T08:12:53.281Z")
};
