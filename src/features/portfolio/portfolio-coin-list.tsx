import Link from 'next/link';
import { SLICE_COLORS } from './portfolio-pie-chart';
import {
  changeColor,
  formatPercent,
  formatPrice,
  type DisplayCurrency,
} from '@/lib/format';
import type { PortfolioCoinHolding } from '@/types/portfolio';

/**
 * 종목 리스트 — 색상 점 + 이미지/심볼 + 평가금액 + 비중 + 손익. 도넛 차트 segment 색상과 일치.
 *
 * <p>거래소별 분해는 상단 거래소 탭으로 — 통합/거래소별 전환을 *상위에서* 해결하므로 행 펼치기 X.
 * 통합일 땐 거래소 분해 정보 안 보이고, 거래소 탭 선택 시엔 그 거래소 자산만 표시.
 */
export function PortfolioCoinList({
  coins,
  currency,
}: {
  coins: PortfolioCoinHolding[];
  currency: DisplayCurrency;
}) {
  return (
    <div className="space-y-3">
      {coins.map((c, idx) => {
        const color = SLICE_COLORS[idx % SLICE_COLORS.length];
        return (
          <Link
            key={c.coinId}
            href={`/coins/${encodeURIComponent(c.symbol)}?currency=${currency}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.imageUrl}
                alt={c.symbol}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {c.symbol}
              </div>
              <div className="text-sm text-zinc-500 font-mono">
                {c.weight == null ? '-' : formatPercent(c.weight).replace('+', '')}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                {c.valuation == null ? '-' : formatPrice(c.valuation, currency)}
              </div>
              {c.unrealizedPnl != null ? (
                <div className={`text-xs font-mono mt-0.5 ${changeColor(c.unrealizedPnl)}`}>
                  {c.unrealizedPnl > 0 ? '+' : ''}
                  {formatPrice(c.unrealizedPnl, currency)}
                  {c.unrealizedPnlPercent != null && (
                    <span className="ml-1">({formatPercent(c.unrealizedPnlPercent)})</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 mt-0.5">손익 정보 없음</div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
