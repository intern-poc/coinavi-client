'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { PortfolioCoinHolding } from '@/types/portfolio';

/**
 * 포트폴리오 비중 도넛 차트 — recharts \`PieChart\`.
 *
 * <p>토스 스타일 도넛 (가운데 비워둠). 종목별 weight 로 segment 크기. valuation null 인 종목
 * (시세 누락) 은 segment 에서 제외 — 백엔드에서 이미 totalValuation 합산 시 빠짐.
 *
 * <p>색상은 인덱스 기반 cycle — 종목 N 개 넘어가도 색상 부족 X.
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

export function PortfolioPieChart({ coins }: { coins: PortfolioCoinHolding[] }) {
  const data = coins
    .filter((c) => c.valuation != null && c.weight != null)
    .map((c, idx) => ({
      name: c.symbol,
      value: c.valuation as number,
      color: SLICE_COLORS[idx % SLICE_COLORS.length],
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        평가 가능한 종목이 없어요
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
