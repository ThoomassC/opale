import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import clsx from 'clsx';
import Glass from '../glass/Glass';
import styles from './style/SearchBar.module.scss';

export type SearchBarProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & {
  size?: 'small' | 'medium' | 'large';
  enableClickAnimation?: boolean;
};

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      size = 'medium',
      disabled,
      enableClickAnimation = true,
      className,
      ['aria-label']: ariaLabel,
      ...props
    },
    ref,
  ) => (
    <Glass
      role="search"
      rootClassName={styles.root}
      rootStyle={{ width: '100%' }}
      enableLiquidAnimation={!disabled && enableClickAnimation}
      className={styles.searchBar}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="10.8" cy="10.8" r="5.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="m15.2 15.2 4.3 4.3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
      <input
        ref={ref}
        type="search"
        disabled={disabled}
        {...props}
        aria-label={ariaLabel ?? 'Rechercher'}
        className={clsx(styles.input, styles[size], disabled && styles.disabled, className)}
      />
    </Glass>
  ),
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
