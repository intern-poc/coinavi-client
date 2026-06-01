'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DisplayCurrency } from '@/lib/format';

/**
 * KRW / USD 통화 토글. URL ?currency=USD 로 상태 동기화.
 *
 * <p><b>왜 URL 동기화</b>: 새로고침 시 토글 상태 유지 + 다른 사람과 URL 공유 가능 +
 * SSR fetch 가 같은 쿼리 파라미터로 백엔드에 전달돼 일관됨. 페이지네이션과 동일 패턴.
 *
 * <p>기본값 KRW — 한국 사용자 우선. URL 에 currency 파라미터 없으면 KRW 로 간주.
 *
 * <p>SSE filter (coin-table) 는 KRW 모드에서 Upbit frame (currency='KRW'), USD 모드에서
 * Binance frame (currency='USDT', USDT≈USD) 만 적용. 이를 통해 거래소별 push 가
 * 토글 상태에 맞게 자연스럽게 갈라짐.
 */
export function CurrencyToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const current: DisplayCurrency =
    searchParams.get('currency')?.toUpperCase() === 'USD' ? 'USD' : 'KRW';

  function setCurrency(next: DisplayCurrency) {
    if (next === current) return;
    const params = new URLSearchParams(searchParams);
    if (next === 'KRW') {
      params.delete('currency');
    } else {
      params.set('currency', 'USD');
    }
    // 페이지 이동도 함께 0 으로 — 통화 전환 시 다른 페이지에 있던 게 어색.
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <ToggleButton
        active={current === 'KRW'}
        onClick={() => setCurrency('KRW')}
        label="₩ KRW"
      />
      <ToggleButton
        active={current === 'USD'}
        onClick={() => setCurrency('USD')}
        label="$ USD"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  const variant = active
    ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold'
    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs transition-colors ${variant}`}
    >
      {label}
    </button>
  );
}
