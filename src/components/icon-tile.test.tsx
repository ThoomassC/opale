import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IconTile } from './icon-tile';

describe('IconTile', () => {
  describe('tuile décorative', () => {
    it('devrait rendre un <span> par défaut', () => {
      const { container } = render(<IconTile>◆</IconTile>);
      const root = container.firstElementChild;

      expect(root?.tagName).toBe('SPAN');
      expect(root).toHaveClass('tc-icontile');
      expect(root).toHaveClass('tc-icontile--decor');
    });

    // Le décor est posé à côté d'un titre qui porte déjà le sens : l'annoncer
    // n'ajoute rien, et le portfolio le masque explicitement.
    it("devrait se retirer de l'arbre d'accessibilité", () => {
      const { container } = render(<IconTile>◆</IconTile>);

      expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    });

    it("devrait laisser l'appelant reprendre la main sur aria-hidden", () => {
      const { container } = render(<IconTile aria-hidden={false}>◆</IconTile>);

      expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'false');
    });

    it('devrait rendre son contenu', () => {
      const { container } = render(
        <IconTile>
          <svg data-testid="glyphe" />
        </IconTile>,
      );

      expect(container.querySelector('[data-testid="glyphe"]')).not.toBeNull();
    });
  });

  describe('tuile de contrôle', () => {
    it('devrait rendre un <a> quand href est fourni', () => {
      render(
        <IconTile href="https://exemple.test" label="Profil LinkedIn">
          {/* Le glyphe d'un lien-icône est décoratif : c'est le libellé qui
              nomme, comme le fait l'exemple de la documentation. */}
          <span aria-hidden="true">◆</span>
        </IconTile>,
      );

      const link = screen.getByRole('link', { name: 'Profil LinkedIn' });

      expect(link).toHaveAttribute('href', 'https://exemple.test');
      expect(link).toHaveClass('tc-icontile');
    });

    /*
     * LE NOM ACCESSIBLE EST EXIGÉ PAR LE TYPE, ET RENDU PAR LE COMPOSANT
     * (WCAG 4.1.2 et 2.4.4).
     *
     * Avant `label`, `IconTileLinkProps` étendait `ComponentPropsWithoutRef<'a'>`
     * où `aria-label` est facultatif : `<IconTile href="/x"><Glyphe /></IconTile>`
     * compilait, rendait un `<a>` valide, contenait des enfants — donc
     * `jsx-a11y/anchor-has-content` restait muet — et produisait un lien dont le
     * nom accessible était « ◆ », ou rien. VoiceOver annonçait « lien, losange
     * noir ».
     */
    it('devrait rendre le libellé en texte masqué visuellement', () => {
      render(
        <IconTile href="https://exemple.test" label="Profil LinkedIn">
          ◆
        </IconTile>,
      );

      const hidden = screen.getByText('Profil LinkedIn');

      expect(hidden).toHaveClass('tc-visually-hidden');
      expect(screen.getByRole('link')).toContainElement(hidden);
    });

    /*
     * Le glyphe ne suffit pas et n'a jamais suffi : sans `label`, le nom du
     * lien ÉTAIT « ◆ ». Ce que le composant garantit désormais est que le
     * libellé est TOUJOURS dans le nom, quoi que l'appelant mette dedans.
     *
     * CE QU'IL NE GARANTIT PAS, ET LE DIRE ICI EST LE POINT : un glyphe écrit
     * en TEXTE sans `aria-hidden` entre dans le nom, et s'y colle. Le composant
     * ne peut pas l'en retirer — c'est un enfant libre — et l'espace qu'on
     * pourrait glisser dans le texte masqué ne changerait rien : le nom est
     * normalisé. En navigateur réel, `.tc-visually-hidden` est
     * `position: absolute`, donc une boîte de bloc, et la séparation vient de
     * là ; ici jsdom n'applique pas la feuille et le nom reste collé. C'est
     * pourquoi ce test mesure l'INCLUSION du libellé et non le nom exact, et
     * pourquoi la documentation demande `aria-hidden` sur le glyphe.
     */
    it('devrait nommer le lien par son libellé même sous un glyphe non masqué', () => {
      render(
        <IconTile href="https://exemple.test" label="Profil LinkedIn">
          ◆
        </IconTile>,
      );

      expect(screen.getByRole('link').textContent).toContain('Profil LinkedIn');
      expect(screen.queryByRole('link', { name: '◆' })).not.toBeInTheDocument();
    });

    // Un titre visible vaut mieux qu'un nom masqué : `aria-labelledby` gagne
    // sur le contenu au sens de la spécification, et le composant ne l'empêche
    // pas.
    it('devrait laisser aria-labelledby désigner un nom visible', () => {
      render(
        <>
          <span id="titre-lien">Mon profil</span>
          <IconTile
            aria-labelledby="titre-lien"
            href="https://exemple.test"
            label="Profil LinkedIn"
          >
            ◆
          </IconTile>
        </>,
      );

      expect(screen.getByRole('link')).toHaveAccessibleName('Mon profil');
    });

    // L'encre suit le RÔLE : la tuile qui est le seul contenu visible d'un
    // contrôle porte le teal des actions, jamais le cuivre éditorial.
    it("devrait porter l'encre d'action sans qu'on la demande", () => {
      render(
        <IconTile href="https://exemple.test" label="Profil GitHub">
          ◆
        </IconTile>,
      );

      expect(screen.getByRole('link')).toHaveClass('tc-icontile--action');
      expect(screen.getByRole('link')).not.toHaveClass('tc-icontile--decor');
    });

    // Un élément focusable retiré de l'arbre d'accessibilité est un piège au
    // clavier : on l'atteint en tabulant, et rien n'est annoncé.
    it('ne devrait jamais être masqué aux technologies d’assistance', () => {
      render(
        <IconTile href="https://exemple.test" label="Profil GitHub">
          ◆
        </IconTile>,
      );

      expect(screen.getByRole('link')).not.toHaveAttribute('aria-hidden');
    });

    it('devrait transmettre les attributs de lien restants', () => {
      render(
        <IconTile
          href="https://exemple.test"
          label="Profil GitHub (nouvelle fenêtre)"
          rel="noopener noreferrer"
          target="_blank"
        >
          ◆
        </IconTile>,
      );

      const link = screen.getByRole('link');

      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  /*
   * `href=""` NE FAIT PAS UN LIEN. Un `<a href="">` pointe vers l'adresse
   * courante : `<IconTile href={p.url}>` avec une URL vide venue des données
   * rendait un lien dont le clic rechargeait la page. La chaîne vide compte
   * donc pour absente.
   */
  describe('href vide', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Le report de la faute est ATTENDU : on l'observe, on ne l'avale pas. */
    function watchConsoleError() {
      return vi.spyOn(console, 'error').mockImplementation(() => {});
    }

    it('ne devrait pas rendre de lien', () => {
      watchConsoleError();

      const { container } = render(
        <IconTile href="" label="Profil">
          ◆
        </IconTile>,
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(container.firstElementChild?.tagName).toBe('SPAN');
    });

    // `label` n'existe pas en HTML : sans son extraction, React le posait tel
    // quel en attribut sur le `<span>`, tout comme le `href` vide.
    it('ne devrait laisser traîner ni href ni label sur le <span>', () => {
      watchConsoleError();

      const { container } = render(
        <IconTile href="" label="Profil">
          ◆
        </IconTile>,
      );

      expect(container.firstElementChild).not.toHaveAttribute('href');
      expect(container.firstElementChild).not.toHaveAttribute('label');
      expect(container.firstElementChild).toHaveClass('tc-icontile--decor');
    });

    it('devrait signaler la faute en console', () => {
      const spy = watchConsoleError();

      render(
        <IconTile href="" label="Profil">
          ◆
        </IconTile>,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/href="" reçu/);
    });

    it('ne devrait rien signaler pour une tuile décorative normale', () => {
      const spy = watchConsoleError();

      render(<IconTile>◆</IconTile>);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  /*
   * LE SECOND TROU DE LA MÊME FAMILLE, refermé par le type.
   *
   * `IconTileDecorProps` acceptait `tone?: IconTileTone`, donc
   * `<IconTile tone="action">` SANS `href` était légal : un carré de 44 px à
   * l'encre teal — la couleur des actions —, sans rôle, sans nom, sans
   * `aria-hidden`, non focusable, et qui prend même le film de survol de
   * `.tc-icontile--action`. Un objet qui promet une action à l'œil et n'en
   * offre aucune au clavier.
   *
   * Le cas légitime — la tuile est l'unique contenu visible d'un contrôle rendu
   * par l'appelant — passe désormais par la CLASSE, à l'endroit même où
   * l'appelant assume le rôle, le nom et la focusabilité de son contrôle.
   */
  describe('encre d’action sur une tuile sans lien', () => {
    it('devrait être refusée par le type', () => {
      // Consommé par `tsc` : `strict` est actif et `src` entier est dans le
      // programme, donc un `@ts-expect-error` inutile fait échouer le
      // typecheck. Si cette ligne est signalée, c'est l'union qu'il faut
      // réparer, pas le test qu'il faut retirer.
      // @ts-expect-error — `tone="action"` n'existe pas sans `href`.
      const rejected = <IconTile tone="action">◆</IconTile>;

      expect(rejected).toBeTruthy();
    });

    it('devrait rester composable par la classe, dans un contrôle de l’appelant', () => {
      render(
        <button type="button">
          <IconTile className="tc-icontile--action">◆</IconTile>
          <span className="tc-visually-hidden">Ouvrir le menu</span>
        </button>,
      );

      const control = screen.getByRole('button', { name: 'Ouvrir le menu' });
      const tile = control.querySelector('.tc-icontile');

      expect(tile).toHaveClass('tc-icontile--action');
      // La tuile est du décor DANS un contrôle nommé : c'est le contrôle qui
      // porte le nom, la tuile n'a rien à ajouter à l'oreille.
      expect(tile).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('devrait fusionner le className reçu au lieu de l’écraser', () => {
    const { container } = render(<IconTile className="ma-classe">◆</IconTile>);

    expect(container.firstElementChild).toHaveClass('tc-icontile');
    expect(container.firstElementChild).toHaveClass('ma-classe');
  });
});
