'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';

/**
 * 회원 탈퇴 확인 모달.
 *
 * <p>되돌릴 수 없는 액션이라 명시적 확인 단계를 둔다. 확인 시 {@code withdraw()} 호출
 * → 성공하면 홈으로 리다이렉트, 실패하면 모달 안에 에러를 표시하고 로그인 상태는 유지한다.
 */
export function WithdrawConfirmModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { withdraw } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await withdraw();
      onClose();
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">회원 탈퇴</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          정말 탈퇴하시겠어요? 개인정보는 즉시 삭제되며 <b>복구할 수 없습니다.</b>
          <br />
          연결된 거래소 API 키도 함께 삭제됩니다.
          <br />
          <span className="text-zinc-400 dark:text-zinc-500">
            (거래 기록은 법적 보존 의무에 따라 비식별 처리되어 일정 기간 보관됩니다.)
          </span>
        </p>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? '처리 중…' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
