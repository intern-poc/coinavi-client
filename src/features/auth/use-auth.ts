import { useContext } from 'react';
import { AuthContext } from './auth-provider';

/**
 * 컴포넌트에서 인증 상태·액션을 가져오는 훅.
 *
 * <p>{@code AuthProvider} 바깥에서 호출하면 throw — 잘못된 사용을 빨리 감지.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
