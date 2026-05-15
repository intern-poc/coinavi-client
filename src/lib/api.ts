import type { CommonResponse } from '@/types/api';
import { getAccessToken, setAccessToken, clearAccessToken } from './auth';

/**
 * 백엔드 base URL.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

type RequestOptions = RequestInit & {
  /** 인증 헤더 부착 여부 (default: true). 로그인·refresh 같은 공개 엔드포인트는 false. */
  authenticated?: boolean;
  /** 401 받으면 silent refresh 시도 후 재시도 (default: true). 단 refresh 자체엔 false. */
  retryOn401?: boolean;
};

/**
 * 백엔드 호출 + CommonResponse unwrap + 인증 자동화.
 *
 * <p><b>핵심 정책</b>:
 * <ul>
 *   <li>{@code Authorization: Bearer <accessToken>} 헤더 자동 부착 (메모리에서 가져옴)</li>
 *   <li>{@code credentials: 'include'} — refresh_token httpOnly cookie 자동 전송</li>
 *   <li>{@code cache: 'no-store'} + 헤더 + URL timestamp — 3중 캐시 우회 (시세 polling 환경)</li>
 *   <li>401 응답 시 silent refresh 자동 시도 → 새 access 받으면 원 요청 재시도. 무한
 *       loop 방지를 위해 retryOn401 플래그가 false 인 호출(refresh 자체) 은 스킵.</li>
 * </ul>
 */
async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const { authenticated = true, retryOn401 = true, headers, ...rest } = opts;

  const sep = path.includes('?') ? '&' : '?';
  const url = `${API_BASE}${path}${method === 'GET' ? `${sep}_=${Date.now()}` : ''}`;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...(headers as Record<string, string> | undefined),
  };

  if (authenticated) {
    const token = getAccessToken();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    credentials: 'include',     // refresh_token cookie 자동 전송
    cache: 'no-store',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
    headers: finalHeaders,
  });

  // 401 + retry 가능 → silent refresh 시도 후 한 번 재시도
  if (res.status === 401 && retryOn401 && authenticated) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      return request<T>(method, path, body, { ...opts, retryOn401: false });
    } else {
      clearAccessToken();
      throw new Error('Unauthorized — refresh failed');
    }
  }

  if (!res.ok) {
    // 백엔드는 4xx/5xx 에도 CommonResponse { success:false, error:{message} } 형태로 응답.
    // 사용자 친화 메시지를 드러내기 위해 body 파싱 시도, 실패 시 generic fallback.
    let message: string | null = null;
    try {
      const json: CommonResponse<unknown> = await res.json();
      message = json.error?.message ?? null;
    } catch {
      // body 가 JSON 이 아니거나 비어있음 — fallback 메시지 사용
    }
    throw new Error(message ?? `API ${path} failed with HTTP ${res.status}`);
  }

  // 204 No Content 등 body 없는 응답 — JSON 파싱 시도 안 함.
  if (res.status === 204) {
    return undefined as T;
  }

  const json: CommonResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message ?? `API ${path} returned unsuccessful`);
  }
  return json.data as T;
}

/**
 * Silent refresh — access token 만료 시 refresh_token cookie 로 새 access 발급.
 * 성공: true 반환 + setAccessToken. 실패: false 반환 (호출부가 미인증 상태로 전이).
 */
async function silentRefresh(): Promise<boolean> {
  try {
    const data = await request<{ accessToken: string; expiresIn: number }>(
      'POST',
      '/api/v1/auth/refresh',
      undefined,
      { authenticated: false, retryOn401: false }
    );
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),
};

/** 외부에서 직접 silent refresh 트리거 (AuthProvider mount 시 등). */
export { silentRefresh };

/** 기존 호출부 호환 — 신규 코드는 api.get 사용 권장. */
export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>('GET', path, undefined, { ...init });
}
