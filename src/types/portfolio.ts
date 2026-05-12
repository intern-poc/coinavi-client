import type { DisplayCurrency } from '@/lib/format';
import type { ExchangeCode } from './exchange-key';

/**
 * 백엔드 PortfolioResponse 와 1:1.
 *
 * <p>1차 프론트는 \`summary.totalValuation\` + \`coins[].symbol/imageUrl/valuation/weight\` 만 사용.
 * \`combinedAvgPrice\`, \`byExchange\`, \`exchanges\` 는 응답에 있지만 후속 (거래소별 펼치기·평단/손익)
 * 에서 활용 예정.
 */
export type Portfolio = {
  summary: PortfolioSummary;
  coins: PortfolioCoinHolding[];
  exchanges: PortfolioExchangeSummary[];
};

export type PortfolioSummary = {
  totalCoins: number;
  totalExchanges: number;
  totalValuation: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number | null;   // cost 0 시 null
  currency: DisplayCurrency;
};

export type PortfolioCoinHolding = {
  coinId: number;
  symbol: string;
  name: string;
  imageUrl: string | null;
  totalQuantity: number;
  combinedAvgPrice: number;
  currentPrice: number | null;
  valuation: number | null;
  weight: number | null;
  costBasis: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  byExchange: PortfolioExchangeBreakdown[];
};

export type PortfolioExchangeBreakdown = {
  exchange: ExchangeCode;
  quantity: number;
  avgPrice: number;
  lastSyncedAt: string | null;
};

export type PortfolioExchangeSummary = {
  code: ExchangeCode;
  name: string;
  coinCount: number;
  lastSyncedAt: string | null;
};

/**
 * POST /api/v1/portfolio/refresh 응답 — 202 + jobId.
 */
export type RefreshJobCreated = {
  jobId: number;
};

/**
 * GET /api/v1/collection/jobs/{id} 응답 — polling 으로 완료 감지.
 */
export type CollectionJob = {
  id: number;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  fetchedCount: number | null;
  failureReason: string | null;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};
