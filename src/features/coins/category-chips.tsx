'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/types/category';

/**
 * 시세 페이지 상단의 카테고리 필터 칩 줄.
 *
 * <p>"전체" + 인기 카테고리 N개 + "더 보기" (/categories 진입). 클릭 시 URL ?categoryId 변경 →
 * Server Component 재 fetch → 해당 카테고리 코인만 리스트.
 *
 * <p>인기 카테고리는 백엔드 응답 (알파벳 순) 에서 화이트리스트로 추리고, 매칭 안 되는 슬러그는
 * graceful skip. CoinGecko 가 슬러그 약간 바꿔도 칩 한두 개 빠질 뿐 화면 깨지지 X.
 */
export function CategoryChips({
  categories,
  selectedId,
}: {
  categories: Category[];
  selectedId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setCategory(categoryId: string | null) {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('categoryId', categoryId);
    } else {
      params.delete('categoryId');
    }
    params.delete('page');   // 카테고리 전환 시 1페이지로
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-4">
      <Chip active={selectedId == null} onClick={() => setCategory(null)}>
        전체
      </Chip>
      {categories.map((c) => (
        <Chip
          key={c.id}
          active={selectedId === c.id}
          onClick={() => setCategory(c.id)}
        >
          {c.name}
        </Chip>
      ))}
      <Link
        href="/categories"
        className="flex-shrink-0 px-3 py-1.5 text-xs rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
      >
        더 보기 →
      </Link>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const variant = active
    ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold'
    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${variant}`}
    >
      {children}
    </button>
  );
}

