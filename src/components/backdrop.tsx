import type { ComponentPropsWithoutRef, ReactElement, Ref } from 'react';
import { cx } from './cx.js';

/**
 * SIX disques, trois froids et trois chauds, et ce nombre n'est pas réglable.
 *
 * Les positions, les tailles et la répartition des teintes vivent dans
 * `styles/components/backdrop.css` ; ce tableau ne fait que nommer les six
 * modificateurs dans l'ordre du document. Les rangs pairs sont les chauds — la
 * feuille les sélectionne par leur nom, elle ne les compte pas.
 */
const HALO_ORDINALS = ['one', 'two', 'three', 'four', 'five', 'six'] as const;

export interface BackdropProps extends ComponentPropsWithoutRef<'div'> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Hôte du décor : positionné, isolé, clippé, et peint `--site-background`. Il
 * rend les six halos, puis ses enfants — dans cet ordre, parce que c'est
 * l'ordre du document qui met le contenu au-dessus des disques.
 *
 * ### Pas de prop de teinte, pas de prop de nombre
 * Le domaine mesuré est FERMÉ. Les deux teintes de halo sont des jetons dont
 * le contrat de couleur épingle la **parité** : mesuré contre le sol de leur
 * thème, le disque froid est à ΔE OKLab 13,28 et le chaud à 13,36 en clair,
 * soit 0,086 d'écart, et 12,83 contre 12,89 en sombre. Laisser un appelant
 * injecter une teinte ou changer le nombre de disques, c'est ouvrir la porte
 * par laquelle une couleur non mesurée entre — et la moitié chaude n'existe
 * que pour que le teal des actions reste un signal.
 *
 * ### Le halo DÉGRADE le contraste, il ne le fournit pas
 * Il tire la carte vers la mi-luminosité : le texte fort passe de 9,02:1 sur
 * page nue à 7,27:1 sur halo froid, et jusqu'à 3,01:1 dans le pire cas
 * mesuré. **Le meilleur cas est donc le halo absent** : `Card` n'exige aucun
 * `Backdrop`, et `Backdrop` n'exige aucune `Card`. Aucun des deux ne prévient
 * ni ne lève quoi que ce soit.
 *
 * ### Ce que cet hôte garantit vraiment
 * Les six disques sont `position: absolute`. Sans hôte positionné, isolé et
 * clippé, ils se rattachent à un ancêtre positionné quelconque, s'échappent de
 * leur section, et peuvent passer **au-dessus** du contenu. C'est une panne
 * SILENCIEUSE — rien ne casse, le décor se contente de recouvrir le texte.
 * `styles/glass.structure.test.ts` échoue si l'une des trois propriétés quitte
 * la feuille.
 *
 * La garantie ne demande **rien** à vos enfants : les disques sont à
 * `z-index: -1` dans un hôte isolé, donc ils se peignent après le fond de
 * l'hôte et avant tout contenu, positionné ou pas. La source du portfolio les
 * met à `z-index: 0`, ce qui ne tient que parce que son contenu est fait de
 * cartes `position: relative` ; mesuré (Chromium 151, capture recadrée à
 * l'intérieur d'une carte opaque), à `z-index: 0` le décor se peint
 * **par-dessus** une `Card variant="flat"` et son texte. C'est la seule
 * divergence assumée avec la source, et elle est documentée dans
 * `styles/components/backdrop.css`.
 *
 * ### N'en faites pas un conteneur de grille ou de flex
 * Les six disques sont des enfants directs, donc ils deviendraient des items.
 * Pour la même raison, `.tc-backdrop > :first-child` désigne un halo et non
 * votre contenu : mettez votre grille dans un enfant, pas sur l'hôte.
 *
 * ### Le piège : n'enveloppez pas votre application entière
 * L'hôte est clippé, et un clip interagit avec `position: sticky` à
 * l'intérieur. **Mesuré** (Chromium 151 headless, sonde de layout, trois
 * positions de défilement par cas) :
 *
 * | `overflow` de l'hôte | barre `sticky` à l'intérieur |
 * | -------------------- | ---------------------------- |
 * | aucun (témoin)       | colle — `rect.top === 0`     |
 * | `clip` (ce composant)| colle — `rect.top === 0`     |
 * | `hidden`             | **ne colle jamais** — `rect.top` = −300, −900, −1000 |
 *
 * `overflow: hidden` crée un conteneur de défilement, qui devient le
 * référentiel du `sticky` : l'élément « colle » dans une boîte qui ne défile
 * pas, donc il défile avec la page. `overflow: clip` ne crée PAS de conteneur
 * de défilement — le référentiel reste la fenêtre, et le `sticky` survit ; il
 * se relâche au bas de l'hôte, ce qui est le comportement normal d'un `sticky`
 * et non un artefact du clip (mesuré aussi).
 *
 * **La feuille dit donc `clip` et pas `hidden`, et ce n'est pas un détail
 * d'écriture.** Cela reste néanmoins une bonne raison de garder l'en-tête
 * collant **hors** du `Backdrop` : le portfolio y échappe exactement comme ça,
 * son `SiteHeader` est un frère de la page décorée, pas un enfant. Non
 * mesuré : le comportement des autres moteurs (WebKit, Gecko) — la mesure
 * ci-dessus ne vaut que pour Chromium 151.
 *
 * @example
 * <Backdrop>
 *   <section>
 *     <Card>
 *       <h2>Titre</h2>
 *     </Card>
 *   </section>
 * </Backdrop>
 */
export function Backdrop({ className, children, ...rest }: BackdropProps): ReactElement {
  return (
    <div className={cx('tc-backdrop', className)} {...rest}>
      {HALO_ORDINALS.map((ordinal) => (
        <div
          key={ordinal}
          className={cx('tc-backdrop__halo', `tc-backdrop__halo--${ordinal}`)}
          aria-hidden="true"
        />
      ))}
      {children}
    </div>
  );
}
