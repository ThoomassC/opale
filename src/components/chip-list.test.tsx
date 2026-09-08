import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChipList } from './chip-list';

describe('ChipList', () => {
  it('devrait rendre une entrée par élément', () => {
    render(<ChipList items={['Bus', 'Train', 'Marche']} label="Transports" />);

    const list = screen.getByRole('list', { name: 'Transports' });

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(list).toHaveTextContent('Bus');
    expect(list).toHaveTextContent('Train');
    expect(list).toHaveTextContent('Marche');
  });

  // Le nom accessible est requis dans le type : une liste qui s'annonce
  // « liste, 6 éléments » laisse l'auditeur deviner ce qu'elle énumère.
  it('devrait nommer la liste avec le libellé reçu', () => {
    render(<ChipList items={['Bus']} label="Transports de l’étape" />);

    expect(screen.getByRole('list', { name: 'Transports de l’étape' })).toBeInTheDocument();
  });

  /*
   * LE CONSEIL ÉTAIT INAPPLICABLE. La documentation recommandait
   * `aria-labelledby` vers un titre visible, et le type exigeait `label` ;
   * le composant posait ensuite `aria-label` inconditionnellement. Suivre le
   * conseil imposait donc d'écrire une chaîne dont la spécification garantit
   * qu'elle sera écrasée : du texte mort. Les deux formes sont maintenant
   * exclusives, et le nom visible est servi seul.
   */
  describe('nommage par un titre visible', () => {
    it('devrait accepter aria-labelledby sans label', () => {
      render(
        <>
          <h3 id="stack">Technologies utilisées chez Blue Soft</h3>
          <ChipList aria-labelledby="stack" items={['Bus']} />
        </>,
      );

      const list = screen.getByRole('list', {
        name: 'Technologies utilisées chez Blue Soft',
      });

      expect(list).toHaveAttribute('aria-labelledby', 'stack');
      expect(list).not.toHaveAttribute('aria-label');
    });

    // Consommés par `tsc` : un `@ts-expect-error` inutile fait échouer le
    // typecheck, donc ces deux lignes exécutent la règle au lieu de la croire.
    it('devrait refuser les deux noms à la fois', () => {
      // @ts-expect-error — `label` et `aria-labelledby` s'excluent.
      const rejected = <ChipList aria-labelledby="stack" items={['Bus']} label="Technologies" />;

      expect(rejected).toBeTruthy();
    });

    it('devrait refuser une liste sans aucun nom', () => {
      // @ts-expect-error — il faut `label` ou `aria-labelledby`.
      const rejected = <ChipList items={['Bus']} />;

      expect(rejected).toBeTruthy();
    });
  });

  // LE CAS QUI JUSTIFIE LE COMPOSANT : une liste vide reste annoncée par les
  // lecteurs d'écran, et son nom accessible affirme alors un contenu qui
  // n'existe pas.
  describe('liste vide', () => {
    it('ne devrait rien rendre du tout', () => {
      const { container } = render(<ChipList items={[]} label="Transports" />);

      expect(container).toBeEmptyDOMElement();
    });

    it('ne devrait pas laisser de liste dans l’arbre d’accessibilité', () => {
      render(<ChipList items={[]} label="Transports" />);

      expect(screen.queryByRole('list')).toBeNull();
    });
  });

  it('devrait rendre une liste non ordonnée : l’ordre des chips ne dit rien', () => {
    const { container } = render(<ChipList items={['Bus']} label="Transports" />);
    const root = container.firstElementChild;

    expect(root?.tagName).toBe('UL');
    expect(root).toHaveClass('tc-chips');
  });

  // Le style de la chip est celui de `Tag` en variante neutre : la liste ne
  // porte que la mise en ligne, elle ne redessine pas la pilule.
  it('devrait rendre chaque entrée comme une étiquette neutre', () => {
    const { container } = render(<ChipList items={['Bus']} label="Transports" />);
    const chip = container.querySelector('li > .tc-tag');

    expect(chip).toHaveClass('tc-tag--plain');
    expect(chip).toHaveTextContent('Bus');
  });

  it('devrait fusionner le className reçu au lieu de l’écraser', () => {
    const { container } = render(
      <ChipList className="ma-classe" items={['Bus']} label="Transports" />,
    );

    expect(container.firstElementChild).toHaveClass('tc-chips');
    expect(container.firstElementChild).toHaveClass('ma-classe');
  });
});
