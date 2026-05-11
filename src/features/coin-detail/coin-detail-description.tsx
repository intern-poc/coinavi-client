import type { CoinDetail } from '@/types/coin';

/**
 * 단건 페이지 코인 설명. CoinGecko {@code description.ko} 우선, 없으면 en.
 *
 * <p>plain text 처리 — CoinGecko 가 HTML 링크 등 마크업을 포함할 수 있지만 dangerouslySetInnerHTML
 * 은 XSS 위험이라 1차에선 텍스트만. 마크업 렌더링은 후속 PR (sanitize-html 도입 후).
 *
 * <p>장문은 더 보기/접기 토글이 자연스럽지만 1차에선 max-h + overflow-y-auto 로 충분.
 */
export function CoinDetailDescription({ coin }: { coin: CoinDetail }) {
  if (!coin.description || coin.description.trim().length === 0) {
    return null;
  }

  // CoinGecko 가 가끔 HTML 태그 (<a>) 를 그대로 보냄 — 1차 단순 strip
  const text = coin.description.replace(/<[^>]+>/g, '').trim();

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
        {coin.name ?? coin.symbol} 소개
      </h2>
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line max-h-64 overflow-y-auto">
        {text}
      </p>
    </div>
  );
}
