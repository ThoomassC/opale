import { describe, expect, it } from 'vitest';

import {
  DECOR_BACKDROPS,
  GLASS_BACKDROPS,
  GLASS_LAYERS,
  SEMANTIC_WASHES,
  STATE_WASHES,
  resolveBackdrop,
  withWash,
} from './backdrop';
import type { BackdropSpec } from './backdrop';
import { contrastRatio, deltaEOklab, parseRgba } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme, ThemeName } from './stylesheet';
import materialsSource from '../tokens/materials.css?raw';
import primitivesSource from '../tokens/primitives.css?raw';
import rolesSource from '../tokens/roles.css?raw';

/**
 * LE CONTRASTE SUR LE VERRE — chaque encre, sur chaque support atteignable,
 * dans les trois thèmes.
 *
 * `tokens.contract.test.ts` mesure une encre contre UN jeton. C'est vrai et
 * insuffisant : le support réel d'une encre de carte est une pile — sol de
 * page, halo, remplissage de verre, lavis d'état — et chaque couche rabote le
 * contraste de la suivante. Ce fichier mesure la pile, via `backdrop.ts`.
 *
 * LE HALO NE FOURNIT PAS LE CONTRASTE, IL LE DÉGRADE, et c'est le fait qui
 * organise tout le fichier. Mesuré ici, en clair, sur `--text-body` :
 * 9,04:1 sur la carte posée sur la page nue, 7,28:1 dès qu'un halo passe
 * dessous, 5,59:1 avec le lavis d'appui par-dessus. Halo absent = MEILLEUR cas.
 * Aucun composant n'a donc à exiger un halo derrière lui ; c'est le contrat qui
 * doit mesurer le pire, et c'est pourquoi les deux bulles sont dans
 * `GLASS_BACKDROPS`.
 *
 * CE QUI EST MESURÉ, ET CE QUI NE L'EST PAS. Seules les couches de `background`
 * sont composées. `backdrop-filter: blur() saturate() brightness()` et le
 * ménisque (`--glass-edge-*`) sont HORS du domaine mesuré : un flou moyenne les
 * pixels du dessous, une saturation déplace la couleur reçue, et rien de cela
 * n'est calculé. Les chiffres de ce fichier sont donc des ESTIMATIONS de ce
 * qu'un navigateur peint — au sens exact où `portfolio/src/index.css:287` emploie
 * ce mot. La liste complète des limites est en tête de `backdrop.ts` ; elle
 * appartient au modèle, pas à ce fichier.
 *
 * LES PIRES CAS SONT ÉCRITS, ÉTIQUETÉS DE LEUR SUPPORT, ET RECALCULÉS. Un
 * ratio en commentaire qui n'est pas rejoué est une affirmation qui se lit
 * comme une vérification. Le § 7 est cette table.
 */

/* ============================================================================
   Seuils.
   ========================================================================== */

const AAA_TEXT = 7; // WCAG 1.4.6 — texte, niveau AAA
const AA_TEXT = 4.5; // WCAG 1.4.3 — texte, niveau AA
const AA_NON_TEXT = 3; // WCAG 1.4.11 — composants d'interface et graphiques

/**
 * Dérive tolérée entre un pire cas DÉCLARÉ au § 7 et sa mesure.
 *
 * La MOITIÉ du dernier chiffre écrit, et pas un centième : à 0,01, déclarer
 * 5,60 pour une mesure de 5,591 passait — l'erreur d'un chiffre dans la table
 * était exactement ce qui ne devait pas passer. À 0,005, seul l'arrondi correct
 * du centième est accepté. Prouvé par échec délibéré avant d'être écrit :
 *
 *   `--text-body` clair, 5.59 → 5.6
 *     FAIL … mesuré 5.591:1, déclaré 5.60:1
 *
 * La conséquence est qu'un pire cas dont la mesure tombe pile sur un demi-
 * centième (`--text-body` sombre vaut 5,1449) s'écrit avec son arrondi VRAI,
 * 5,14 et non 5,15 : la table dit la mesure, pas le chiffre qu'on aurait aimé.
 */
const MAX_RATIO_DRIFT = 0.005;

/**
 * Plancher de perceptibilité du liseré de carte, en ΔE OKLab.
 *
 * Ce n'est PAS un seuil WCAG, et le § 8 explique pourquoi il ne peut pas l'être.
 * 10 est choisi sous le pire cas mesuré (12,53) avec 2,5 de marge : assez pour
 * qu'un halo un peu plus dense ne fasse pas tomber la suite, assez peu pour
 * qu'un liseré qu'on affaiblirait de moitié la fasse tomber.
 */
const MIN_RIM_DELTA_E = 10;

/**
 * Sous ce ΔE OKLab, deux aplats sont la même couleur — même constante et même
 * raison qu'au § 12 de `tokens.contract.test.ts`.
 */
const MAX_MERGE_DELTA_E = 0.5;

const THEME_NAMES = ['light', 'dark-os', 'dark-explicit'] as const satisfies readonly ThemeName[];

/* ============================================================================
   La vraie feuille, dans l'ordre du document. `tokens.css` n'est qu'un point
   d'entrée : ses `@import` ne sont pas résolus par `?raw`, et lire
   `materials.css` avant `roles.css` laisserait `--glass-fill-solid` sans valeur.
   ========================================================================== */

const stylesheet = `${primitivesSource}\n${rolesSource}\n${materialsSource}`;
const themes = parseThemes(stylesheet);

function themeNamed(name: ThemeName): Theme {
  const found = themes.find((theme) => theme.name === name);

  if (found === undefined) {
    throw new Error(
      `thème « ${name} » absent — reçus : ${themes.map((theme) => theme.name).join(', ') || '(aucun)'}`,
    );
  }

  return found;
}

function tokenOf(name: ThemeName, token: string): string {
  return resolveToken(themeNamed(name), token);
}

function backdropOf(name: ThemeName, backdrop: BackdropSpec): string {
  return resolveBackdrop(themeNamed(name), backdrop);
}

function ratioOn(name: ThemeName, ink: string, backdrop: BackdropSpec): number {
  return contrastRatio(tokenOf(name, ink), backdropOf(name, backdrop));
}

/** Asserts a contrast floor and reports the measured value plus the shortfall. */
function expectRatio(measured: number, minimum: number, subject: string): void {
  expect(
    measured,
    `${subject} — mesuré ${measured.toFixed(2)}:1, exigé ${minimum}:1 (manque ${Math.max(
      0,
      minimum - measured,
    ).toFixed(2)})`,
  ).toBeGreaterThanOrEqual(minimum);
}

/* ============================================================================
   Les encres, groupées par EMPLOI — c'est l'emploi qui décide du seuil.
   ========================================================================== */

/**
 * Les cinq encres qu'une carte porte réellement : titre, texte courant, texte
 * secondaire, encre d'accent, surtitre éditorial. Ce sont les rôles de texte de
 * `roles.css`, et la liste est celle que le portfolio a établie règle par règle
 * (`.timeline .company`, `.project-card p`, `.accessibility-status`,
 * `.project-date`, `.eyebrow`).
 */
const CARD_INKS: readonly string[] = [
  '--text-strong',
  '--text-body',
  '--text-muted',
  '--text-accent',
  '--accent-secondary',
];

/**
 * Les trois encres sémantiques. Elles vivent sur une carte comme les autres —
 * un message d'erreur est du texte —, donc même seuil AA.
 */
const SEMANTIC_INKS: readonly string[] = ['--danger', '--success', '--warning'];

const TEXT_INKS: readonly string[] = [...CARD_INKS, ...SEMANTIC_INKS];

/** Tous les supports atteignables : les cinq nus, et les quinze sous lavis. */
const WASHED_BACKDROPS: readonly BackdropSpec[] = GLASS_BACKDROPS.flatMap((backdrop) =>
  STATE_WASHES.map((wash) => withWash(backdrop, wash)),
);

const ALL_BACKDROPS: readonly BackdropSpec[] = [...GLASS_BACKDROPS, ...WASHED_BACKDROPS];

/** Le support nommé dans `GLASS_BACKDROPS`, retrouvé par sa pile et non par son rang. */
function glassBackdrop(layers: readonly unknown[]): BackdropSpec {
  const found = GLASS_BACKDROPS.find(
    (backdrop) => JSON.stringify(backdrop.layers) === JSON.stringify(layers),
  );

  if (found === undefined) {
    throw new Error(`aucun support de GLASS_BACKDROPS ne porte la pile ${JSON.stringify(layers)}`);
  }

  return found;
}

const BARE_PAGE = glassBackdrop([GLASS_LAYERS.page]);
const CARD_ON_PAGE = glassBackdrop([GLASS_LAYERS.page, GLASS_LAYERS.glassFill]);
const CARD_ON_COOL = glassBackdrop([
  GLASS_LAYERS.page,
  GLASS_LAYERS.coolHalo,
  GLASS_LAYERS.glassFill,
]);
const CARD_ON_WARM = glassBackdrop([
  GLASS_LAYERS.page,
  GLASS_LAYERS.warmHalo,
  GLASS_LAYERS.glassFill,
]);
const OPAQUE_CARD = glassBackdrop([GLASS_LAYERS.opaqueCard]);

/* ========================================================================== */

describe('1. Les deux chemins vers le sombre composent le MÊME support', () => {
  /*
   * `dark-os` sert la préférence système et `dark-explicit` le choix de
   * l'utilisateur. Les blocs sont dupliqués à la main dans les deux feuilles ;
   * le § 9 de `tokens.contract.test.ts` vérifie que les JETONS ne divergent pas,
   * ce § vérifie que les SUPPORTS COMPOSÉS n'ont pas divergé non plus. Ce n'est
   * pas le même contrôle : une divergence sur `--halo-opacity` seule laisse
   * chaque jeton coloré identique et déplace pourtant les vingt supports.
   */
  it.each(ALL_BACKDROPS.map((backdrop) => ({ label: backdrop.label, backdrop })))(
    '$label',
    ({ backdrop }) => {
      expect(backdropOf('dark-explicit', backdrop)).toBe(backdropOf('dark-os', backdrop));
    },
  );
});

describe('2. Le remplissage de verre : ce qu’il achète, et son plafond', () => {
  /*
   * `materials.css` justifie l'alpha 0,40 du verre clair par une mesure : le
   * remplissage lève la carte de 1,078:1 contre le sol, quand le blanc PUR ne
   * la lèverait qu'à 1,202:1. « Il n'y a plus rien à acheter en blanchissant »
   * est donc une affirmation arithmétique, et ce § la rejoue. C'est elle qui
   * force la séparation de la carte à passer par le liseré (§ 8) et par l'ombre.
   */
  it('en clair, le verre lève la carte de 1,078:1 contre le sol', () => {
    expect(ratioOn('light', '--site-background', CARD_ON_PAGE)).toBeCloseTo(1.078, 3);
  });

  it('en clair, le blanc PUR plafonne à 1,202:1 — le verre en prend déjà les deux tiers', () => {
    const white = resolveBackdrop(themeNamed('light'), {
      label: 'une carte blanc pur',
      layers: [GLASS_LAYERS.page, { token: '--tc-white' }],
    });

    expect(contrastRatio(white, tokenOf('light', '--site-background'))).toBeCloseTo(1.202, 3);
  });

  it('en sombre, le verre CREUSE la carte de 1,037:1 — la polarité s’inverse, pas le modèle', () => {
    expect(ratioOn('dark-os', '--site-background', CARD_ON_PAGE)).toBeCloseTo(1.037, 3);
  });

  it.each(THEME_NAMES)('le repli opaque est la MÊME carte que le verre composé — %s', (name) => {
    /*
     * `--glass-fill-solid` est un alias de `--surface`, servi quand
     * `backdrop-filter` manque. S'il rendait une autre carte, la moitié des
     * navigateurs verrait une palette non mesurée. Mesuré : ΔE OKLab 0,06 en
     * clair et 0,10 en sombre — la même couleur, à un centième près.
     */
    const drift = deltaEOklab(backdropOf(name, CARD_ON_PAGE), backdropOf(name, OPAQUE_CARD));

    expect(
      drift,
      `le repli opaque dérive de ΔE ${drift.toFixed(3)} du verre composé en ${name}`,
    ).toBeLessThan(MAX_MERGE_DELTA_E);
  });
});

describe('3. Le halo DÉGRADE le contraste, il ne le fournit jamais', () => {
  /*
   * L'inversion à ne pas faire, et la raison d'être de tout ce fichier. Le halo
   * tire la carte vers la mi-luminosité : sur un thème clair il l'assombrit, sur
   * un thème sombre il l'éclaircit, et dans les deux cas il RAPPROCHE le support
   * de l'encre. Une palette validée contre `--site-background` seul est validée
   * contre le meilleur cas.
   *
   * Le § est restreint aux encres de TEXTE, et c'est une limite du fait, pas une
   * commodité : une encre dont la clarté est voisine de celle du support — par
   * exemple `--focus-inner`, à 1,08:1 sur la carte claire — est au contraire
   * AMÉLIORÉE par le halo. Ce qui est vrai pour tout le monde, c'est que le halo
   * déplace ; ce qui est vrai des encres de lecture, c'est qu'il leur coûte.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      TEXT_INKS.flatMap((ink) =>
        [CARD_ON_COOL, CARD_ON_WARM].map((halo) => ({ theme, ink, halo, label: halo.label })),
      ),
    ),
  )('$ink perd du contraste sur « $label » — $theme', ({ theme, ink, halo }) => {
    const best = ratioOn(theme, ink, CARD_ON_PAGE);
    const measured = ratioOn(theme, ink, halo);

    expect(
      measured,
      `${ink} en ${theme} : ${measured.toFixed(2)}:1 sur ${halo.label} contre ` +
        `${best.toFixed(2)}:1 sur la carte posée sur la page nue. Si le halo se met à ` +
        'AMÉLIORER le contraste, ce n’est plus le pire cas et l’enveloppe du § 7 mesure à côté.',
    ).toBeLessThan(best);
  });
});

describe('4. Toute encre de texte tient AA sur les cinq supports NUS', () => {
  /*
   * Le seul § dont la portée est universelle : une encre de texte peut être
   * posée sur n'importe laquelle des cinq cartes, sans lavis, par n'importe
   * quel composant. C'est donc la contrainte que la palette doit tenir partout.
   *
   * Pires cas mesurés, chacun étiqueté du support qui l'a produit :
   *   --accent-secondary  4,58:1  la carte sur le halo froid   (sombre)
   *   --text-muted        5,86:1  la carte sur le halo froid   (clair)
   * Soit 0,08 de marge pour le cuivre sombre : ce test tombera au premier halo
   * sensiblement plus clair, et c'est ce qu'on lui demande.
   *
   * `--warning` occupait la seconde ligne à 4,75:1 tant que l'ambre clair était
   * `--tc-amber-482`. Il tient 9,97:1 depuis que le § 9 a fait tomber cette
   * encre ; ce n'est plus une encre tendue de la palette, c'est la plus large.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      TEXT_INKS.flatMap((ink) =>
        GLASS_BACKDROPS.map((backdrop) => ({ theme, ink, backdrop, label: backdrop.label })),
      ),
    ),
  )('$ink sur « $label » — $theme', ({ theme, ink, backdrop }) => {
    expectRatio(
      ratioOn(theme, ink, backdrop),
      AA_TEXT,
      `${ink} sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });
});

describe('5. Les deux encres de lecture tiennent AAA sur les cinq supports nus', () => {
  /*
   * `--text-strong` et `--text-body` portent le texte long : la cible est
   * WCAG 1.4.6, pas 1.4.3. Pire cas mesuré : `--text-body` à 7,28:1 sur la
   * carte sur le halo froid en clair — 0,28 de marge sur 7:1. Les trois autres
   * encres de carte ne sont PAS tenues à AAA, et c'est délibéré : `--text-muted`
   * y tombe à 5,86:1 au même endroit, et exiger AAA d'une encre secondaire la
   * ferait converger sur l'encre forte, ce que le plancher de ΔE de
   * `tokens.contract.test.ts` interdit par ailleurs.
   */
  const READING_INKS = ['--text-strong', '--text-body'] as const;

  it.each(
    THEME_NAMES.flatMap((theme) =>
      READING_INKS.flatMap((ink) =>
        GLASS_BACKDROPS.map((backdrop) => ({ theme, ink, backdrop, label: backdrop.label })),
      ),
    ),
  )('$ink sur « $label » — $theme', ({ theme, ink, backdrop }) => {
    expectRatio(
      ratioOn(theme, ink, backdrop),
      AAA_TEXT,
      `${ink} sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });
});

describe('6. --control-border tient 3:1 sur les VINGT supports, lavis compris', () => {
  /*
   * WCAG 1.4.11 : le liseré est le seul indice visible d'un champ ou d'un bouton
   * secondaire, donc son seuil est un vrai plancher, pas une préférence. Et
   * contrairement aux encres de texte, un contrôle se pose bien sur un lavis
   * d'état — c'est même sa raison d'être —, donc les quinze supports sous lavis
   * sont dans la portée.
   *
   * Pire cas mesuré : 3,18:1 en clair et 3,27:1 en sombre, tous deux sur la
   * carte sur le halo froid sous le lavis d'appui.
   *
   * CE § N'EST PAS LE PIRE CAS ABSOLU DU JETON, et il ne prétend pas l'être :
   * le § 15 de `tokens.contract.test.ts` ajoute la TUILE D'ICÔNE dans la pile et
   * descend à 3,01:1 (clair) et 3,09:1 (sombre). La tuile est une couche de
   * composant, pas un support de carte, donc elle n'entre pas dans
   * `GLASS_BACKDROPS` ; les deux chaînes s'enchaînent proprement — même sol,
   * une couche de plus, deux dixièmes de moins.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      ALL_BACKDROPS.map((backdrop) => ({ theme, backdrop, label: backdrop.label })),
    ),
  )('« $label » — $theme', ({ theme, backdrop }) => {
    expectRatio(
      ratioOn(theme, '--control-border', backdrop),
      AA_NON_TEXT,
      `--control-border sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });
});

/* ============================================================================
   § 7 — L'ENVELOPPE.
   ========================================================================== */

/**
 * Le pire support de toute la palette, mesuré : la carte sur le halo FROID sous
 * le lavis d'APPUI. Quatre couches — page, halo, verre, lavis — et c'est
 * l'argument minimal des neuf encres dans les trois thèmes, sans exception.
 *
 * Le halo froid bat le chaud de peu (3,18:1 contre 3,19:1 pour
 * `--control-border` en clair), ce qui est cohérent avec la parité de présence
 * que le § 14 de `tokens.contract.test.ts` épingle sur les deux bulles.
 */
const WORST_BACKDROP = withWash(CARD_ON_COOL, '--panel-surface-active');

interface WorstCase {
  readonly ink: string;
  /** Le plancher WCAG applicable à l'emploi de cette encre. */
  readonly floor: number;
  /** Pire ratio de toute l'enveloppe, thème clair. */
  readonly light: number;
  /** Le même, thème sombre — identique dans `dark-os` et `dark-explicit` (§ 1). */
  readonly dark: number;
  /**
   * Renseigné SEULEMENT quand le pire cas passe sous `floor`, et il dit alors
   * ce qu'un composant doit faire à la place. Une palette qui remonterait au-
   * dessus du seuil fait ÉCHOUER l'entrée : la liste ne peut pas rester
   * périmée.
   */
  readonly shortfall?: string;
}

/**
 * Les pires cas, encre par encre, sur les vingt supports.
 *
 * CE QUE CETTE TABLE EST. Une librairie ne sait pas quelles règles ses
 * consommateurs écriront : elle ne peut donc pas décréter que `--warning` sur un
 * lavis d'appui est interdit, ni prétendre que ce couple tient AA. Ce qu'elle
 * peut faire, et ce que fait cette table, c'est PUBLIER le plafond de chaque
 * encre avec le support qui le produit, et le recalculer à chaque exécution.
 * Un auteur de composant y lit ce qu'il ne doit pas faire ; la CI y vérifie que
 * personne ne l'a déplacé sans le dire.
 *
 * Les quatre `shortfall` ne sont pas des dettes déguisées : ce sont les seuls
 * couples encre × support où la palette ne tient pas AA, ils sont nommés, et
 * chacun porte l'encre de remplacement qui tient au même endroit.
 */
const WORST_CASES: readonly WorstCase[] = [
  { ink: '--text-strong', floor: AA_TEXT, light: 6.85, dark: 6.12 },
  { ink: '--text-body', floor: AA_TEXT, light: 5.59, dark: 5.14 },
  {
    ink: '--text-muted',
    floor: AA_TEXT,
    light: 4.5,
    dark: 4.31,
    shortfall:
      'en sombre, l’encre secondaire ne passe pas le lavis d’APPUI au-dessus d’un halo. Elle ' +
      'tient 7,00:1 au lavis de repos et 6,67:1 sur la carte nue : c’est l’appui, et lui seul, ' +
      'qui est hors budget. Un composant qui garde du texte secondaire visible pendant l’appui ' +
      'passe à --text-body (5,15:1 au même endroit).',
  },
  {
    ink: '--text-accent',
    floor: AA_TEXT,
    light: 4.4,
    dark: 4.23,
    shortfall:
      'ce manquement est celui du TEXTE, pas celui du LISERÉ, et la distinction est la même que ' +
      'celle du § 6 pour --control-border. En TEXTE (WCAG 1.4.3, 4,5:1), l’encre d’accent ne se ' +
      'pose pas sur un lavis d’APPUI au-dessus d’un halo, dans aucun des deux thèmes : c’est ' +
      'l’arbitrage que le portfolio avait fait à la main, son lavis d’appui ne portant que ' +
      '--text-strong (6,85:1 clair, 6,12:1 sombre sur ce même support). En LISERÉ (WCAG 1.4.11, ' +
      '3:1) le même couple est LÉGITIME, et la librairie l’emploie : ' +
      '`.tc-btn--secondary:hover` pose `border-color: var(--text-accent)`, `:active` passe le ' +
      'fond à --panel-surface-active, et le survol persiste sous la souris — donc le teal borde ' +
      'bien un lavis d’appui, mesuré 4,40:1 en clair et 4,23:1 en sombre, soit 1,40 et 1,23 de ' +
      'marge sur le seuil applicable. La note précédente interdisait en toutes lettres ce que ' +
      'la feuille de bouton fait à bon droit.',
  },
  {
    ink: '--accent-secondary',
    floor: AA_TEXT,
    light: 4.75,
    dark: 2.96,
    shortfall:
      'le cuivre est ÉDITORIAL — surtitre, date, décor — et jamais un contrôle : il n’a donc ' +
      'rien à faire sur un lavis d’état, qui est une couche d’INTERACTION. Sur les cinq ' +
      'supports nus, son pire cas reste 4,58:1 (sombre, carte sur le halo froid). En sombre, ' +
      'sur le lavis d’appui au-dessus du halo froid, il tombe à 2,96:1 — sous AA et même sous ' +
      '3:1. C’est la mesure la plus basse de toute la table.',
  },
  { ink: '--danger', floor: AA_TEXT, light: 6.9, dark: 4.57 },
  { ink: '--success', floor: AA_TEXT, light: 5.36, dark: 5.28 },
  /*
   * L'EXEMPTION DE `--warning` A ÉTÉ RETIRÉE, ET C'EST LE § 9 QUI L'A FAIT
   * TOMBER. Elle disait « une mention d'avertissement se pose sur une carte
   * NUE, où son pire cas est 4,75:1 » — une consigne que la librairie ne
   * pouvait pas tenir, puisque `.tc-message--warn` ne se pose pas sur une carte
   * nue : il peint son propre lavis, et `Backdrop` l'autorise à le faire
   * au-dessus d'un halo sans carte du tout. Mesurée, cette chaîne valait 3,35:1.
   * L'ambre clair a donc été remplacé par `--tc-amber-300` dans `roles.css` (et
   * l'ambre juste, à ouvrir en primitive, est nommé là-bas). Le pire cas de
   * cette table remonte du même coup de 3,65 à 5,395 — et non à 7,65 comme
   * l'annonçait la version intermédiaire de cette table, calée sur
   * `--tc-amber-300`. Cette primitive tenait le seuil mais passait DEVANT
   * `--text-strong` (10,28:1) sur le sol : une encre d'avertissement plus
   * contrastée que l'encre forte est une faute d'apparence. `--tc-amber-390`
   * a été battue pour cet emploi, avec 4,96:1 au pire au § 9.
   */
  { ink: '--warning', floor: AA_TEXT, light: 5.395, dark: 5.38 },
  { ink: '--control-border', floor: AA_NON_TEXT, light: 3.18, dark: 3.27 },
];

describe('7. L’enveloppe : le pire cas de chaque encre, étiqueté de son support', () => {
  function worstOf(theme: ThemeName, ink: string): { ratio: number; label: string } {
    return ALL_BACKDROPS.map((backdrop) => ({
      ratio: ratioOn(theme, ink, backdrop),
      label: backdrop.label,
    })).reduce((worst, candidate) => (candidate.ratio < worst.ratio ? candidate : worst));
  }

  it.each(
    THEME_NAMES.flatMap((theme) => WORST_CASES.map((worstCase) => ({ theme, ...worstCase }))),
  )('$ink — $theme', ({ theme, ink, light, dark, floor, shortfall }) => {
    const declared = theme === 'light' ? light : dark;
    const measured = worstOf(theme, ink);

    // (a) LE SUPPORT. Si le pire cas change de support, la table ne mesure plus
    //     ce qu'elle prétend mesurer, même si le nombre tombe juste par hasard.
    expect(
      measured.label,
      `en ${theme}, le pire support de ${ink} est « ${measured.label} » et non ` +
        `« ${WORST_BACKDROP.label} ». Le pire cas a bougé de place : remesurez les neuf encres ` +
        'avant de retoucher cette table.',
    ).toBe(WORST_BACKDROP.label);

    // (b) LE NOMBRE.
    expect(
      Math.abs(measured.ratio - declared),
      `${ink} en ${theme} sur ${measured.label} — mesuré ${measured.ratio.toFixed(3)}:1, ` +
        `déclaré ${declared.toFixed(2)}:1. Écrivez la mesure, ne déplacez pas la tolérance.`,
    ).toBeLessThanOrEqual(MAX_RATIO_DRIFT);

    // (c) LE VERDICT, dans les deux sens. Une exemption qui n'est plus
    //     nécessaire doit être SUPPRIMÉE, sans quoi la table finit par
    //     autoriser ce que la palette tient déjà.
    if (shortfall === undefined) {
      expectRatio(measured.ratio, floor, `${ink} sur ${measured.label} en ${theme}`);
    } else {
      const worstOfBoth = Math.min(light, dark);

      expect(
        worstOfBoth,
        `${ink} porte une note de manquement alors que son pire cas des deux thèmes vaut ` +
          `${worstOfBoth.toFixed(2)}:1, au-dessus du plancher de ${floor}:1. La palette a ` +
          'progressé : retirez le `shortfall` au lieu de le laisser exempter une encre qui ' +
          'n’en a plus besoin.',
      ).toBeLessThan(floor);
    }
  });

  it('n’exempte que ce qui est nommé', () => {
    // La contrepartie du (c) : le nombre d'exemptions est lui-même épinglé, pour
    // qu'en ajouter une soit une modification visible en revue et non une ligne
    // de plus dans une liste que personne ne recompte.
    expect(
      WORST_CASES.filter((worstCase) => worstCase.shortfall !== undefined).map((w) => w.ink),
    ).toStrictEqual(['--text-muted', '--text-accent', '--accent-secondary']);
  });

  /*
   * LA MOITIÉ VRAIE DE L'EXEMPTION DE `--text-accent`, REJOUÉE.
   *
   * Sa note dit deux choses : le teal ne porte pas de TEXTE sur un lavis
   * d'appui (mesuré au (b) ci-dessus, sous 4,5:1) et il y porte légitimement un
   * LISERÉ (WCAG 1.4.11, 3:1). La seconde moitié était une affirmation en
   * prose ; sans ce bloc, la table pouvait interdire ce que
   * `.tc-btn--secondary:hover` fait à bon droit sans que rien ne le signale.
   *
   * Le `floor` de la table reste AA_TEXT, et c'est correct : une encre qui sert
   * DEUX emplois est tenue par le plus exigeant, et la note nomme l'autre.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      ALL_BACKDROPS.map((backdrop) => ({ theme, backdrop, label: backdrop.label })),
    ),
  )('--text-accent tient le seuil du LISERÉ sur « $label » — $theme', ({ theme, backdrop }) => {
    expectRatio(
      ratioOn(theme, '--text-accent', backdrop),
      AA_NON_TEXT,
      `--text-accent EN LISERÉ sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });

  it('couvre toutes les encres mesurées par les §§ 4 à 6', () => {
    expect(WORST_CASES.map((worstCase) => worstCase.ink)).toStrictEqual([
      ...TEXT_INKS,
      '--control-border',
    ]);
  });
});

describe('8. --glass-border : un bord perceptible, et pas un composant', () => {
  /*
   * SEUIL DE PERCEPTIBILITÉ, PAS LES 3:1 DE WCAG 1.4.11 — un choix argumenté,
   * pas un oubli, et repris tel quel du portfolio.
   *
   * 1.4.11 porte sur « l'information visuelle nécessaire pour identifier les
   * composants d'interface ». Une carte de verre est un CONTENEUR décoratif :
   * rien n'a besoin de son liseré pour être identifié ni actionné, et les vraies
   * bordures de contrôle sont mesurées à 3:1 au § 6. Exiger 3:1 ici imposerait un
   * trait d'encre franc sur une carte claire — c'est-à-dire bloquerait une
   * palette valide. Mesuré, ce liseré tient entre 1,66:1 et 1,74:1 en clair, et
   * `materials.css` documente cette valeur comme voulue, la séparation étant
   * portée par l'ombre (`--glass-shadow`, ΔE 20,6 contre le sol clair).
   *
   * Ce qui est donc exigé est la PERCEPTIBILITÉ du bord, en ΔE OKLab. Mesuré :
   * 16,75 contre la page nue en clair et 18,50 en sombre — les deux chiffres que
   * `materials.css` annonce arrondis à 16,7 et 18,5 —, et jamais moins de 13,99
   * (clair) ni 12,53 (sombre) sur l'ensemble des vingt supports.
   *
   * LE PIXEL MESURÉ. Le fond de la carte est peint SOUS la bordure
   * (`background-clip: border-box` par défaut), donc le pixel de bordure vaut
   * `--glass-border` composé sur le support, et c'est au support qu'on le
   * compare.
   */
  function rimDeltaE(theme: ThemeName, backdrop: BackdropSpec): number {
    const support = backdropOf(theme, backdrop);
    const rim = resolveBackdrop(themeNamed(theme), {
      label: `le liseré sur ${backdrop.label}`,
      layers: [...backdrop.layers, { token: '--glass-border' }],
    });

    return deltaEOklab(rim, support);
  }

  it('le liseré est translucide — il n’a donc pas de contraste propre', () => {
    // La raison pour laquelle ce § compose au lieu de mesurer le jeton : un
    // `rgba()` mesuré seul rendrait son ratio contre du blanc pur.
    for (const theme of THEME_NAMES) {
      expect(parseRgba(tokenOf(theme, '--glass-border')).alpha).toBeLessThan(1);
    }
  });

  it('vaut ΔE 16,75 contre la page nue en clair — le chiffre de materials.css', () => {
    expect(rimDeltaE('light', BARE_PAGE)).toBeCloseTo(16.75, 2);
  });

  it('vaut ΔE 18,50 contre la page nue en sombre, où c’est LUI qui détache la carte', () => {
    expect(rimDeltaE('dark-os', BARE_PAGE)).toBeCloseTo(18.5, 2);
  });

  it.each(
    THEME_NAMES.flatMap((theme) =>
      ALL_BACKDROPS.map((backdrop) => ({ theme, backdrop, label: backdrop.label })),
    ),
  )('reste perceptible sur « $label » — $theme', ({ theme, backdrop }) => {
    const measured = rimDeltaE(theme, backdrop);

    expect(
      measured,
      `--glass-border sur ${backdrop.label} en ${theme} — ΔE ${measured.toFixed(2)}, ` +
        `plancher ${MIN_RIM_DELTA_E}. Sous ce plancher la carte n’a plus de bord : ` +
        'l’ombre portée est le seul relais, et elle est quasi inopérante en sombre.',
    ).toBeGreaterThanOrEqual(MIN_RIM_DELTA_E);
  });
});

describe('9. Une encre sémantique tient AA sur SON PROPRE lavis, verre et halos compris', () => {
  /*
   * LE TROU QUE LES §§ 4 À 7 NE VOYAIENT PAS, ET IL A COÛTÉ UN ÉCHEC RÉEL.
   *
   * Trois mesures existaient, et aucune ne regardait le bon support :
   *
   *  - le § 4 mesure les encres sémantiques sur les cinq cartes NUES. Vrai, mais
   *    `Message` ne se pose jamais sur une carte nue : il peint son propre fond ;
   *  - le § 7 publie leur pire cas sur les vingt supports, lavis d'ÉTAT compris.
   *    Un lavis d'état n'est pas le fond d'un `Message` — c'est une couche
   *    d'interaction — donc ce chiffre ne décrit pas ce rendu-ci non plus ;
   *  - le § 11 de `tokens.contract.test.ts` mesure bien l'encre sur son propre
   *    lavis, mais sur trois aplats OPAQUES (`--site-background`, `--surface`,
   *    `--panel-surface` composé sur la carte), écrits avant que le verre et les
   *    halos n'existent.
   *
   * Résultat : `.tc-message--warn` posait `--warning` sur `--warning-quiet` à
   * `font-size: var(--text-base)` — donc 4,5:1 exigé par WCAG 1.4.3, pas 3:1 —
   * et personne ne mesurait la chaîne réelle. Elle valait 4,17:1 sur une carte
   * au-dessus d'un halo, et 3,35:1 sur le décor nu au-dessus du même halo.
   *
   * LES DEUX SUPPORTS DE DÉCOR NU SONT DANS LA PORTÉE ICI, ET NULLE PART
   * AILLEURS. `Backdrop` rend ses disques puis SES ENFANTS, sans rien exiger
   * d'eux : un `Message` qui n'est pas dans une `Card` a le halo pour seul
   * substrat. C'est le pire support atteignable de la librairie, et il n'entre
   * pas dans `GLASS_BACKDROPS` — voir la note de `DECOR_BACKDROPS`, qui dit
   * pourquoi le produit avec les lavis d'ÉTAT, lui, décrirait un rendu fictif.
   *
   * NEUF ASSERTIONS, une par ton et par thème, chacune mesurant les SEPT
   * supports et rapportant le pire avec son nom. Le seuil est AA_TEXT sans
   * exception possible : un bandeau d'état est du texte courant.
   */
  const TONES = ['danger', 'success', 'warning'] as const;
  const SUPPORTS: readonly BackdropSpec[] = [...GLASS_BACKDROPS, ...DECOR_BACKDROPS];

  it('nomme un lavis sémantique par ton, et rien de plus', () => {
    // Sans cette garde, un ton retiré de `SEMANTIC_WASHES` viderait le produit
    // en silence et le bloc resterait vert en ne mesurant plus ce ton.
    expect([...SEMANTIC_WASHES].sort()).toStrictEqual(
      TONES.map((tone) => `--${tone}-quiet`).sort(),
    );
  });

  it.each(THEME_NAMES.flatMap((theme) => TONES.map((tone) => ({ theme, tone }))))(
    '--$tone sur --$tone-quiet — $theme',
    ({ theme, tone }) => {
      const worst = SUPPORTS.map((backdrop) => {
        const washed = withWash(backdrop, `--${tone}-quiet`);

        return { label: washed.label, ratio: ratioOn(theme, `--${tone}`, washed) };
      }).reduce((worse, candidate) => (candidate.ratio < worse.ratio ? candidate : worse));

      expectRatio(worst.ratio, AA_TEXT, `--${tone} sur ${worst.label} en ${theme}`);
    },
  );
});
