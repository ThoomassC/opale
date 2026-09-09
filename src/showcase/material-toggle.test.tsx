import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MaterialToggle } from './material-toggle';

const STORAGE_KEY = 'tc-material';

/** Le nom accessible, écrit une seule fois : il ne bascule jamais avec l'état. */
const TOGGLE_NAME = 'Verre liquide';

describe('MaterialToggle', () => {
  it('devrait rendre UN bouton, et un seul', () => {
    render(<MaterialToggle />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  /* L'IDIOME EST DÉJÀ CHOISI DANS CE DÉPÔT, deux fois, et ce garde le rappelle.
     `theme-toggle.tsx` documente le remplacement de trois radios par un bouton
     unique `aria-pressed` : des radios rejoueraient ce qui a été retiré. Et un
     `<select>` introduirait un TROISIÈME idiome dans une barre qui n'en a
     qu'un, avec son propre clavier et ses propres annonces. */
  it('ne devrait être ni un groupe de radios ni une liste déroulante', () => {
    render(<MaterialToggle />);

    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(screen.queryAllByRole('listbox')).toHaveLength(0);
  });

  it('devrait garder le nom accessible « Verre liquide » quand il est relâché', () => {
    render(<MaterialToggle />);

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAccessibleName(TOGGLE_NAME);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('devrait garder le nom accessible « Verre liquide » quand il est enfoncé', () => {
    // LE NOM NE BASCULE PAS AVEC L'ÉTAT, même règle que la bascule de thème. Un
    // bouton qui s'appellerait « Thème normal » une fois enfoncé s'annoncerait
    // « Thème normal, activé » alors que c'est le VERRE qui est allumé : double
    // négation, et plus personne ne sait ce qui est en cours. Le nom dit la
    // CHOSE, `aria-pressed` dit le OUI.
    window.localStorage.setItem(STORAGE_KEY, 'glass');

    render(<MaterialToggle />);

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAccessibleName(TOGGLE_NAME);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('devrait garder le même nom accessible de part et d’autre d’un clic', async () => {
    const user = userEvent.setup();
    render(<MaterialToggle />);

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    // Le MÊME nœud, le MÊME nom : seul l'état a bougé.
    expect(screen.getByRole('button')).toBe(toggle);
    expect(toggle).toHaveAccessibleName(TOGGLE_NAME);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('devrait poser le matériau sur le document et le mémoriser au clic', async () => {
    const user = userEvent.setup();
    render(<MaterialToggle />);

    await user.click(screen.getByRole('button', { name: TOGGLE_NAME }));

    expect(document.documentElement).toHaveAttribute('data-material', 'glass');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('glass');
  });

  it('devrait RETIRER l’attribut au second clic, et non écrire « flat »', async () => {
    const user = userEvent.setup();
    render(<MaterialToggle />);
    const toggle = screen.getByRole('button', { name: TOGGLE_NAME });

    await user.click(toggle);
    await user.click(toggle);

    expect(
      document.documentElement.getAttribute('data-material'),
      `le second clic laisse data-material="${document.documentElement.getAttribute('data-material')}" ` +
        `— l'aplat est l'ABSENCE d'attribut`,
    ).toBeNull();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  /* ==========================================================================
     LA CLASSE RÉUTILISÉE, et c'est un garde et non un détail d'habillage.

     `.tc-doc-themetoggle` porte dans `doc.css` la dérogation `forced-colors`
     qui repeint l'état enfoncé en `Highlight` / `HighlightText` — sans elle,
     l'état enfoncé, peint par un simple aplat, redevient INVISIBLE en contraste
     élevé, et l'anneau de focus repasse en couleurs d'auteur sur un fond
     système. La réutiliser donne les deux gratuitement et laisse `doc.css`
     intact ; une classe à moi aurait demandé de recopier la dérogation, donc de
     la tenir alignée à la main.

     Non mesurable ici — jsdom ne peint pas et n'évalue aucun
     `@media (forced-colors)`. Ce qui est vérifié, c'est que le bouton est bien
     dans la portée de la règle.
     ======================================================================== */
  it('devrait réutiliser la classe de la bascule de thème', () => {
    render(<MaterialToggle />);

    expect(
      screen.getByRole('button'),
      `hors de la portée de .tc-doc-themetoggle : le bouton perd le langage de ` +
        `contrôle déjà mesuré ET la dérogation forced-colors de doc.css`,
    ).toHaveClass('tc-doc-themetoggle');
  });

  it('devrait masquer son glyphe aux technologies d’assistance', () => {
    // Un glyphe TEXTUEL et masqué : `@tabler/icons-react` n'est pas une
    // dépendance de ce dépôt et ne doit pas le devenir. Masqué, sans quoi le
    // bouton s'appellerait « ◍ Verre liquide ».
    const { container } = render(<MaterialToggle />);

    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph).not.toBeNull();
    expect(glyph).toHaveClass('tc-doc-themetoggle__glyph');
    expect(screen.getByRole('button')).toHaveAccessibleName(TOGGLE_NAME);
  });

  it('devrait être un bouton de type button, hors de toute soumission', () => {
    render(<MaterialToggle />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
