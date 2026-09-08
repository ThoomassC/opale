import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { cx } from './cx.js';

/**
 * Niveau du titre rendu, `2` par défaut.
 *
 * **Le niveau est CHOISI PAR L'APPELANT, et il n'est pas devinable.** Un
 * composant ne connaît pas sa profondeur dans le document : la même en-tête de
 * section vit sous un `h1` de page (elle est donc un `h2`) comme à l'intérieur
 * d'un panneau déjà titré (elle est alors un `h3`). Deviner reviendrait à
 * produire un plan de document faux une fois sur deux — et un plan faux est
 * exactement ce sur quoi un lecteur d'écran navigue.
 *
 * `1` est volontairement absent : le titre de premier niveau est celui de la
 * page, il n'appartient pas à une section.
 */
export type SectionHeadingLevel = 2 | 3 | 4;

export interface SectionHeadingProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'title'
> {
  /**
   * Titre de la section.
   *
   * Cette prop **remplace** l'attribut HTML `title` du conteneur, qui est donc
   * retiré du type : les deux ne peuvent pas coexister sous le même nom, et
   * l'attribut n'aurait rien à faire ici — une infobulle au survol d'un bloc de
   * titre n'est ni atteignable au clavier ni lisible au toucher.
   */
  readonly title: ReactNode;
  /** @default 2 — voir {@link SectionHeadingLevel}. */
  readonly level?: SectionHeadingLevel;
  /**
   * Sourcil : le mot de catégorie posé au-dessus du titre.
   *
   * Il est rendu en **cuivre** (`--accent-secondary`), la couche éditoriale du
   * contrat de couleur — jamais l'accent teal, qui est réservé à ce qui
   * s'actionne.
   */
  readonly eyebrow?: ReactNode;
  /** Chapô : une phrase sous le titre. Passe en seconde colonne au-delà de 62rem. */
  readonly lede?: ReactNode;
  /**
   * Variante compacte : marge nulle, alignement centré dans la boîte parente.
   * Elle sort aussi de la mise en deux colonnes du grand écran, étant faite
   * pour vivre dans une grille qui lui est propre.
   */
  readonly compact?: boolean;
  /**
   * Identifiant posé **sur le titre**, pas sur le conteneur.
   *
   * C'est ce qui permet à la `<section>` englobante de se nommer par
   * `aria-labelledby` : le conteneur, lui, garde son propre `id` pour l'ancre
   * de navigation. Les deux ne peuvent pas être le même attribut, d'où la prop.
   */
  readonly headingId?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * En-tête de section : sourcil, titre, chapô.
 *
 * Sans état, sans hook — rendable tel quel en Server Component.
 *
 * @example
 * <section aria-labelledby="titre-parcours">
 *   <SectionHeading
 *     headingId="titre-parcours"
 *     eyebrow="Expérience"
 *     title="Un parcours construit sur le produit et sa qualité."
 *     lede="Du développement d'outils à l'automatisation des tests."
 *   />
 * </section>
 */
export function SectionHeading({
  title,
  level = 2,
  eyebrow,
  lede,
  compact = false,
  headingId,
  className,
  ...rest
}: SectionHeadingProps) {
  const Heading = `h${level}` as const;

  return (
    <div
      className={cx('tc-section-heading', compact && 'tc-section-heading--compact', className)}
      {...rest}
    >
      {eyebrow ? <p className="tc-eyebrow">{eyebrow}</p> : null}
      <Heading className="tc-section-heading__title" id={headingId}>
        {title}
      </Heading>
      {lede ? <p className="tc-section-heading__lede">{lede}</p> : null}
    </div>
  );
}
