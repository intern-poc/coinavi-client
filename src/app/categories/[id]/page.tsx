import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { CurrencyToggle } from '@/components/currency-toggle';
import { Header } from '@/components/header';
import { CoinTable } from '@/features/coins/coin-table';
import { fetchCategories, fetchCoins } from '@/features/coins/api';
import type { DisplayCurrency } from '@/lib/format';

const PAGE_SIZE = 50;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; currency?: string }>;
};

/**
 * 카테고리 세부 페이지 — \/categories/[id]
 *
 * <p>해당 카테고리에 매핑된 코인을 시총 순으로 표시. CoinTable 재사용 — SSE 갱신 + 페이지네이션
 * + 김프 컬럼 모두 그대로 동작. 백엔드는 \`?categoryId=` 필터로 매핑된 코인만 반환.
 *
 * <p>매핑은 OnDemand fetch + 부팅 시 1회 sync 로 채워지므로 카테고리에 따라 결과 수가 다름.
 * 비어있으면 "해당 카테고리에 매핑된 코인이 없습니다" 안내.
 *
 * <p>존재하지 않는 카테고리 슬러그 → 카테고리 마스터에서 찾을 수 없으면 404.
 */
export default async function CategoryDetailPage({ params, searchParams }: Props) {
  const { id: categoryId } = await params;
  const sp = await searchParams;

  const page = Math.max(0, parseInt(sp.page ?? '0', 10) || 0);
  const currency: DisplayCurrency =
    sp.currency?.toUpperCase() === 'USD' ? 'USD' : 'KRW';

  // 카테고리 마스터 lookup — 존재 확인 + 표시명 획득
  const categories = await fetchCategories();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) {
    notFound();
  }

  const initialPage = await fetchCoins(page, PAGE_SIZE, currency, categoryId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <BackButton fallback="/categories" />
          <CurrencyToggle />
        </div>

        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-1">카테고리</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {category.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-mono">{category.id}</p>
        </div>

        {initialPage.totalElements === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center text-sm text-zinc-500">
            <p className="mb-2">이 카테고리에 매핑된 코인이 아직 없어요.</p>
            <p className="text-xs">
              해당 카테고리 코인의 단건 페이지를 방문하면 자동으로 매핑이 채워집니다.
            </p>
          </div>
        ) : (
          <CoinTable
            initialPage={initialPage}
            currency={currency}
            categoryName={category.name}
          />
        )}
      </main>
    </div>
  );
}
