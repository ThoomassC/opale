import type { ComponentPropsWithoutRef, MouseEvent, Ref } from 'react';
import { cx } from './cx.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonOwnProps {
  /**
   * `primary` : l'aplat teal, avec son ombre portée. **Un seul par vue.**
   * `secondary` : liseré `--control-border` sur un lavis `--panel-surface`.
   * `danger` : liseré rouge, fond transparent — l'aplat plein reste le
   * monopole du teal, une action destructrice ne se peint pas.
   */
  variant?: ButtonVariant;
}

/**
 * Le bouton, branche `<button>`. `href` y est déclaré `undefined` et non
 * absent : c'est lui qui discrimine l'union, et une propriété absente ne
 * discrimine rien.
 */
export interface ButtonAsButtonProps extends ButtonOwnProps, ComponentPropsWithoutRef<'button'> {
  href?: undefined;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Le bouton, branche `<a>`. `href` y est **requis** : c'est ce qui fait
 * basculer l'élément rendu.
 *
 * `Omit<…, 'type'>` n'est pas cosmétique. `AnchorHTMLAttributes` porte un
 * `type?: string` — l'indice de type MIME de la cible, `type="text/html"` — qui
 * accepterait silencieusement `type="submit"` sur un lien et le rendrait dans
 * le DOM sans que rien ne proteste. La branche ancre n'a pas de `type`.
 */
export interface ButtonAsAnchorProps
  extends ButtonOwnProps, Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'type'> {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

/** `aria-disabled` accepte le booléen comme la chaîne : les deux comptent. */
function isInert(ariaDisabled: boolean | 'true' | 'false' | undefined): boolean {
  return ariaDisabled === true || ariaDisabled === 'true';
}

/**
 * Fabrique le gestionnaire de clic qui neutralise l'activation sous
 * `aria-disabled`. Sur un `<button>`, le `preventDefault()` annule en plus la
 * soumission d'un `type="submit"`.
 *
 * **`stopPropagation()` autant que `preventDefault()`.** Un `<button disabled>`
 * natif ne DISPATCHE aucun `click` : l'événement n'existe pas, donc rien
 * au-dessus ne l'entend. Un `aria-disabled` sans arrêt de propagation laissait
 * au contraire l'événement remonter :
 *
 * ```tsx
 * <div onClick={openDetail}><Button aria-disabled onClick={send} /></div>
 * ```
 *
 * n'appelait pas `send` — correct — mais appelait bien `openDetail`. Un clic
 * sur un contrôle annoncé indisponible déclenchait l'action de son conteneur.
 * L'arrêt de propagation rend l'inertie aussi silencieuse que celle du natif.
 *
 * La fonction est recréée à chaque rendu, sans `useCallback` : le composant
 * doit rester rendable en Server Component, donc sans le moindre hook.
 */
function guardClick<E extends Element>(
  inert: boolean,
  onClick: ((event: MouseEvent<E>) => void) | undefined,
) {
  return function handleClick(event: MouseEvent<E>) {
    if (inert) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };
}

/**
 * Vrai quand le composant doit rendre un `<a>` : `href` présent ET non vide.
 *
 * Un prédicat, et non un test écrit à l'appel, parce que la chaîne vide doit
 * discriminer l'union comme l'absence. `props.href !== undefined` laissait
 * passer `<Button href={p.url}>` avec `p.url === ''` : `<a href="">` est un
 * lien vers l'adresse courante, donc un rechargement de page déguisé en
 * navigation. Le type n'a rien à corriger — l'appel est légitime, c'est la
 * donnée qui est vide — donc c'est au rendu de retomber sur le `<button>`.
 */
function isAnchor(props: ButtonProps): props is ButtonAsAnchorProps {
  return 'href' in props && typeof props.href === 'string' && props.href.length > 0;
}

/**
 * Bouton de la librairie. Sans état React, sans hook : rendu tel quel comme
 * Server Component. Survol, appui, focus et désactivation sont entièrement
 * portés par la feuille de style (`:hover`, `:active`, `:focus-visible`,
 * `:disabled`, `[aria-disabled]`, `[aria-busy]`).
 *
 * Hauteur minimale `--target-button` (48 px), bordure en pilule.
 *
 * ### `<button>` ou `<a>` ?
 * Passez `href` et le composant rend un `<a>` : même apparence, sémantique de
 * lien. L'union est discriminée sur `href`, donc `type` et `disabled` — qui
 * n'ont aucun sens sur un lien — sont refusés à la compilation dès qu'un `href`
 * est présent. Rien de plus n'est nécessaire côté CSS : la règle
 * `[aria-disabled='true']` porte déjà l'apparence inerte complète, et
 * `:disabled` ne s'applique pas à un lien.
 *
 * ### `disabled` ou `aria-disabled` ?
 * `disabled` retire le bouton de l'ordre de tabulation : l'utilisateur au
 * clavier ne le trouve plus et ne peut pas lire pourquoi il est inerte.
 * Dans une **modale**, un **formulaire en cours d'envoi** ou toute vue où le
 * bouton est la sortie attendue, préférez `aria-disabled="true"` : le bouton
 * reste focusable et annoncé « indisponible ». Les deux reçoivent le même
 * rendu. C'est une recommandation, pas une contrainte : `disabled` reste
 * correct sur un bouton secondaire d'une page tranquille.
 *
 * Sur un **lien**, il n'y a pas de choix à faire : `aria-disabled` est le seul
 * outil disponible. Il reste focusable mais inerte, pour que le lecteur
 * d'écran l'atteigne et l'annonce — voir la section sur les chemins de
 * navigation, plus bas, pour ce que cela demande au composant.
 *
 * **`aria-disabled` neutralise l'activation, et c'est le composant qui s'en
 * charge.** L'activation principale — clic gauche, `Entrée`, `Espace` — passe
 * par l'événement `click` ; il est intercepté, `preventDefault()` et
 * `stopPropagation()` sont appelés, et `onClick` n'est pas invoqué. Sans cette
 * interception, poser `aria-disabled` sur un bouton d'envoi donnait un bouton
 * d'apparence inerte qui soumettait quand même : double soumission garantie.
 *
 * ### Sur un LIEN, l'interception du clic ne suffisait pas — et ne pouvait pas
 * Ce commentaire affirmait que « le clic à la souris comme la validation au
 * clavier passent par le même événement `click` ». C'est vrai du bouton
 * primaire, **faux des boutons auxiliaires de la souris**, et un lien inerte
 * navigait donc par trois chemins que `onClick` ne voit pas :
 *
 * | chemin | ce qui arrive à `onClick` | résultat avant correction |
 * | --- | --- | --- |
 * | clic du MILIEU | `auxclick`, plus de `click` pour les boutons non primaires depuis Chrome 55 / Firefox 53 | navigue, dans un nouvel onglet |
 * | menu contextuel → « Ouvrir dans un nouvel onglet » | aucun événement | navigue |
 * | glisser le lien vers la barre d'adresse | aucun événement | navigue |
 *
 * Scénario mesuré : `<Button href="/etape/12" aria-disabled="true">Publier
 * </Button>`, clic molette — l'étape s'ouvrait, alors que le bouton est peint
 * inerte, curseur `not-allowed` et liseré tireté.
 *
 * **La correction ferme les trois d'un coup : sous `aria-disabled`, le
 * composant N'ÉMET PAS `href`.** Un `<a>` sans `href` n'est pas un lien : il
 * n'y a plus rien à ouvrir, à copier ni à glisser, par aucun chemin, présent ou
 * futur. Deux attributs rétablissent ce que la perte de `href` aurait coûté :
 * `role="link"` — sans `href`, l'élément retombe sur `generic` et le lecteur
 * d'écran n'annonce plus ni « lien » ni son indisponibilité — et `tabIndex={0}`,
 * pour qu'il reste atteignable au clavier et annoncé « indisponible », ce qui
 * est toute la raison de préférer `aria-disabled` à un retrait.
 *
 * `aria-busy="true"` marque l'attente ; ajoutez un texte de substitution
 * (« Envoi… ») plutôt que de vider le libellé. Il ne neutralise rien : si vous
 * voulez qu'un bouton en attente refuse le second clic, posez aussi
 * `aria-disabled`.
 *
 * @example
 * <Button variant="secondary" onClick={close}>Annuler</Button>
 * @example
 * <Button href="/contact" variant="secondary">Me contacter</Button>
 * @example
 * <Button aria-disabled={isSending} aria-busy={isSending} onClick={send}>
 *   {isSending ? 'Envoi…' : 'Envoyer'}
 * </Button>
 */
export function Button(props: ButtonProps) {
  // Narrowing par prédicat, jamais par `as` : un `href={undefined}` explicite
  // comme un `href=""` venu des données doivent retomber sur la branche bouton,
  // ce que la seule présence de la clé ne dirait pas.
  if (isAnchor(props)) {
    // `href` et `children` sont posés en clair sur l'élément plutôt que noyés
    // dans le spread : `jsx-a11y` lit l'arbre JSX, et un `<a onClick>` dont le
    // `href` lui arrive par `{...rest}` lui apparaît comme un élément statique
    // rendu cliquable — deux règles se déclenchent à tort.
    const { variant = 'primary', className, href, onClick, children, ...rest } = props;
    const inert = isInert(rest['aria-disabled']);

    return (
      <a
        // `undefined` et non la chaîne vide : React n'émet aucun attribut pour
        // `undefined`, là où `href=""` referait un lien vers la page courante.
        href={inert ? undefined : href}
        // Sans `href`, l'élément n'a plus de rôle implicite : `role` et
        // `tabIndex` rendent le lien inerte annonçable et atteignable, ce qui
        // est la seule raison d'employer `aria-disabled` plutôt qu'un retrait.
        role={inert ? 'link' : undefined}
        tabIndex={inert ? 0 : undefined}
        className={cx('tc-btn', `tc-btn--${variant}`, className)}
        onClick={guardClick(inert, onClick)}
        {...rest}
      >
        {children}
      </a>
    );
  }

  // `href` EST retiré du reste, contrairement à la version précédente : sur
  // cette branche il est typé `undefined`, mais un `href=""` venu des données
  // atterrit ici à l'exécution, et React poserait l'attribut tel quel sur le
  // `<button>`. Sans cette extraction, le `<button>` sortait avec un `href`
  // vide — invalide sur cet élément, et contraire au test qui l'interdit.
  const { variant = 'primary', className, type = 'button', onClick, href, ...rest } = props;

  if (href === '') {
    // La même politique que `Pill` et `TimelineItem` : la faute est bruyante
    // pour l'auteur, jamais fatale pour le visiteur. Une URL vide est un défaut
    // de DONNÉES, et le silence le laisserait passer pour un choix.
    console.error(
      'Button: href="" reçu, rendu en <button> plutôt qu’en lien. Un <a href=""> pointe vers ' +
        'l’adresse courante, donc le clic rechargerait la page. Rendez le lien conditionnel ' +
        'côté appelant, ou fournissez une URL.',
    );
  }

  return (
    <button
      type={type}
      className={cx('tc-btn', `tc-btn--${variant}`, className)}
      onClick={guardClick(isInert(rest['aria-disabled']), onClick)}
      {...rest}
    />
  );
}
