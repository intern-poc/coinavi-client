'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/features/auth/auth-provider';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

/**
 * 전역 Provider 묶음. layout 에서 한 번만 감싸 모든 페이지에 적용.
 *
 * <p>왜 별도 Client Component 인가: layout.tsx 는 Server Component 이라야 metadata
 * export 등이 가능. 그런데 GoogleOAuthProvider/AuthProvider 는 Client only. 분리해서
 * layout 의 server 성격을 유지.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
}
