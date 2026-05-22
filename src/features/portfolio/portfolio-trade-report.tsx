'use client';

import { useEffect, useState } from 'react';
import { fetchTradeReport } from './api';
import { changeColor, formatLargePrice, formatPercent } from '@/lib/format';
import type { TradeHighlight, TradeReport } from '@/types/portfolio';

/**
 * 매매 성과 리포트 — 청산된 거래 기반 실현 성과 요약 스트립.
 *
 * <p><b>표시 조건</b>: 청산(매도)된 거래가 있을 때만. 거래 짝 0건이면 렌더 안 함 (null) —
 * 빈 카드로 화면 어수선하게 안 만듦. "전체" 탭에서만 노출 (계정 전체 집계라 거래소 필터 무관).
 *
 * <p>가로 4칸 스탯(실현손익·승률·평균보유·손익비) + 베스트/워스트 하이라이트. 모바일은 2칸.
 *
 * <p>금액 KRW 고정 — 서버가 KRW 로 집계 (Upbit·Bithumb 만, 둘 다 KRW).
 */
export function PortfolioTradeReport() {
  const [report, setReport] = useState<TradeReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchTradeReport()
      .then(setReport)
      .catch((e) => setLoadError(e instanceof Error ? e.message : '매매 성과 조회 실패'));
  }, []);

  // 조회 실패는 조용히 숨김 — 부가 정보라 메인 흐름 방해 안 함.
  if (loadError || report === null || report.tradeCount === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">📊 매매 성과</h2>
        <span className="text-xs text-zinc-400">실현 기준 · {report.tradeCount}건</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
        <Stat
          label="손익비"
          value={report.profitLossRatio == null ? '—' : `${report.profitLossRatio}`}
          sub={report.profitLossRatio == null ? '이익·손실 필요' : '이익 ÷ 손실'}
        />
      </div>

      {(report.bestTrade || report.worstTrade) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {report.bestTrade && <Highlight emoji="🏆" label="베스트" trade={report.bestTrade} />}
          {report.worstTrade && <Highlight emoji="💀" label="워스트" trade={report.worstTrade} />}
        </div>
      )}
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

/**
 * 부호 포함 압축 금액 — formatLargePrice 가 음수를 압축 안 하므로 절댓값에 부호를 직접 붙임.
 * 예: 1240000 → "+124만원", -180000 → "-18만원".
 */
function signedLarge(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return sign + formatLargePrice(Math.abs(value), 'KRW');
}
