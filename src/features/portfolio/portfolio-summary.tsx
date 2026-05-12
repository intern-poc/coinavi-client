import { formatPrice, type DisplayCurrency } from '@/lib/format';

/**
 * 포트폴리오 hero — 총 평가금액. 토스 스타일 큰 숫자.
 */
export function PortfolioSummary({
  totalValuation,
  currency,
}: {
  totalValuation: number;
  currency: DisplayCurrency;
}) {
  return (
    <div>
      <div className="text-sm text-zinc-500">총 금액</div>
      <div className="text-3xl sm:text-4xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
        {formatPrice(totalValuation, currency)}
      </div>
    </div>
  );
}
