'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CoinChart, ChartRange } from '@/types/chart';
import { CHART_RANGES } from '@/types/chart';
import { formatPrice, type DisplayCurrency } from '@/lib/format';

/**
 * 단건 페이지 차트 — recharts LineChart + range 토글.
 *
 * <p>range 변경은 URL ?range=7d 갱신으로 서버 컴포넌트가 새 chart 를 fetch 해 다시 props 로
 * 내려주는 패턴 (시세 페이지의 currency 토글과 동일). client-only 차트 라이브러리는
 * 추후 lightweight-charts 등으로 교체 가능 — 외부 인터페이스는 {@link CoinChart} 만 사용.
 *
 * <p>빈 prices (placeholder 코인 또는 CoinGecko 일시 장애) 는 "데이터 없음" 영역 표시.
 *
 * <p>1차 범위에서 실시간 갱신 X — 시세 페이지 SSE 와 차트 갱신 통합은 후속 PR.
 */
export function CoinDetailChart({
  chart,
  range,
  currency,
}: {
  chart: CoinChart;
  range: ChartRange;
  currency: DisplayCurrency;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const data = useMemo(
    () =>
      chart.prices.map((p) => ({
        ts: Date.parse(p.timestamp),
        price: p.price,
      })),
    [chart.prices]
  );

  const isUp =
    data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const lineColor = isUp ? '#ef4444' : '#3b82f6';   // 한국 컨벤션: 상승 빨강 / 하락 파랑

  function setRange(next: ChartRange) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('range', next);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">가격 차트</h2>
        <div className="flex gap-1">
          {CHART_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                r === range
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-zinc-500">
            차트 데이터 없음
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <XAxis
                dataKey="ts"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts) => formatTick(ts, range)}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-zinc-500"
              />
              <YAxis
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v) => formatPrice(v, currency)}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                width={90}
                className="text-zinc-500"
              />
              <Tooltip
                labelFormatter={(ts) => formatFullTime(ts as number)}
                formatter={(v) => [formatPrice(typeof v === 'number' ? v : null, currency), '가격']}
                contentStyle={{
                  backgroundColor: 'rgb(24 24 27)',
                  border: '1px solid rgb(63 63 70)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'rgb(212 212 216)' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/**
 * X축 tick 포맷 — range 별 단위가 다르므로 분기.
 * 1d → 시:분, 7d/30d → 월/일, 1y → 월
 */
function formatTick(ts: number, range: ChartRange): string {
  const d = new Date(ts);
  if (range === '1d') {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  if (range === '1y') {
    return `${d.getFullYear() % 100}.${pad2(d.getMonth() + 1)}`;
  }
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

function formatFullTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}
