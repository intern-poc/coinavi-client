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
 * 자산 추이 차트 — 사용자의 KRW 평가액 시계열.
 *
 * <p><b>데이터 구성</b>:
 * <ul>
 *   <li>오늘·미래 진입일 — 그날 실제 평가액 (정확)</li>
 *   <li>과거 365일 (첫 진입 시 자동 백필) — 거래내역 역산 + CoinGecko 일별 가격 (추정값)</li>
 * </ul>
 * 외부 입출금/거래소 API 한도 이전 거래 누락 시 과거값이 부정확할 수 있어 작은 안내 노출.
 *
 * <p>금액 단위 KRW 고정. 통화 토글은 Phase 3+.
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
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-zinc-500">통합 자산 추이 (KRW)</span>
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
      ) : (
        <>
          <Chart data={snapshots} />
          {snapshots.length === 1 ? (
            <p className="text-xs text-zinc-500 mt-2 text-center">
              📍 오늘의 기록 1점. 매일 방문하면 추이 선이 그려집니다.
            </p>
          ) : (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 text-center leading-relaxed">
              과거 데이터는 거래내역과 일별 시세로 추정한 값이에요.
              외부 입출금이 있거나 거래소 조회 한도(업비트 1년) 이전 거래는 반영되지 않을 수 있어요.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Chart({ data }: { data: PortfolioSnapshot[] }) {
  // 점 1개일 땐 dot 강조 (line 안 그려지므로) — 사용자가 "차트 안 보임" 느끼지 않게.
  const showDot = data.length === 1;
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
            dot={showDot ? { r: 5, fill: '#0ea5e9' } : false}
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
      <p className="text-xs">거래소 키를 등록하면 자동으로 추이가 채워집니다.</p>
    </div>
  );
}

