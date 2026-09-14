import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('renders a labelled search field in a search landmark', () => {
    render(<SearchBar placeholder="Un voyage, un lieu, un pays…" />);

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Rechercher' })).toHaveAttribute(
      'placeholder',
      'Un voyage, un lieu, un pays…',
    );
  });
});
