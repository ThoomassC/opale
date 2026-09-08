import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';
import type { CardElevation, CardProps } from './card';

/**
 * Ce que le TYPE refuse, vérifié à la compilation et non au rendu.
 *
 * `variant="glass"` avec un cran d'élévation est la seule combinaison
 * contradictoire que l'API rend possible à écrire ; elle est refusée par
 * l'union (`elevation?: never` sur la branche verre). Sans cette assertion,
 * élargir le type par mégarde rendrait la prop silencieusement ignorée — le
 * défaut exact que l'API cherche à éviter. Le témoin positif est là pour que
 * l'assertion ne passe pas par accident en refusant tout.
 */
type Rejects<T> = T extends CardProps ? never : 'refusé';
type Accepts<T> = T extends CardProps ? 'accepté' : never;

const GLASS_WITH_ELEVATION: Rejects<{ variant: 'glass'; elevation: 2 }> = 'refusé';
const FLAT_WITH_ELEVATION: Accepts<{ variant: 'flat'; elevation: 2 }> = 'accepté';

describe('Card', () => {
  it('devrait rendre son contenu', () => {
    render(
      <Card>
        <h2>Titre</h2>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Titre' })).toBeInTheDocument();
  });

  it("ne devrait imposer aucun rôle : la sémantique appartient à l'appelant", () => {
    render(
      <Card>
        <article>Contenu</article>
      </Card>,
    );

    // Une carte purement présentationnelle ne doit pas apparaître comme
    // région ou article dans l'arbre d'accessibilité — seul l'enfant compte.
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  // Le mandat : le portfolio gagne. Le verre n'est donc pas une option qu'on
  // demande, c'est ce qu'on obtient sans rien demander.
  describe('verre', () => {
    it('devrait être le rendu par défaut, sans aucune prop', () => {
      const { container } = render(<Card>Contenu</Card>);
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-card');
      expect(root).toHaveClass('tc-card--glass');
    });

    it('devrait donner le même rendu quand `glass` est demandé explicitement', () => {
      const { container } = render(<Card variant="glass">Contenu</Card>);

      expect(container.firstElementChild).toHaveClass('tc-card--glass');
    });

    /*
     * Le verre porte son ombre en dur dans la feuille. Poser en plus un cran
     * d'élévation mettrait deux `box-shadow` de même spécificité en
     * concurrence, et l'ordre du document déciderait à la place de l'appelant.
     */
    it('ne devrait porter aucun cran d’élévation', () => {
      const { container } = render(<Card>Contenu</Card>);
      const className = container.firstElementChild?.getAttribute('class') ?? '';

      expect(className).not.toMatch(/tc-card--elev-/);
    });

    it('devrait refuser un cran d’élévation à la compilation', () => {
      expect(GLASS_WITH_ELEVATION).toBe('refusé');
      expect(FLAT_WITH_ELEVATION).toBe('accepté');
    });
  });

  // L'élévation est purement visuelle : la classe est ici tout le contrat.
  // Elle appartient désormais à la seule variante opaque.
  describe('élévation (variante opaque)', () => {
    it.each<[CardElevation, string]>([
      [0, 'tc-card--elev-0'],
      [1, 'tc-card--elev-1'],
      [2, 'tc-card--elev-2'],
      [3, 'tc-card--elev-3'],
    ])('devrait porter la classe du cran %i', (elevation, expected) => {
      const { container } = render(
        <Card variant="flat" elevation={elevation}>
          Contenu
        </Card>,
      );
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-card');
      expect(root).toHaveClass(expected);
      expect(root).not.toHaveClass('tc-card--glass');
    });

    it('devrait retomber sur le cran 0 quand `flat` est demandé sans cran', () => {
      const { container } = render(<Card variant="flat">Contenu</Card>);

      expect(container.firstElementChild).toHaveClass('tc-card--elev-0');
    });

    /*
     * Passer un cran est en soi le choix du matériau opaque : c'est le seul
     * des deux à en avoir un. L'inférence évite d'exiger deux props pour dire
     * une seule chose, et le type refuse l'écriture qui la contredirait.
     */
    it('devrait déduire la variante opaque d’un cran fourni seul', () => {
      const { container } = render(<Card elevation={2}>Contenu</Card>);
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-card--elev-2');
      expect(root).not.toHaveClass('tc-card--glass');
    });

    it('devrait ne poser qu’un seul cran à la fois', () => {
      const { container } = render(<Card elevation={2}>Contenu</Card>);
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-card--elev-2');
      expect(root).not.toHaveClass('tc-card--elev-0');
    });
  });
});
