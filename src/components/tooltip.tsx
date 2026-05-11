'use client';

import type { ReactNode } from 'react';

/**
 * 호버 tooltip — group-hover 기반 CSS-only.
 *
 * <p>native {@code title} 속성보다 디자인 통제 가능 + 다크 모드 동기. 라이브러리
 * 의존 없이 작동하는 가장 단순한 형태. 화살표 (▼) 가 trigger 아래쪽에 붙어 방향 명시.
 *
 * <p>위치: trigger 바로 위 중앙 정렬 (`bottom-full + left-1/2 + -translate-x-1/2`).
 * 화면 우측 가장자리에 잘릴 가능성 있을 때만 placement="left" / "right" 사용.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
}: {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const positionClass =
    placement === 'left'
      ? 'right-full top-1/2 -translate-y-1/2 mr-2'
      : placement === 'right'
        ? 'left-full top-1/2 -translate-y-1/2 ml-2'
        : placement === 'bottom'
          ? 'top-full left-1/2 -translate-x-1/2 mt-2'
          : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span className="relative inline-flex group cursor-help">
      {children}
      <span
        role="tooltip"
        className={`absolute ${positionClass} px-3 py-2 rounded-md shadow-lg
          bg-zinc-900 dark:bg-zinc-700 text-zinc-50 text-xs leading-relaxed
          w-max max-w-xs whitespace-normal text-left
          opacity-0 group-hover:opacity-100 transition-opacity duration-150
          pointer-events-none z-20`}
      >
        {content}
      </span>
    </span>
  );
}
