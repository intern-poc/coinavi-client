'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/use-auth';
import { WithdrawConfirmModal } from '@/features/auth/withdraw-confirm-modal';
import { ThemeToggle } from './theme-toggle';

/**
 * 전역 상단 헤더. 인증 상태에 따라 메뉴 변경.
 *
 * <p>'use client' — useAuth 훅 + 메뉴 state 위해 Client Component.
 *
 * <p>레이아웃 분기:
 * <ul>
 *   <li><b>sm 이상 (데스크탑)</b>: 포트폴리오 링크 + 유저 이름 드롭다운(로그아웃·회원 탈퇴)</li>
 *   <li><b>sm 미만 (모바일)</b>: 햄버거 버튼, 클릭 시 헤더 아래 드롭다운(탈퇴 포함) 펼침</li>
 * </ul>
 *
 * <p>회원 탈퇴는 되돌릴 수 없어 {@link WithdrawConfirmModal} 확인 단계를 거친다.
 */
export function Header() {
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false); // 모바일 햄버거
  const [userMenuOpen, setUserMenuOpen] = useState(false); // 데스크탑 유저 드롭다운
  const [withdrawOpen, setWithdrawOpen] = useState(false); // 탈퇴 확인 모달

  const closeMenu = () => setOpen(false);
  const closeUserMenu = () => setUserMenuOpen(false);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link
          href="/"
          onClick={closeMenu}
          className="text-xl font-bold text-zinc-900 dark:text-zinc-50 hover:opacity-80 transition-opacity"
        >
          Coinavi
        </Link>

        {/* 데스크탑 메뉴 — sm 이상 */}
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          {status === 'loading' && (
            <span className="px-3 py-2 text-zinc-400 dark:text-zinc-500">...</span>
          )}

          {status === 'authenticated' && (
            <>
              <Link
                href="/portfolio"
                className="px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              >
                포트폴리오
              </Link>

              {user && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-1 px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <span>
                      <span className="font-medium">{user.name}</span>님
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <>
                      {/* 바깥 클릭 시 닫기용 투명 백드롭 */}
                      <button
                        type="button"
                        aria-hidden
                        tabIndex={-1}
                        onClick={closeUserMenu}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                      <div
                        role="menu"
                        className="absolute right-0 mt-1 z-20 w-40 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            closeUserMenu();
                            logout();
                          }}
                          className="w-full px-3 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          로그아웃
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            closeUserMenu();
                            setWithdrawOpen(true);
                          }}
                          className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          회원 탈퇴
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
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

        {/* 모바일 — 햄버거 + ThemeToggle */}
        <div className="flex sm:hidden items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={open}
            className="p-2 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              {open ? (
                <path d="M6 18 18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 — open 일 때만 */}
      {open && (
        <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <nav className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1 text-sm">
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
                  onClick={closeMenu}
                  className="px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  포트폴리오
                </Link>
                <button
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="px-3 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  로그아웃
                </button>
                <button
                  onClick={() => {
                    closeMenu();
                    setWithdrawOpen(true);
                  }}
                  className="px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                >
                  회원 탈퇴
                </button>
              </>
            )}

            {status === 'unauthenticated' && (
              <Link
                href="/login"
                onClick={closeMenu}
                className="px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      )}

      <WithdrawConfirmModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </header>
  );
}
