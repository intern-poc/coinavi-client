import type { Category } from '@/types/category';

/**
 * 카테고리 페이지 (/categories) 카드 그리드 + 시세 페이지 칩 노출용 인기 카테고리.
 *
 * <p>서버측 \`CoinGeckoSyncService.POPULAR_CATEGORY_IDS\` 와 같은 정책 (18개). 부팅 sync 가
 * 채우는 카테고리 = UI 노출 카테고리. 일관성 유지.
 *
 * <p>시세 페이지 칩은 빠른 필터링용 처음 6개만 노출. 카테고리 페이지는 탐색용 18개 다.
 *
 * <p>이 파일은 서버 컴포넌트에서도 import 가능 (use client 마킹 X).
 */
const POPULAR_CATEGORY_IDS = [
  'layer-1',
  'smart-contract-platform',
  'stablecoins',
  'decentralized-finance-defi',
  'meme-token',
  'ethereum-ecosystem',
  // 위 6개는 시세 페이지 칩 노출. 아래 12개는 카테고리 페이지 (/categories) 에만.
  'layer-2',
  'solana-ecosystem',
  'polygon-ecosystem',
  'bnb-chain-ecosystem',
  'real-world-assets-rwa',
  'artificial-intelligence',
  'ai-agents',
  'gaming',
  'non-fungible-tokens-nft',
  'privacy-coins',
  'oracle',
  'liquid-staking-tokens',
];

const CHIP_LIMIT = 6;

/**
 * 시세 페이지 칩 — 처음 6개만. 가로 스크롤 짧게 + 빠른 필터링.
 */
export function selectChipCategories(all: Category[]): Category[] {
  return filterAndOrder(all, POPULAR_CATEGORY_IDS.slice(0, CHIP_LIMIT));
}

/**
 * /categories 페이지 — 화이트리스트 18개 전부. 탐색용.
 */
export function selectPopularCategories(all: Category[]): Category[] {
  return filterAndOrder(all, POPULAR_CATEGORY_IDS);
}

function filterAndOrder(all: Category[], orderedIds: string[]): Category[] {
  const map = new Map(all.map((c) => [c.id, c]));
  return orderedIds.flatMap((id) => {
    const c = map.get(id);
    return c ? [c] : [];
  });
}
