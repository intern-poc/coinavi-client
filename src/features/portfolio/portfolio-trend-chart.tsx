'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { changeColor, formatLargePrice, formatPercent } from '@/lib/format';
import type { PortfolioSnapshot, SnapshotRange } from '@/types/portfolio';

const MY_COLOR = '#0ea5e9';   // sky — 내 자산
const BTC_COLOR = '#f59e0b';  // amber — BTC 단순보유

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

  // 원금 = 최근(오늘) 스냅샷의 평가액 − 평가손익. 오늘 점은 실제 손익이라 정확
  // (백필 과거점은 손익 0이라 제외 — 맨 끝 점만 사용). 현재 보유 기준 단일 값이라 range 무관.
  const principal =
    snapshots && snapshots.length > 0
      ? snapshots[snapshots.length - 1].totalValue - snapshots[snapshots.length - 1].totalPnl
      : null;

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs text-zinc-500">통합 자산 추이 (KRW)</span>
          {principal != null && (
            <p className="text-xs text-zinc-400 mt-0.5">
              원금: <span className="tabular-nums">{formatLargePrice(principal, 'KRW')}</span>
            </p>
          )}
        </div>
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
          <BenchmarkSummary data={snapshots} />
          <Chart data={snapshots} range={range} />
          {snapshots.length === 1 ? (
            <p className="text-xs text-zinc-500 mt-2 text-center">
              📍 오늘의 기록 1점. 매일 방문하면 추이 선이 그려집니다.
            </p>
          ) : (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 text-center leading-relaxed">
              과거 데이터는 최근 1년 거래내역과 일별 시세로 추정한 값이에요.
              외부 지갑 입출금은 반영되지 않아요.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Chart({ data, range }: { data: PortfolioSnapshot[]; range: SnapshotRange }) {
  // 1년 범위는 월별 점으로 집계 — 각 월의 *마지막 날* 값 (월말 평가액). 365점 → ~12점.
  // 1주/1개월은 일별 그대로 (점 개수 적당, 사용자가 일별 변화 보고 싶어함).
  const displayData = useMemo(() => {
    if (range !== '1y') return data;
    const byMonth = new Map<string, PortfolioSnapshot>();
    for (const s of data) {
      // 같은 월키에 대해 뒤(=더 늦은 날) 값이 덮어쓰기 → 결과적으로 월의 마지막 데이터.
      byMonth.set(s.date.slice(0, 7), s);
    }
    return Array.from(byMonth.values());
  }, [range, data]);

  // 점 1개일 땐 dot 강조 (line 안 그려지므로) — 사용자가 "차트 안 보임" 느끼지 않게.
  const showDot = displayData.length === 1;
  // BTC 벤치마크 값이 하나라도 있으면 점선 라인 노출.
  const hasBtc = displayData.some((d) => d.btcHodlValue != null);

  const formatXTick = (d: string): string => {
    if (range !== '1y') return d.slice(5); // 'MM-DD'
    const year = d.slice(0, 4);
    const month = parseInt(d.slice(5, 7), 10);
    // 1월(연도 경계) + 데이터 시작점에만 연도 같이 — 나머지는 "5월" 식으로 간결.
    const isFirst = displayData[0]?.date === d;
    if (month === 1 || isFirst) {
      return `'${year.slice(2)} ${month}월`;
    }
    return `${month}월`;
  };

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXTick}
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
            formatter={(v, name) => [formatLargePrice(Number(v), 'KRW'), name]}
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
            name="내 자산"
            stroke={MY_COLOR}
            strokeWidth={2}
            fill="url(#trendGradient)"
            dot={showDot ? { r: 5, fill: MY_COLOR } : false}
          />
          {hasBtc && (
            <Area
              type="monotone"
              dataKey="btcHodlValue"
              name="BTC 보유 시"
              stroke={BTC_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
              dot={false}
              connectNulls
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * vs BTC 단순보유 비교 요약 — 차트 위 범례 + 수익률. 첫↔마지막 스냅샷으로 계산.
 * BTC 값 없으면 (시세 미수신) 렌더 안 함.
 */
function BenchmarkSummary({ data }: { data: PortfolioSnapshot[] }) {
  const withBtc = data.filter((d) => d.btcHodlValue != null);
  if (data.length < 2 || withBtc.length < 2) return null;

  const myLast = data[data.length - 1].totalValue;
  const btcLast = withBtc[withBtc.length - 1].btcHodlValue as number;
  const myReturn = pctChange(data[0].totalValue, myLast);
  const btcReturn = pctChange(withBtc[0].btcHodlValue as number, btcLast);
  if (myReturn == null || btcReturn == null) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-xs">
      <Legend color={MY_COLOR} label="내 자산" amount={myLast} value={myReturn} solid />
      <Legend color={BTC_COLOR} label="BTC 보유 시" amount={btcLast} value={btcReturn} solid={false} />
    </div>
  );
}

function Legend({
  color,
  label,
  amount,
  value,
  solid,
}: {
  color: string;
  label: string;
  amount: number;
  value: number;
  solid: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-4 h-0"
        style={{
          borderTop: `2px ${solid ? 'solid' : 'dashed'} ${color}`,
        }}
      />
      <span className="text-zinc-500">{label}</span>
      <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-200">
        {formatLargePrice(amount, 'KRW')}
      </span>
      <span className={`tabular-nums ${changeColor(value)}`}>({formatPercent(value)})</span>
    </span>
  );
}

function pctChange(from: number, to: number): number | null {
  if (from === 0) return null;
  return ((to - from) / from) * 100;
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

