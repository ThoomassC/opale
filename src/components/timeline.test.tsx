import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Timeline, TimelineItem } from './timeline';

describe('Timeline', () => {
  // `<ol>` et non `<ul>` : l'ordre porte du sens, c'est une chronologie.
  it('devrait rendre une liste ordonnée nommée', () => {
    const { container } = render(
      <Timeline label="Étapes du voyage">
        <TimelineItem>Kyoto</TimelineItem>
      </Timeline>,
    );
    const root = container.firstElementChild;

    expect(root?.tagName).toBe('OL');
    expect(root).toHaveClass('tc-timeline');
    expect(screen.getByRole('list', { name: 'Étapes du voyage' })).toBe(root);
  });

  it('devrait rendre une entrée par enfant', () => {
    render(
      <Timeline label="Étapes du voyage">
        <TimelineItem>Kyoto</TimelineItem>
        <TimelineItem>Osaka</TimelineItem>
      </Timeline>,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  /*
   * CE TEST PASSAIT `aria-labelledby` **ET** `label`, avec la même chaîne
   * écrite deux fois — et c'était la trace du défaut, pas une commodité de
   * test. Le composant recommandait `aria-labelledby` tout en exigeant `label`
   * dans son type, puis posait `aria-label` inconditionnellement : l'appelant
   * qui suivait le conseil devait fournir une chaîne dont la spécification
   * garantit qu'elle sera écrasée. Le type accepte désormais l'un ou l'autre,
   * et refuse leur cumul.
   */
  it('devrait laisser aria-labelledby désigner un titre visible, sans label', () => {
    render(
      <>
        <h2 id="titre-frise">Étapes du voyage</h2>
        <Timeline aria-labelledby="titre-frise">
          <TimelineItem>Kyoto</TimelineItem>
        </Timeline>
      </>,
    );

    const list = screen.getByRole('list', { name: 'Étapes du voyage' });

    expect(list).toHaveAttribute('aria-labelledby', 'titre-frise');
    // Le nom masqué ne double PAS le nom visible : sans cette absence, la
    // spécification écraserait l'un des deux et le code garderait du texte mort.
    expect(list).not.toHaveAttribute('aria-label');
  });

  describe('nommage exclusif, à la compilation', () => {
    // Consommés par `tsc` : `strict` est actif et `src` entier est dans le
    // programme, donc un `@ts-expect-error` inutile fait échouer le typecheck.
    it('devrait refuser les deux noms à la fois', () => {
      // @ts-expect-error — `label` et `aria-labelledby` s'excluent.
      const rejected = <Timeline aria-labelledby="titre-frise" label="Étapes du voyage" />;

      expect(rejected).toBeTruthy();
    });

    it('devrait refuser une frise sans aucun nom', () => {
      // @ts-expect-error — il faut `label` ou `aria-labelledby`.
      const rejected = <Timeline />;

      expect(rejected).toBeTruthy();
    });
  });

  it('devrait fusionner le className reçu au lieu de l’écraser', () => {
    const { container } = render(
      <Timeline className="ma-classe" label="Étapes">
        <TimelineItem>Kyoto</TimelineItem>
      </Timeline>,
    );

    expect(container.firstElementChild).toHaveClass('tc-timeline');
    expect(container.firstElementChild).toHaveClass('ma-classe');
  });
});

describe('TimelineItem', () => {
  it('devrait rendre un <li> et son contenu libre', () => {
    render(
      <ol>
        <TimelineItem>
          <h3>Kyoto</h3>
          <p>Trois jours de temples.</p>
        </TimelineItem>
      </ol>,
    );

    const item = screen.getByRole('listitem');

    expect(item).toHaveClass('tc-timeline__item');
    expect(screen.getByRole('heading', { level: 3, name: 'Kyoto' })).toBeInTheDocument();
    expect(item).toHaveTextContent('Trois jours de temples.');
  });

  // Le contenu vit dans son propre conteneur : c'est lui qui occupe la seconde
  // colonne de la grille, et c'est sur lui que porte la typographie.
  it('devrait envelopper le contenu dans un corps d’entrée', () => {
    render(
      <ol>
        <TimelineItem>Kyoto</TimelineItem>
      </ol>,
    );

    expect(screen.getByRole('listitem').querySelector('.tc-timeline__body')).toHaveTextContent(
      'Kyoto',
    );
  });

  describe('tuile', () => {
    it('devrait rendre la tuile avant le corps et ouvrir la seconde colonne', () => {
      render(
        <ol>
          <TimelineItem icon={<span data-testid="tuile" />}>Kyoto</TimelineItem>
        </ol>,
      );

      const item = screen.getByRole('listitem');

      expect(item).toHaveClass('tc-timeline__item--with-icon');
      expect(item.firstElementChild).toHaveAttribute('data-testid', 'tuile');
      expect(item.lastElementChild).toHaveClass('tc-timeline__body');
    });

    it('ne devrait pas ouvrir la seconde colonne sans tuile', () => {
      render(
        <ol>
          <TimelineItem>Kyoto</TimelineItem>
        </ol>,
      );

      const item = screen.getByRole('listitem');

      expect(item).not.toHaveClass('tc-timeline__item--with-icon');
      expect(item.children).toHaveLength(1);
    });
  });

  /*
   * LE NIVEAU DU TITRE N'EST PLUS LIBRE, ET LE DÉFAUT N'EXISTAIT QU'À L'OREILLE.
   *
   * `timeline.css` stylait `:is(h3, h4)` à l'identique : un `<h4>` posé sous un
   * `<h2>` — saut de niveau, WCAG 1.3.1 — était visuellement indistinguable du
   * `<h3>` correct, donc rien en revue ni à l'écran ne le signalait. Le
   * composant déclare maintenant le niveau, comme `SectionHeading`, et le
   * signale deux fois : la classe du corps ne style que la balise déclarée, et
   * une discordance part en `console.error`.
   */
  describe('niveau du titre', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each<[3 | 4, string]>([
      [3, 'tc-timeline__body--h3'],
      [4, 'tc-timeline__body--h4'],
    ])('devrait porter la classe du niveau %i sur le corps', (level, expected) => {
      render(
        <ol>
          <TimelineItem level={level}>Kyoto</TimelineItem>
        </ol>,
      );

      expect(screen.getByRole('listitem').querySelector('.tc-timeline__body')).toHaveClass(
        expected,
      );
    });

    it('devrait retomber sur le niveau 3 sans niveau fourni', () => {
      render(
        <ol>
          <TimelineItem>Kyoto</TimelineItem>
        </ol>,
      );

      expect(screen.getByRole('listitem').querySelector('.tc-timeline__body')).toHaveClass(
        'tc-timeline__body--h3',
      );
    });

    it('ne devrait rien signaler quand le titre est au niveau déclaré', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ol>
          <TimelineItem level={4}>
            <h4>Kyoto</h4>
          </TimelineItem>
        </ol>,
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it.each(['h2', 'h3', 'h5'] as const)(
      'devrait signaler un <%s> sous un niveau 4 déclaré',
      (tag) => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const Heading = tag;

        render(
          <ol>
            <TimelineItem level={4}>
              <Heading>Kyoto</Heading>
            </TimelineItem>
          </ol>,
        );

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0]).toContain(`<${tag}>`);
      },
    );

    // Le composant rend quand même : un plan de document discutable est un
    // défaut à corriger, pas une raison de ne rien afficher.
    it('devrait rendre l’entrée malgré la discordance', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ol>
          <TimelineItem level={3}>
            <h4>Kyoto</h4>
          </TimelineItem>
        </ol>,
      );

      expect(screen.getByRole('heading', { level: 4, name: 'Kyoto' })).toBeInTheDocument();
    });

    // Limite assumée, écrite pour qu'on ne la découvre pas par surprise :
    // `Children.toArray` ne descend pas dans un fragment ni dans un composant
    // intermédiaire, donc un titre enveloppé échappe au contrôle.
    it('ne devrait pas prétendre voir un titre enveloppé dans un composant', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const Wrapper = () => <h2>Kyoto</h2>;

      render(
        <ol>
          <TimelineItem level={4}>
            <Wrapper />
          </TimelineItem>
        </ol>,
      );

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // L'entrée ne porte aucun matériau : le fond, le liseré et l'ombre viennent
  // de la carte, que l'appelant empile par `className`. Sans cette fusion, la
  // composition serait impossible.
  it('devrait accepter la classe d’une carte par-dessus la sienne', () => {
    render(
      <ol>
        <TimelineItem className="tc-card">Kyoto</TimelineItem>
      </ol>,
    );

    const item = screen.getByRole('listitem');

    expect(item).toHaveClass('tc-timeline__item');
    expect(item).toHaveClass('tc-card');
  });
});
