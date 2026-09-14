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

export type SiteNavLanguageItem = {
  /** Stable key for React and the current-language marker. */
  readonly id: string;
  readonly href: string;
  readonly label: ReactNode;
  /** Optional flag or other compact visual marker. */
  readonly flag?: ReactNode;
  /** Language metadata forwarded to the anchor. */
  readonly lang?: string;
  readonly hrefLang?: string;
  readonly current?: boolean;
};

export type SiteNavLanguage = {
  /** Current-language visual, usually a flag. */
  readonly current: ReactNode;
  /** Accessible name of the disclosure summary. */
  readonly label: string;
  readonly title?: ReactNode;
  readonly items: readonly SiteNavLanguageItem[];
  readonly note?: ReactNode;
};

export type SiteNavProps = Omit<ComponentPropsWithoutRef<'header'>, 'children'> & {
  /** Brand lock-up supplied by the consuming application. */
  readonly brand: ReactNode;
  /** Main destinations. The liquid navigation is designed for four items. */
  readonly items: readonly SiteNavItem[];
  /** Identifier of the destination that owns the active bubble. */
  readonly activeItem?: string;
  /** Accessible name of the navigation landmark. */
  readonly navLabel: string;
  /** Search control supplied by the consuming application. */
  readonly search?: ReactNode;
  /** Optional native language disclosure. */
  readonly language?: SiteNavLanguage;
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
 * concerns stay in slots and data: brand, search, routes, labels and locales.
 */
export function SiteNav({
  brand,
  items,
  activeItem,
  navLabel,
  search,
  language,
  onNavigate,
  className,
  ...headerProps
}: SiteNavProps) {
  return (
    <header className={[styles.bar, className].filter(Boolean).join(' ')} {...headerProps}>
      <div className={styles.brandZone}>{brand}</div>

      <div className={styles.inner}>
        <nav aria-label={navLabel}>
          <NavBubble items={items} activeKey={activeItem} onNavigate={onNavigate} />
        </nav>

        {(search || language) && (
          <div className={styles.chromeEnd}>
            {search}
            {language && (
              <details className={styles.language}>
                <summary>
                  <span className={styles.flag}>{language.current}</span>
                  <span className={styles.visuallyHidden}>{language.label}</span>
                  <svg
                    className={styles.chevron}
                    viewBox="0 0 12 8"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M1,1.5 L6,6.5 L11,1.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <div className={styles.languagePanel}>
                  {language.title && <p className={styles.languageTitle}>{language.title}</p>}
                  {language.items.map((item) => (
                    <a
                      key={item.id}
                      className={styles.languageLink}
                      href={item.href}
                      lang={item.lang}
                      hrefLang={item.hrefLang}
                      aria-current={item.current ? 'true' : undefined}
                    >
                      {item.flag && <span className={styles.flag}>{item.flag}</span>}
                      <span>{item.label}</span>
                    </a>
                  ))}
                  {language.note && <p className={styles.languageNote}>{language.note}</p>}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
