/**
 * 거래소 enum. 백엔드 ExchangeCode 와 1:1 매칭.
 *
 * <p>{@code DEMO} 는 시연용 가상 거래소 — 서버는 dev 프로파일에서만 등록 받음.
 * prod 빌드에선 UI 에서도 숨김 ({@code process.env.NODE_ENV} 기반).
 */
export type ExchangeCode = 'UPBIT' | 'BINANCE' | 'BITHUMB' | 'DEMO';

export const EXCHANGE_LABELS: Record<ExchangeCode, string> = {
  UPBIT: '업비트',
  BINANCE: '바이낸스',
  BITHUMB: '빗썸',
  DEMO: 'Demo (시연용)',
};

/**
 * 거래소별 API 키 입력 필드 명칭. 거래소가 발급 화면에 쓰는 라벨과 일치시켜야 사용자가
 * 헷갈리지 않음 (Bithumb 만 "Connect Key" 로 다름). Demo 는 검증 우회라 아무 값이나 통과.
 */
export const KEY_FIELD_LABELS: Record<ExchangeCode, { primary: string; secret: string }> = {
  UPBIT: { primary: 'Access Key', secret: 'Secret Key' },
  BITHUMB: { primary: 'Connect Key', secret: 'Secret Key' },
  BINANCE: { primary: 'API Key', secret: 'Secret Key' },
  DEMO: { primary: 'Demo Key (아무 값)', secret: 'Demo Secret (아무 값)' },
};

/**
 * dev 빌드에서만 노출되는 거래소. Next.js 가 build 시점에 정적 치환 → prod 빌드에선 false.
 */
export const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * 백엔드 ExchangeApiKeyResponse 와 1:1. 평문 키는 절대 응답에 포함 안 됨 — 마스킹된 형태만.
 */
export type ExchangeApiKey = {
  id: number;
  exchange: ExchangeCode;
  apiKeyMasked: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export type RegisterExchangeKeyRequest = {
  exchange: ExchangeCode;
  apiKey: string;
  secret: string;
};
