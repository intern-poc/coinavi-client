import Link from 'next/link';

/**
 * 보유 자산이 없는 사용자에게 노출 — 거래소 API 키 등록부터 유도.
 *
 * <p>API 키 등록 → \`POST /refresh\` 자동 트리거 (UX 자연스러움) 는 후속.
 * 1차에선 사용자가 직접 키 등록 후 portfolio 페이지에서 새로고침 버튼 누르는 흐름.
 */
export function PortfolioEmpty() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
      <p className="text-zinc-700 dark:text-zinc-300 mb-2 font-medium">
        아직 등록된 자산이 없어요
      </p>
      <p className="text-sm text-zinc-500 mb-6">
        거래소 API 키를 먼저 등록하면 자산이 자동으로 통합됩니다.
      </p>
      <Link
        href="/exchange-keys"
        className="inline-block px-5 py-2.5 rounded-md bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        거래소 API 키 등록하기
      </Link>
    </div>
  );
}
