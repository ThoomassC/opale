import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

/**
 * Les deux matériaux de la carte.
 *
 * `glass` est le rendu par DÉFAUT : c'est le verre liquide du portfolio, porté
 * ici tel quel (voir `styles/components/card.css`). `flat` est la surface
 * opaque d'origine de la librairie, qui reste nécessaire — sans halo derrière
 * elle, ni `backdrop-filter` sous les yeux, le verre n'a rien à filtrer, et
 * une carte posée dans un panneau opaque ne doit pas prétendre en être une.
 */
export type CardVariant = 'glass' | 'flat';

export type CardElevation = 0 | 1 | 2 | 3;

interface CardBaseProps extends ComponentPropsWithoutRef<'div'> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * La carte de VERRE. `elevation` y est déclaré `never` et non absent : c'est
 * ce qui fait de la combinaison `variant="glass" elevation={2}` une erreur de
 * compilation au lieu d'une prop silencieusement ignorée. Le verre porte son
 * ombre en dur — il n'y a pas de cran à choisir.
 */
export interface CardGlassProps extends CardBaseProps {
  variant?: 'glass';
  elevation?: never;
}

/**
 * La carte OPAQUE et son cran d'élévation.
 *
 * `variant` y est optionnel, donc `<Card elevation={2}>` suffit : passer un
 * cran est en soi le choix du matériau opaque, puisque c'est le seul des deux
 * qui en a un. `<Card variant="flat">` sans cran retombe sur le cran 0 —
 * exactement le rendu que `<Card>` donnait avant que le verre devienne le
 * défaut.
 */
export interface CardFlatProps extends CardBaseProps {
  variant?: 'flat';
  /**
   * Cran d'élévation, 0 à 3. @default 0
   *
   * La polarité s'inverse entre les thèmes : en clair c'est l'ombre qui
   * détache la carte du sol, en sombre c'est le liseré — une ombre composée
   * y mesure ΔE 2,2, sous le seuil de perceptibilité. Les deux sont donc
   * toujours posés ensemble.
   */
  elevation?: CardElevation;
}

export type CardProps = CardGlassProps | CardFlatProps;

/**
 * Surface de contenu. Purement présentationnelle — c'est à l'appelant de
 * rendre le bon élément sémantique à l'intérieur (`<article>`, `<section>`,
 * un titre).
 *
 * ### Le verre est le défaut
 * `<Card>` rend le verre liquide : fond translucide `--glass-fill`, ménisque
 * de bord, liseré spéculaire, ombre portée propre. Pour la surface opaque,
 * demandez-la — `<Card variant="flat">`, ou `<Card elevation={n}>` qui
 * l'implique.
 *
 * ### Le verre n'exige RIEN de son arrière-plan
 * Ni prop, ni avertissement, ni `throw`. C'est une conséquence de la mesure,
 * pas une commodité : **le halo ne fournit pas le contraste, il le dégrade.**
 * Le texte fort passe de 9,02:1 sur page nue à 7,27:1 sur halo froid, et
 * 3,01:1 dans le pire cas mesuré (tuile d'icône, halo chaud, lavis de survol).
 * Le meilleur cas est donc le halo ABSENT ; une carte de verre posée sur une
 * page nue est le cas le plus favorable, jamais un défaut à signaler. Une prop
 * `hasHalo` qui ne changerait aucune mesure serait un mensonge poli.
 *
 * Ce dont le verre a besoin, c'est de quelque chose à filtrer : sans halo
 * derrière lui il reste lisible, mais il ne se lit plus comme du verre. C'est
 * un choix esthétique de l'appelant, pas une contrainte de contraste. Le
 * décor, lui, a une dépendance dure — voir `Backdrop`.
 *
 * @example
 * <Backdrop>
 *   <Card>
 *     <h2>Titre</h2>
 *   </Card>
 * </Backdrop>
 * @example
 * <Card variant="flat" elevation={2}>Panneau flottant</Card>
 */
export function Card({ variant, elevation, className, ...rest }: CardProps) {
  // `elevation` implique `flat` : c'est le seul des deux matériaux à porter un
  // cran, donc en passer un ne peut pas vouloir dire autre chose. Le cas
  // contradictoire (`variant="glass"` avec un cran) n'arrive jamais ici — le
  // type le refuse.
  const material: CardVariant = variant ?? (elevation === undefined ? 'glass' : 'flat');

  return (
    <div
      className={cx(
        'tc-card',
        material === 'glass' ? 'tc-card--glass' : `tc-card--elev-${elevation ?? 0}`,
        className,
      )}
      {...rest}
    />
  );
}
