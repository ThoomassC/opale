import { useMaterial } from './use-material';

/**
 * Bascule de matériau — le second bouton de la barre du haut, symétrique de
 * `ThemeToggle`.
 *
 * UN BOUTON `aria-pressed`, et le MÊME IDIOME que la bascule de thème. La
 * décision est déjà prise deux fois dans ce dépôt : `theme-toggle.tsx`
 * documente le remplacement de trois radios par un bouton unique, et le bloc
 * `forced-colors` qui repeint l'état enfoncé en `Highlight` / `HighlightText`
 * vit dans `doc.css`, sur `.tc-doc-themetoggle`. Un `<select>` introduirait un
 * troisième idiome dans une barre qui n'en a qu'un ; des radios rejoueraient ce
 * qui a été retiré.
 *
 * D'OÙ LA CLASSE RÉUTILISÉE, `.tc-doc-themetoggle`, ET NON UNE CLASSE À MOI.
 * Elle donne GRATUITEMENT le langage de contrôle déjà mesuré (liseré
 * `--control-border`, encre `--text-accent`, aplat `--accent` à l'état retenu,
 * anneau de focus à deux couches) ET la dérogation `forced-colors` sans
 * laquelle l'état enfoncé redevient invisible en contraste élevé. Une seconde
 * classe aurait demandé de recopier les deux, donc de les tenir alignées à la
 * main — et d'ouvrir `doc.css`, qui n'est pas à moi.
 *
 * LE LIBELLÉ NE BASCULE PAS AVEC L'ÉTAT, même règle que la bascule de thème :
 * le nom dit la CHOSE — « Verre liquide » — et `aria-pressed` dit le OUI. Un
 * bouton qui s'appellerait « Thème normal » une fois enfoncé s'annoncerait
 * « Thème normal, activé » alors que c'est le verre qui est allumé.
 *
 * Le glyphe est TEXTUEL et masqué, pour la même raison que là-bas : une
 * librairie de socle qui traîne un paquet d'icônes l'impose à tous ses
 * consommateurs, donc `@tabler/icons-react` n'entre pas.
 */
export function MaterialToggle() {
  const { isGlass, toggleMaterial } = useMaterial();

  return (
    <button
      className="tc-doc-themetoggle"
      type="button"
      aria-pressed={isGlass}
      onClick={toggleMaterial}
    >
      <span className="tc-doc-themetoggle__glyph" aria-hidden="true">
        ◍
      </span>
      {/* LE LIBELLÉ EST ENVELOPPÉ, et c'est la barre du haut qui l'exige : sous
          36 rem, `doc.css` le masque visuellement pour que la barre tienne sur
          UNE ligne à toute largeur. Un nœud de texte nu n'est pas ciblable par un
          sélecteur, donc l'enveloppe est la condition du repli. Le texte reste
          dans l'arbre d'accessibilité : le bouton garde son nom, seule sa
          présentation change. */}
      <span className="tc-doc-themetoggle__label">Verre liquide</span>
    </button>
  );
}
