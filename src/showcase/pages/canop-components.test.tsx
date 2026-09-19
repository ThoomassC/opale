import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { opaleComponentPages } from './canop-components';

afterEach(cleanup);

function renderButtonPage() {
  const page = opaleComponentPages.find((entry) => entry.label === 'Button');

  if (!page) throw new Error('La page Button du catalogue Opale est introuvable.');

  return render(<>{page.render()}</>);
}

describe('la page V3 de Button', () => {
  it('montre les quatre variantes pleines dans le même ordre que CanopUI', () => {
    const { container } = renderButtonPage();
    const row = container.querySelector('.tc-doc-canop-preview__row');

    expect(row).not.toBeNull();

    const buttons = within(row as HTMLElement).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Primaire',
      'Secondaire',
      'Accent',
      'Danger',
    ]);
    expect(buttons[3]).toHaveClass('canop-button--danger');
    expect(screen.queryByRole('button', { name: 'Ghost' })).not.toBeInTheDocument();
  });

  it('affiche le code exact de la rangée depuis sa commande', async () => {
    const user = userEvent.setup();
    renderButtonPage();

    await user.click(screen.getByRole('button', { name: 'Afficher le code' }));

    const code = screen.getByRole('group', {
      name: 'Exemple Button, défilement horizontal',
    });
    expect(code).toHaveTextContent('<Opale.Button variant="primary">Primaire</Opale.Button>');
    expect(code).toHaveTextContent('<Opale.Button variant="danger">Danger</Opale.Button>');
  });
});
