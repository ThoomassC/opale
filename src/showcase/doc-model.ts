import type { ReactNode } from 'react';

/* =============================================================================
   LE MODÈLE DE LA VITRINE — une page par sujet, une entrée de nav par page.

   La vitrine était UNE page de charte qui déroulait sept sections ; elle est
   désormais un site de documentation : une barre de navigation à gauche, une
   page à droite, et une entrée de navigation par composant publié. Le routage
   passe par le FRAGMENT (`#/composants/button`) et non par l'historique
   `pushState` : la vitrine est servie en statique depuis `dist-showcase/`, sans
   serveur capable de réécrire une URL profonde vers `index.html`. Un chemin
   réel se casserait donc au premier rechargement, et au premier lien partagé.

   Ce fichier ne contient que le MODÈLE — les types, les groupes, la lecture du
   fragment. Les pages elles-mêmes vivent dans `pages/`, la coquille dans
   `doc-shell.tsx` : aucun des deux n'a besoin de connaître l'autre.
   ========================================================================== */

/** Les quatre familles de la barre de gauche, dans l'ordre où elle les sert. */
export type DocGroupId = 'introduction' | 'fondations' | 'composants' | 'compositions';

export interface DocGroup {
  readonly id: DocGroupId;
  readonly label: string;
  /** Une ligne sous le titre du groupe. Absente, le groupe n'en affiche pas. */
  readonly note?: string;
}

export const GROUPS: readonly DocGroup[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'fondations', label: 'Fondations', note: 'Ce que les composants consomment.' },
  { id: 'composants', label: 'Composants', note: 'Un par entrée publiée.' },
  { id: 'compositions', label: 'Compositions', note: 'Ce qui ne se juge qu’assemblé.' },
];

export interface DocPage {
  /** Le fragment sans son préfixe. `''` est l'accueil. */
  readonly slug: string;
  /** Le libellé dans la barre de gauche — court, c'est une colonne étroite. */
  readonly label: string;
  readonly group: DocGroupId;
  /** Le `<h1>` de la page, et le titre du document. */
  readonly title: string;
  /** Le chapeau, rendu par la coquille juste sous le titre. */
  readonly lede?: ReactNode;
  /**
   * Le corps de la page. Une FONCTION et non un `ReactNode` : le registre est
   * un module de premier niveau, donc évalué à l'import — un nœud construit
   * là rendrait les quinze pages non affichées à chaque chargement.
   */
  readonly render: () => ReactNode;
}

/** L'accueil. Sert aussi de repli pour un fragment qu'on ne connaît pas. */
export const HOME_SLUG = '';

/**
 * Le fragment d'une page, lu sans confiance.
 *
 * Tolérant par nécessité : les spécimens contiennent des liens écrits à la
 * main du temps où la vitrine tenait sur une page — `href="#palette"` — et
 * un visiteur qui tape une adresse ajoute ou oublie la barre oblique. Les
 * quatre formes `#/palette`, `#palette`, `#/palette/` et `palette` désignent
 * donc la même page.
 */
export function parseSlug(hash: string): string {
  let raw = hash.trim();

  if (raw.startsWith('#')) raw = raw.slice(1);

  /* Le fragment arrive percent-encodé quand le navigateur l'a normalisé. Un
     fragment malformé (`%E0%`) fait lever `decodeURIComponent` : la vitrine
     doit alors servir l'accueil, pas une page blanche. */
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return HOME_SLUG;
  }

  return raw.replace(/^\/+/, '').replace(/\/+$/, '');
}

/** L'adresse d'une page. Toujours préfixée `#/` : c'est la forme canonique. */
export function hrefFor(slug: string): string {
  return `#/${slug}`;
}

/** La page d'un fragment, ou `undefined` — la coquille décide du repli. */
export function findPage(pages: readonly DocPage[], slug: string): DocPage | undefined {
  return pages.find((page) => page.slug === slug);
}
