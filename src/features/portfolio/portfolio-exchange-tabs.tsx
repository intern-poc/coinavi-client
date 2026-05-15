'use client';

import type { ExchangeFilter } from './portfolio-filter';
import { EXCHANGE_LABELS } from '@/types/exchange-key';
import type { PortfolioExchangeSummary } from '@/types/portfolio';

/**
 * 포트폴리오 상단 거래소 탭 — "전체 / 업비트 / 빗썸 / ..." (실제 보유 거래소만 노출).
 *
 * <p>거래소 1개 이하면 탭 자체 hide (의미 없음).
 */
export function PortfolioExchangeTabs({
  exchanges,
  selected,
  onSelect,
}: {
  exchanges: PortfolioExchangeSummary[];
  selected: ExchangeFilter;
  onSelect: (filter: ExchangeFilter) => void;
}) {
  if (exchanges.length <= 1) return null;

  return (
    <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <TabButton active={selected === 'ALL'} onClick={() => onSelect('ALL')}>
        전체
      </TabButton>
      {exchanges.map((e) => (
        <TabButton
          key={e.code}
          active={selected === e.code}
          onClick={() => onSelect(e.code)}
        >
          {EXCHANGE_LABELS[e.code]}
        </TabButton>
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const variant = active
    ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold'
    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800';
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 text-xs ${variant}`}>
      {children}
    </button>
  );
}
