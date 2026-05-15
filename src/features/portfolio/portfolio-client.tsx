'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCollectionJob,
  fetchPortfolio,
  refreshPortfolio,
} from './api';
import { PortfolioCoinList } from './portfolio-coin-list';
import { PortfolioEmpty } from './portfolio-empty';
import { PortfolioExchangeTabs } from './portfolio-exchange-tabs';
import { filterPortfolioByExchange, type ExchangeFilter } from './portfolio-filter';
import { PortfolioPieChart } from './portfolio-pie-chart';
import { PortfolioSummary } from './portfolio-summary';
import { useAuth } from '@/features/auth/use-auth';
import type { DisplayCurrency } from '@/lib/format';
import type { Portfolio } from '@/types/portfolio';
import { EXCHANGE_LABELS } from '@/types/exchange-key';

/**
 * 포트폴리오 페이지 client-side 로직.
 *
 * <p>auth 분기 → fetchPortfolio (currency 변경 시 재요청). 새로고침 버튼 → POST /refresh →
 * 받은 jobId 로 GET /collection/jobs/{id} polling (1.5초 간격, 최대 30초). 종결 status
 * (SUCCEEDED) 시 fetchPortfolio 재호출해서 갱신된 holdings 반영.
 */

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;

export function PortfolioClient() {
  const { status } = useAuth();
  const searchParams = useSearchParams();
  const currency: DisplayCurrency =
    searchParams.get('currency')?.toUpperCase() === 'USD' ? 'USD' : 'KRW';

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter>('ALL');

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // 거래소 필터 + 비중 desc 정렬. 조기 return 들 위에 호출 — React Hooks 호출 순서.
  const filtered = useMemo(() => {
    if (!portfolio) return null;
    return filterPortfolioByExchange(portfolio, exchangeFilter);
  }, [portfolio, exchangeFilter]);

  const sortedCoins = useMemo(() => {
    if (!filtered) return [];
    return [...filtered.coins].sort((a, b) => {
      if (a.valuation == null && b.valuation == null) return 0;
      if (a.valuation == null) return 1;
      if (b.valuation == null) return -1;
      return b.valuation - a.valuation;
    });
  }, [filtered]);

  // 거래소 필터가 *없는* 거래소를 가리키면 (refresh 등으로 사라짐) 자동 ALL 로 복귀
  useEffect(() => {
    if (!portfolio || exchangeFilter === 'ALL') return;
    if (!portfolio.exchanges.some((e) => e.code === exchangeFilter)) {
      setExchangeFilter('ALL');
    }
  }, [portfolio, exchangeFilter]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoadError(null);
    fetchPortfolio(currency)
      .then(setPortfolio)
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : '포트폴리오 조회 실패')
      );
  }, [status, currency]);

  useEffect(() => {
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const { jobId } = await refreshPortfolio();
      pollStartRef.current = Date.now();
      pollTimerRef.current = setInterval(async () => {
        try {
          const job = await fetchCollectionJob(jobId);
          if (job.status === 'SUCCEEDED') {
            stopPolling();
            const fresh = await fetchPortfolio(currency);
            setPortfolio(fresh);
            setRefreshing(false);
          } else if (job.status === 'FAILED') {
            stopPolling();
            setRefreshError(job.failureReason ?? '수집 실패');
            setRefreshing(false);
          } else if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
            stopPolling();
            setRefreshError('수집이 오래 걸려요. 잠시 후 다시 시도해주세요.');
            setRefreshing(false);
          }
        } catch (e) {
          stopPolling();
          setRefreshError(e instanceof Error ? e.message : '상태 조회 실패');
          setRefreshing(false);
        }
      }, POLL_INTERVAL_MS);
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : '새로고침 요청 실패');
      setRefreshing(false);
    }
  }

  if (status === 'loading') {
    return <div className="text-sm text-zinc-500">불러오는 중...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
        <p className="text-zinc-700 dark:text-zinc-300 mb-4">
          포트폴리오는 로그인 후 이용할 수 있어요.
        </p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 text-sm font-medium hover:opacity-90"
        >
          로그인하러 가기
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">
        {loadError}
      </div>
    );
  }

  if (portfolio === null || filtered === null) {
    return <div className="text-sm text-zinc-500">포트폴리오 불러오는 중...</div>;
  }

  const isEmpty = portfolio.summary.totalCoins === 0;
  const summaryTitle =
    exchangeFilter === 'ALL'
      ? '통합 자산'
      : `${EXCHANGE_LABELS[exchangeFilter]} 보유 현황`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PortfolioSummary
          title={summaryTitle}
          totalValuation={filtered.summary.totalValuation}
          totalUnrealizedPnl={filtered.summary.totalUnrealizedPnl}
          totalUnrealizedPnlPercent={filtered.summary.totalUnrealizedPnlPercent}
          currency={filtered.summary.currency}
        />
        <div className="flex items-center gap-2">
          <Link
            href="/exchange-keys"
            className="px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            API 키 관리
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="새로고침"
            title="새로고침"
            className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            >
              <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {refreshError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">
          {refreshError}
        </div>
      )}

      {isEmpty ? (
        <PortfolioEmpty />
      ) : (
        <>
          <PortfolioExchangeTabs
            exchanges={portfolio.exchanges}
            selected={exchangeFilter}
            onSelect={setExchangeFilter}
          />
          <PortfolioPieChart coins={sortedCoins} currency={currency} />
          <PortfolioCoinList coins={sortedCoins} currency={currency} />
        </>
      )}
    </div>
  );
}
