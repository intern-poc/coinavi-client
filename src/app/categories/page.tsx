import Link from 'next/link';
import { BackButton } from '@/components/back-button';
import { Header } from '@/components/header';
import { fetchCategories } from '@/features/coins/api';
import { selectPopularCategories } from '@/features/coins/category-popular';

/**
 * 카테고리 탐색 페이지 — 인기 카테고리 (화이트리스트 18개) 카드 그리드.
 *
 * <p>각 카드 클릭 시 \/categories/[id] 로 이동해 해당 카테고리 코인 리스트 표시.
 *
 * <p>CoinGecko 마스터엔 ~800개 카테고리가 있지만 *대부분 사용자 가치 낮은 micro 분류*. 인기
 * 카테고리만 노출하는 게 탐색 UX 좋음. 서버측 부팅 sync 도 같은 18개만 매핑 적재 — 정책 일관.
 *
 * <p>화이트리스트는 \`features/coins/category-popular.ts\` 에서 관리. CoinGecko 슬러그 변동 시
 * 매칭 안 되는 건 graceful skip.
 */
export default async function CategoriesPage() {
  const all = await fetchCategories();
  const categories = selectPopularCategories(all);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            카테고리 탐색
          </h1>
          <div className="w-8" />
        </div>

        <p className="text-sm text-zinc-500 mb-6">
          인기 카테고리 {categories.length}개. 각 카테고리에 속한 코인을 시총 순으로 조회할 수 있어요.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${encodeURIComponent(c.id)}`}
              className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all"
            >
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                {c.name}
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-1 truncate">
                {c.id}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
