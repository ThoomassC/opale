import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { installationPage } from './installation';

afterEach(cleanup);

describe('la page Installation', () => {
  it('montre ses trois commandes dès le premier rendu', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const reveals = container.querySelectorAll('.tc-doc-codeexample__reveal');

    expect(reveals).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Masquer le code' })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Afficher le code' })).not.toBeInTheDocument();

    for (const reveal of reveals) {
      expect(reveal).toHaveAttribute('data-open', 'true');
      expect(reveal).toHaveAttribute('aria-hidden', 'false');
    }
  });

  it('distingue les commandes shell des imports TypeScript', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const languages = [...container.querySelectorAll<HTMLElement>('.tc-doc-code code')].map(
      (code) => code.dataset.language,
    );

    expect(languages).toEqual(['shell', 'shell', 'tsx']);
  });
});
