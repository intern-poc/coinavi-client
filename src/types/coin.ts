/**
 * 코인 리스트용 요약 정보. 백엔드 CoinSummaryResponse 와 1:1 매칭.
 *
 * 가격·변동률·거래량은 Upbit Redis hit 시 실시간, miss 시 CoinGecko 6h stale.
 * 백엔드 BigDecimal 이 JSON number 로 직렬화 — JS number 정밀도 손실 가능성
 * (큰 시총 등) 있으면 string 으로 전환 필요.
 */
export type CoinSummary = {
  id: number;
  symbol: string;
  name: string | null;
  imageUrl: string | null;
  coingeckoId: string | null;
  marketCapRank: number | null;
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
