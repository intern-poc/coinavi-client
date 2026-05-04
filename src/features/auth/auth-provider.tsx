'use client';

import { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { setAccessToken, clearAccessToken } from '@/lib/auth';
import { silentRefresh } from '@/lib/api';
import { loginWithGoogle as apiLoginWithGoogle, logout as apiLogout } from './api';

/**
 * 인증 상태 Context.
 *
 * <p><b>왜 user 객체가 없나</b>: 백엔드의 LoginResponse 가 accessToken·expiresIn 만 반환.
 * user 정보 (이메일·이름) 가 필요해지면 GET /me 엔드포인트 추가 후 fetch. 현 단계는
 * "로그인 됐는지 여부" 만 추적.
 *
 * <p>{@code status}:
 * <ul>
 *   <li>{@code 'loading'} — mount 시 silent refresh 시도 중. 화면에 로그인 버튼 표시 X</li>
 *   <li>{@code 'authenticated'} — access token 보유. 보호된 화면 접근 가능</li>
 *   <li>{@code 'unauthenticated'} — refresh 실패 또는 로그아웃 후</li>
 * </ul>
 */
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  // mount 시 silent refresh — refresh_token cookie 가 살아있으면 새 access token 발급.
  // 새로고침·새 탭에서도 자동 로그인 유지의 핵심.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await silentRefresh();
      if (cancelled) return;
      setStatus(ok ? 'authenticated' : 'unauthenticated');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    const { accessToken } = await apiLoginWithGoogle(idToken);
    setAccessToken(accessToken);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // 로그아웃은 best-effort — 실패해도 클라 상태는 비움.
    }
    clearAccessToken();
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, loginWithGoogleIdToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
