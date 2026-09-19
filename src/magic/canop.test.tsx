import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CanopButton } from './canop';

afterEach(cleanup);

describe('CanopButton', () => {
  it('utilise button comme type sûr par défaut et respecte un type explicite', () => {
    render(
      <>
        <CanopButton>Action</CanopButton>
        <CanopButton type="submit">Envoyer</CanopButton>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Envoyer' })).toHaveAttribute('type', 'submit');
  });

  it.each(['primary', 'secondary', 'accent', 'danger'] as const)(
    'expose la variante pleine %s',
    (variant) => {
      render(<CanopButton variant={variant}>{variant}</CanopButton>);
      expect(screen.getByRole('button', { name: variant })).toHaveClass(`canop-button--${variant}`);
    },
  );

  it('conserve ghost dans l’API pour les boutons spécialisés existants', () => {
    render(<CanopButton variant="ghost">Action secondaire</CanopButton>);
    expect(screen.getByRole('button', { name: 'Action secondaire' })).toHaveClass(
      'canop-button--ghost',
    );
  });
});
