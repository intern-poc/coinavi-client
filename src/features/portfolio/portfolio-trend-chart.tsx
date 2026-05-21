'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchPortfolioSnapshots } from './api';
import { formatLargePrice } from '@/lib/format';
import type { PortfolioSnapshot, SnapshotRange } from '@/types/portfolio';

/**
 * 자산 추이 차트 — 도입 이후 사용자가 방문한 날들의 KRW 평가액 시계열.
 *
 * <p><b>Phase 1 한계</b>: 도입 이후 누적만 — 등록 직후엔 점 1개. 사용자가 매일 방문해야 채워짐.
 * 과거 데이터는 Phase 2 (trades 역산 백필) 에서.
 *
 * <p>금액 단위 KRW 고정. 차트 우상단 통화 토글은 Phase 2+.
 */
const RANGES: { code: SnapshotRange; label: string }[] = [
  { code: '1w', label: '1주' },
  { code: '1m', label: '1개월' },
  { code: '1y', label: '1년' },
];

export function PortfolioTrendChart() {
  const [range, setRange] = useState<SnapshotRange>('1m');
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    fetchPortfolioSnapshots(range)
      .then(setSnapshots)
      .catch((e) => setLoadError(e instanceof Error ? e.message : '추이 조회 실패'));
  }, [range]);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          자산 추이
          <span className="ml-2 text-xs font-normal text-zinc-500">(KRW)</span>
        </h3>
        <RangeTabs selected={range} onSelect={setRange} />
      </div>

      {loadError && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded mb-2">
          {loadError}
        </div>
      )}

      {snapshots === null ? (
        <div className="h-56 flex items-center justify-center text-sm text-zinc-500">
          불러오는 중...
        </div>
      ) : snapshots.length === 0 ? (
        <EmptyState />
      ) : snapshots.length === 1 ? (
        <SinglePointHint snapshot={snapshots[0]} />
      ) : (
        <Chart data={snapshots} />
      )}
    </div>
  );
}

function Chart({ data }: { data: PortfolioSnapshot[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => d.slice(5)}  // 'MM-DD'
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.4}
          />
          <YAxis
            tickFormatter={(v) => formatLargePrice(v, 'KRW')}
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.4}
            width={70}
          />
          <Tooltip
            formatter={(v) => [formatLargePrice(Number(v), 'KRW'), '평가액']}
            labelFormatter={(d) => String(d)}
            contentStyle={{
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
            }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Area
            type="monotone"
            dataKey="totalValue"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#trendGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RangeTabs({
  selected,
  onSelect,
}: {
  selected: SnapshotRange;
  onSelect: (r: SnapshotRange) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {RANGES.map((r) => (
        <button
          key={r.code}
          type="button"
          onClick={() => onSelect(r.code)}
          className={`px-2.5 py-1 text-xs ${
            selected === r.code
              ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-56 flex flex-col items-center justify-center text-center text-sm text-zinc-500 gap-1">
      <p>아직 추이 데이터가 없어요.</p>
      <p className="text-xs">포트폴리오를 방문할 때마다 매일 한 점씩 기록됩니다.</p>
    </div>
  );
}

function SinglePointHint({ snapshot }: { snapshot: PortfolioSnapshot }) {
  return (
    <div className="h-56 flex flex-col items-center justify-center text-center text-sm text-zinc-500 gap-2">
      <p>
        <span className="font-mono text-zinc-700 dark:text-zinc-200">
          {formatLargePrice(snapshot.totalValue, 'KRW')}
        </span>{' '}
        — {snapshot.date}
      </p>
      <p className="text-xs">
        추이 차트는 점이 2개 이상부터 표시됩니다. 내일 다시 방문하면 선 그래프로 보여요.
      </p>
    </div>
  );
}
