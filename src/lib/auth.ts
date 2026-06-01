/**
 * Access token 메모리 보관소.
 *
 * <p><b>왜 메모리만 — localStorage 안 쓰는 이유</b>:
 * localStorage 는 XSS 공격에 노출됨 (악성 스크립트가 자유 접근). 표준 SPA 인증 패턴은
 * access token 을 메모리(JS 변수) 에만 두고, 새로고침 시엔 httpOnly cookie 의
 * refresh token 으로 새 access 를 발급받는 방식.
 *
 * <p>refresh token 은 백엔드가 httpOnly cookie 로 관리 → JS 가 접근 못 해 XSS 안전.
 * 그래서 새로고침 직후 잠깐 비인증 상태 → AuthProvider 가 mount 시 silent refresh.
 */

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
