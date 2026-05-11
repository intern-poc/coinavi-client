import { api } from '@/lib/api';
import type {
  ExchangeApiKey,
  RegisterExchangeKeyRequest,
} from '@/types/exchange-key';

/**
 * 내 거래소 API 키 리스트. 인증 필요 — Bearer 자동 부착.
 */
export function listMyExchangeKeys(): Promise<ExchangeApiKey[]> {
  return api.get<ExchangeApiKey[]>('/api/v1/exchange-keys');
}

/**
 * 새 거래소 키 등록. 백엔드가 AES-256-GCM 으로 즉시 암호화 후 저장 — 평문은 DB·로그에 안 남음.
 *
 * <p>같은 거래소 중복 등록 시 백엔드 409 (EXCHANGE_KEY_ALREADY_REGISTERED).
 * rotate 는 별도 PUT — 이번 1차에선 노출 X (삭제 후 재등록 으로 충분).
 */
export function registerExchangeKey(
  request: RegisterExchangeKeyRequest
): Promise<ExchangeApiKey> {
  return api.post<ExchangeApiKey>('/api/v1/exchange-keys', request);
}

export function deleteExchangeKey(id: number): Promise<void> {
  return api.delete<void>(`/api/v1/exchange-keys/${id}`);
}
