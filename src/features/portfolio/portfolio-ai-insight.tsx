'use client';

import { useState } from 'react';
import { fetchInsightComment, fetchInsightFacts } from './api';
import type { InsightComment, InsightFacts } from '@/types/portfolio';

/**
 * AI 분석 — 포트폴리오 상단 버튼 → 모달. 상단에 Gemini 코멘트(hero), 아래에 근거 facts.
 *
 * <p>코멘트는 서버에서 7일 캐시되므로 모달 열 때 1회 fetch (새로고침 스팸 없음).
 * "다시 생성"은 {@code refresh=true}로 캐시 무시하고 재생성.
 */
export function PortfolioAiInsight() {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState<InsightComment | null>(null);
  const [facts, setFacts] = useState<InsightFacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  function openModal() {
    setOpen(true);
    if (!loadedOnce) void loadInitial();
  }

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [c, f] = await Promise.all([fetchInsightComment(false), fetchInsightFacts()]);
      setComment(c);
      setFacts(f);
      setLoadedOnce(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 분석을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    setError(null);
    try {
      setComment(await fetchInsightComment(true)); // 캐시 무시 재생성. facts는 그대로
    } catch (e) {
      setError(e instanceof Error ? e.message : '재생성하지 못했어요.');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        🤖 AI 분석
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">🤖 AI 분석</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-lg leading-none"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded mb-3">
                {error}
              </p>
            )}

            {loading ? (
              <p className="text-sm text-zinc-500 py-6 text-center">AI가 포트폴리오를 분석 중...</p>
            ) : (
              <>
                {/* 코멘트 (hero) */}
                {comment && (
                  <div className="rounded-md bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 p-3 mb-4">
                    <p
                      className={`text-sm leading-relaxed ${
                        comment.available ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 italic'
                      }`}
                    >
                      {comment.comment}
                    </p>
                  </div>
                )}

                {/* 근거 facts */}
                {facts?.hasData && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <p className="text-xs text-zinc-500 mb-2">분석 근거</p>
                    <div className="space-y-2 text-xs">
                      {facts.concentration && (
                        <FactRow title="종목 집중도" flag={facts.concentration.flag}>
                          최대 비중 <b>{facts.concentration.topCoin ?? '-'}</b> {fmtPct(facts.concentration.topWeight)}
                          {' · '}보유 {facts.concentration.coinCount}종목
                        </FactRow>
                      )}
                      {facts.sector && (
                        <FactRow title="섹터 집중도" flag={facts.sector.flag}>
                          {facts.sector.topCategory ? (
                            <>
                              <b>{facts.sector.topCategory}</b> {fmtPct(facts.sector.topWeight)}
                            </>
                          ) : (
                            <span className="text-zinc-500">카테고리 데이터 부족</span>
                          )}
                        </FactRow>
                      )}
                      {facts.behavior && (
                        <FactRow title="매매 행동" flag={facts.behavior.flag}>
                          승률 {fmtPct(facts.behavior.winRate)} ({facts.behavior.winCount}승 {facts.behavior.lossCount}패)
                          {facts.behavior.profitLossRatio != null && (
                            <>{' · '}손익비 {facts.behavior.profitLossRatio}</>
                          )}
                          {' · '}평균 {facts.behavior.avgHoldDays}일
                        </FactRow>
                      )}
                      {facts.contribution && (
                        <FactRow title="수익 기여" flag={facts.contribution.flag}>
                          {facts.contribution.topGainCoin ? (
                            <>
                              실현이익 <b>{facts.contribution.topGainCoin}</b> {fmtPct(facts.contribution.topGainShare)}
                              {' · '}{facts.contribution.tradedCoinCount}종목 매매
                            </>
                          ) : (
                            <span className="text-zinc-500">실현이익 없음 · {facts.contribution.tradedCoinCount}종목 매매</span>
                          )}
                        </FactRow>
                      )}
                    </div>
                  </div>
                )}

                <RegenerateButton comment={comment} regenerating={regenerating} onClick={regenerate} />
                <p className="text-[11px] text-zinc-400 mt-2 text-center">
                  분석은 주 1회 갱신돼요. 거래내역과 일별 시세 기반 추정이에요.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 다시 생성 버튼 — 생성 후 7일간 비활성(연타·비용 폭탄 방지), 7일 지나면 재활성.
 * 생성 실패(available=false)는 재시도 허용 (캐시 안 됐으니).
 */
function RegenerateButton({
  comment,
  regenerating,
  onClick,
}: {
  comment: InsightComment | null;
  regenerating: boolean;
  onClick: () => void;
}) {
  const REFRESH_DAYS = 7;
  const daysSince =
    comment?.generatedAt != null
      ? (Date.now() - new Date(comment.generatedAt).getTime()) / 86_400_000
      : Infinity;
  const failed = comment != null && !comment.available;
  const refreshAvailable = comment == null || failed || daysSince >= REFRESH_DAYS;
  const daysLeft = Math.max(1, Math.ceil(REFRESH_DAYS - daysSince));

  let label: string;
  if (regenerating) label = '다시 생성 중...';
  else if (failed) label = '🔄 다시 시도';
  else if (refreshAvailable) label = '🔄 다시 생성';
  else label = `주 1회 갱신 · ${daysLeft}일 후 다시 생성 가능`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={regenerating || !refreshAvailable}
      className="mt-4 w-full px-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 enabled:hover:bg-zinc-100 dark:enabled:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

function FactRow({ title, flag, children }: { title: string; flag: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-20 shrink-0 text-zinc-500">{title}</span>
      <span className="flex-1 text-zinc-800 dark:text-zinc-200">{children}</span>
      <FlagBadge flag={flag} />
    </div>
  );
}

function FlagBadge({ flag }: { flag: string }) {
  const attention =
    flag === 'HIGH' || flag === 'CONCENTRATED' || flag === 'WEAK_CUT' || flag === 'CONCENTRATED_GAIN';
  const muted = flag === 'INSUFFICIENT_DATA';
  const cls = attention
    ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
    : muted
      ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
  return <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>{flag}</span>;
}

function fmtPct(v: number | null): string {
  if (v == null) return '-';
  return `${v}%`;
}
