import type { ExchangeCode } from '@/types/exchange-key';
import type {
  Portfolio,
  PortfolioCoinHolding,
  PortfolioSummary,
} from '@/types/portfolio';

/**
 * 포트폴리오 거래소 필터링.
 *
 * <p>"전체" 선택 시 원본 그대로. 특정 거래소 선택 시:
 * <ul>
 *   <li>각 코인의 byExchange 중 해당 거래소 분만 추출 → quantity·avgPrice 그것만 사용</li>
 *   <li>valuation = quantity × currentPrice (해당 거래소 분)</li>
 *   <li>weight = 그 코인 valuation / 필터된 합계</li>
 *   <li>costBasis = quantity × avgPrice (해당 거래소). avgPrice null 면 null</li>
 *   <li>pnl = valuation − costBasis. costBasis null 면 null</li>
 *   <li>summary 도 같은 기준으로 재계산</li>
 * </ul>
 *
 * <p>해당 거래소에 매핑이 없는 코인은 결과에서 제외.
 */
export type ExchangeFilter = ExchangeCode | 'ALL';

export function filterPortfolioByExchange(
  portfolio: Portfolio,
  filter: ExchangeFilter
): Portfolio {
  if (filter === 'ALL') return portfolio;

  const filteredCoins = portfolio.coins
    .map((c) => projectCoin(c, filter))
    .filter((c): c is PortfolioCoinHolding => c !== null);

  const totalValuation = filteredCoins.reduce(
    (sum, c) => sum + (c.valuation ?? 0),
    0
  );
  const coinsWithWeight = filteredCoins.map((c) => ({
    ...c,
    weight:
      c.valuation == null || totalValuation === 0
        ? null
        : (c.valuation / totalValuation) * 100,
  }));

  const totalCostBasis = filteredCoins.reduce(
    (sum, c) => (c.costBasis == null ? sum : sum + c.costBasis),
    0
  );
  const totalUnrealizedPnl = filteredCoins.reduce(
    (sum, c) => (c.unrealizedPnl == null ? sum : sum + c.unrealizedPnl),
    0
  );
  const totalUnrealizedPnlPercent =
    totalCostBasis === 0 ? null : (totalUnrealizedPnl / totalCostBasis) * 100;

  const summary: PortfolioSummary = {
    ...portfolio.summary,
    totalCoins: filteredCoins.length,
    totalExchanges: 1,
    totalValuation,
    totalCostBasis,
    totalUnrealizedPnl,
    totalUnrealizedPnlPercent,
  };

  return {
    summary,
    coins: coinsWithWeight,
    exchanges: portfolio.exchanges.filter((e) => e.code === filter),
  };
}

function projectCoin(
  coin: PortfolioCoinHolding,
  exchange: ExchangeCode
): PortfolioCoinHolding | null {
  const breakdown = coin.byExchange.find((b) => b.exchange === exchange);
  if (!breakdown) return null;

  const quantity = breakdown.quantity;
  const avgPrice = breakdown.avgPrice;
  const valuation =
    coin.currentPrice == null ? null : quantity * coin.currentPrice;
  const costBasis = avgPrice == null ? null : quantity * avgPrice;
  const unrealizedPnl =
    valuation == null || costBasis == null ? null : valuation - costBasis;
  const unrealizedPnlPercent =
    costBasis == null || costBasis === 0 || unrealizedPnl == null
      ? null
      : (unrealizedPnl / costBasis) * 100;

  return {
    ...coin,
    totalQuantity: quantity,
    combinedAvgPrice: avgPrice,
    valuation,
    weight: null,                       // 호출 측에서 합계 확정 후 채움
    costBasis,
    unrealizedPnl,
    unrealizedPnlPercent,
    byExchange: [breakdown],
  };
}
