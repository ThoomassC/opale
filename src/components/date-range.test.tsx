import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateRange } from './date-range';

const START = { dateTime: '2023-09', label: 'Septembre 2023' } as const;
const END = { dateTime: '2025-06', label: 'Juin 2025' } as const;

/** Ce qu'un lecteur d'écran énonce : tout le texte, masqué compris. */
function spoken(root: Element): string {
  return (root.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Ce que l'ŒIL lit : le texte privé de ce qui est masqué visuellement.
 *
 * Les deux couches doivent être mesurées séparément, sinon la correction de
 * `SEPARATOR_LABEL` ne se distingue pas d'un mot ajouté à l'affichage.
 */
function visible(root: Element): string {
  const clone = root.cloneNode(true) as Element;

  for (const hidden of clone.querySelectorAll('.tc-visually-hidden')) {
    hidden.remove();
  }

  return spoken(clone);
}

describe('DateRange', () => {
  // Toute la valeur du composant est là : DEUX `<time dateTime>` distincts. Un
  // `dateTime` unique ne documenterait que la date de début, et la fin ne
  // serait plus qu'un morceau de texte pour toute machine qui lit la page.
  it('devrait rendre deux <time> quand la plage est fermée', () => {
    const { container } = render(<DateRange start={START} end={END} />);

    const marks = container.querySelectorAll('time');

    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveAttribute('datetime', '2023-09');
    expect(marks[0]).toHaveTextContent('Septembre 2023');
    expect(marks[1]).toHaveAttribute('datetime', '2025-06');
    expect(marks[1]).toHaveTextContent('Juin 2025');
  });

  describe('plage ouverte', () => {
    // Pas de `<time>` sur « Aujourd'hui » : il n'y a pas de date à documenter.
    // En poser un obligerait à choisir entre la date du build et celle du
    // rendu, et cette date serait fausse dès le lendemain.
    it("ne devrait rendre qu'un seul <time> et le libellé de fin ouverte", () => {
      const { container } = render(<DateRange start={START} />);
      const root = container.firstElementChild!;

      expect(container.querySelectorAll('time')).toHaveLength(1);
      expect(visible(root)).toBe('Septembre 2023 — Aujourd’hui');
      expect(spoken(root)).toBe('Septembre 2023 à — Aujourd’hui');
    });

    it('devrait accepter un autre libellé de fin ouverte', () => {
      const { container } = render(<DateRange start={START} presentLabel="En cours" />);
      const root = container.firstElementChild!;

      expect(visible(root)).toBe('Septembre 2023 — En cours');
      expect(spoken(root)).toBe('Septembre 2023 à — En cours');
      expect(container.querySelectorAll('time')).toHaveLength(1);
    });

    it('ne devrait pas utiliser le libellé de fin ouverte quand la fin existe', () => {
      const { container } = render(<DateRange start={START} end={END} presentLabel="En cours" />);

      expect(container.firstElementChild).not.toHaveTextContent('En cours');
    });
  });

  /*
   * LE CADRATIN NE SE PRONONCE PAS, ET IL ÉTAIT LE SEUL PORTEUR DE LA RELATION.
   *
   * NVDA, JAWS et VoiceOver, à leur réglage de ponctuation par défaut, passent
   * U+2014 en silence : on entendait « Septembre 2023 Juin 2025 », deux dates
   * juxtaposées, sans savoir laquelle est le début (WCAG 1.3.1). Sur une frise
   * où chaque entrée en porte une, l'ambiguïté est systématique.
   *
   * Les deux couches sont donc mesurées séparément : ce que l'œil lit, et ce
   * que l'oreille entend. Un test sur `textContent` seul ne les distingue pas,
   * et c'est précisément pourquoi le défaut est passé.
   */
  describe('séparation des deux bornes', () => {
    it('devrait garder le cadratin à l’œil', () => {
      const { container } = render(<DateRange start={START} end={END} />);

      expect(visible(container.firstElementChild!)).toBe('Septembre 2023 — Juin 2025');
    });

    it('devrait porter la relation par un MOT à l’oreille', () => {
      const { container } = render(<DateRange start={START} end={END} />);

      expect(spoken(container.firstElementChild!)).toBe('Septembre 2023 à — Juin 2025');
    });

    it('devrait rendre le séparateur parlé en texte masqué visuellement', () => {
      const { container } = render(<DateRange start={START} end={END} />);
      const separator = container.querySelector('.tc-visually-hidden');

      expect(separator).not.toBeNull();
      expect(separator?.textContent?.trim()).toBe('à');
    });

    // Réglé sur « toute la ponctuation », un lecteur d'écran annoncerait
    // « à tiret cadratin » : le glyphe est un doublon visuel du mot, donc il
    // sort de l'arbre d'accessibilité.
    it('devrait retirer le cadratin de l’arbre d’accessibilité', () => {
      const { container } = render(<DateRange start={START} end={END} />);
      const dash = [...container.querySelectorAll('span')].find((node) =>
        node.textContent?.includes('—'),
      );

      expect(dash).toBeDefined();
      expect(dash).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('devrait rendre un paragraphe portant la classe du composant', () => {
    const { container } = render(<DateRange start={START} end={END} />);
    const root = container.firstElementChild;

    expect(root?.tagName).toBe('P');
    expect(root).toHaveClass('tc-daterange');
  });

  it('devrait fusionner le className reçu au lieu de l’écraser', () => {
    const { container } = render(<DateRange className="ma-classe" start={START} end={END} />);

    expect(container.firstElementChild).toHaveClass('tc-daterange');
    expect(container.firstElementChild).toHaveClass('ma-classe');
  });

  it('devrait transmettre les attributs restants au paragraphe', () => {
    render(<DateRange data-testid="plage" start={START} end={END} />);

    expect(screen.getByTestId('plage')).toBeInTheDocument();
  });
});
