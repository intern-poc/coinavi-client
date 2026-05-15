/**
 * 거래소 enum. 백엔드 ExchangeCode 와 1:1 매칭.
 */
export type ExchangeCode = 'UPBIT' | 'BINANCE' | 'BITHUMB';

export const EXCHANGE_LABELS: Record<ExchangeCode, string> = {
  UPBIT: '업비트',
  BINANCE: '바이낸스',
  BITHUMB: '빗썸',
};

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
