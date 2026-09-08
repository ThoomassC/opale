import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

/**
 * `plain` est la chip du portfolio, et c'est le DÉFAUT.
 *
 * Chez lui (`.experience-stack li`, `.project-stack li`, `.skill-group li`)
 * l'étiquette est neutre et sans variante : le préfixe désigne un EMPLACEMENT,
 * pas un sens. Une chip de stack technique ne « vaut » pas plus qu'une autre,
 * il n'y a donc rien à distinguer.
 *
 * Les trois variantes de charte survivent malgré la règle « le portfolio
 * gagne » : cette règle porte sur ce qu'on obtient PAR DÉFAUT, et `measured |
 * proposed | open` est le seul moyen dont la vitrine dispose pour marquer une
 * donnée mesurée, proposée ou restée ouverte. Les supprimer ferait perdre de
 * l'information à la page de charte sans que personne l'ait demandé.
 */
export type TagVariant = 'plain' | 'measured' | 'proposed' | 'open';

const TAG_GLYPH: Record<Exclude<TagVariant, 'plain'>, string> = {
  measured: '◆',
  proposed: '◇',
  open: '○',
};

export interface TagProps extends ComponentPropsWithoutRef<'span'> {
  /**
   * - `plain` (défaut) — étiquette neutre : pilule sans-serif, aucun glyphe.
   *   C'est la chip de stack technique du portfolio ;
   * - `measured` — donnée mesurée, bordure **pleine**, losange plein ;
   * - `proposed` — proposée et non encore vérifiée, bordure **tiretée**,
   *   losange creux ;
   * - `open` — question ouverte, bordure **pointillée**, cercle creux.
   */
  variant?: TagVariant;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Étiquette. Neutre par défaut ; les trois variantes de charte se distinguent
 * par la **forme de la bordure** (pleine / tiretée / pointillée) et par le
 * glyphe, jamais par la seule couleur : imprimé en noir et blanc, le tableau
 * reste lisible.
 *
 * `plain` n'a ni glyphe ni bordure parlante, et n'en a pas besoin : sans
 * variante concurrente, il n'y a aucune distinction à porter.
 */
export function Tag({ variant = 'plain', className, children, ...rest }: TagProps) {
  return (
    <span className={cx('tc-tag', `tc-tag--${variant}`, className)} {...rest}>
      {variant !== 'plain' && (
        <span className="tc-tag__glyph" aria-hidden="true">
          {TAG_GLYPH[variant]}
        </span>
      )}
      <span className="tc-tag__label">{children}</span>
    </span>
  );
}
