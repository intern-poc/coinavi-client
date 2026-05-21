'use client';

import { useState } from 'react';
import { PortfolioPieChart } from './portfolio-pie-chart';
import { PortfolioTrendChart } from './portfolio-trend-chart';
import type { DisplayCurrency } from '@/lib/format';
import type { PortfolioCoinHolding } from '@/types/portfolio';

/**
 * 도넛(비중) ↔ 추이 토글 카드. "전체" 거래소 탭에서만 사용.
 *
 * <p>거래소별 추이는 snapshot 데이터가 거래소별 분해돼 있어야 하는데 (Phase 1 은 통합만 저장)
 * 빗썸/업비트 탭에서는 토글 자체를 노출 안 함 — portfolio-client 가 PieChart 만 직접 렌더.
 *
 * <p>두 컴포넌트(PieChart/TrendChart) 의 카드 wrapper 는 제거하고 이 view 가 단일 카드 책임 —
 * 토글 + 선택된 차트 한 영역.
 */
type ChartView = 'donut' | 'trend';

export function PortfolioChartView({
  coins,
  currency,
}: {
  coins: PortfolioCoinHolding[];
  currency: DisplayCurrency;
}) {
  const [view, setView] = useState<ChartView>('donut');

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <ChartToggle selected={view} onSelect={setView} />
      </div>

      {view === 'donut' ? (
        <PortfolioPieChart coins={coins} currency={currency} />
      ) : (
        <PortfolioTrendChart />
      )}
    </div>
  );
}

function ChartToggle({
  selected,
  onSelect,
}: {
  selected: ChartView;
  onSelect: (v: ChartView) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <ToggleButton active={selected === 'donut'} onClick={() => onSelect('donut')}>
        도넛
      </ToggleButton>
      <ToggleButton active={selected === 'trend'} onClick={() => onSelect('trend')}>
        추이
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
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
