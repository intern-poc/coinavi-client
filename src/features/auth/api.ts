import { api } from '@/lib/api';
import type { UserMe } from '@/types/user';

/** 백엔드 LoginResponse 와 1:1. accessToken 만 노출 (refresh_token 은 cookie 로). */
export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
};

/**
 * Google ID 토큰 검증 + 자체 JWT 발급. 응답 cookie 로 refresh_token 자동 저장됨.
 */
export function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/api/v1/auth/google/login', { idToken }, { authenticated: false });
}

/**
 * 로그아웃 — access token 블랙리스트 + refresh_token cookie 만료.
 */
export function logout(): Promise<void> {
  return api.post<void>('/api/v1/auth/logout');
}

/**
 * 본인 정보 조회 — 헤더의 "{name}님" 표시 등 식별 정보용.
 * 백엔드의 access token 검증 통과해야 호출 가능.
 */
export function fetchMe(): Promise<UserMe> {
  return api.get<UserMe>('/api/v1/users/me');
}
