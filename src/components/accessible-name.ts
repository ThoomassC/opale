/**
 * LES DEUX FAÇONS DE NOMMER UN GROUPE, ET LE TYPE QUI EN EXIGE UNE.
 *
 * `ChipList` et `Timeline` rendent tous deux une liste, et une liste sans nom
 * ne dit rien à qui l'écoute : « liste, 6 éléments ». Le nom est donc requis —
 * mais il y a **deux** manières de le donner, et les deux composants
 * documentaient la meilleure tout en rendant l'autre obligatoire :
 *
 * > « Si un titre visible porte déjà ce nom, passez `aria-labelledby` vers
 * >   lui : il gagne sur `aria-label` au sens de la spécification. »
 *
 * …au-dessus d'un `label: string` **requis**, que le composant posait
 * inconditionnellement en `aria-label`. L'appelant qui suivait le conseil
 * devait donc fournir une chaîne dont la spécification garantit qu'elle sera
 * écrasée : du texte mort dans son code, et un conseil inapplicable. Le test
 * de la frise en portait la trace — il passait `aria-labelledby` ET `label`,
 * avec la même valeur écrite deux fois.
 *
 * Ce type rend le conseil applicable : **l'un ou l'autre, jamais ni l'un ni
 * l'autre, et jamais les deux.** Les `never` sont ce qui interdit la
 * combinaison — sans eux, TypeScript accepterait un objet qui satisfait les
 * deux branches à la fois, et on retomberait sur le texte mort.
 *
 * Un nom VISIBLE reste préférable à un nom masqué : `aria-labelledby` d'abord,
 * `label` quand rien à l'écran ne porte déjà le nom.
 */
export type AccessibleNameProps =
  | {
      /**
       * Nom accessible du groupe, posé en `aria-label`.
       *
       * Nommez ce que la liste énumère ET son rattachement : « Technologies
       * utilisées chez Blue Soft » vaut mieux que « Technologies », répété six
       * fois dans la page.
       */
      readonly label: string;
      readonly 'aria-labelledby'?: never;
    }
  | {
      /**
       * Identifiant d'un élément **visible** qui porte déjà ce nom — un titre
       * de section, typiquement. Il gagne sur `aria-label` au sens de la
       * spécification, donc `label` devient non seulement inutile mais
       * trompeur : le type l'interdit.
       */
      readonly 'aria-labelledby': string;
      readonly label?: never;
    };
