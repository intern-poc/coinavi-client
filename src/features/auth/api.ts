import { api } from '@/lib/api';

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
