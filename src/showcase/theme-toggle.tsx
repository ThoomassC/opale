import { useTheme } from './use-theme';

/**
 * Bascule de thème. **Le seul composant à état de tout le dépôt**, et il vit
 * dans la vitrine : `src/components` reste sans hook.
 *
 * UN BOUTON UNIQUE `aria-pressed`, reprise du portfolio, en remplacement des
 * trois radios de la v0.2.0. Ce qui s'en va avec les radios : le groupe annoncé
 * comme tel, les flèches du clavier gratuites, et l'option retenue lisible sans
 * ARIA. Ce qui s'en va aussi, et il faut le dire : le troisième état. Une fois
 * cliqué, ce bouton ne sait plus rendre la main à `prefers-color-scheme` — le
 * choix est définitif jusqu'au vidage du stockage.
 *
 * LE LIBELLÉ NE BASCULE PAS AVEC L'ÉTAT. Un bouton dont le nom passerait à
 * « Thème clair » en même temps qu'`aria-pressed` devient vrai s'annoncerait
 * « Thème clair, activé » : double négation, et plus personne ne sait ce qui est
 * allumé. Le nom dit la CHOSE — « Thème sombre » — et `aria-pressed` dit le OUI.
 *
 * Le glyphe est TEXTUEL et masqué. Le portfolio tire son croissant de
 * `@tabler/icons-react` ; une librairie de socle qui traîne un paquet d'icônes
 * l'impose à tous ses consommateurs, donc cette dépendance n'entre pas.
 */
export function ThemeToggle() {
  const { isDarkTheme, toggleTheme } = useTheme();

  return (
    <button
      className="tc-doc-themetoggle"
      type="button"
      aria-pressed={isDarkTheme}
      onClick={toggleTheme}
    >
      <span className="tc-doc-themetoggle__glyph" aria-hidden="true">
        ☾
      </span>
      {/* LE LIBELLÉ EST ENVELOPPÉ, et c'est la barre du haut qui l'exige : sous
          36 rem, `doc.css` le masque visuellement pour que la barre tienne sur
          UNE ligne à toute largeur. Un nœud de texte nu n'est pas ciblable par un
          sélecteur, donc l'enveloppe est la condition du repli. Le texte reste
          dans l'arbre d'accessibilité : le bouton garde son nom, seule sa
          présentation change. */}
      <span className="tc-doc-themetoggle__label">Thème sombre</span>
    </button>
  );
}
