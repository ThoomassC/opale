import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { cx } from './cx.js';

/**
 * Attributs que `Field` a calculés pour son contrôle. Conçus pour être
 * **étalés tels quels** sur l'élément de formulaire :
 *
 * ```tsx
 * <Field id="email" label="Adresse e-mail" error={erreur}>
 *   {(control) => <Input {...control} type="email" name="email" />}
 * </Field>
 * ```
 *
 * Les clés valant `undefined` disparaissent du DOM : pas de
 * `aria-invalid="false"` parasite.
 *
 * **Étalez-les en dernier, et ne posez pas votre propre `aria-describedby`
 * après.** Le faire écrase la valeur calculée sans que rien ne le signale —
 * ni le typage, ni le rendu : l'aide reste affichée, garde son `id`, et n'est
 * plus référencée par personne. Pour ajouter une description à vous, composez
 * explicitement :
 *
 * ```tsx
 * {(control) => (
 *   <Input
 *     {...control}
 *     aria-describedby={[control['aria-describedby'], 'ma-note']
 *       .filter(Boolean)
 *       .join(' ')}
 *   />
 * )}
 * ```
 *
 * C'est le revers du choix de la fonction-enfant : elle rend le câblage
 * visible plutôt que magique, au prix de pouvoir le défaire.
 */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

export interface FieldProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'id'> {
  /**
   * Identifiant du contrôle. **Prop requise, et volontairement.**
   * `useId` est un hook : l'appeler ici interdirait l'usage en Server
   * Component. C'est donc l'appelant qui nomme le champ — ce qui a le mérite
   * d'être stable entre le serveur et le client, et lisible dans le DOM.
   *
   * **`Field` réserve deux identifiants dérivés : `${id}-hint` et
   * `${id}-error`.** Ils sont dérivés, donc collisionnables : un champ nommé
   * `date` et un second nommé `date-hint` produisent deux éléments portant
   * `id="date-hint"`, et le `<label for>` du second désigne alors le
   * paragraphe d'aide du premier — libellé plus cliquable, contrôle sans nom
   * accessible. Sans `useId`, aucun garde n'est possible ici : c'est à
   * l'appelant de ne pas nommer un champ d'après un autre. En contrepartie,
   * `${id}-error` est une adresse stable, sur laquelle un formulaire peut
   * poser le focus après un envoi refusé.
   */
  id: string;
  /** Libellé visible, câblé au contrôle par `htmlFor`. */
  label: ReactNode;
  /** Aide permanente. Référencée par `aria-describedby`. */
  hint?: ReactNode;
  /**
   * Message d'erreur. Sa présence pose `aria-invalid` sur le contrôle, ajoute
   * le message — glyphe + texte — à `aria-describedby`, et **l'annonce** :
   * le paragraphe porte `role="alert"`.
   */
  error?: ReactNode;
  /**
   * Fonction-enfant recevant les attributs calculés.
   *
   * Choix assumé contre `cloneElement` : `cloneElement` devine la forme de
   * l'enfant, écrase silencieusement un `aria-describedby` déjà posé et casse
   * dès qu'on interpose un fragment ou un composant intermédiaire. La
   * fonction-enfant rend le câblage visible à la lecture et laisse
   * l'appelant décider où atterrissent les attributs.
   */
  children: (control: FieldControlProps) => ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Enveloppe un contrôle de formulaire : libellé, aide, message d'erreur, et
 * le câblage ARIA entre les trois. Aucun état, aucun hook.
 *
 * ### L'erreur est ANNONCÉE, et le rôle est en dur
 * Le message d'erreur porte `role="alert"`. Sans lui, le composant avait deux
 * des trois pieds du trépied — `aria-describedby` pour la relation,
 * `scroll-margin-block-start` pour l'atteinte au défilement — et pas le
 * troisième : après un envoi refusé par le serveur, l'appelant re-rend
 * `<Field error="Adresse invalide">`, le glyphe apparaît, le libellé rougit, et
 * le lecteur d'écran **ne dit rien**. L'utilisateur reste sur le bouton sans
 * savoir que quoi que ce soit a changé (WCAG 4.1.3).
 *
 * **`role="alert"` en dur plutôt qu'une prop symétrique du `live` de
 * `Message`**, et c'est un choix, pas un raccourci. Deux raisons, dans cet
 * ordre :
 *
 * 1. **Le nœud est monté À L'APPARITION de l'erreur.** `Message` peut être
 *    rendu vide en permanence, ce qui est la condition pour qu'un
 *    `aria-live="polite"` soit lu : une région dynamique doit exister dans le
 *    DOM AVANT que son contenu change. Ici le `<p>` n'existe pas tant que
 *    `error` est absent, donc `aria-live` serait posé sur un nœud qui arrive
 *    déjà rempli — le cas que les lecteurs d'écran annoncent le moins
 *    fiablement. `role="alert"` est précisément l'exception documentée :
 *    l'insertion d'un nœud qui le porte est annoncée, et c'est pour cette
 *    raison que l'ARIA APG en fait le motif des erreurs de formulaire.
 * 2. **Une prop qui vaut `off` par défaut aurait reproduit le défaut** chez
 *    tout appelant qui ne la renseigne pas — c'est-à-dire par ce chemin exact
 *    que le défaut a été livré. Et une prop qui vaudrait `assertive` par défaut
 *    ne serait que ce `role="alert"`, avec une porte de sortie de plus à
 *    documenter.
 *
 * Ce que ce choix coûte : une validation qui se déclenche à chaque frappe
 * interrompt le lecteur d'écran à chaque frappe. C'est un défaut de la
 * validation au clavier, pas du composant — validez à la perte de focus ou à
 * l'envoi.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
  ...rest
}: FieldProps) {
  const hasHint = Boolean(hint);
  const hasError = Boolean(error);

  const hintId = hasHint ? `${id}-hint` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control: FieldControlProps = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': hasError ? true : undefined,
  };

  return (
    <div
      className={cx('tc-field', hasError && 'tc-field--invalid', className)}
      {...rest}
    >
      <label className="tc-field__label" htmlFor={id}>
        {label}
      </label>
      {hasHint ? (
        <p className="tc-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className="tc-field__control">{children(control)}</div>
      {hasError ? (
        <p className="tc-field__error" id={errorId} role="alert">
          <span className="tc-field__glyph" aria-hidden="true">
            ▲
          </span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
