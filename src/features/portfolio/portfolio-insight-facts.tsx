'use client';

import { useEffect, useState } from 'react';
import { fetchInsightComment, fetchInsightFacts } from './api';
import type { InsightComment, InsightFacts } from '@/types/portfolio';

/**
 * AI 인사이트 뷰어 — 임시 검증용.
 *
 * <p>상단: Gemini가 facts를 풀이한 자연어 코멘트(hero). 하단: 룰이 뽑은 정규화 facts(근거).
 * LLM 코멘트 품질 + 룰/임계값을 화면에서 확인하기 위한 화면. 실제 AI 코멘트 UI(버튼·드로어)는 후속.
 */
export function PortfolioInsightFacts() {
  const [facts, setFacts] = useState<InsightFacts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [comment, setComment] = useState<InsightComment | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsightFacts()
      .then(setFacts)
      .catch((e) => setError(e instanceof Error ? e.message : 'facts 조회 실패'));
    fetchInsightComment()
      .then(setComment)
      .catch((e) => setCommentError(e instanceof Error ? e.message : '코멘트 조회 실패'));
  }, []);

  return (
    <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          🔬 AI 인사이트 (임시 — 검증용)
        </span>
        {facts && (
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
          >
            {showRaw ? '카드 보기' : '원본 JSON'}
          </button>
        )}
      </div>

      {/* AI 코멘트 (hero) */}
      <div className="mb-4 rounded-md bg-white/70 dark:bg-zinc-900/50 border border-amber-200 dark:border-amber-800 p-3">
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-1">🤖 AI 코멘트</p>
        {commentError && <p className="text-xs text-red-600 dark:text-red-400">{commentError}</p>}
        {!commentError && comment === null && (
          <p className="text-xs text-zinc-500">AI가 코멘트를 작성 중...</p>
        )}
        {comment && (
          <p
            className={`text-sm leading-relaxed ${
              comment.available
                ? 'text-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 italic'
            }`}
          >
            {comment.comment}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!error && facts === null && <p className="text-xs text-zinc-500">불러오는 중...</p>}

      {facts && !facts.hasData && (
        <p className="text-xs text-zinc-500">보유 자산이 없어 분석할 데이터가 없어요.</p>
      )}

      {facts && facts.hasData && !showRaw && (
        <div className="space-y-3 text-xs">
          {facts.concentration && (
            <Row title="종목 집중도" flag={facts.concentration.flag}>
              최대 비중 <b>{facts.concentration.topCoin ?? '-'}</b>{' '}
              {fmtPct(facts.concentration.topWeight)} · 보유 {facts.concentration.coinCount}종목
            </Row>
          )}
          {facts.sector && (
            <Row title="섹터 집중도" flag={facts.sector.flag}>
              {facts.sector.topCategory ? (
                <>
                  <b>{facts.sector.topCategory}</b> {fmtPct(facts.sector.topWeight)} · coverage{' '}
                  {fmtPct(facts.sector.coverage)}
                </>
              ) : (
                <span className="text-zinc-500">카테고리 매핑 데이터 부족</span>
              )}
            </Row>
          )}
          {facts.behavior ? (
            <Row title="매매 행동" flag={facts.behavior.flag}>
              승률 {fmtPct(facts.behavior.winRate)} ({facts.behavior.winCount}승{' '}
              {facts.behavior.lossCount}패) · 평균보유 {facts.behavior.avgHoldDays}일
              <span className="block text-zinc-500 mt-0.5">
                이익 {facts.behavior.avgHoldDaysWin}일 / 손실 {facts.behavior.avgHoldDaysLoss}일 보유
              </span>
            </Row>
          ) : (
            <Row title="매매 행동" flag="OK">
              <span className="text-zinc-500">청산된 거래가 없어요</span>
            </Row>
          )}
        </div>
      )}

      {facts && showRaw && (
        <pre className="text-[11px] leading-relaxed overflow-x-auto text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-zinc-900/60 p-3 rounded">
          {JSON.stringify(facts, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Row({
  title,
  flag,
  children,
}: {
  title: string;
  flag: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-20 shrink-0 text-zinc-500">{title}</span>
      <span className="flex-1 text-zinc-800 dark:text-zinc-200">{children}</span>
      <FlagBadge flag={flag} />
    </div>
  );
}

function FlagBadge({ flag }: { flag: string }) {
  const attention = flag === 'HIGH' || flag === 'CONCENTRATED' || flag === 'WEAK_CUT';
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
