/**
 * 거래소 횡단 통합 시세 frame — 백엔드 SSE 가 push 하는 event payload.
 *
 * <p>백엔드 {@code LivePriceFrame} (Jackson 기본 camelCase) 의 직렬화 결과 그대로.
 * Upbit·Binance 모두 동일 모양으로 정규화되어 옴. 거래소 구분은 {@code exchange} 필드.
 *
 * <p><b>tradePrice 단위</b>: 거래소 원본 통화. Upbit=KRW, Binance=USDT.
 *
 * <p><b>fxRate</b>: 매 frame 동봉되는 USD-KRW 환율 (BigDecimal → JSON number). 클라이언트가
 * 표시 통화 모드에 따라 환산:
 * <ul>
 *   <li>KRW 모드 — Upbit frame 그대로 / Binance frame: tradePrice * fxRate</li>
 *   <li>USD 모드 — Binance frame 그대로 / Upbit frame: tradePrice / fxRate</li>
 * </ul>
 *
 * <p><b>changeRate 단위</b>: 이미 % 로 정규화 (1.5 = +1.5%). 통화 무관.
 */
export type LivePriceFrame = {
  coinId: number;
  symbol: string;                 // "BTC"
  exchange: 'UPBIT' | 'BINANCE';
  marketCode: string;             // "KRW-BTC" | "BTCUSDT"
  currency: 'KRW' | 'USDT';
  tradePrice: number;
  changeRate: number;             // % 단위
  volume24h: number;
  high24h: number;
  low24h: number;
  fxRate: number;                 // USD-KRW (예: 1455.30)
  timestamp: string;              // ISO-8601
};
