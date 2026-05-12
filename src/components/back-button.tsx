'use client';

import { useRouter } from 'next/navigation';

/**
 * 뒤로가기 버튼 — 브라우저 history 가 있으면 \`router.back()\`, 없으면 \`fallback\` URL 로.
 *
 * <p>history.length 1 인 경우 (새 탭 직접 진입·북마크 클릭 등) router.back() 이 빈 동작이라
 * 사용자가 갇히는 느낌. fallback 으로 안전한 시작점 제공. 단건 페이지처럼 currency 모드 유지하고
 * 싶을 땐 fallback 에 쿼리 포함해서 전달.
 */
export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="뒤로가기"
      className="inline-flex items-center text-xl font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
    >
      ←
    </button>
  );
}
