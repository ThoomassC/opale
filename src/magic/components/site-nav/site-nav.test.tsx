import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteNav, type SiteNavItem } from './site-nav';

const items: readonly SiteNavItem[] = [
  { id: 'map', href: '/map', label: 'Map' },
  { id: 'countries', href: '/countries', label: 'Countries' },
  { id: 'cities', href: '/cities', label: 'Cities' },
  { id: 'about', href: '/about', label: 'About' },
];

const renderNav = (props?: Partial<React.ComponentProps<typeof SiteNav>>) =>
  render(
    <SiteNav
      brand={<a href="/">Travels in World</a>}
      items={items}
      activeItem="map"
      navLabel="Main navigation"
      search={<input aria-label="Search" placeholder="A trip, a place, a country…" />}
      language={{
        current: <span aria-hidden="true">FR</span>,
        label: 'Change language',
        title: 'Language',
        items: [
          { id: 'fr', href: '/fr', label: 'Français', current: true },
          { id: 'en', href: '/en', label: 'English' },
        ],
      }}
      onNavigate={() => undefined}
      {...props}
    />,
  );

describe('SiteNav', () => {
  it('renders the brand, four destinations, search and language disclosure', () => {
    renderNav();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Travels in World' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(7);
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText('Language')).not.toBeVisible();
    expect(screen.getByRole('link', { name: 'Français' })).toHaveAttribute('aria-current', 'true');
  });

  it('moves one active bubble on click, without reacting to hover', () => {
    renderNav();

    const list = screen.getByRole('list');
    const countries = screen.getByRole('link', { name: 'Countries' });

    expect(list).toHaveAttribute('data-active-index', '0');
    fireEvent.mouseEnter(countries);
    expect(list).toHaveAttribute('data-active-index', '0');

    fireEvent.click(countries);
    expect(list).toHaveAttribute('data-active-index', '1');
    expect(countries).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Map' })).not.toHaveAttribute('aria-current');
    expect(list).toHaveAttribute('data-moving', 'true');
  });

  it('delegates client-side navigation while preserving the clicked state', () => {
    const onNavigate = vi.fn();
    renderNav({ onNavigate });

    const countries = screen.getByRole('link', { name: 'Countries' });
    const event = fireEvent.click(countries);

    expect(event).toBe(false);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(items[1], expect.any(Object));
    expect(screen.getByRole('list')).toHaveAttribute('data-active-index', '1');
  });
});
