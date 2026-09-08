import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

/**
 * Une borne de la plage : la date **lisible par la machine** et son libellé
 * **lisible par l'humain**, séparés.
 *
 * `dateTime` prend une valeur de date valide au sens HTML — `2024`,
 * `2024-03`, `2024-03-15`… La granularité est libre, mais elle doit
 * correspondre à ce que le libellé affirme : `dateTime="2024-03-15"` sous un
 * libellé « mars 2024 » promet une précision que le texte n'a pas.
 */
export interface DateMark {
  readonly dateTime: string;
  readonly label: string;
}

/**
 * LE SÉPARATEUR PARLÉ, parce que le cadratin ne l'est pas.
 *
 * Le seul porteur de la relation « de … à … » était le caractère `—`
 * (U+2014, tiret cadratin). NVDA, JAWS et VoiceOver, à leur réglage de
 * ponctuation par défaut, **ne le prononcent pas** : on entendait « Septembre
 * 2023 Juin 2025 », deux dates juxtaposées, sans savoir laquelle est le début.
 * Sur une frise où chaque entrée en porte une, l'ambiguïté est systématique
 * (WCAG 1.3.1).
 *
 * Le mot est donc rendu en texte, masqué visuellement, et le cadratin devient
 * décoratif — `aria-hidden`, pour qu'un lecteur réglé sur « toute la
 * ponctuation » n'entende pas « à tiret cadratin ».
 */
const SEPARATOR_LABEL = ' à ';

export interface DateRangeProps extends Omit<ComponentPropsWithoutRef<'p'>, 'children'> {
  readonly start: DateMark;
  /** Absente, la plage est **ouverte** et se termine sur {@link DateRangeProps.presentLabel}. */
  readonly end?: DateMark;
  /**
   * Texte de fin d'une plage ouverte.
   *
   * @default 'Aujourd’hui'
   */
  readonly presentLabel?: string;
  ref?: Ref<HTMLParagraphElement>;
}

/**
 * Plage de dates. Toute sa valeur est **sémantique**.
 *
 * Une plage se décrit avec **deux `<time dateTime>` distincts** : un `dateTime`
 * unique ne documenterait que sa date de début, et la fin ne serait plus qu'un
 * morceau de texte pour toute machine qui lit la page.
 *
 * Quand la plage est ouverte, la fin est rendue en **texte simple** et non en
 * `<time>` : il n'y a pas de date à documenter. Poser un `<time>` sur
 * « Aujourd'hui » obligerait à choisir une date — celle du build, ou celle du
 * rendu — et cette date serait fausse dès le lendemain.
 *
 * La relation entre les deux bornes est portée par un **mot**, masqué
 * visuellement, et non par le seul cadratin : voir {@link SEPARATOR_LABEL}.
 *
 * Sans état, sans hook — rendable tel quel en Server Component.
 *
 * @example
 * <DateRange
 *   start={{ dateTime: '2023-09', label: 'Septembre 2023' }}
 *   end={{ dateTime: '2025-06', label: 'Juin 2025' }}
 * />
 * @example
 * <DateRange start={{ dateTime: '2025-07', label: 'Juillet 2025' }} />
 */
export function DateRange({
  start,
  end,
  presentLabel = 'Aujourd’hui',
  className,
  ...rest
}: DateRangeProps) {
  return (
    <p className={cx('tc-daterange', className)} {...rest}>
      <time dateTime={start.dateTime}>{start.label}</time>
      <span className="tc-visually-hidden">{SEPARATOR_LABEL}</span>
      <span aria-hidden="true">{' — '}</span>
      {end ? <time dateTime={end.dateTime}>{end.label}</time> : presentLabel}
    </p>
  );
}
