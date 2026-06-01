import {
  changeColor,
  formatPercent,
  formatPrice,
  type DisplayCurrency,
} from '@/lib/format';

/**
 * 포트폴리오 hero — 총 평가금액 + 손익 한 줄. 토스 스타일.
 *
 * <p>손익 색상은 한국 거래소 컨벤션 (양수 빨강·음수 파랑). 부호는 양수에 명시적 + 부착.
 * cost 0 이라 pnlPercent null 일 땐 금액만 표시.
 */
export function PortfolioSummary({
  title,
  totalValuation,
  totalUnrealizedPnl,
  totalUnrealizedPnlPercent,
  currency,
}: {
  title: string;
  totalValuation: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number | null;
  currency: DisplayCurrency;
}) {
  const pnlSign = totalUnrealizedPnl > 0 ? '+' : '';
  return (
    <div>
      <div className="text-sm text-zinc-500">{title}</div>
      <div className="text-3xl sm:text-4xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
        {formatPrice(totalValuation, currency)}
      </div>
      <div className={`text-sm font-mono mt-1 ${changeColor(totalUnrealizedPnl)}`}>
        {pnlSign}
        {formatPrice(totalUnrealizedPnl, currency)}
        {totalUnrealizedPnlPercent != null && (
          <span className="ml-1">({formatPercent(totalUnrealizedPnlPercent)})</span>
        )}
      </div>
    </div>
  );
}
