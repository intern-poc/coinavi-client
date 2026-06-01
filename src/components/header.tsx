'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/use-auth';
import { ThemeToggle } from './theme-toggle';

/**
 * 전역 상단 헤더. 인증 상태에 따라 메뉴 변경.
 *
 * <p>'use client' — useAuth 훅 사용 위해 Client Component. 그래도 layout 의 Server 성격은
 * 유지 (이 컴포넌트만 client).
 */
export function Header() {
  const { status, user, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-zinc-900 dark:text-zinc-50 hover:opacity-80 transition-opacity"
        >
          Coinavi
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {status === 'loading' && (
            <span className="px-3 py-2 text-zinc-400 dark:text-zinc-500">...</span>
          )}

          {status === 'authenticated' && (
            <>
              {user && (
                <span className="px-3 py-2 text-zinc-700 dark:text-zinc-200">
                  <span className="font-medium">{user.name}</span>님
                </span>
              )}
              <Link
                href="/portfolio"
                className="px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              >
                포트폴리오
              </Link>
              <button
                onClick={logout}
                className="px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              >
                로그아웃
              </button>
            </>
          )}

          {status === 'unauthenticated' && (
            <Link
              href="/login"
              className="px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              로그인
            </Link>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
