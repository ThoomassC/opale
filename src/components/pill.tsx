import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

/**
 * L'axe de la pastille est l'AVANCEMENT, pas la sévérité.
 *
 * `success | warning | danger` a quitté ce composant : ce vocabulaire vit dans
 * `Message` (`--ok | --warn | --error`, sur les lavis `--*-quiet`). Une
 * composante, un vocabulaire — sinon deux composants prétendent porter le même
 * sens et rien ne dit lequel choisir.
 *
 * Les trois tons sont exactement ceux du portfolio
 * (`.project-status--completed|in-progress|upcoming`, mêmes règles pour
 * `.education-status--*` : deux préfixes pour un seul rendu) et servent les
 * jetons appariés `--status-{done,progress,upcoming}-{surface,text}`.
 */
export type PillTone = 'done' | 'progress' | 'upcoming';

/**
 * LE GLYPHE RESTE, ET C'EST DÉLIBÉRÉ CONTRE LA RÈGLE « LE PORTFOLIO GAGNE ».
 *
 * Le portfolio n'a rien à cet emplacement : il n'y a donc pas de version
 * concurrente à faire gagner, le glyphe est strictement additif. Et sa propre
 * feuille (`portfolio/src/index.css`, note de `--status-*`) explique pourquoi il
 * en faut un : en simulation deutéranope (Viénot, Brettel & Mollon 1999),
 * l'ambre `#ffe0af` et le violet `#e6d6ff` tombent à 1,16:1 l'un contre
 * l'autre — indiscernables ; en thème sombre les trois pastilles s'effondrent
 * ensemble à 1,06 / 1,21 / 1,14:1. « LE GARDE-FOU RÉEL EST LE LIBELLÉ
 * TEXTUEL », écrit-elle en majuscules.
 *
 * Les trois formes se séparent donc en niveaux de gris : plein, à moitié
 * rempli, vide — la progression se lit dans le remplissage.
 */
const PILL_GLYPH: Record<PillTone, string> = {
  done: '✓',
  progress: '◐',
  upcoming: '○',
};

/**
 * LE LIBELLÉ DE REPLI, dérivé du seul renseignement dont le composant est sûr.
 *
 * `tone` est requis, donc il est toujours là : quand `children` ne produit
 * aucun texte, le nom du ton est un libellé JUSTE — moins précis que celui que
 * l'appelant aurait dû fournir, mais jamais faux. C'est ce qui permet de tenir
 * le contrat (« une pastille rend toujours un libellé ») sans avoir à choisir
 * entre publier une pastille muette et démonter la page.
 */
const PILL_FALLBACK_LABEL: Record<PillTone, string> = {
  done: 'Acquis',
  progress: 'En cours',
  upcoming: 'À venir',
};

export interface PillProps extends ComponentPropsWithoutRef<'span'> {
  /**
   * Avancement :
   * - `done` — acquis, obtenu, terminé ;
   * - `progress` — en cours ;
   * - `upcoming` — à venir.
   */
  tone: PillTone;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Vrai dès qu'un libellé lisible atteindra le DOM.
 *
 * Limite assumée : un élément React est tenu pour visible sans être inspecté.
 * `<Pill tone="done"><span /></Pill>` passe donc le garde — descendre dans un
 * arbre d'éléments demanderait de connaître le rendu de chaque enfant, ce qu'un
 * composant ne peut pas faire. Le garde attrape le mode de défaillance réel :
 * une chaîne vide ou absente venue des données (`{project.status}`).
 */
function hasVisibleLabel(children: PillProps['children']): boolean {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return false;
  }
  if (typeof children === 'string') return children.trim().length > 0;
  if (typeof children === 'number' || typeof children === 'bigint') return true;
  if (Array.isArray(children)) return children.some(hasVisibleLabel);
  return true;
}

/**
 * Pastille d'avancement. `tone` est **requis** : une pastille sans état
 * n'existe pas dans cette charte.
 *
 * Le sens ne repose jamais sur la couleur : chaque pastille porte un glyphe
 * (masqué aux technologies d'assistance, il double le texte) **et** un libellé
 * lisible. Ce libellé est le garde-fou réel — la couleur des trois tons est
 * mesurée indiscernable en deutéranopie —, donc il est **toujours rendu** :
 * quand `children` n'en produit aucun, le nom du ton prend sa place et la faute
 * part en `console.error`.
 *
 * ### Pourquoi ce composant NE LÈVE PLUS
 * Il levait, et le raisonnement écrit ici était « les deux consommateurs sont
 * prérendus, la faute se voit au build et non chez le visiteur ». **C'est faux,
 * et vérifié faux** : `portfolio/package.json` fait `tsc -b && vite build`,
 * sans `react-dom/server` ni plugin de prérendu ; `portfolio/src/main.tsx` est
 * un `createRoot` nu ; il n'y a pas d'`ErrorBoundary` dans `portfolio/src`. Un
 * `vite build` ne rend AUCUN composant React. `<Pill tone={s.tone}>{s.label}
 * </Pill>` avec un libellé vide passait donc le build, passait `tsc`, et
 * démontait la racine React au chargement : page blanche pour tous les
 * visiteurs, à cause d'une pastille.
 *
 * Le repli est le seul arbitrage défendable entre les deux fautes possibles.
 * Une pastille dont le libellé est « En cours » au lieu de « En cours depuis
 * mars » est un défaut de PRÉCISION sur un élément ; une racine démontée est la
 * perte TOTALE du contenu pour tout le monde. Et le contrat, lui, tient : il
 * disait « le libellé est le garde-fou réel et il est toujours rendu », pas
 * « le composant échoue ».
 *
 * ### Ce que le garde n'attrape pas, et ne peut pas attraper
 * `hasVisibleLabel` tient tout élément React pour visible sans l'inspecter,
 * donc `<Pill><span>{''}</span></Pill>` passe à travers et rend une pastille
 * muette. Descendre dans un arbre d'enfants demanderait de connaître le rendu
 * de chacun, ce qu'un composant ne peut pas faire. Le mode de défaillance réel
 * — une chaîne vide venue des données — est, lui, couvert.
 */
export function Pill({ tone, className, children, ...rest }: PillProps) {
  const missing = !hasVisibleLabel(children);
  const label = missing ? PILL_FALLBACK_LABEL[tone] : children;

  if (missing) {
    // `console.error` et non un `throw` : la faute doit rester bruyante pour
    // l'auteur — elle apparaît dans la console du navigateur comme dans la
    // sortie des tests — sans devenir fatale pour le visiteur.
    console.error(
      `Pill: aucun libellé textuel reçu (tone="${tone}"), repli sur « ${label} ». La couleur ` +
        'est un renfort, jamais le porteur de l’information : les trois pastilles ' +
        'd’avancement sont mesurées indiscernables en deutéranopie, et le libellé est le ' +
        'garde-fou réel. Fournissez-le.',
    );
  }

  return (
    <span className={cx('tc-pill', `tc-pill--${tone}`, className)} {...rest}>
      <span className="tc-pill__glyph" aria-hidden="true">
        {PILL_GLYPH[tone]}
      </span>
      <span className="tc-pill__label">{label}</span>
    </span>
  );
}
