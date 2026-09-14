'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { LiquidBubble } from './liquid-bubble';
import styles from './site-nav.module.css';
import type { SiteNavItem } from './site-nav';

export type NavBubbleProps = {
  readonly items: readonly SiteNavItem[];
  readonly activeKey?: string;
  readonly onNavigate?: (item: SiteNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
};

const isModifiedClick = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

type OptimisticSelection = {
  readonly sourceKey: string | undefined;
  readonly targetKey: string;
};

/** Keeps one liquid surface moving between the navigation's destinations. */
export function NavBubble({ items, activeKey, onNavigate }: NavBubbleProps) {
  const initialKey = activeKey ?? items[0]?.id;
  const [optimisticSelection, setOptimisticSelection] = useState<OptimisticSelection>();
  const [moving, setMoving] = useState(false);
  const movementTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (movementTimer.current !== null) window.clearTimeout(movementTimer.current);
    },
    [],
  );

  /*
   * The optimistic state belongs to the active key it replaced. When the
   * consumer updates `activeKey` after routing, the new prop wins during render
   * and no state-setting effect is needed. That keeps the click animation smooth
   * while avoiding a cascading render after every route change.
   */
  const displayedKey =
    optimisticSelection && optimisticSelection.sourceKey === activeKey
      ? optimisticSelection.targetKey
      : initialKey;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === displayedKey),
  );

  const handleClick = (item: SiteNavItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(event) || event.currentTarget.target === '_blank') return;
    if (item.id === displayedKey) return;

    setOptimisticSelection({ sourceKey: activeKey, targetKey: item.id });
    setMoving(true);
    if (movementTimer.current !== null) window.clearTimeout(movementTimer.current);
    movementTimer.current = window.setTimeout(() => setMoving(false), 620);

    if (onNavigate) {
      event.preventDefault();
      onNavigate(item, event);
    }
  };

  return (
    <ul
      className={styles.list}
      data-active-index={activeIndex}
      data-moving={moving ? 'true' : undefined}
    >
      <LiquidBubble className={styles.movingBubble} aria-hidden="true" />
      {items.map((item) => {
        const current = item.id === displayedKey;
        return (
          <li key={item.id}>
            <a
              className={styles.link}
              data-nav={item.id}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              onClick={(event) => handleClick(item, event)}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
