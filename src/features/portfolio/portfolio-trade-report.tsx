'use client';

import { useEffect, useState } from 'react';
import { fetchTradeReport } from './api';
import { changeColor, formatLargePrice, formatPercent } from '@/lib/format';
import type { CoinRealizedPnl, TradeHighlight, TradeReport } from '@/types/portfolio';

/**
 * 매매 성과 — 청산된 거래 기반 실현 성과. 차트 토글 카드의 [매매성과] 뷰 콘텐츠.
 *
 * <p>구성: 3칸 스탯(실현손익·승률·평균보유) + 베스트/워스트 + 코인별 실현손익 막대.
 * 카드 wrapper 는 상위 {@link PortfolioChartView} 가 책임 — 여기선 내부 콘텐츠만.
 *
 * <p>금액 KRW 고정 (서버가 Upbit·Bithumb 만 집계, 둘 다 KRW). 청산 거래 없으면 빈 상태 안내.
 */
export function PortfolioTradeReport() {
  const [report, setReport] = useState<TradeReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchTradeReport()
      .then(setReport)
      .catch((e) => setLoadError(e instanceof Error ? e.message : '매매 성과 조회 실패'));
  }, []);

  if (loadError) return <Centered>매매 성과를 불러오지 못했어요.</Centered>;
  if (report === null) return <Centered>불러오는 중...</Centered>;
  if (report.tradeCount === 0) {
    return <Centered>아직 청산된 거래가 없어요. 매도가 발생하면 매매 성과가 집계됩니다.</Centered>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        <Stat
          label="실현손익"
          value={signedLarge(report.totalRealizedPnl)}
          sub={formatPercent(report.totalRealizedPnlPercent)}
          valueClass={changeColor(report.totalRealizedPnl)}
          subClass={changeColor(report.totalRealizedPnlPercent)}
        />
        <Stat
          label="승률"
          value={`${report.winRate}%`}
          sub={`${report.winCount}승 ${report.lossCount}패`}
        />
        <Stat label="평균 보유" value={`${report.avgHoldingDays}일`} />
      </div>

      {(report.bestTrade || report.worstTrade) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs">
          {report.bestTrade && <Highlight emoji="🏆" label="베스트" trade={report.bestTrade} />}
          {report.worstTrade && <Highlight emoji="💀" label="워스트" trade={report.worstTrade} />}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 mb-2">코인별 실현손익</p>
        <CoinBars coins={report.byCoin} />
      </div>
    </div>
  );
}

function CoinBars({ coins }: { coins: CoinRealizedPnl[] }) {
  // 막대 길이는 |실현손익| 의 상대 비율 — 가장 큰 절댓값이 100%.
  const maxAbs = Math.max(...coins.map((c) => Math.abs(c.realizedPnl)), 1);
  return (
    <div className="space-y-1.5">
      {coins.map((c) => {
        const widthPct = (Math.abs(c.realizedPnl) / maxAbs) * 100;
        const positive = c.realizedPnl >= 0;
        return (
          <div key={c.coinSymbol} className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0 font-medium text-zinc-700 dark:text-zinc-200">
              {c.coinSymbol}
            </span>
            <div className="flex-1 h-4">
              <div
                className={`h-full rounded ${
                  positive ? 'bg-red-400/70 dark:bg-red-500/60' : 'bg-blue-400/70 dark:bg-blue-500/60'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className={`w-24 shrink-0 text-right tabular-nums ${changeColor(c.realizedPnl)}`}>
              {signedLarge(c.realizedPnl)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  valueClass = 'text-zinc-900 dark:text-zinc-50',
  subClass = 'text-zinc-400',
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  subClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className={`text-xs tabular-nums ${subClass}`}>{sub}</p>}
    </div>
  );
}

function Highlight({ emoji, label, trade }: { emoji: string; label: string; trade: TradeHighlight }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-zinc-400">{emoji} {label}</span>
      <span className="font-medium text-zinc-700 dark:text-zinc-200">{trade.coinSymbol}</span>
      <span className={`tabular-nums ${changeColor(trade.realizedPnl)}`}>
        {signedLarge(trade.realizedPnl)} ({formatPercent(trade.realizedPnlPercent)})
      </span>
      <span className="text-zinc-400">· {trade.holdingDays}일</span>
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-48 flex items-center justify-center text-center text-sm text-zinc-500 px-4">
      {children}
    </div>
  );
}

/**
 * 부호 포함 압축 금액 — formatLargePrice 가 음수를 압축 안 하므로 절댓값에 부호를 직접 붙임.
 * 예: 1240000 → "+124만원", -180000 → "-18만원".
 */
function signedLarge(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return sign + formatLargePrice(Math.abs(value), 'KRW');
}
