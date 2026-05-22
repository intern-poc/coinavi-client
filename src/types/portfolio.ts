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

/**
 * 자산 추이 차트 범위 — 서버 SnapshotRange 와 1:1.
 */
export type SnapshotRange = '1w' | '1m' | '3m' | '6m' | '1y';

/**
 * GET /api/v1/portfolio/snapshots 응답 element — 일일 스냅샷 한 점.
 * 모든 금액 KRW 단위 (Phase 1).
 */
export type PortfolioSnapshot = {
  date: string;           // ISO 'YYYY-MM-DD'
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number | null;
};

/**
 * GET /api/v1/trades/report 응답 — 청산된 거래 기반 실현 매매 성과. 금액 KRW.
 * 거래 짝이 없으면 모든 값 0, bestTrade/worstTrade null.
 */
export type TradeReport = {
  totalRealizedPnl: number;
  totalRealizedPnlPercent: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;            // %
  avgHoldingDays: number;
  profitLossRatio: number | null;   // 이익·손실 둘 다 있어야 산출, 아니면 null
  bestTrade: TradeHighlight | null;
  worstTrade: TradeHighlight | null;
};

export type TradeHighlight = {
  coinSymbol: string;
  realizedPnl: number;
  realizedPnlPercent: number;
  holdingDays: number;
};
