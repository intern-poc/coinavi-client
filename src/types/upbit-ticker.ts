/**
 * Upbit ticker frame — 백엔드 SSE 가 push 하는 event payload.
 *
 * <p>백엔드 {@code UpbitTickerFrame} (Jackson SnakeCaseStrategy) 의 직렬화 결과 그대로.
 * 프론트 컨벤션과 다르게 snake_case 라 별도 타입으로 분리하고, 사용 시점에 필요한 필드만
 * 추출해 우리 camelCase 모델 ({@code CoinSummary.currentPrice} 등) 로 변환.
 */
export type UpbitTickerEvent = {
  code: string;                  // "KRW-BTC"
  trade_price: number;           // 현재가
  signed_change_rate: number;    // 24h 변동률 (소수, 0.0247 = +2.47%)
  change_price: number;          // 24h 변동 금액
  change: 'RISE' | 'FALL' | 'EVEN';
  acc_trade_price_24h: number;   // 24h 거래대금 (KRW)
  high_price: number;
  low_price: number;
  timestamp: number;
  stream_type: 'REALTIME' | 'SNAPSHOT';
};
