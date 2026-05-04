'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/features/auth/use-auth';

/**
 * 로그인 페이지.
 *
 * <p>Google ID 토큰을 SDK 가 받아 백엔드 /auth/google/login 으로 보냄. 백엔드가 검증 후
 * 자체 JWT (access) + refresh_token cookie 발급. 성공 시 메인으로 이동.
 *
 * <p><b>왜 GoogleLogin 컴포넌트인가</b>: useGoogleLogin 훅은 access_token 만 주는 implicit
 * flow 가 default. 우리 백엔드는 ID 토큰 검증이라 credential(=ID token) 을 직접 주는
 * GoogleLogin 컴포넌트가 fit.
 */
export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogleIdToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSuccess(idToken: string | undefined) {
    if (!idToken) {
      setError('Google 로그인 응답에 ID 토큰이 없습니다');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await loginWithGoogleIdToken(idToken);
      router.push('/');
    } catch (e) {
      console.error('[login] failed', e);
      setError('로그인 실패. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 text-center">
          Coinavi
        </h1>
        <p className="text-sm text-zinc-500 mb-8 text-center">
          거래소에 흩어진 자산을 한 곳에서.
        </p>

        <div className="flex flex-col items-center gap-4">
          <GoogleLogin
            onSuccess={(res) => handleSuccess(res.credential)}
            onError={() => setError('Google 로그인 실패')}
            useOneTap={false}
            theme="outline"
            size="large"
            locale="ko"
          />

          {busy && <p className="text-sm text-zinc-500">로그인 중...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <p className="text-xs text-zinc-400 mt-8 text-center">
          로그인 없이도 시세는 메인 페이지에서 볼 수 있습니다.
        </p>
      </div>
    </div>
  );
}
