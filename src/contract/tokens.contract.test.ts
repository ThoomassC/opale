import { describe, expect, it } from 'vitest';

import { compositeLayers, contrastRatio, deltaEOklab, oklab, parseRgba, withAlpha } from './color';
import { parseThemes, resolveToken, stripComments } from './stylesheet';
import type { Theme, ThemeName } from './stylesheet';
import materialsSource from '../tokens/materials.css?raw';
import primitivesSource from '../tokens/primitives.css?raw';
import rolesSource from '../tokens/roles.css?raw';

/* ============================================================================
   Seuils. Chaque constante nomme la règle qu'elle applique : un rouge doit
   dire quelle exigence tombe, pas seulement quel nombre est trop petit.
   ========================================================================== */

const AAA_TEXT = 7; // WCAG 1.4.6 — texte, niveau AAA
const AA_TEXT = 4.5; // WCAG 1.4.3 — texte, niveau AA
const AA_NON_TEXT = 3; // WCAG 1.4.11 — composants d'interface et graphiques
const MIN_ROLE_DELTA_E = 5; // plancher de hiérarchie entre encres voisines
const MIN_WARM_LIGHTNESS_GAP = 0.08; // écart OKLab L imposé entre le cuivre et l'accent

/**
 * Sous ce ΔE OKLab composé, deux valeurs sont la même couleur et la primitive
 * existante gagne.
 *
 * C'est la règle qui a évité d'ouvrir six primitives d'alpha en portant la
 * palette du portfolio : son encre de lavis (`rgba(11, 24, 28, α)`) et celle de
 * la librairie (`--tc-shade`, `rgba(7, 20, 23, α)`) se composent à 0,06 / 0,13
 * / 0,16 d'écart. Un seuil non écrit aurait laissé ce choix à l'œil de qui
 * portait la palette ; le § 12 le rejoue.
 */
const MAX_MERGE_DELTA_E = 0.5;

/**
 * Écart de ΔE toléré entre le halo froid et le halo chaud, chacun mesuré contre
 * le sol de son thème. Même ordre de grandeur que MAX_MERGE_DELTA_E, et pour la
 * même raison : en dessous, l'œil ne voit pas laquelle des deux couches domine.
 */
const MAX_HALO_PARITY_GAP = 0.5;

const THEME_NAMES = ['light', 'dark-os', 'dark-explicit'] as const satisfies readonly ThemeName[];

/* ============================================================================
   Chargement de la vraie feuille.

   `tokens.css` n'est qu'un point d'entrée : ses trois `@import` ne sont PAS
   résolus par `?raw`. On concatène donc les trois couches dans l'ordre du
   document, primitives puis rôles puis matériaux — `parseThemes` fusionne les
   blocs `:root` des trois fichiers, le dernier déclarant l'emportant. L'ordre
   compte : `materials.css` cite `--surface` et `--shadow-ink`, donc le lire
   avant `roles.css` ferait échouer la résolution.
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

function tokenOf(themeName: ThemeName, token: string): string {
  return resolveToken(themeNamed(themeName), token);
}

/**
 * Les lavis de panneau. Ce ne sont PAS des sols.
 *
 * Depuis la v0.3.0 ce sont des couches d'état translucides : sur une carte dont
 * le repli est #ebf4f6 il ne reste rien à éclaircir, donc l'échelle repos /
 * survol / appui est portée par une encre à faible alpha (et par un voile clair
 * en sombre). Un `rgba()` n'a pas de contraste propre, il a celui de ce sur quoi
 * il est posé — la carte, `--surface`.
 *
 * `contrastRatio` refuse une entrée translucide plutôt que de la composer
 * d'office sur du blanc, et c'est cette garde qui a rendu la migration visible
 * au lieu de la laisser passer en mesurant un chiffre faux et rassurant.
 */
const PANEL_WASHES: readonly string[] = [
  '--panel-surface',
  '--panel-surface-hover',
  '--panel-surface-active',
];

/** L'aplat opaque que `token` présente réellement à une encre. */
function groundOf(themeName: ThemeName, token: string): string {
  const value = tokenOf(themeName, token);

  return PANEL_WASHES.includes(token)
    ? compositeLayers([tokenOf(themeName, '--surface'), value])
    : value;
}

function ratioOf(themeName: ThemeName, ink: string, backdrop: string): number {
  return contrastRatio(tokenOf(themeName, ink), groundOf(themeName, backdrop));
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

/** Cross product of the three themes with a list of token names. */
function perTheme<T>(items: readonly T[]): readonly { theme: ThemeName; item: T }[] {
  return THEME_NAMES.flatMap((theme) => items.map((item) => ({ theme, item })));
}

/* ========================================================================== */

describe('0. La suite lit bien la vraie feuille', () => {
  // Sans ces gardes, toute la suite peut virer au vert en ne lisant rien :
  // une source vide, ou des blocs sombres jamais trouvés, feraient mesurer
  // trois fois le thème clair.

  it('devrait charger une source non vide', () => {
    expect(stylesheet.length).toBeGreaterThan(1000);
  });

  it('devrait produire les trois thèmes du contrat', () => {
    expect(themes.map((theme) => theme.name)).toEqual(['light', 'dark-os', 'dark-explicit']);
  });

  it('devrait charger un thème clair réellement peuplé', () => {
    expect(themeNamed('light').tokens.size).toBeGreaterThan(20);
  });

  it.each(['dark-os', 'dark-explicit'] as const)(
    '%s devrait réellement surcharger le clair et non le recopier',
    (name) => {
      expect(tokenOf(name, '--site-background')).not.toBe(tokenOf('light', '--site-background'));
    },
  );
});

describe('1. Les encres tiennent leur seuil contre le fond de page', () => {
  const AA_INKS = ['--text-strong', '--text-body', '--text-muted', '--text-accent'] as const;
  const AAA_INKS = ['--text-strong', '--text-body'] as const;

  it.each(perTheme(AA_INKS))(
    '$item devrait tenir AA_TEXT contre --site-background en $theme',
    ({ theme, item }) => {
      expectRatio(ratioOf(theme, item, '--site-background'), AA_TEXT, `${item} / fond en ${theme}`);
    },
  );

  it.each(perTheme(AAA_INKS))(
    '$item devrait tenir AAA_TEXT contre --site-background en $theme',
    ({ theme, item }) => {
      expectRatio(
        ratioOf(theme, item, '--site-background'),
        AAA_TEXT,
        `${item} / fond en ${theme}`,
      );
    },
  );
});

describe("2. L'encre posée sur l'accent tient dans les trois états du contrôle", () => {
  const ACCENT_STATES = ['--accent', '--accent-hover', '--accent-active'] as const;

  it.each(perTheme(ACCENT_STATES))(
    '--text-on-accent devrait tenir AA_TEXT contre $item en $theme',
    ({ theme, item }) => {
      expectRatio(
        ratioOf(theme, '--text-on-accent', item),
        AA_TEXT,
        `--text-on-accent / ${item} en ${theme}`,
      );
    },
  );
});

describe('3. Le trait de contrôle tient AA_NON_TEXT sur ses trois supports', () => {
  /*
   * Le lavis d'APPUI est ajouté à la liste en v0.3.0. C'est le pire des trois,
   * et son chiffre est écrit dans `roles.css` (3,90:1 en clair, 4,37:1 en
   * sombre) : un ratio annoncé sans test est exactement ce que ce dépôt refuse.
   */
  const BACKDROPS = ['--site-background', '--panel-surface', '--panel-surface-active'] as const;

  it.each(perTheme(BACKDROPS))(
    '--control-border devrait tenir AA_NON_TEXT contre $item en $theme',
    ({ theme, item }) => {
      expectRatio(
        ratioOf(theme, '--control-border', item),
        AA_NON_TEXT,
        `--control-border / ${item} en ${theme}`,
      );
    },
  );
});

describe('4. Les encres sémantiques tiennent AA_TEXT sur le fond et sur la carte', () => {
  const SEMANTIC_INKS = ['--danger', '--success', '--warning'] as const;
  const BACKDROPS = ['--site-background', '--surface'] as const;
  const cases = THEME_NAMES.flatMap((theme) =>
    SEMANTIC_INKS.flatMap((ink) => BACKDROPS.map((backdrop) => ({ theme, ink, backdrop }))),
  );

  it.each(cases)(
    '$ink devrait tenir AA_TEXT contre $backdrop en $theme',
    ({ theme, ink, backdrop }) => {
      expectRatio(ratioOf(theme, ink, backdrop), AA_TEXT, `${ink} / ${backdrop} en ${theme}`);
    },
  );
});

describe('5. La hiérarchie des encres survit à la résolution des contrastes', () => {
  const NEIGHBOURS = [
    ['--text-strong', '--text-body'],
    ['--text-body', '--text-muted'],
  ] as const;
  const cases = THEME_NAMES.flatMap((theme) =>
    NEIGHBOURS.map(([one, other]) => ({ theme, one, other })),
  );

  it.each(cases)(
    'ΔE OKLab entre $one et $other devrait atteindre MIN_ROLE_DELTA_E en $theme',
    ({ theme, one, other }) => {
      const measured = deltaEOklab(tokenOf(theme, one), tokenOf(theme, other));

      expect(
        measured,
        `${one} vs ${other} en ${theme} — ΔE mesuré ${measured.toFixed(2)}, exigé ${MIN_ROLE_DELTA_E} (manque ${Math.max(
          0,
          MIN_ROLE_DELTA_E - measured,
        ).toFixed(2)})`,
      ).toBeGreaterThanOrEqual(MIN_ROLE_DELTA_E);
    },
  );
});

describe('6. Le contrat teal & cuivre : les deux accents ne se confondent jamais', () => {
  it.each(THEME_NAMES)(
    "l'écart de clarté OKLab entre --accent et --accent-secondary devrait atteindre MIN_WARM_LIGHTNESS_GAP en %s",
    (theme) => {
      const accent = oklab(tokenOf(theme, '--accent')).lightness;
      const secondary = oklab(tokenOf(theme, '--accent-secondary')).lightness;
      const gap = Math.abs(accent - secondary);

      expect(
        gap,
        `en ${theme} — L(--accent) ${accent.toFixed(3)}, L(--accent-secondary) ${secondary.toFixed(
          3,
        )}, écart ${gap.toFixed(3)}, exigé ${MIN_WARM_LIGHTNESS_GAP} (manque ${Math.max(
          0,
          MIN_WARM_LIGHTNESS_GAP - gap,
        ).toFixed(3)})`,
      ).toBeGreaterThanOrEqual(MIN_WARM_LIGHTNESS_GAP);
    },
  );
});

describe("7. L'anneau de focus reste lisible sur chacun de ses supports", () => {
  it.each(THEME_NAMES)(
    "--focus-inner devrait tenir AA_NON_TEXT contre l'aplat --accent en %s",
    (theme) => {
      expectRatio(
        ratioOf(theme, '--focus-inner', '--accent'),
        AA_NON_TEXT,
        `--focus-inner / --accent en ${theme}`,
      );
    },
  );

  it.each(THEME_NAMES)(
    '--focus-outer devrait tenir AA_NON_TEXT contre --site-background en %s',
    (theme) => {
      expectRatio(
        ratioOf(theme, '--focus-outer', '--site-background'),
        AA_NON_TEXT,
        `--focus-outer / --site-background en ${theme}`,
      );
    },
  );

  it.each(THEME_NAMES)(
    "les deux anneaux devraient tenir AA_NON_TEXT l'un contre l'autre en %s",
    (theme) => {
      expectRatio(
        ratioOf(theme, '--focus-inner', '--focus-outer'),
        AA_NON_TEXT,
        `--focus-inner / --focus-outer en ${theme}`,
      );
    },
  );
});

describe('8. Complétude : aucun jeton ne vit uniquement dans un bloc sombre', () => {
  it.each(['dark-os', 'dark-explicit'] as const)(
    'tout jeton de %s devrait aussi être déclaré dans le bloc :root nu',
    (name) => {
      const light = themeNamed('light');
      const orphans = [...themeNamed(name).tokens.keys()].filter(
        (token) => !light.tokens.has(token),
      );

      expect(
        orphans,
        `déclarés uniquement en ${name}, donc jamais appliqués dans l'état non marqué : ${orphans.join(', ')}`,
      ).toEqual([]);
    },
  );
});

describe('9. Les deux blocs sombres ne divergent pas', () => {
  /*
   * On compare `overrides`, jamais `tokens`. Les maps fusionnées partagent
   * toujours leurs clés dès lors que le test 8 passe : supprimer
   * `--accent` du bloc `[data-theme="dark"]` laisse la valeur claire prendre
   * sa place, et une comparaison sur `tokens` reste verte alors que le thème
   * explicite a réellement divergé. Vérifié : cette mutation-là passait.
   */
  const sortedEntries = (theme: Theme): readonly (readonly [string, string])[] =>
    [...theme.overrides.entries()].sort(([one], [other]) => one.localeCompare(other));

  it.each(['dark-os', 'dark-explicit'] as const)(
    'devrait trouver un bloc %s réellement peuplé',
    (name) => {
      expect(
        themeNamed(name).overrides.size,
        `le bloc \`${name}\` n'a été trouvé avec aucune surcharge : sélecteur introuvable ?`,
      ).toBeGreaterThan(0);
    },
  );

  it('devrait redéclarer exactement les mêmes jetons dans les deux blocs sombres', () => {
    expect([...themeNamed('dark-os').overrides.keys()].sort()).toEqual(
      [...themeNamed('dark-explicit').overrides.keys()].sort(),
    );
  });

  it('devrait leur donner les mêmes valeurs', () => {
    expect(sortedEntries(themeNamed('dark-os'))).toEqual(
      sortedEntries(themeNamed('dark-explicit')),
    );
  });
});

describe('11. Une encre sémantique tient son seuil sur SON PROPRE lavis', () => {
  /*
   * Le substrat que le contrat ne regardait pas, et qui a coûté un échec réel :
   * une pastille pose son encre sur `--x-quiet`, c'est-à-dire sur elle-même à
   * alpha faible, composé sur la surface. Mesuré contre le fond de page seul,
   * `--warning` annonçait 4,90:1 ; sur son lavis posé sur `--panel-surface`, il
   * tombait à 4,20:1. Le fond de page n'est jamais le pire cas.
   *
   * ET CES TROIS SUBSTRATS NE SONT PAS LE PIRE CAS NON PLUS. Ce sont trois
   * aplats OPAQUES, et ils ont été écrits avant que le verre et les halos
   * n'existent : le support réel d'un `Message` est une PILE, dont la couche
   * de halo rabote plus que tout le reste. Ce bloc reste — il mesure des
   * chaînes courtes, sans dépendre du modèle de `backdrop.ts` — mais le
   * plafond du rôle, lui, est au § 9 de `contract/glass.contract.test.ts`, qui
   * ajoute les cinq supports de carte et les deux de décor nu. C'est là que
   * l'ambre clair est tombé à 3,35:1, pas ici.
   */
  const TONES = ['danger', 'success', 'warning'] as const;
  const SUBSTRATES = ['--site-background', '--surface', '--panel-surface'] as const;

  it.each(
    perTheme(TONES).flatMap(({ theme, item }) =>
      SUBSTRATES.map((substrate) => ({ theme, tone: item, substrate })),
    ),
  )('$tone sur son lavis posé sur $substrate — thème $theme', ({ theme, tone, substrate }) => {
    const ink = tokenOf(theme, `--${tone}`);
    const composed = compositeLayers([
      groundOf(theme, substrate),
      tokenOf(theme, `--${tone}-quiet`),
    ]);

    expectRatio(
      contrastRatio(ink, composed),
      AA_TEXT,
      `--${tone} sur --${tone}-quiet composé sur ${substrate} (${composed}) en ${theme}`,
    );
  });
});

describe('12. Les fusions de valeurs portées restent imperceptibles', () => {
  /*
   * Porter la palette du portfolio a posé une question à chaque valeur : ouvrir
   * une primitive, ou réutiliser celle qui existe ? La réponse est
   * MAX_MERGE_DELTA_E, et ce bloc la rejoue au lieu de la raconter.
   *
   * Le ΔE se mesure COMPOSÉ : deux encres d'alpha 0,05 séparées de trois unités
   * par canal sont indiscernables une fois posées, et comparer les rgba() nus
   * n'aurait aucun sens — un `rgba()` n'a pas de couleur propre.
   */
  const CARD_LIGHT = '#ebf4f6';
  const CARD_DARK = '#0c1518';

  const MERGES = [
    ['--panel-surface clair', 'rgba(11, 24, 28, 0.05)', 'rgba(7, 20, 23, 0.05)', CARD_LIGHT],
    ['--panel-surface-hover clair', 'rgba(11, 24, 28, 0.1)', 'rgba(7, 20, 23, 0.1)', CARD_LIGHT],
    ['--panel-surface-active clair', 'rgba(11, 24, 28, 0.13)', 'rgba(7, 20, 23, 0.13)', CARD_LIGHT],
    [
      '--panel-surface sombre',
      'rgba(225, 234, 236, 0.049)',
      'rgba(225, 234, 236, 0.05)',
      CARD_DARK,
    ],
    [
      '--panel-surface-hover sombre',
      'rgba(225, 234, 236, 0.125)',
      'rgba(225, 234, 236, 0.121)',
      CARD_DARK,
    ],
    [
      '--panel-surface-active sombre',
      'rgba(225, 234, 236, 0.164)',
      'rgba(225, 234, 236, 0.16)',
      CARD_DARK,
    ],
  ] as const;

  it.each(MERGES)(
    '%s : la valeur du portfolio et la primitive retenue se confondent',
    (subject, ported, kept, ground) => {
      const measured = deltaEOklab(
        compositeLayers([ground, ported]),
        compositeLayers([ground, kept]),
      );

      expect(
        measured,
        `${subject} — ΔE composé ${measured.toFixed(3)} sur ${ground}, seuil de fusion ${MAX_MERGE_DELTA_E}. ` +
          `Au-dessus, la fusion n'est plus légitime : ouvrez une primitive au lieu de réutiliser ${kept}.`,
      ).toBeLessThan(MAX_MERGE_DELTA_E);
    },
  );

  it.each(['light', 'dark-os', 'dark-explicit'] as const)(
    'les lavis de panneau sont bien translucides en %s',
    (theme) => {
      // La prémisse de `groundOf`. Si un jour ces lavis redeviennent des aplats,
      // ce rouge dit d'aller relire la composition plutôt que de la garder.
      for (const wash of PANEL_WASHES) {
        const alpha = parseRgba(tokenOf(theme, wash)).alpha;
        expect(alpha, `${wash} vaut ${tokenOf(theme, wash)} en ${theme}`).toBeLessThan(1);
      }
    },
  );
});

describe('13. Tout jeton coloré thémé est redéclaré dans les DEUX blocs sombres', () => {
  /*
   * LE TROU QUE LES §§ 8 ET 9 NE VOIENT PAS, et il est large.
   *
   * Le § 8 refuse un jeton déclaré en sombre et absent du clair. Le § 9 refuse
   * deux blocs sombres qui divergent. Un jeton déclaré UNIQUEMENT dans `:root`
   * satisfait les deux — il est bien dans le clair, et il n'est dans aucun des
   * deux blocs sombres, donc ils concordent — tout en restant faux en thème
   * sombre. La v0.3.0 ajoute vingt-neuf jetons de panneau, de verre, de halo,
   * de tuile et d'état : à trois blocs chacun, l'oubli était la sortie la plus
   * probable de ce portage.
   *
   * Le test porte sur la VALEUR RÉSOLUE et non sur la présence d'une
   * redéclaration. C'est ce qui rend légitimes `--glass-fill-solid:
   * var(--surface)` et `--glass-shadow: var(--shadow-ink)` : ils ne sont écrits
   * qu'une fois, dans `:root`, et se thèment pourtant, parce qu'ils aliasent un
   * rôle déjà thémé. Exiger la redéclaration aurait imposé de recopier ce que
   * la cascade fait déjà — soit exactement la duplication que ces deux alias
   * existent pour supprimer.
   */
  const THEMED_PREFIXES = [
    '--panel-surface',
    '--glass-',
    '--halo-',
    '--icon-surface-',
    '--status-',
    '--badge-live-',
  ] as const;

  /**
   * Les jetons à préfixe thémé qui NE DOIVENT PAS varier, et la raison de
   * chacun. Une liste ÉCRITE, parce qu'une exclusion implicite est un trou :
   * un jeton oublié n'est pas ici, donc il échoue quand même.
   */
  const THEME_INVARIANT = new Map<string, string>([
    ['--glass-blur', 'un rayon de flou n’a pas de thème'],
    ['--glass-saturate', 'un facteur de saturation n’a pas de thème'],
    ['--glass-edge-width', 'géométrie du ménisque'],
    ['--glass-edge-blur', 'géométrie du ménisque'],
    ['--glass-edge-saturate', 'filtre du ménisque'],
    ['--glass-edge-brightness', 'filtre du ménisque'],
    ['--glass-rim-width', 'géométrie du liseré'],
    ['--badge-live-surface', 'valeur unique dans les deux thèmes, décision de palette'],
    ['--badge-live-text', 'le libellé de la pastille est blanc dans les deux thèmes'],
    ['--status-done-surface', 'aliase --badge-live-surface'],
    ['--status-done-text', 'aliase --badge-live-text'],
  ]);

  const themedTokens = [...themeNamed('light').tokens.keys()]
    .filter((token) => THEMED_PREFIXES.some((prefix) => token.startsWith(prefix)))
    .sort();

  const varying = themedTokens.filter((token) => !THEME_INVARIANT.has(token));

  it('trouve bien la famille de jetons thémés que la v0.3.0 a ajoutée', () => {
    // Sans cette garde, une faute de frappe dans THEMED_PREFIXES viderait le
    // bloc et il resterait vert en ne vérifiant plus rien.
    expect(
      themedTokens.length,
      `jetons trouvés : ${themedTokens.join(', ')}`,
    ).toBeGreaterThanOrEqual(25);
    expect(varying.length).toBeGreaterThanOrEqual(15);
  });

  it("la liste d'exception ne nomme que des jetons qui existent", () => {
    const stale = [...THEME_INVARIANT.keys()].filter((token) => !themedTokens.includes(token));

    expect(
      stale,
      `THEME_INVARIANT nomme des jetons introuvables : ${stale.join(', ')}. ` +
        'Une entrée périmée exempte un jeton qui a changé de nom.',
    ).toEqual([]);
  });

  it.each(
    varying.flatMap((token) =>
      (['dark-os', 'dark-explicit'] as const).map((theme) => ({ theme, token })),
    ),
  )('$token prend bien une valeur sombre en $theme', ({ theme, token }) => {
    const light = resolveToken(themeNamed('light'), token);
    const dark = resolveToken(themeNamed(theme), token);

    expect(
      dark,
      `${token} vaut ${dark} en ${theme}, c'est-à-dire exactement sa valeur claire. ` +
        `Soit il manque au bloc \`${theme === 'dark-os' ? '@media (prefers-color-scheme: dark)' : ':root[data-theme="dark"]'}\`, ` +
        "soit il n'est pas thémé et sa place est dans THEME_INVARIANT, avec la raison écrite.",
    ).not.toBe(light);
  });

  it.each([...THEME_INVARIANT])('%s ne varie pas par thème — %s', (token) => {
    const light = resolveToken(themeNamed('light'), token);

    for (const theme of ['dark-os', 'dark-explicit'] as const) {
      expect(
        resolveToken(themeNamed(theme), token),
        `${token} varie en ${theme} alors que THEME_INVARIANT le déclare stable`,
      ).toBe(light);
    }
  });
});

describe('14. Les deux halos restent à parité contre leur sol', () => {
  /*
   * Le halo chaud n'existe que pour que l'encre se lise par OPPOSITION DE
   * TEINTE plutôt que de se dissoudre. Il ne partage pas seulement son alpha
   * avec le froid : les deux couches sont tenues à parité de PRÉSENCE, mesurée
   * contre le sol. Laisser l'une des deux dériver ne supprime pas le pire cas,
   * il le déplace simplement d'une bulle à l'autre — et la couche la plus forte
   * écrase visuellement l'autre, ce qui défait la raison d'être de la chaude.
   *
   * Les bulles sont des DISQUES PLEINS posés à `opacity: var(--halo-opacity)`,
   * d'où `withAlpha` : une opacité CSS se compose exactement comme le même ton
   * écrit en `rgba()` à cet alpha.
   */
  it.each(THEME_NAMES)('en %s', (theme) => {
    const ground = tokenOf(theme, '--site-background');
    const opacity = Number(tokenOf(theme, '--halo-opacity'));

    expect(opacity, `--halo-opacity vaut « ${tokenOf(theme, '--halo-opacity')} »`).toBeGreaterThan(
      0,
    );

    const presence = (tint: string): number =>
      deltaEOklab(compositeLayers([ground, withAlpha(tokenOf(theme, tint), opacity)]), ground);

    const cool = presence('--halo-tint');
    const warm = presence('--halo-tint-warm');
    const gap = Math.abs(cool - warm);

    expect(
      gap,
      `en ${theme} sur ${ground} — halo froid à ΔE ${cool.toFixed(2)} du sol, halo chaud à ` +
        `${warm.toFixed(2)}, écart ${gap.toFixed(3)}, toléré ${MAX_HALO_PARITY_GAP}. ` +
        "Ne rattrapez pas l'écart en relevant la tolérance : c'est la teinte qui doit revenir à parité.",
    ).toBeLessThan(MAX_HALO_PARITY_GAP);
  });
});

describe("15. Le trait de contrôle survit à la tuile d'icône", () => {
  /*
   * LE PIRE SUPPORT DE TOUTE LA PALETTE, et c'est lui qui dimensionne l'alpha
   * des deux arrêts de `--icon-surface-*`.
   *
   * Une icône seule dans un bouton reste un CONTRÔLE : WCAG 1.4.11 s'applique,
   * et son seul indice visible est `--control-border`. Or ce liseré vit sur une
   * pile de cinq couches — fond de page, halo, remplissage de verre, tuile,
   * lavis de survol — dont chacune rabote son contraste. Mesuré, le pire cas
   * tient 3,01:1 en clair et 3,09:1 en sombre : deux centièmes de marge, ce qui
   * veut dire que ce test tombera au premier halo notablement plus sombre ou
   * plus saturé. C'est exactement ce qu'on lui demande.
   *
   * Les commentaires de `materials.css` annoncent ces deux chiffres et les
   * valeurs d'alpha écartées (2,90:1 à 0,55 en clair, 2,74:1 à 0,34 en sombre).
   * Ce bloc est ce qui les rend refaisables.
   */
  const STOPS = ['--icon-surface-start', '--icon-surface-end'] as const;

  /** Les quatre sols qu'une carte peut prendre, la plus basse couche d'abord. */
  function cardGrounds(theme: ThemeName): Record<string, string> {
    const floor = tokenOf(theme, '--site-background');
    const fill = tokenOf(theme, '--glass-fill');
    const opacity = Number(tokenOf(theme, '--halo-opacity'));
    const overHalo = (tint: string): string =>
      compositeLayers([floor, withAlpha(tokenOf(theme, tint), opacity), fill]);

    return {
      'sol nu': compositeLayers([floor, fill]),
      'halo froid': overHalo('--halo-tint'),
      'halo chaud': overHalo('--halo-tint-warm'),
      'repli opaque': tokenOf(theme, '--surface'),
    };
  }

  it.each(
    THEME_NAMES.flatMap((theme) =>
      STOPS.flatMap((stop) =>
        Object.keys(cardGrounds(theme)).map((card) => ({ theme, stop, card })),
      ),
    ),
  )('$stop sur une carte « $card », lavis de survol posé — $theme', ({ theme, stop, card }) => {
    const composed = compositeLayers([
      cardGrounds(theme)[card],
      tokenOf(theme, stop),
      tokenOf(theme, '--panel-surface-hover'),
    ]);

    expectRatio(
      contrastRatio(tokenOf(theme, '--control-border'), composed),
      AA_NON_TEXT,
      `--control-border sur ${stop} posé sur une carte « ${card} » plus le lavis de survol (${composed}) en ${theme}`,
    );
  });
});

describe('16. Les pastilles d’état tiennent leur seuil sur LEUR PROPRE aplat', () => {
  /*
   * TROIS RATIOS QUI ÉTAIENT ÉCRITS SANS ÊTRE REJOUÉS, et `roles.css` en
   * documentait les six chiffres à la virgule près (8,40 · 4,63 · 4,63 en
   * clair, 8,40 · 4,62 · 4,62 en sombre) sans qu'aucun des quinze blocs
   * précédents ne les mesure. C'est exactement ce que la tête de
   * `glass.contract.test.ts` interdit en toutes lettres : « un ratio en
   * commentaire qui n'est pas rejoué est une affirmation qui se lit comme une
   * vérification ».
   *
   * LA MARGE EST DE 0,12 SUR DEUX DES TROIS PAIRES. `--status-progress-text` et
   * `--status-upcoming-text` sont deux encres appariées à leur aplat pour tenir
   * 4,5:1 tout juste ; un pas de luminosité dans un sens ou dans l'autre les
   * fait tomber. C'est la définition d'un chiffre qui doit être sous test.
   *
   * LES DEUX AUTRES CHIFFRES DE CETTE FAMILLE SONT ICI AUSSI, pour la même
   * raison. `roles.css` annonce que l'aplat « acquis » tient 7,52:1 contre la
   * carte claire — au-dessus du 3:1 de WCAG 1.4.11 — mais SEULEMENT 2,20:1
   * contre la carte sombre, d'où l'obligation faite au composant de donner à
   * cette pastille sa propre bordure `currentColor`. Cette contrainte-là est
   * une CONSIGNE, pas un plancher : elle est donc mesurée à l'égalité, dans les
   * deux sens, pour que la consigne disparaisse si la palette progresse au lieu
   * de survivre à ce qui la justifiait.
   */
  const STATES = ['done', 'progress', 'upcoming'] as const;

  it.each(
    perTheme(STATES).map(({ theme, item }) => ({ theme, state: item })),
  )('--status-$state-text sur --status-$state-surface — $theme', ({ theme, state }) => {
    expectRatio(
      ratioOf(theme, `--status-${state}-text`, `--status-${state}-surface`),
      AA_TEXT,
      `--status-${state}-text / --status-${state}-surface en ${theme}`,
    );
  });

  /*
   * « Acquis » EST « en direct » : `roles.css` déclare les deux jetons d'état
   * comme des alias, et le § 13 les tient invariants par thème. Mesurer l'alias
   * sans mesurer sa source laisserait un renommage casser la paire en silence.
   */
  it.each(THEME_NAMES)('--badge-live-text sur sa pastille — %s', (theme) => {
    expectRatio(
      ratioOf(theme, '--badge-live-text', '--badge-live-surface'),
      AA_TEXT,
      `--badge-live-text / --badge-live-surface en ${theme}`,
    );
  });

  it('la pastille « acquis » se détache de la carte CLAIRE — 7,52:1', () => {
    expectRatio(
      ratioOf('light', '--status-done-surface', '--surface'),
      AA_NON_TEXT,
      '--status-done-surface / --surface en light',
    );
  });

  it.each(['dark-os', 'dark-explicit'] as const)(
    'la pastille « acquis » NE se détache PAS de la carte sombre — la bordure du composant reste obligatoire (%s)',
    (theme) => {
      const measured = ratioOf(theme, '--status-done-surface', '--surface');

      expect(
        measured,
        `--status-done-surface / --surface en ${theme} — mesuré ${measured.toFixed(2)}:1. Il est ` +
          `passé au-dessus de ${AA_NON_TEXT}:1 : la palette a progressé, donc retirez de ` +
          '`roles.css` l’obligation faite au composant de border cette pastille de ' +
          '`currentColor`, au lieu de laisser une consigne survivre à sa raison.',
      ).toBeLessThan(AA_NON_TEXT);
    },
  );
});

describe('17. Chaque bloc de thème annonce son `color-scheme`', () => {
  /*
   * CE QUE LE CONTRAT NE POUVAIT PAS ATTEINDRE AVANT CE BLOC, et ce n'est pas
   * une couleur de la feuille : c'est tout ce que l'agent utilisateur dessine
   * lui-même. La liste déroulante d'un `<select>` — un contrôle publié par
   * cette librairie —, les barres de défilement, le sélecteur de date, le jaune
   * d'autocomplétion de Chrome. Sans `color-scheme: dark`, un utilisateur en OS
   * CLAIR qui choisit le thème sombre obtient une page sombre où ces
   * dessins-là restent clairs, et aucune mesure de contraste ne peut le voir
   * puisque ces couleurs ne sont écrites nulle part.
   *
   * `useTheme` pose `data-theme` et RIEN D'AUTRE, ce qui est correct : la
   * bascule est une décision de couche de jetons, pas de JavaScript.
   *
   * LES BLOCS DE THÈME SONT IDENTIFIÉS PAR CE QU'ILS DÉCLARENT, pas par leur
   * sélecteur. Un bloc de thème est celui qui pose `--site-background` — le sol
   * de la page. C'est ce qui fait que ce test suit une réécriture de sélecteur,
   * et qu'un QUATRIÈME thème ajouté demain est mesuré sans qu'on y pense ; et
   * c'est aussi ce qui EXCLUT le bloc d'aplatissement de fin de fichier, qui ne
   * fait qu'opacifier des lavis déjà déclarés et n'a pas de `color-scheme` à
   * annoncer.
   */
  const source = stripComments(rolesSource);

  /** Corps de chaque règle de la feuille, à toute profondeur d'imbrication. */
  function everyRuleBody(css: string): readonly { prelude: string; body: string }[] {
    const rules: { prelude: string; body: string }[] = [];
    let depth = 0;
    let preludeStart = 0;
    const opens: number[] = [];
    const preludes: string[] = [];

    for (let index = 0; index < css.length; index += 1) {
      const char = css[index];

      if (char === '{') {
        preludes.push(css.slice(preludeStart, index).trim());
        opens.push(index + 1);
        depth += 1;
        preludeStart = index + 1;
      } else if (char === '}') {
        depth -= 1;
        const open = opens.pop();
        const prelude = preludes.pop();

        if (open === undefined || prelude === undefined) {
          throw new Error(`accolade fermante orpheline à l'offset ${index}`);
        }

        rules.push({ prelude, body: css.slice(open, index) });
        preludeStart = index + 1;
      } else if (char === ';' && depth === 0) {
        preludeStart = index + 1;
      }
    }

    if (depth !== 0) {
      throw new Error(`feuille déséquilibrée : ${depth} accolade(s) non fermée(s)`);
    }

    return rules;
  }

  /** Valeur d'une propriété NON personnalisée, au premier niveau du corps. */
  function plainDeclaration(body: string, property: string): string | undefined {
    for (const statement of body.split(/;(?![^(]*\))/)) {
      const colon = statement.indexOf(':');
      if (colon === -1) continue;

      const name = statement.slice(0, colon).trim();
      if (name === property) return statement.slice(colon + 1).trim();
    }

    return undefined;
  }

  const themeBlocks = everyRuleBody(source).filter(
    (rule) => plainDeclaration(rule.body, '--site-background') !== undefined,
  );

  it('trouve bien les trois blocs de thème de roles.css', () => {
    // Sans cette garde, une réécriture qui déplacerait `--site-background`
    // viderait la liste et le bloc resterait vert en ne mesurant plus rien.
    expect(
      themeBlocks.map((rule) => rule.prelude).sort(),
      'blocs déclarant --site-background',
    ).toStrictEqual(
      [':root', ":root:not([data-theme='light'])", ":root[data-theme='dark']"].sort(),
    );
  });

  it.each([
    [':root', 'light'],
    [":root:not([data-theme='light'])", 'dark'],
    [":root[data-theme='dark']", 'dark'],
  ])('%s devrait annoncer color-scheme: %s', (prelude, expected) => {
    const block = themeBlocks.find((rule) => rule.prelude === prelude);

    expect(block, `bloc \`${prelude}\` introuvable`).toBeDefined();
    expect(
      plainDeclaration(block!.body, 'color-scheme'),
      `le bloc \`${prelude}\` déclare un thème sans annoncer son \`color-scheme\` : les ` +
        'contrôles dessinés par le navigateur — liste déroulante de `<select>`, barres de ' +
        'défilement, sélecteur de date, jaune d’autocomplétion — resteront de la polarité ' +
        'inverse, et aucune mesure de cette suite ne peut les atteindre.',
    ).toBe(expected);
  });
});

/*
 * 10. « Aucun hexadécimal littéral hors de primitives.css » vit dans
 *     `src/tokens/primitives.contract.test.ts`, qui appartient à la couche des
 *     jetons et y ajoute le garde du nommage par clarté OKLab. Pas de doublon
 *     ici : deux tests du même invariant divergent tôt ou tard.
 */
