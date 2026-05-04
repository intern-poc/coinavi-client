'use client';

import { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { setAccessToken, clearAccessToken } from '@/lib/auth';
import { silentRefresh } from '@/lib/api';
import { loginWithGoogle as apiLoginWithGoogle, logout as apiLogout, fetchMe } from './api';
import type { UserMe } from '@/types/user';

/**
 * 인증 상태 Context.
 *
 * <p>{@code status}:
 * <ul>
 *   <li>{@code 'loading'} — mount 시 silent refresh + /me fetch 중. 화면에 로그인 버튼 표시 X</li>
 *   <li>{@code 'authenticated'} — access token + user 정보 보유</li>
 *   <li>{@code 'unauthenticated'} — refresh 실패 또는 로그아웃 후</li>
 * </ul>
 *
 * <p><b>user 정보 fetch 흐름</b>: silent refresh 성공 직후 GET /api/v1/users/me 호출.
 * 표준 SPA 패턴 — auth 응답엔 토큰만, user 정보는 별도 /me. 새 access 발급 후 1회 호출
 * 로 user state 채움.
 */
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: UserMe | null;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserMe | null>(null);

  // mount 시 silent refresh + /me fetch — 새로고침·새 탭에서도 자동 로그인 + 사용자 정보 복원.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await silentRefresh();
      if (cancelled) return;
      if (!ok) {
        setStatus('unauthenticated');
        return;
      }
      // refresh 성공 → 사용자 정보 함께 fetch.
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        // /me 가 실패해도 토큰은 유효한 상태이지만, user 식별 불가라 unauth 로 떨어뜨림.
        // 백엔드 일시 장애 등은 다음 새로고침에서 재시도.
        if (cancelled) return;
        clearAccessToken();
        setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    const { accessToken } = await apiLoginWithGoogle(idToken);
    setAccessToken(accessToken);
    // 토큰 받자마자 /me 호출 → 헤더 등에 즉시 사용자 정보 반영.
    const me = await fetchMe();
    setUser(me);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // 로그아웃은 best-effort — 실패해도 클라 상태는 비움.
    }
    clearAccessToken();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, loginWithGoogleIdToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
