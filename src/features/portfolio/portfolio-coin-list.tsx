'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SLICE_COLORS } from './portfolio-pie-chart';
import {
  changeColor,
  formatPercent,
  formatPrice,
  type DisplayCurrency,
} from '@/lib/format';
import { EXCHANGE_LABELS } from '@/types/exchange-key';
import type { PortfolioCoinHolding } from '@/types/portfolio';

/**
 * 종목 리스트 — 색상 점 + 이미지/심볼 + 평가금액 + 비중. 도넛 차트 segment 색상과 일치.
 *
 * <p>코인이 *2개 이상 거래소* 에 분산돼 있으면 우측에 펼치기 버튼 노출 — 클릭 시
 * 거래소별 수량·평단·동기화 시각 분해 표시.
 *
 * <p>코인 이미지/심볼 영역만 Link (코인 상세 이동). 펼치기 버튼은 별도 — Link 안에 button
 * 중첩 X (HTML 위반).
 */
export function PortfolioCoinList({
  coins,
  currency,
}: {
  coins: PortfolioCoinHolding[];
  currency: DisplayCurrency;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(coinId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(coinId)) next.delete(coinId);
      else next.add(coinId);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {coins.map((c, idx) => {
        const color = SLICE_COLORS[idx % SLICE_COLORS.length];
        const canExpand = c.byExchange.length >= 2;
        const isExpanded = expanded.has(c.coinId);

        return (
          <div
            key={c.coinId}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <Link
                href={`/coins/${encodeURIComponent(c.symbol)}?currency=${currency}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
              >
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
              </Link>
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
              {canExpand && (
                <button
                  type="button"
                  onClick={() => toggle(c.coinId)}
                  aria-label={isExpanded ? '거래소 분해 접기' : '거래소 분해 펼치기'}
                  className="w-7 h-7 inline-flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                </button>
              )}
            </div>

            {canExpand && isExpanded && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 px-4 py-2 space-y-1">
                {c.byExchange.map((b) => (
                  <div
                    key={b.exchange}
                    className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300"
                  >
                    <span className="font-medium">{EXCHANGE_LABELS[b.exchange] ?? b.exchange}</span>
                    <span className="font-mono">
                      {b.quantity} {c.symbol}
                      {b.avgPrice != null && (
                        <span className="text-zinc-400 ml-2">
                          평단 {formatPrice(b.avgPrice, currency)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
