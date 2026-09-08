import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Pill } from './pill';
import type { PillTone } from './pill';

describe('Pill', () => {
  it('devrait afficher son libellé', () => {
    render(<Pill tone="done">Obtenu</Pill>);

    expect(screen.getByText('Obtenu')).toBeInTheDocument();
  });

  it("ne devrait pas s'annoncer comme une région dynamique", () => {
    render(<Pill tone="upcoming">À venir</Pill>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each<[PillTone, string]>([
    ['done', '✓'],
    ['progress', '◐'],
    ['upcoming', '○'],
  ])('devrait afficher le glyphe de la tonalité %s sans l’annoncer', (tone, glyph) => {
    render(<Pill tone={tone}>Statut</Pill>);

    const marker = screen.getByText(glyph);

    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  // Les trois glyphes se distinguent par le REMPLISSAGE, donc en niveaux de
  // gris : plein, à moitié, vide. C'est la seule distinction qui survive à la
  // deutéranopie, où les trois aplats tombent à 1,06–1,21:1 les uns des autres.
  it('devrait employer trois glyphes deux à deux distincts', () => {
    const glyphs = (['done', 'progress', 'upcoming'] as const).map((tone) => {
      const { container } = render(<Pill tone={tone}>Statut</Pill>);
      return container.querySelector('.tc-pill__glyph')?.textContent;
    });

    expect(new Set(glyphs).size).toBe(3);
  });

  it('devrait ne laisser entendre que le libellé, jamais le glyphe', () => {
    render(
      <>
        <Pill tone="done" id="pill">
          Obtenu
        </Pill>
        <input aria-label="Titre" aria-describedby="pill" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Titre' })).toHaveAccessibleDescription('Obtenu');
  });

  // La tonalité n'a pas d'écho accessible ; la classe est son seul contrat.
  it.each<[PillTone, string]>([
    ['done', 'tc-pill--done'],
    ['progress', 'tc-pill--progress'],
    ['upcoming', 'tc-pill--upcoming'],
  ])('devrait porter la classe de la tonalité %s', (tone, expected) => {
    const { container } = render(<Pill tone={tone}>Statut</Pill>);
    const root = container.firstElementChild;

    expect(root).toHaveClass('tc-pill');
    expect(root).toHaveClass(expected);
  });

  it('devrait fusionner le className reçu au lieu de l’écraser', () => {
    const { container } = render(
      <Pill tone="progress" className="tc-doc-state--hover">
        En cours
      </Pill>,
    );
    const root = container.firstElementChild;

    expect(root).toHaveClass('tc-pill');
    expect(root).toHaveClass('tc-pill--progress');
    expect(root).toHaveClass('tc-doc-state--hover');
  });

  /*
   * CES SIX CAS EXIGEAIENT UN `throw`, ET C'ÉTAIT LA MAUVAISE EXIGENCE.
   *
   * Le raisonnement de l'ancienne version — « les deux consommateurs sont
   * prérendus, la faute se voit au build » — est faux : `portfolio` fait
   * `tsc -b && vite build`, sans `react-dom/server` ni plugin de prérendu, son
   * `main.tsx` est un `createRoot` nu, et il n'a aucun `ErrorBoundary`. Une
   * pastille sans libellé démontait donc la racine React au chargement : page
   * blanche pour tous les visiteurs.
   *
   * Les six cas restent, avec l'attente inversée : la pastille se rend, son
   * libellé de repli est celui du ton, et la faute part en `console.error`. Le
   * contrat n'a pas bougé — « le libellé est le garde-fou réel et il est
   * toujours rendu » — seule sa sanction a changé de nature.
   */
  describe('libellé manquant', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Le `console.error` du repli est ATTENDU : on l'observe, on ne l'avale pas. */
    function watchConsoleError() {
      return vi.spyOn(console, 'error').mockImplementation(() => {});
    }

    const MISSING: ReadonlyArray<[string, React.ReactNode]> = [
      ['une chaîne vide', ''],
      ['une chaîne d’espaces', '   '],
      ['undefined', undefined],
      ['null', null],
      ['false', false],
      ['un tableau de vides', ['', null]],
    ];

    it.each(MISSING)(
      'devrait se rendre quand même plutôt que de démonter la page — %s',
      (_label, children) => {
        watchConsoleError();

        const { container } = render(<Pill tone="done">{children}</Pill>);

        expect(container.firstElementChild).toHaveClass('tc-pill');
      },
    );

    it.each(MISSING)('devrait replier sur le nom du ton — %s', (_label, children) => {
      watchConsoleError();

      render(<Pill tone="done">{children}</Pill>);

      expect(screen.getByText('Acquis')).toHaveClass('tc-pill__label');
    });

    it.each<[string, 'done' | 'progress' | 'upcoming', string]>([
      ['done', 'done', 'Acquis'],
      ['progress', 'progress', 'En cours'],
      ['upcoming', 'upcoming', 'À venir'],
    ])('devrait replier sur le libellé du ton %s', (_label, tone, expected) => {
      watchConsoleError();

      render(<Pill tone={tone}>{''}</Pill>);

      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it.each(MISSING)('devrait signaler la faute en console — %s', (_label, children) => {
      const spy = watchConsoleError();

      render(<Pill tone="progress">{children}</Pill>);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/aucun libellé textuel reçu/);
    });

    // Le repli reste ANNONCÉ : sans lui la pastille n'aurait plus que sa
    // couleur, et les trois tons sont mesurés indiscernables en deutéranopie.
    it('devrait laisser entendre le libellé de repli', () => {
      watchConsoleError();

      render(
        <>
          <Pill tone="upcoming" id="pill">
            {''}
          </Pill>
          <input aria-label="Titre" aria-describedby="pill" />
        </>,
      );

      expect(screen.getByRole('textbox', { name: 'Titre' })).toHaveAccessibleDescription('À venir');
    });

    it('ne devrait rien signaler quand le libellé est fourni', () => {
      const spy = watchConsoleError();

      render(<Pill tone="done">Obtenu</Pill>);

      expect(spy).not.toHaveBeenCalled();
    });

    it('devrait accepter un libellé numérique, y compris zéro', () => {
      const spy = watchConsoleError();

      render(<Pill tone="progress">{0}</Pill>);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
