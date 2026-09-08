/**
 * Le SUPPORT d'une encre, nommé et composable — la pièce qui manquait au
 * contrat de couleur.
 *
 * `contrastRatio` mesure deux couleurs opaques. `compositeLayers` aplatit une
 * pile. Entre les deux il restait un trou que chaque projet rebouchait à sa
 * façon : le portfolio dans son `index.css.test.ts` (`CARD_FLOORS`,
 * `WASH_SUPPORTS`), `travels_in_world` dans son `colour-contract.test.ts` (une
 * fonction `stack()` maison). Deux copies d'un même modèle, qui dérivent, et
 * une palette validée deux fois contre deux définitions différentes du mot
 * « fond ». Ce fichier est la copie unique.
 *
 * CE QU'IL ENCODE. Le support réel d'une encre de carte de verre n'est pas un
 * jeton, c'est une PILE : sol de page → halo → remplissage de verre → lavis
 * d'état. Chaque couche rabote le contraste de la suivante, et le halo est
 * celle qui rabote le plus.
 *
 * LE HALO NE DONNE PAS LE CONTRASTE, IL LE DÉGRADE. Mesuré sur cette feuille,
 * en clair, sur `--text-strong` : 11,08:1 sur la carte posée sur la page nue,
 * 8,92:1 dès qu'un halo passe dessous, 6,85:1 avec le lavis d'appui par-dessus.
 * Le halo tire la carte vers la mi-luminosité : halo présent = PIRE cas, halo
 * absent = MEILLEUR cas. Aucun composant n'a donc à exiger un halo derrière
 * lui ; c'est au contrat de mesurer le pire, et c'est pour ça que
 * `GLASS_BACKDROPS` porte les deux bulles. Le pire cas de toute la palette est
 * plus bas encore — `--control-border` à 3,01:1 en clair et 3,09:1 en sombre —
 * mais il demande une couche que ce fichier ne connaît pas, la tuile d'icône
 * d'un composant : c'est le § 15 de `tokens.contract.test.ts` qui l'ajoute, et
 * `glass.contract.test.ts` mesure la même chaîne sans elle, à 3,18:1 et 3,27:1.
 *
 * ================================ CE QUE CE MODÈLE NE PROUVE PAS ============
 *
 * Il lit du CSS en TEXTE et ne compose que des couches de `background`. Sont
 * donc HORS DU DOMAINE MESURÉ, et aucune assertion écrite avec ces outils ne
 * doit prétendre le contraire :
 *
 *  1. `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))`
 *     et le ménisque (`--glass-edge-*`, `--glass-rim-width`). Un flou moyenne
 *     les pixels du dessous — donc rapproche le support de sa propre moyenne —
 *     et `saturate(1.6)` comme `brightness(1.08)` déplacent la couleur reçue.
 *     Rien de tout cela n'est calculé ici. Le portfolio a la même limite et la
 *     déclare *estimation* (`index.css:287`) ; on reprend le mot.
 *  2. Les dégradés : `--glass-specular`, `--glass-highlight`, `--icon-surface-*`
 *     pris comme dégradé. Un arrêt de couleur se mesure (le § 15 le fait, arrêt
 *     par arrêt), le dégradé rendu non : sa couleur en un point donné dépend de
 *     la géométrie de l'élément.
 *  3. La GÉOMÉTRIE des halos. Les bulles sont des disques positionnés, pas des
 *     aplats de page ; le modèle suppose qu'une carte peut se trouver
 *     entièrement dessus, ce qui est le cas le plus défavorable et non le cas
 *     général.
 *  4. Ce qu'un navigateur peint VRAIMENT sur un élément donné. Le contrat prouve
 *     qu'une pile nommée est arithmétiquement juste ; l'appariement d'une pile
 *     avec une règle CSS reste une affirmation humaine. Un contrat qui prétend
 *     plus qu'il ne prouve est pire que pas de contrat.
 *
 * ========================================================================== */

import { compositeLayers, parseRgba, withAlpha } from './color.js';
import { resolveToken } from './stylesheet.js';
import type { Theme } from './stylesheet.js';

/**
 * Une couche de la pile.
 *
 * `{ token }` est le cas normal : un jeton de la feuille, résolu dans le thème
 * mesuré. `opacity` nomme un SECOND jeton, celui qui porte l'opacité CSS de la
 * couche — pas un nombre écrit en dur. C'est exactement ce que demande
 * `--halo-opacity`, qui vaut 0,9 en clair et 0,8 en sombre : coder 0,9 ici
 * mesurerait un halo sombre que personne ne voit. Le mécanisme CSS est
 * `background: var(--halo-tint); opacity: var(--halo-opacity)`, et une opacité
 * d'élément se compose exactement comme le même ton écrit en `rgba()` à cet
 * alpha — d'où `withAlpha`, qui MULTIPLIE l'alpha au lieu de le remplacer.
 *
 * `{ literal }` sert la couleur qui n'est pas un jeton : une valeur lue dans le
 * corps d'une règle (`.liquid-card { background: … }` sous
 * `prefers-contrast: more`, que le portfolio lit dans la feuille plutôt que de
 * la recopier). Un `var()` y est REFUSÉ plutôt que rendu tel quel : une couche
 * qui vaut la chaîne `"var(--surface)"` ferait échouer la composition avec un
 * message qui parle de syntaxe de couleur, très loin de la cause.
 */
export type LayerSpec =
  { readonly token: string; readonly opacity?: string } | { readonly literal: string };

/**
 * La DESCRIPTION d'un support : son libellé et sa pile de couches.
 *
 * `Spec` et non `Backdrop` tout court, et c'est une décision d'API publique :
 * la librairie exporte depuis la v0.3.0 un composant React `Backdrop` (l'hôte
 * du décor, entrée `.`), et ce type-ci vit dans l'entrée `./contract`. Les deux
 * noms ne se disputent techniquement rien — deux points d'entrée, deux espaces
 * de modules — mais un consommateur qui mesure sa propre palette importe
 * volontiers les deux dans le même fichier de test, et il devait alors aliaser
 * l'un des deux. Le suffixe dit aussi ce que l'objet est : une spécification
 * lue par `resolveBackdrop`, pas un morceau d'interface.
 */
export interface BackdropSpec {
  /**
   * Ce qui apparaîtra dans le message d'échec. Une mesure sans son empilement
   * ne veut rien dire : « --control-border manque 0,11 » n'est réparable que si
   * la ligne dit AUSSI sur quoi il était posé.
   */
  readonly label: string;
  /** Les couches, LA PLUS BASSE D'ABORD — l'ordre de la peinture. */
  readonly layers: readonly LayerSpec[];
}

/** Description courte d'une couche, pour les messages d'erreur seuls. */
function layerLabel(layer: LayerSpec): string {
  if ('literal' in layer) {
    return `le littéral « ${layer.literal} »`;
  }

  return layer.opacity === undefined
    ? `\`${layer.token}\``
    : `\`${layer.token}\` à l'opacité \`${layer.opacity}\``;
}

function causeMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * `resolveToken`, dont l'échec nomme le support et la couche.
 *
 * « jeton `--halo-tint` absent du thème `dark-os` » est déjà précis ; ce qui
 * manque est l'endroit. Sur un produit encres × supports × thèmes, savoir
 * QUELLE pile réclamait ce jeton est la moitié de la réparation.
 */
function tokenValue(theme: Theme, backdrop: BackdropSpec, layer: LayerSpec, token: string): string {
  try {
    return resolveToken(theme, token);
  } catch (cause) {
    throw new Error(
      `support « ${backdrop.label} », couche ${layerLabel(layer)} : ${causeMessage(cause)}`,
      { cause },
    );
  }
}

/**
 * Facteur d'opacité d'un jeton numérique, refusé plutôt que deviné.
 *
 * `Number('')` vaut 0 et `Number('none')` vaut NaN : sans cette garde, une
 * opacité absente de la feuille donnerait une couche parfaitement
 * transparente — donc un support qui ressemble au meilleur cas — et la suite
 * passerait au vert sur une mesure qui n'a jamais eu lieu.
 */
function opacityFactor(
  theme: Theme,
  backdrop: BackdropSpec,
  layer: LayerSpec,
  token: string,
): number {
  const raw = tokenValue(theme, backdrop, layer, token);
  const factor = Number(raw);

  if (!Number.isFinite(factor) || factor < 0 || factor > 1) {
    throw new Error(
      `support « ${backdrop.label} » : \`${token}\` doit valoir un nombre dans [0, 1] pour ` +
        `servir d'opacité de couche, or il vaut « ${raw} » dans le thème \`${theme.name}\`.`,
    );
  }

  return factor;
}

function resolveLayer(theme: Theme, backdrop: BackdropSpec, layer: LayerSpec): string {
  if ('literal' in layer) {
    if (layer.literal.includes('var(')) {
      throw new Error(
        `support « ${backdrop.label} » : ${layerLabel(layer)} contient un \`var()\`, que ce ` +
          'modèle ne substitue pas. Nomme le jeton — `{ token: "--x" }` — pour que ' +
          '`resolveToken` le résolve dans le thème mesuré.',
      );
    }

    return layer.literal.trim();
  }

  const color = tokenValue(theme, backdrop, layer, layer.token);

  return layer.opacity === undefined
    ? color
    : withAlpha(color, opacityFactor(theme, backdrop, layer, layer.opacity));
}

/**
 * L'aplat OPAQUE que ce support présente à une encre, dans ce thème.
 *
 * Rien n'est recalculé ici : `resolveToken` résout, `compositeLayers` compose.
 * Ce que cette fonction ajoute, et c'est tout ce qu'on lui demande, c'est que
 * l'échec NOMME le support fautif. `compositeLayers` dit « substrat
 * translucide », ce qui est vrai et inutilisable : sur un produit de cinq
 * encres par cinq supports par trois thèmes, la ligne rouge ne dit pas laquelle
 * des soixante-quinze piles est cassée. Un test qu'on répare en trente secondes
 * et un test qu'on abandonne, c'est la même différence.
 */
export function resolveBackdrop(theme: Theme, backdrop: BackdropSpec): string {
  const [ground, ...above] = backdrop.layers;

  if (ground === undefined) {
    throw new Error(
      `support « ${backdrop.label} » : aucune couche. Une pile part d'un sol opaque, ` +
        'la couche la plus basse en premier.',
    );
  }

  const resolved = [ground, ...above].map((layer) => resolveLayer(theme, backdrop, layer));

  let groundAlpha: number;

  try {
    groundAlpha = parseRgba(resolved[0]).alpha;
  } catch (cause) {
    throw new Error(
      `support « ${backdrop.label} » : sa couche la plus basse, ${layerLabel(ground)}, ` +
        `ne compose pas — ${causeMessage(cause)}`,
      { cause },
    );
  }

  if (groundAlpha < 1) {
    throw new Error(
      `support « ${backdrop.label} » : sa couche la plus basse, ${layerLabel(ground)}, vaut ` +
        `« ${resolved[0]} » dans le thème \`${theme.name}\` — alpha ${groundAlpha}, donc ` +
        'translucide. Un support part du SOL : ajoute la couche qui est dessous ' +
        '(`--site-background` pour une page, `--surface` pour une carte opaque), ou fais ' +
        'de ce support un `withWash(…)` de celui qui porte déjà son sol.',
    );
  }

  try {
    return compositeLayers(resolved);
  } catch (cause) {
    throw new Error(
      `support « ${backdrop.label} » (${backdrop.layers.map(layerLabel).join(' → ')}) ne ` +
        `compose pas dans le thème \`${theme.name}\` : ${causeMessage(cause)}`,
      { cause },
    );
  }
}

/* ============================================================================
   Les couches, nommées une fois.

   Les nommer ici et non à l'intérieur de chaque `BackdropSpec` est ce qui empêche
   le halo d'être un jour empilé sans son opacité thémée : il n'y a qu'un seul
   endroit où ce câblage est écrit. Un consommateur qui a besoin d'un cinquième
   support le compose de ces pièces plutôt que de les retaper.
   ========================================================================== */

const PAGE: LayerSpec = { token: '--site-background' };
const COOL_HALO: LayerSpec = { token: '--halo-tint', opacity: '--halo-opacity' };
const WARM_HALO: LayerSpec = { token: '--halo-tint-warm', opacity: '--halo-opacity' };
const GLASS_FILL: LayerSpec = { token: '--glass-fill' };
const OPAQUE_CARD: LayerSpec = { token: '--glass-fill-solid' };

/** Les couches du matériau, réutilisables telles quelles. */
export const GLASS_LAYERS = {
  /** Le sol de la page. Le seul jeton opaque sur lequel tout le reste se pose. */
  page: PAGE,
  /** Bulle froide, à son opacité THÉMÉE. */
  coolHalo: COOL_HALO,
  /** Bulle chaude, même opacité, tenue à parité de présence avec la froide. */
  warmHalo: WARM_HALO,
  /** Le remplissage translucide de la carte : blanc à 0,40 en clair, lavis noir en sombre. */
  glassFill: GLASS_FILL,
  /** Le repli opaque, servi quand `backdrop-filter` manque. Alias de `--surface`. */
  opaqueCard: OPAQUE_CARD,
} as const satisfies Readonly<Record<string, LayerSpec>>;

/**
 * Les SEULS supports sur lesquels une carte de verre est mesurée.
 *
 * Un consommateur qui en invente un quatrième l'ajoute ICI, et toutes les
 * encres sont remesurées du même coup — c'est la seule discipline qui empêche
 * un écran d'introduire un fond que la palette n'a jamais vu.
 *
 * Cinq entrées, et chacune est un vrai chemin de rendu :
 *  - la page nue : ce que touche le texte hors carte, et le MEILLEUR cas ;
 *  - la carte sur page nue ;
 *  - la carte sur halo froid et la carte sur halo chaud : les PIRES cas ;
 *  - le repli opaque, quand `backdrop-filter` manque ou que la transparence
 *    réduite est demandée. Ce n'est pas une redite de la carte sur page nue :
 *    `--glass-fill-solid` est `--surface`, un jeton propre, et c'est un chemin
 *    que des navigateurs empruntent réellement.
 */
export const GLASS_BACKDROPS: readonly BackdropSpec[] = [
  { label: 'la page nue', layers: [PAGE] },
  { label: 'la carte sur la page nue', layers: [PAGE, GLASS_FILL] },
  { label: 'la carte sur le halo froid', layers: [PAGE, COOL_HALO, GLASS_FILL] },
  { label: 'la carte sur le halo chaud', layers: [PAGE, WARM_HALO, GLASS_FILL] },
  { label: 'la carte en repli opaque', layers: [OPAQUE_CARD] },
];

/**
 * LE HALO SANS LA CARTE — le support que `GLASS_BACKDROPS` ne contient pas, et
 * qui est pourtant le PIRE de tous.
 *
 * Les cinq supports ci-dessus supposent tous une carte, ou pas de halo. Il
 * manquait la combinaison inverse : `Backdrop` rend ses six disques puis **ses
 * enfants**, sans rien exiger d'eux. Un enfant qui n'est pas dans une `Card`
 * pose donc son encre sur `page → halo`, sans le remplissage de verre qui est
 * précisément la couche qui protégeait le contraste. Mesuré, l'écart est d'un
 * point entier : `--warning` sur son propre lavis tient 4,17:1 sur la carte au-
 * dessus du halo froid, et 3,35:1 sur le même halo sans carte.
 *
 * POURQUOI CES DEUX PILES NE SONT PAS DANS `GLASS_BACKDROPS`. Cette liste-là
 * est le domaine des mesures de CARTE : les §§ 4 à 8 de
 * `glass.contract.test.ts` l'énumèrent, et son § 7 publie le pire cas de chaque
 * encre en supposant qu'un lavis d'ÉTAT peut se poser dessus. Or un lavis
 * d'état est une couche d'interaction — il appartient à un panneau ou à un
 * contrôle, qui a sa propre surface — et l'empiler sur le décor nu décrirait un
 * rendu que rien ne produit. Mesuré quand même, par curiosité et pour que le
 * chiffre existe : sur ce produit-là, six des neuf encres tombent sous leur
 * seuil (jusqu'à 2,55:1 pour `--control-border`). Ce n'est pas une dette
 * cachée, c'est un empilement fictif.
 *
 * Ce qui se pose RÉELLEMENT sur le décor nu, c'est un lavis SÉMANTIQUE : un
 * `Message` n'a pas de surface propre, il peint `--{tone}-quiet` et rien
 * d'autre. C'est exactement le produit que mesure le § 9 de
 * `glass.contract.test.ts`, et c'est le seul emploi pour lequel ces deux piles
 * sont dans la portée.
 */
export const DECOR_BACKDROPS: readonly BackdropSpec[] = [
  { label: 'le décor nu sur le halo froid', layers: [PAGE, COOL_HALO] },
  { label: 'le décor nu sur le halo chaud', layers: [PAGE, WARM_HALO] },
];

/**
 * Les trois lavis d'état, du repos à l'appui.
 *
 * Ils ne sont PAS des sols : depuis la v0.3.0 ce sont des couches translucides
 * (une encre à faible alpha en clair, un voile clair en sombre), donc leur
 * contraste est celui de ce sur quoi ils sont posés. On les liste ici pour que
 * le produit « support × lavis » se construise sans que personne réécrive la
 * liste — et se mette à en oublier un.
 */
export const STATE_WASHES: readonly string[] = [
  '--panel-surface',
  '--panel-surface-hover',
  '--panel-surface-active',
];

/**
 * Les trois lavis SÉMANTIQUES — l'autre famille de couches translucides, et
 * celle que ce fichier avait oubliée.
 *
 * `STATE_WASHES` a été écrite pour les lavis d'INTERACTION : ce qu'un panneau,
 * un champ ou un bouton secondaire pose sous le doigt. Les `--{tone}-quiet`
 * n'ont rien à voir avec l'interaction — ce sont les fonds de `Message`, à
 * savoir l'encre sémantique elle-même à faible alpha — mais ils sont
 * translucides pour la même raison, donc ils raboteront le contraste de la même
 * façon. Ne pas les avoir listés ici est ce qui a laissé le produit « support ×
 * lavis sémantique » hors de toute mesure : le § 11 de
 * `tokens.contract.test.ts` les mesurait sur trois aplats OPAQUES
 * (`--site-background`, `--surface`, `--panel-surface` composé), écrits avant
 * que le verre et les halos n'existent.
 *
 * L'ordre est celui de `roles.css`, et le nom du ton se lit dans le jeton :
 * l'encre qui se pose sur `--warning-quiet` est `--warning`, jamais une autre.
 */
export const SEMANTIC_WASHES: readonly string[] = [
  '--danger-quiet',
  '--success-quiet',
  '--warning-quiet',
];

/**
 * Le même support, avec un lavis d'état posé dessus.
 *
 * Le libellé grandit au lieu d'être remplacé : c'est ce qui fait qu'un rouge dit
 * « la carte sur le halo chaud, lavis --panel-surface-hover posé » et non
 * « --panel-surface-hover », qui n'est le nom d'aucun support.
 */
export function withWash(backdrop: BackdropSpec, washToken: string): BackdropSpec {
  return {
    label: `${backdrop.label}, lavis ${washToken} posé`,
    layers: [...backdrop.layers, { token: washToken }],
  };
}
