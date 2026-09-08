import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { AccessibleNameProps } from './accessible-name.js';
import { cx } from './cx.js';
import { Tag } from './tag.js';

interface ChipListOwnProps {
  /**
   * Entrées de la liste. Une liste **vide fait disparaître le composant** :
   * voir la description de {@link ChipList}.
   *
   * Les entrées servent aussi de clé de rendu : deux entrées identiques dans
   * la même liste sont un doublon à corriger côté données, pas ici.
   */
  readonly items: readonly string[];
  ref?: Ref<HTMLUListElement>;
}

/**
 * Le nom de la liste est **requis**, sous l'une de ses deux formes : `label`
 * (posé en `aria-label`) ou `aria-labelledby` vers un titre visible. Voir
 * {@link AccessibleNameProps} — c'est là qu'est écrit pourquoi exiger les deux
 * à la fois, comme le faisait la version précédente, produisait du texte mort.
 */
export type ChipListProps = Omit<
  ComponentPropsWithoutRef<'ul'>,
  'children' | 'aria-label' | 'aria-labelledby'
> &
  ChipListOwnProps &
  AccessibleNameProps;

/**
 * Liste de chips : une suite d'étiquettes neutres, sans ordre.
 *
 * **Rend `null` quand `items` est vide**, plutôt qu'un `<ul>` sans enfant.
 * C'est le comportement utile : une liste vide reste annoncée par les lecteurs
 * d'écran (« liste, 0 élément »), et son nom accessible affirme un contenu qui
 * n'existe pas. La feuille de style double le garde d'un `:empty { display:
 * none }`, qui ne rattrape que les listes écrites à la main hors du composant.
 *
 * ### Le nom : `label` OU `aria-labelledby`, jamais les deux
 * Un nom est exigé, et le type accepte les deux façons de le donner sans
 * accepter leur cumul — voir {@link AccessibleNameProps}. Préférez
 * `aria-labelledby` quand un titre visible porte déjà le nom.
 *
 * `<ul>` et non `<ol>` : l'ordre des chips ne porte pas de sens.
 *
 * Chaque entrée est rendue par `Tag` en variante `plain` — l'étiquette neutre
 * de la librairie, qui **est** la chip du portfolio. La liste ne porte donc que
 * la mise en ligne (flex, retour à la ligne, gouttière).
 *
 * Sans état, sans hook — rendable tel quel en Server Component.
 *
 * ### Ce qui n'a pas été porté
 * Le portfolio a une prop `variant: "experience-stack" | "project-stack"`.
 * Elle ne dit pas ce qu'est la liste, elle dit **où elle est posée** dans sa
 * feuille de style : deux emplacements CSS au rendu identique. Une prop qui ne
 * nomme qu'un emplacement n'a rien à faire dans l'API d'une librairie — elle
 * obligerait chaque appelant à choisir entre deux valeurs sans différence.
 *
 * @example
 * <ChipList label="Technologies de l'étape" items={['Bus', 'Train', 'Marche']} />
 * @example
 * <h3 id="stack-bluesoft">Technologies utilisées chez Blue Soft</h3>
 * <ChipList aria-labelledby="stack-bluesoft" items={stack} />
 */
export function ChipList({ label, items, className, ...rest }: ChipListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    // `aria-label={label}` avec `label` absent ne pose AUCUN attribut : React
    // n'émet rien pour `undefined`. C'est ce qui laisse le champ libre à
    // l'`aria-labelledby` qui arrive par le reste, au lieu de le doubler d'un
    // nom que la spécification écraserait.
    <ul aria-label={label} className={cx('tc-chips', className)} {...rest}>
      {items.map((item) => (
        <li key={item}>
          <Tag>{item}</Tag>
        </li>
      ))}
    </ul>
  );
}
