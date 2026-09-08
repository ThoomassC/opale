import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from './tag';
import type { TagVariant } from './tag';

type CharterVariant = Exclude<TagVariant, 'plain'>;

describe('Tag', () => {
  it('devrait afficher son libellé', () => {
    render(<Tag variant="measured">Contraste 7,1</Tag>);

    expect(screen.getByText('Contraste 7,1')).toBeInTheDocument();
  });

  it("ne devrait pas s'annoncer comme une région dynamique", () => {
    render(<Tag variant="open">À vérifier</Tag>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each<[CharterVariant, string]>([
    ['measured', '◆'],
    ['proposed', '◇'],
    ['open', '○'],
  ])('devrait afficher le glyphe de la variante %s sans l’annoncer', (variant, glyph) => {
    render(<Tag variant={variant}>Statut</Tag>);

    const marker = screen.getByText(glyph);

    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  it('devrait ne laisser entendre que le libellé, jamais le glyphe', () => {
    render(
      <>
        <Tag variant="measured" id="tag">
          Mesuré
        </Tag>
        <input aria-label="Jeton" aria-describedby="tag" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Jeton' })).toHaveAccessibleDescription('Mesuré');
  });

  // La variante ne s'entend pas : elle se voit à la forme de la bordure, donc
  // la classe est ici le contrat observable.
  it.each<[TagVariant, string]>([
    ['plain', 'tc-tag--plain'],
    ['measured', 'tc-tag--measured'],
    ['proposed', 'tc-tag--proposed'],
    ['open', 'tc-tag--open'],
  ])('devrait porter la classe de la variante %s', (variant, expected) => {
    const { container } = render(<Tag variant={variant}>Statut</Tag>);
    const root = container.firstElementChild;

    expect(root).toHaveClass('tc-tag');
    expect(root).toHaveClass(expected);
  });

  it('devrait fusionner le className reçu au lieu de l’écraser', () => {
    const { container } = render(<Tag className="tc-doc-chip">TypeScript</Tag>);
    const root = container.firstElementChild;

    expect(root).toHaveClass('tc-tag');
    expect(root).toHaveClass('tc-tag--plain');
    expect(root).toHaveClass('tc-doc-chip');
  });

  describe('variante par défaut', () => {
    // C'est le cœur de l'arbitrage : ce qu'on obtient sans rien demander est la
    // chip du portfolio, pas une variante de charte.
    it('devrait être neutre quand aucune variante n’est demandée', () => {
      const { container } = render(<Tag>TypeScript</Tag>);
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-tag--plain');
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('ne devrait porter aucun glyphe', () => {
      const { container } = render(<Tag>PostgreSQL</Tag>);

      expect(container.querySelector('.tc-tag__glyph')).toBeNull();
    });

    // Sans glyphe, tout le texte du composant EST son libellé : rien ne doit
    // s'ajouter au nom accessible.
    it('devrait exposer son seul libellé comme texte', () => {
      const { container } = render(<Tag>Vitest</Tag>);

      expect(container.firstElementChild).toHaveTextContent(/^Vitest$/);
    });
  });
});
