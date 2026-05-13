import { Header } from '@/components/header';
import { CategoryChips } from '@/features/coins/category-chips';
import { selectChipCategories } from '@/features/coins/category-popular';
import { CoinTable } from '@/features/coins/coin-table';
import { fetchCategories, fetchCoins } from '@/features/coins/api';
import type { DisplayCurrency } from '@/lib/format';

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<{ page?: string; currency?: string; categoryId?: string }>;
};

/**
 * 메인 페이지 — 코인 시총 순 리스트 + 페이지네이션 + 통화 토글 + 카테고리 필터.
 *
 * <p>Server Component 가 URL ?page=N&currency=KRW|USD&categoryId=<slug> 를 읽어 백엔드에서
 * 해당 페이지·통화·카테고리로 fetch. categoryId 있으면 카테고리 매핑된 코인만 표시.
 *
 * <p>URL 변경 (페이지네이션 / 통화 토글 / 카테고리 칩) → Next.js 가 이 Server Component 다시
 * 렌더 → 새 initialPage 로 CoinTable re-mount.
 */
export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? '0', 10) || 0);
  const currency: DisplayCurrency =
    params.currency?.toUpperCase() === 'USD' ? 'USD' : 'KRW';
  const categoryId = params.categoryId?.trim() || null;

  const [initialPage, allCategories] = await Promise.all([
    fetchCoins(page, PAGE_SIZE, currency, categoryId ?? undefined),
    fetchCategories(),
  ]);
  const chipCategories = selectChipCategories(allCategories);
  const selectedCategoryName = categoryId
    ? allCategories.find((c) => c.id === categoryId)?.name
    : undefined;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <CategoryChips categories={chipCategories} selectedId={categoryId} />
        <CoinTable
          initialPage={initialPage}
          currency={currency}
          categoryName={selectedCategoryName}
        />
      </main>
    </div>
  );
}
