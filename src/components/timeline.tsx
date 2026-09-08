import { Children, isValidElement } from 'react';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import type { AccessibleNameProps } from './accessible-name.js';
import { cx } from './cx.js';

/**
 * Le nom de la frise est **requis**, sous l'une de ses deux formes : `label`
 * (posé en `aria-label`) ou `aria-labelledby` vers un titre visible. Voir
 * {@link AccessibleNameProps} — la version précédente exigeait `label` tout en
 * recommandant `aria-labelledby`, si bien que suivre le conseil imposait
 * d'écrire une chaîne condamnée à être écrasée.
 */
export type TimelineProps = Omit<
  ComponentPropsWithoutRef<'ol'>,
  'aria-label' | 'aria-labelledby'
> &
  AccessibleNameProps & { ref?: Ref<HTMLOListElement> };

/**
 * Frise : la liste **ordonnée** des entrées.
 *
 * `<ol>` et non `<ul>` parce que l'ordre porte du sens — c'est une
 * chronologie ; le retirer perdrait l'information. Le contenu de chaque entrée
 * est libre : voir {@link TimelineItem}.
 *
 * Sans état, sans hook — rendable tel quel en Server Component.
 *
 * @example
 * <Timeline label="Étapes du voyage">
 *   <TimelineItem level={3} icon={<IconTile><Glyphe /></IconTile>}>
 *     <DateRange start={{ dateTime: '2025-04-02', label: '2 avril 2025' }} />
 *     <h3>Kyoto</h3>
 *     <p className="tc-timeline__meta">Kansai, Japon</p>
 *     <p>Trois jours de temples et de ruelles.</p>
 *   </TimelineItem>
 * </Timeline>
 */
export function Timeline({ label, className, ...rest }: TimelineProps) {
  // `aria-label={label}` avec `label` absent ne pose aucun attribut : React
  // n'émet rien pour `undefined`, donc l'`aria-labelledby` du reste reste seul
  // à nommer la frise au lieu d'être doublé par un nom qu'il écraserait.
  return <ol aria-label={label} className={cx('tc-timeline', className)} {...rest} />;
}

/**
 * Niveau du titre que l'entrée contient, `3` par défaut.
 *
 * `1` et `2` sont absents : une entrée de frise vit dans une section, donc sous
 * un titre. `5` et `6` le sont aussi — une frise imbriquée à cette profondeur
 * est un signe de structure, pas un cas à servir.
 */
export type TimelineItemLevel = 3 | 4;

/** Les balises de titre, pour la vérification de niveau ci-dessous. */
const HEADING_TAGS: readonly string[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * Les titres d'enfants DIRECTS dont la balise n'est pas celle déclarée.
 *
 * Limite assumée, et de la même famille que celle du garde de `Pill` :
 * `Children.toArray` aplatit les tableaux mais ne descend ni dans un fragment
 * ni dans un composant intermédiaire. Un titre enveloppé échappe donc au
 * contrôle. Ce qui est attrapé est le mode d'écriture réel — le titre est un
 * enfant direct de l'entrée, comme dans l'exemple ci-dessus — et c'est là que
 * la faute se commet.
 */
function misleveledHeadings(children: ReactNode, expected: string): readonly string[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => child.type)
    .filter((type): type is string => typeof type === 'string')
    .filter((tag) => HEADING_TAGS.includes(tag) && tag !== expected);
}

export interface TimelineItemProps extends ComponentPropsWithoutRef<'li'> {
  /**
   * Tuile d'illustration, en tête de l'entrée. Typiquement un `IconTile`.
   *
   * Sa présence ouvre la seconde colonne de la grille ; son absence laisse le
   * contenu occuper toute la largeur.
   */
  readonly icon?: ReactNode;
  /**
   * **Niveau du titre de l'entrée, DÉCLARÉ par l'appelant.** Voir
   * {@link TimelineItemLevel}.
   *
   * Le contenu de l'entrée reste libre — c'est la décision d'origine du
   * composant, et elle tient — mais le NIVEAU de son titre ne l'est plus, et
   * c'est ce qui manquait. `SectionHeading` prend son niveau en prop en
   * expliquant longuement pourquoi : un composant ne connaît pas sa profondeur
   * dans le document. La frise laissait ce même niveau au contenu libre, et sa
   * feuille stylait `:is(h3, h4)` **à l'identique** — si bien qu'un `<h4>`
   * posé sous un `<h2>` (saut de niveau, WCAG 1.3.1) était visuellement
   * indistinguable du `<h3>` correct. Le défaut n'existait qu'à l'oreille, ce
   * qui est la définition d'un défaut qui survit à la relecture.
   *
   * La déclaration sert deux fois. La feuille ne style QUE la balise déclarée
   * (`.tc-timeline__body--h3 h3`), donc un titre au mauvais niveau perd la
   * typographie de l'entrée et se voit ; et le composant journalise la
   * discordance en `console.error`, donc elle s'entend aussi en développement.
   */
  readonly level?: TimelineItemLevel;
  ref?: Ref<HTMLLIElement>;
}

/**
 * Une entrée de frise : la tuile, puis un contenu **libre**.
 *
 * ### Pourquoi le contenu est libre
 * Le composant ne connaît ni poste, ni entreprise, ni mission : la même frise
 * sert une chronologie professionnelle et un carnet d'étapes de voyage. Fixer
 * ces champs en props aurait figé le vocabulaire de l'un des deux usages dans
 * une librairie qui sert les deux. L'entrée fournit donc la **géométrie**
 * (deux colonnes, gouttière, coussin) et la typographie de ce qu'on y met, pas
 * un modèle de données.
 *
 * Deux classes sont à votre disposition à l'intérieur :
 * `tc-timeline__meta` pour la ligne secondaire sous le titre (un lieu, un
 * employeur, un rôle), et la typographie du titre et des `p` est déjà posée.
 *
 * ### Ce qui n'est PAS libre : le niveau du titre
 * Le contenu est libre, son PLAN ne l'est pas. Déclarez `level` — voir
 * {@link TimelineItemProps.level} — et écrivez le titre à ce niveau : la
 * feuille ne style que celui-là, et une discordance part en `console.error`.
 *
 * ### Pourquoi ce n'est pas une carte
 * L'entrée ne porte **aucun matériau** : ni fond, ni liseré, ni ombre. Chez le
 * portfolio, la même entrée est aussi une carte de verre — mais la carte est un
 * composant à part entière de cette librairie, et l'écrire une seconde fois ici
 * donnerait deux définitions du même matériau, qui divergeraient.
 *
 * `Card` rendant un `<div>`, la composition se fait par les **classes** :
 * `className` est fusionné, jamais écrasé, donc elles s'empilent sur celles de
 * l'entrée.
 *
 * ```tsx
 * <TimelineItem className="tc-card tc-card--glass" icon={…}>…</TimelineItem>
 * ```
 *
 * Deux détails rendent cet empilement stable, tous deux dans la feuille de la
 * frise : le coussin de l'entrée vaut exactement celui de `.tc-card`, et ses
 * règles sont assez spécifiques pour que la grille l'emporte sur le
 * `display: block` de la carte. Sans quoi le résultat dépendrait de l'ordre
 * d'import des feuilles de style.
 *
 * Sans état, sans hook — rendable tel quel en Server Component.
 */
export function TimelineItem({
  icon,
  level = 3,
  className,
  children,
  ...rest
}: TimelineItemProps) {
  const hasIcon = Boolean(icon);
  const expected = `h${level}`;
  const wrong = misleveledHeadings(children, expected);

  if (wrong.length > 0) {
    console.error(
      `TimelineItem: level=${level} déclaré, mais l'entrée contient ${wrong
        .map((tag) => `<${tag}>`)
        .join(', ')}. Le plan du document est ce sur quoi un lecteur d'écran navigue, et un ` +
        `saut de niveau ne se voit pas : la feuille ne style que <${expected}>, donc écrivez ` +
        'le titre à ce niveau ou déclarez le niveau que vous écrivez.',
    );
  }

  return (
    <li
      className={cx('tc-timeline__item', hasIcon && 'tc-timeline__item--with-icon', className)}
      {...rest}
    >
      {hasIcon ? icon : null}
      <div className={cx('tc-timeline__body', `tc-timeline__body--${expected}`)}>{children}</div>
    </li>
  );
}
