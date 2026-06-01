'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 호버 + 클릭 tooltip. 모바일에서도 사용 가능 (호버 안 되는 환경에선 탭).
 *
 * <p><b>인터랙션</b>:
 * <ul>
 *   <li>호버 — 마우스 위에 있는 동안 표시</li>
 *   <li>클릭 — 토글 (pinned). 호버 떠나도 유지. 다시 클릭 또는 외부 클릭 시 닫힘</li>
 *   <li>{@code withIcon=true} — children 옆에 작은 "?" 뱃지 표시 (시각 단서)</li>
 * </ul>
 *
 * <p>위치: trigger 기준. 화면 우측 가장자리에 잘릴 가능성 있을 때 placement 지정.
 * {@code overflow-x-auto} 컨테이너 안의 헤더 셀은 위로 띄우면 잘리므로 bottom 권장.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  withIcon = false,
}: {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  withIcon?: boolean;
}) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [pinned]);

  const positionClass =
    placement === 'left'
      ? 'right-full top-1/2 -translate-y-1/2 mr-2'
      : placement === 'right'
        ? 'left-full top-1/2 -translate-y-1/2 ml-2'
        : placement === 'bottom'
          ? 'top-full left-1/2 -translate-x-1/2 mt-2'
          : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  const visible = pinned || hovered;

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center gap-1 cursor-help"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setPinned((p) => !p);
      }}
    >
      {children}
      {withIcon && (
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold leading-none"
        >
          ?
        </span>
      )}
      <span
        role="tooltip"
        className={`absolute ${positionClass} px-3 py-2 rounded-md shadow-lg
          bg-zinc-900 dark:bg-zinc-700 text-zinc-50 text-xs leading-relaxed
          w-max max-w-xs whitespace-normal text-left
          transition-opacity duration-150 pointer-events-none z-20
          ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {content}
      </span>
    </span>
  );
}
