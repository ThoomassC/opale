/**
 * The colour contract — the part of this library that has to exist first.
 *
 * `portfolio` and `travels_in_world` both carried a comment promising their
 * palettes were identical. Six tokens drifted anyway, and nothing said a word,
 * because a comment is not a guard. These helpers are the guard: they read a
 * token sheet as text, rebuild its three themes, and recompute every ratio the
 * comments claim. A wrong number fails CI on the day it is written.
 *
 * Nothing here imports React, touches the DOM, or opens a file. It is a
 * development dependency, never a runtime one, so it costs a consumer's
 * JavaScript budget exactly zero bytes.
 */

export type { Oklab, RgbaColor } from './color.js';
export {
  MID_GREY_LUMINANCE,
  compositeLayers,
  compositeOver,
  contrastRatio,
  deltaEOklab,
  oklab,
  oklchHue,
  oklchHueDistance,
  parseColor,
  parseRgba,
  relativeLuminance,
  withAlpha,
} from './color.js';

export type { Theme, ThemeName } from './stylesheet.js';
export {
  colourTokens,
  parseCustomProperties,
  parseThemes,
  resolveToken,
  ruleBodies,
  stripComments,
} from './stylesheet.js';

/*
 * Le SUPPORT composé — la pièce qui manquait, et la seule dont l'absence se
 * payait en duplication. Le portfolio nommait ses piles de cartes dans son
 * fichier de test (`CARD_FLOORS`, `WASH_SUPPORTS`), `travels_in_world` dans le
 * sien (une fonction `stack()` maison) : deux copies d'un même modèle, donc
 * deux définitions du mot « fond » qui dérivent. Elles arrivent ici.
 *
 * `resolveBackdrop` ne recalcule rien : il assemble `resolveToken` et
 * `compositeLayers` et NOMME le résultat, ce qui est précisément ce qui manque
 * à un message d'échec quand soixante piles sont mesurées d'un coup.
 */
export type { BackdropSpec, LayerSpec } from './backdrop.js';
export {
  DECOR_BACKDROPS,
  GLASS_BACKDROPS,
  GLASS_LAYERS,
  SEMANTIC_WASHES,
  STATE_WASHES,
  resolveBackdrop,
  withWash,
} from './backdrop.js';
