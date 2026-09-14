'use client';

import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import { NavBubble } from './nav-bubble';
import styles from './site-nav.module.css';

export type SiteNavItem = {
  /** Stable identifier used to position the single active liquid bubble. */
  readonly id: string;
  /** Destination of the anchor. */
  readonly href: string;
  /** Visible label for the destination. */
  readonly label: ReactNode;
};

/** Default destinations for the compact site navigation. */
export const DEFAULT_SITE_NAV_ITEMS: readonly SiteNavItem[] = [
  { id: 'map', href: '/', label: 'Carte' },
  { id: 'countries', href: '/countries', label: 'Pays' },
  { id: 'cities', href: '/cities', label: 'Villes' },
  { id: 'about', href: '/about', label: 'À propos' },
];

export type SiteNavProps = Omit<ComponentPropsWithoutRef<'header'>, 'children'> & {
  /** Optional brand lock-up supplied by the consuming application. */
  readonly brand?: ReactNode;
  /** Main destinations. The liquid navigation is designed for four items. */
  readonly items?: readonly SiteNavItem[];
  /** Identifier of the destination that owns the active bubble. */
  readonly activeItem?: string;
  /** Accessible name of the navigation landmark. */
  readonly navLabel?: string;
  /**
   * Optional client-side navigation hook. When provided, the component keeps
   * the clicked bubble visible and delegates routing to the consumer.
   */
  readonly onNavigate?: (item: SiteNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Reusable liquid-glass site navigation.
 *
 * The component owns the chrome and the animated active surface. Application
 * concerns stay in slots and data: optional brand, routes and labels.
 */
export function SiteNav({
  brand,
  items = DEFAULT_SITE_NAV_ITEMS,
  activeItem,
  navLabel = 'Navigation principale',
  onNavigate,
  className,
  ...headerProps
}: SiteNavProps) {
  return (
    <header className={[styles.bar, className].filter(Boolean).join(' ')} {...headerProps}>
      {brand && <div className={styles.brandZone}>{brand}</div>}

      <div className={styles.inner}>
        <nav aria-label={navLabel}>
          <NavBubble items={items} activeKey={activeItem} onNavigate={onNavigate} />
        </nav>
      </div>
    </header>
  );
}
