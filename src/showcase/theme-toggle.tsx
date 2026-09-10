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
 *
 * LE GLYPHE SEUL, ET LE LIBELLÉ RESTE DANS L'ARBRE. Le bouton n'affiche plus
 * son texte : il montre ☾ en clair, ☀ en sombre, c'est-à-dire CE QU'ON
 * OBTIENDRAIT en cliquant. Deux choses ne changent pas pour autant, et c'est
 * la condition pour que ce soit un bouton et non une décoration :
 *
 * — le libellé est toujours rendu, simplement masqué visuellement. Le nom
 *   accessible reste « Thème sombre », donc l'annonce reste « Thème sombre,
 *   bouton, activé ». Un `aria-label` aurait fait la même chose et aurait
 *   perdu la sélection du texte et l'affichage en cas de CSS absente ;
 * — le `title` est ABSENT volontairement. Il ne s'affiche ni au clavier ni au
 *   toucher, il double le nom accessible chez la plupart des lecteurs, et il
 *   n'apparaît qu'après un temps d'arrêt à la souris. Un bouton dont l'usage
 *   dépend d'une infobulle est un bouton qu'on n'a pas su dessiner.
 *
 * `min-inline-size: var(--target-min)` dans `doc.css` garde la cible à 44 px
 * malgré la perte du texte — c'est ce que la perte du texte coûte, et il est
 * payé en géométrie plutôt qu'en accessibilité.
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
      {/* LE GLYPHE SUIT L'ÉTAT, contrairement au libellé. Il montre ce qu'un
          clic DONNERAIT — le croissant quand on est en clair, le soleil quand
          on est en sombre — parce qu'une icône n'a pas de forme affirmative :
          elle ne peut pas dire « sombre, activé », seulement montrer une
          direction. C'est l'inverse du libellé, et les deux sont justes pour
          la même raison. */}
      <span className="tc-doc-themetoggle__glyph" aria-hidden="true">
        {isDarkTheme ? '☀' : '☾'}
      </span>
      {/* Le libellé, désormais masqué à TOUTE largeur et non plus seulement sous
          36 rem. Il reste rendu : c'est lui le nom accessible du bouton. */}
      <span className="tc-visually-hidden">Thème sombre</span>
    </button>
  );
}
