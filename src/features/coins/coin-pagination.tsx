'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * 코인 리스트 페이지네이션. URL ?page=N 으로 상태 동기화.
 *
 * <p><b>왜 URL 동기화</b>: 새로고침해도 같은 페이지 유지, 다른 사람과 URL 공유 가능,
 * 브라우저 뒤로가기 자연 동작. 페이지가 단순 컴포넌트 state 라면 새로고침 시 1페이지로 회귀.
 *
 * <p>page 는 0-based (백엔드 Spring Data 표준), 화면 표시는 1-based ({page+1} / {totalPages}).
 */
export function CoinPagination({
  totalPages,
  currentPage,
  totalElements,
}: {
  totalPages: number;
  currentPage: number;     // 0-based
  totalElements: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isFirst = currentPage <= 0;
  const isLast = currentPage >= totalPages - 1;

  function go(page: number) {
    const params = new URLSearchParams(searchParams);
    if (page > 0) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }
    const query = params.toString();
    router.push(query ? `?${query}` : '/');
  }

  // 표시할 page 번호 5개 (현재 ±2). 경계 근처 보정.
  const pageNumbers = computePageNumbers(currentPage, totalPages, 5);

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <div className="flex items-center gap-1">
        <PaginationButton onClick={() => go(0)} disabled={isFirst}>
          ‹‹
        </PaginationButton>
        <PaginationButton onClick={() => go(currentPage - 1)} disabled={isFirst}>
          이전
        </PaginationButton>

        {pageNumbers.map((n) => (
          <PaginationButton
            key={n}
            onClick={() => go(n)}
            active={n === currentPage}
          >
            {n + 1}
          </PaginationButton>
        ))}

        <PaginationButton onClick={() => go(currentPage + 1)} disabled={isLast}>
          다음
        </PaginationButton>
        <PaginationButton onClick={() => go(totalPages - 1)} disabled={isLast}>
          ››
        </PaginationButton>
      </div>

      <span className="text-sm text-zinc-500">
        총 {totalElements.toLocaleString('ko-KR')}개 · {currentPage + 1} / {totalPages} 페이지
      </span>
    </div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const base =
    'min-w-[2.25rem] h-9 px-3 rounded-md text-sm transition-colors';
  const variant = active
    ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold'
    : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800';
  const disabledStyle = disabled
    ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
    : '';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variant} ${disabledStyle}`.trim()}
    >
      {children}
    </button>
  );
}

/**
 * 표시할 페이지 번호 윈도우. 현재 페이지 주변 size 개를 보여주되 0 / lastPage 경계 보정.
 */
function computePageNumbers(current: number, total: number, size: number): number[] {
  if (total <= size) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const half = Math.floor(size / 2);
  let start = current - half;
  let end = current + half;
  if (start < 0) {
    end -= start;
    start = 0;
  }
  if (end > total - 1) {
    start -= end - (total - 1);
    end = total - 1;
  }
  start = Math.max(0, start);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
