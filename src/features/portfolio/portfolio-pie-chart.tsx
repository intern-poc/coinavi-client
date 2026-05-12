'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { PortfolioCoinHolding } from '@/types/portfolio';
import { formatPrice, type DisplayCurrency } from '@/lib/format';

/**
 * 포트폴리오 비중 도넛 차트 — recharts \`PieChart\` + hover interaction.
 *
 * <p>토스 스타일 도넛 (가운데 비워둠). 종목별 weight 로 segment 크기.
 *
 * <p><b>Hover 인터랙션</b>:
 * <ul>
 *   <li>hover 안 된 segment 들은 fillOpacity 0.4 로 흐려짐 → active segment 가 두드러짐</li>
 *   <li>도넛 중앙 빈 공간에 hover 종목의 심볼·평가금액·비중 표시</li>
 *   <li>hover 해제 시 중앙 비움 + 모든 segment opacity 1.0 복귀</li>
 * </ul>
 *
 * <p>recharts 3.x 에서 \`activeIndex\`/\`activeShape\` prop 이 타입에서 제거돼 segment 확대 대신
 * opacity 강조 채택. 시각적 효과는 비슷하면서 라이브러리 호환성 유지.
 */

export const SLICE_COLORS = [
  '#3b82f6',   // blue-500
  '#10b981',   // emerald-500
  '#f59e0b',   // amber-500
  '#ef4444',   // red-500
  '#8b5cf6',   // violet-500
  '#06b6d4',   // cyan-500
  '#ec4899',   // pink-500
  '#84cc16',   // lime-500
];

type Slice = {
  symbol: string;
  value: number;
  weight: number;
  color: string;
};

export function PortfolioPieChart({
  coins,
  currency,
}: {
  coins: PortfolioCoinHolding[];
  currency: DisplayCurrency;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data: Slice[] = coins
    .filter((c) => c.valuation != null && c.weight != null)
    .map((c, idx) => ({
      symbol: c.symbol,
      value: c.valuation as number,
      weight: c.weight as number,
      color: SLICE_COLORS[idx % SLICE_COLORS.length],
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        평가 가능한 종목이 없어요
      </div>
    );
  }

  const active = activeIndex != null && activeIndex < data.length ? data[activeIndex] : null;

  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="symbol"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.color}
                fillOpacity={activeIndex === null || activeIndex === idx ? 1 : 0.4}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* 도넛 중앙 정보 — hover 시만 노출 */}
      {active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {active.symbol}
            </div>
            <div className="text-base font-mono font-semibold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {formatPrice(active.value, currency)}
            </div>
            <div className="text-xs text-zinc-500 font-mono mt-0.5">
              {active.weight.toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

