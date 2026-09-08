import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

/**
 * Rôle de la tuile, dont dépend son **encre**.
 *
 * - `decor` (défaut) — la tuile est posée à côté d'un titre qui porte déjà le
 *   sens. Elle prend le cuivre `--accent-secondary`, la couche éditoriale, et
 *   se retire de l'arbre d'accessibilité : elle ne nomme rien.
 * - `action` — la tuile est le **seul contenu visible d'un contrôle** (son
 *   libellé est en texte masqué). Son encre porte donc du sens : elle reste le
 *   teal des actions, `--text-accent`, et doit tenir un contraste mesuré ≥ 3:1
 *   au repos comme au survol.
 *
 * Les deux encres ne sont pas interchangeables : c'est une règle du contrat de
 * couleur. Un cuivre sur un contrôle efface la promesse d'action ; un teal sur
 * du décor en promet une qui n'existe pas.
 */
export type IconTileTone = 'decor' | 'action';

export interface IconTileDecorProps extends ComponentPropsWithoutRef<'span'> {
  /**
   * **Figé à `decor`, symétriquement à ce que la branche lien fait de
   * `action`.** Le type l'acceptait librement, et `<IconTile tone="action">`
   * sans `href` était donc légal : un carré de 44 px à l'encre teal — la
   * couleur des actions —, sans rôle, sans nom, sans `aria-hidden`, non
   * focusable, et qui prend même le film de survol de `.tc-icontile--action`.
   * Un objet qui promet une action à l'œil et n'en offre aucune au clavier.
   *
   * L'échappatoire pour le cas légitime — la tuile est l'unique contenu visible
   * d'un contrôle rendu par l'appelant, son propre `<button>` — est la CLASSE,
   * pas la prop : `<IconTile className="tc-icontile--action">`. Elle dit la
   * même chose de l'encre, et elle le dit à l'endroit où l'appelant assume
   * aussi le rôle, le nom et la focusabilité de son contrôle. La recette de
   * l'encre reste dans une seule feuille.
   */
  readonly tone?: 'decor';
  readonly href?: never;
  readonly label?: never;
  ref?: Ref<HTMLSpanElement>;
}

export interface IconTileLinkProps
  extends Omit<ComponentPropsWithoutRef<'a'>, 'aria-label'> {
  /** Sa présence fait de la tuile un `<a>`. La chaîne vide compte pour absente. */
  readonly href: string;
  /**
   * **Nom accessible du lien. Requis, et rendu en texte masqué.**
   *
   * L'icône est le seul contenu VISIBLE du lien, donc sans ce libellé le lien
   * n'a aucun nom : VoiceOver annonce « lien, losange noir », ou rien
   * (WCAG 4.1.2 et 2.4.4). Le type l'exigeait si peu que
   * `<IconTile href="/x"><Glyphe /></IconTile>` compilait, rendait un `<a>`
   * valide, contenait des enfants — donc `jsx-a11y/anchor-has-content` ne
   * bronchait pas — et produisait exactement ce lien anonyme.
   *
   * **Une prop, et pas l'exigence d'un `aria-label`.** Un `aria-*` est un
   * attribut parmi cent : le type ne peut le rendre obligatoire qu'en le
   * nommant, et l'appelant peut toujours l'oublier ou le mal orthographier
   * sans que rien ne le dise. Une prop nommée est refusée à la compilation
   * quand elle manque. Le composant OMET d'ailleurs `aria-label` de son type :
   * deux noms pour un même lien, dont un seul gagne, est une divergence
   * silencieuse — et le nom accessible d'un lien doit correspondre à son
   * libellé (WCAG 2.5.3), ce qui n'a de sens que s'il n'y en a qu'un.
   *
   * Nommez la DESTINATION, et signalez une nouvelle fenêtre :
   * « Profil LinkedIn (nouvelle fenêtre) ». `aria-labelledby` reste disponible
   * pour désigner un titre visible ; il gagne alors sur ce texte, comme le veut
   * la spécification.
   */
  readonly label: string;
  /**
   * **Figé à `action`.** Une tuile qui EST le lien est le seul contenu visible
   * d'un contrôle : son encre porte du sens, elle ne peut pas retomber sur la
   * couche décorative. Le type interdit donc l'autre valeur plutôt que de
   * laisser le contrat se casser à l'usage.
   */
  readonly tone?: 'action';
  ref?: Ref<HTMLAnchorElement>;
}

export type IconTileProps = IconTileDecorProps | IconTileLinkProps;

/**
 * Vrai quand la tuile doit rendre un `<a>` : `href` présent ET non vide.
 *
 * Un prédicat, et non un test écrit à l'appel, parce que la valeur vide doit
 * discriminer l'union de la même façon que l'absence. `props.href !== undefined`
 * laissait passer `href=""` : un `<a href="">` est un lien vers l'adresse
 * courante, donc un rechargement de page déguisé en navigation. Il n'y a rien à
 * corriger côté type — `<IconTile href={p.url}>` est légitime, c'est la donnée
 * qui est vide — donc c'est au rendu de retomber sur la branche décorative.
 */
function isLink(props: IconTileProps): props is IconTileLinkProps {
  return typeof props.href === 'string' && props.href.length > 0;
}

/**
 * Tuile en squircle portant une icône : géométrie fixe, matériau dégradé
 * (`--icon-surface-start` → `--icon-surface-end`), liseré, ombre basse.
 *
 * Sans état, sans hook — rendable tel quel en Server Component.
 *
 * ### Pourquoi elle sait rendre un `<a>`
 * Le composant est **présentationnel par défaut et capable de rendre un lien**
 * quand `href` est fourni. Le rôle et l'encre étant liés par le contrat de
 * couleur, laisser l'appelant envelopper une tuile présentationnelle dans son
 * propre `<a>` aurait deux conséquences : rien ne garantirait plus l'appariement
 * (une tuile `decor` dans un lien est exactement l'erreur que le contrat
 * interdit), et les états `:hover` / `:active` — écrits par le portfolio SUR le
 * lien lui-même — devraient être réécrits en sélecteurs de parent, donc
 * dépendre du balisage de l'appelant. En rendant l'élément, le composant garde
 * la règle et ses états au même endroit.
 *
 * **La tuile n'est pas un bouton.** Pour une action qui n'est pas une
 * navigation, ou pour un contrôle avec libellé visible, c'est `Button` qu'il
 * faut : cette tuile ne porte ni la hauteur de cible d'un bouton (48 px) ni sa
 * silhouette en pilule.
 *
 * ### Ce que le composant pose pour vous
 * Une tuile `decor` rendue en `<span>` reçoit `aria-hidden="true"` : elle est du
 * décor, l'annoncer n'ajoute rien. Le lien, lui, ne le reçoit jamais — un
 * élément focusable masqué à l'arbre d'accessibilité est un piège au clavier —
 * et il reçoit son **nom accessible**, rendu en `.tc-visually-hidden` depuis la
 * prop `label` qui est requise sur cette branche.
 *
 * ### `href=""` n'est PAS un lien
 * La branche est choisie sur une chaîne NON VIDE. `<IconTile href={p.url}>`
 * avec une URL vide venue des données rendait `<a href="">`, c'est-à-dire un
 * lien vers l'adresse courante : cliquer rechargeait la page. La chaîne vide
 * compte donc pour absente, et la tuile retombe sur son `<span>` décoratif.
 *
 * @example
 * <IconTile><MonGlyphe /></IconTile>
 * @example
 * <IconTile href={profil} label="Profil LinkedIn (nouvelle fenêtre)">
 *   <GlypheLinkedIn aria-hidden="true" />
 * </IconTile>
 */
export function IconTile(props: IconTileProps) {
  if (isLink(props)) {
    const { tone = 'action', className, children, label, ...rest } = props;

    // `children` est extrait plutôt que laissé dans le reste : un `<a>` dont le
    // contenu n'arrive que par un étalement de props est indistinguable d'un
    // lien vide à la lecture — pour le linter comme pour le relecteur.
    return (
      <a className={cx('tc-icontile', `tc-icontile--${tone}`, className)} {...rest}>
        {children}
        <span className="tc-visually-hidden">{label}</span>
      </a>
    );
  }

  // `href` et `label` sont extraits du reste : sur cette branche ils sont typés
  // `never`, mais `<IconTile href={p.url} label="…">` avec une URL vide est un
  // appel LÉGITIME qui atterrit ici à l'exécution, et React poserait les deux
  // attributs tels quels sur le `<span>` — dont un `label` qui n'existe pas en
  // HTML.
  const { tone = 'decor', className, href, label, ...rest } = props;

  if (href === '') {
    // Même politique que `Pill` et `TimelineItem` : bruyant pour l'auteur,
    // jamais fatal pour le visiteur.
    console.error(
      `IconTile: href="" reçu (label « ${label ?? ''} »), rendu en <span> décoratif plutôt ` +
        'qu’en lien. Un <a href=""> pointe vers l’adresse courante, donc le clic rechargerait ' +
        'la page. Rendez la tuile conditionnelle côté appelant, ou fournissez une URL.',
    );
  }

  return (
    <span
      className={cx('tc-icontile', `tc-icontile--${tone}`, className)}
      aria-hidden
      {...rest}
    />
  );
}
