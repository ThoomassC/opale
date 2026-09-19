import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { DocShell } from './doc-shell';
import { PAGES } from './pages';

afterEach(cleanup);

describe('le sélecteur de langue de la vitrine', () => {
  it('propose français, anglais et espagnol avec le français par défaut', () => {
    render(<DocShell pages={PAGES} />);

    const selector = screen.getByRole('combobox', { name: 'Langue' });
    const options = Array.from(selector.querySelectorAll('option'));

    expect(selector).toHaveValue('FR');
    expect(options.map((option) => [option.value, option.textContent])).toEqual([
      ['FR', 'Français'],
      ['EN', 'English'],
      ['ES', 'Español'],
    ]);
  });

  it('traduit l’interface en anglais puis en espagnol et persiste le choix', async () => {
    const user = userEvent.setup();
    render(<DocShell pages={PAGES} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Langue' }), 'EN');

    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(localStorage.getItem('tc-language')).toBe('EN');
    expect(screen.getAllByRole('link', { name: 'Home' })).not.toHaveLength(0);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'The design system for the Opale ecosystem.',
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ES');

    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(localStorage.getItem('tc-language')).toBe('ES');
    expect(screen.getAllByRole('link', { name: 'Inicio' })).not.toHaveLength(0);
    expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'El sistema de diseño del ecosistema Opale.',
    );
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toHaveValue('ES');
  });
});
