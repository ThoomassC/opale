import { describe, expect, it } from 'vitest';

import { compositeLayers, parseRgba } from '../contract/color';
import { colourTokens, parseThemes, resolveToken } from '../contract/stylesheet';
import type { Theme, ThemeName } from '../contract/stylesheet';
import materialsSource from '../tokens/materials.css?raw';
import primitivesSource from '../tokens/primitives.css?raw';
import rolesSource from '../tokens/roles.css?raw';
import type { Plate, Swatch } from './palette-data';
import { DARK_PLATE, LIGHT_PLATE, PLATES, SEMANTIC_ROWS } from './palette-data';

/* ============================================================================
   POURQUOI CE FICHIER EXISTE

   `palette-data.ts` recopie à la main les valeurs de la feuille de jetons, et
   ce choix est délibéré : les deux plaques documentent le thème clair ET le
   thème sombre dans une page qui n'en rend qu'un. Un `var(--accent)` ne
   montrerait jamais que la moitié de la palette.

   Ce qui n'était pas délibéré, c'est que rien ne tenait cette copie. Constat
   avant écriture de ce fichier : `LIGHT_PLATE.ground` affichait `#deedf0`
   quand `roles.css` déclarait `#f2e9d6`, et la page a documenté un sol qui
   n'existait plus pendant tout un cycle de commits. Le commentaire d'en-tête
   qui interdisait la dérive n'a rien empêché — un commentaire ne s'exécute
   pas.

   Ce test rejoue donc CHAQUE valeur affichée contre le jeton résolu dans le
   thème correspondant, en lisant les vraies feuilles. Et il ajoute les deux
   réciproques, sans lesquelles une comparaison ne voit que ce qu'on lui
   montre : tout rôle coloré de la feuille doit être plaqué ou explicitement
   exclu, et une exclusion dont le jeton a disparu est un rouge.
   ========================================================================== */

/* Même concaténation que `tokens.contract.test.ts`, et pour la même raison :
   `?raw` ne résout pas les `@import` de `tokens.css`. L'ordre du document
   compte — `materials.css` cite `--surface` et `--shadow-ink`. */
const stylesheet = `${primitivesSource}\n${rolesSource}\n${materialsSource}`;
const themes = parseThemes(stylesheet);

/**
 * Les thèmes qu'une plaque doit satisfaire.
 *
 * Une plaque sombre est vérifiée contre les DEUX chemins vers le sombre — la
 * préférence système et le choix explicite. `tokens.contract.test.ts` garde
 * déjà leur non-divergence, mais s'appuyer là-dessus ferait de ce fichier le
 * complice d'un futur relâchement de l'autre : ici, une plaque juste dans un
 * seul des deux blocs est rouge.
 */
const THEMES_OF: Readonly<Record<Plate['theme'], readonly ThemeName[]>> = {
  light: ['light'],
  dark: ['dark-os', 'dark-explicit'],
};

function themeNamed(name: ThemeName): Theme {
  const found = themes.find((theme) => theme.name === name);

  if (found === undefined) {
    throw new Error(
      `thème « ${name} » absent — reçus : ${themes.map((theme) => theme.name).join(', ') || '(aucun)'}`,
    );
  }

  return found;
}

/**
 * Forme canonique d'une couleur CSS : ses quatre canaux, et rien de la
 * notation.
 *
 * La comparaison passe par là plutôt que par l'égalité de chaînes : `#DEEDF0`
 * et `#deedf0` sont la même couleur, et un rouge sur une casse serait du bruit
 * qui apprendrait à ignorer ce test. Ce qui compte — la valeur peinte — est
 * comparé exactement, canal par canal et alpha compris.
 */
function canonical(color: string): string {
  const { red, green, blue, alpha } = parseRgba(color);

  return `${red}/${green}/${blue}/${alpha}`;
}

const HEX_NOTATION = /^#[0-9a-f]{6}$/;

/** Hexadécimal d'une couleur OPAQUE. Refuse tout le reste plutôt que d'aplatir. */
function toHex(color: string): string {
  const { red, green, blue, alpha } = parseRgba(color);

  if (alpha < 1) {
    throw new Error(
      `toHex a reçu une couleur translucide ("${color}", alpha ${alpha}) : un lavis ` +
        "n'a pas d'hexadécimal, il faut le composer sur sa pile d'abord.",
    );
  }

  const byte = (channel: number): string => Math.round(channel).toString(16).padStart(2, '0');

  return `#${byte(red)}${byte(green)}${byte(blue)}`;
}

function isTranslucent(color: string): boolean {
  return parseRgba(color).alpha < 1;
}

/* ============================================================================
   1. Chaque pastille dit la valeur de son jeton

   Trois assertions par pastille, et les trois sont nécessaires :

   — la VALEUR, canal par canal. C'est la dérive qu'on a subie ;
   — la TRANSLUCIDITÉ, en équivalence avec la présence de `wash`. C'est le mode
     de défaillance de la v0.3.0 : `--panel-surface` est passé d'un aplat
     opaque à un lavis, et une pastille qui aurait gardé l'aplat aurait
     continué d'afficher une couleur plausible et fausse. L'équivalence prend
     les deux sens — un lavis déclaré sur un jeton redevenu opaque est aussi un
     mensonge ;
   — la NOTATION, parce que la plaque est un document : elle promet un
     hexadécimal pour un aplat et un `rgba()` pour un lavis, et un
     `rgb(222, 237, 240)` passerait les deux premières sans tenir cette
     promesse.
   ========================================================================== */

function swatchCases(): readonly {
  readonly name: string;
  readonly theme: ThemeName;
  readonly swatch: Swatch;
}[] {
  return PLATES.flatMap((plate) =>
    THEMES_OF[plate.theme].flatMap((theme) =>
      plate.groups.flatMap((group) =>
        group.swatches.map((swatch) => ({
          name: `${plate.title} / ${group.title} / ${swatch.token} en ${theme}`,
          theme,
          swatch,
        })),
      ),
    ),
  );
}

describe('1. Chaque pastille affiche la valeur déclarée de son jeton', () => {
  it.each(swatchCases())('$name', ({ theme, swatch }) => {
    const resolved = resolveToken(themeNamed(theme), swatch.token);

    expect(
      canonical(swatch.hex),
      `${swatch.token} en ${theme} — la plaque affiche « ${swatch.hex} », la feuille déclare « ${resolved} »`,
    ).toBe(canonical(resolved));

    expect(
      swatch.wash !== undefined,
      `${swatch.token} en ${theme} vaut « ${resolved} » : ${
        isTranslucent(resolved)
          ? "c'est un LAVIS, la pastille doit porter un `wash` (pile de composition + aplat rendu)"
          : "c'est un APLAT opaque, la pastille ne doit pas porter de `wash`"
      }`,
    ).toBe(isTranslucent(resolved));

    expect(
      HEX_NOTATION.test(swatch.hex) || swatch.hex.startsWith('rgba('),
      `${swatch.token} — notation « ${swatch.hex} » : la plaque écrit un aplat en #rrggbb et un lavis en rgba()`,
    ).toBe(true);
  });
});

/* ============================================================================
   2. L'aplat peint sous un lavis est bien celui de sa pile

   C'est la moitié de la décision prise en (a) : un lavis affiche sa valeur
   DÉCLARÉE en texte, et la plaque peint sa COMPOSITION. Restait à garantir que
   la composition écrite est la vraie — sans quoi on aurait remplacé un aplat
   faux par un aplat faux mieux commenté.

   `compositeLayers` prend la pile la plus basse d'abord et exige un sol
   opaque : c'est ce qui rend l'appel refusable plutôt que devinable.
   ========================================================================== */

function washCases(): readonly {
  readonly name: string;
  readonly theme: ThemeName;
  readonly swatch: Swatch;
}[] {
  return swatchCases().filter((entry) => entry.swatch.wash !== undefined);
}

describe('2. Le lavis composé sur sa pile donne bien l’aplat annoncé', () => {
  it.each(washCases())('$name', ({ theme, swatch }) => {
    const wash = swatch.wash;

    if (wash === undefined) {
      throw new Error('cas filtré à tort : un lavis sans `wash`');
    }

    const resolvedTheme = themeNamed(theme);
    const stack = [
      ...wash.over.map((token) => resolveToken(resolvedTheme, token)),
      resolveToken(resolvedTheme, swatch.token),
    ];
    const painted = toHex(compositeLayers(stack));

    expect(
      canonical(wash.composite),
      `${swatch.token} en ${theme} sur [${wash.over.join(', ')}] — la plaque peint ` +
        `« ${wash.composite} », la composition réelle donne « ${painted} »`,
    ).toBe(canonical(painted));

    expect(
      HEX_NOTATION.test(wash.composite),
      `${swatch.token} — l'aplat composé « ${wash.composite} » doit s'écrire en #rrggbb`,
    ).toBe(true);
  });
});

/* ============================================================================
   3. Le décor de la plaque elle-même

   Fond, encre, encre atténuée et filet ne sont pas des pastilles : ce sont les
   styles en ligne de l'article. Ils ont dérivé les premiers, et c'est logique —
   personne ne les lit comme des données.

   Le filet est un LAVIS et reste affiché tel quel, sans aplat de substitution :
   il est posé en `borderColor` sur un élément dont le fond est `ground`, donc
   c'est le navigateur qui compose et le rendu est exact. Aucune raison de
   précalculer ce que la peinture fait juste.
   ========================================================================== */

const PLATE_FIELDS = [
  { field: 'ground', token: '--site-background', opaque: true },
  { field: 'ink', token: '--text-strong', opaque: true },
  { field: 'inkMuted', token: '--text-muted', opaque: true },
  { field: 'rule', token: '--rule', opaque: false },
] as const satisfies readonly {
  readonly field: keyof Plate;
  readonly token: string;
  readonly opaque: boolean;
}[];

function plateFieldCases(): readonly {
  readonly name: string;
  readonly theme: ThemeName;
  readonly declared: string;
  readonly token: string;
  readonly opaque: boolean;
}[] {
  return PLATES.flatMap((plate) =>
    THEMES_OF[plate.theme].flatMap((theme) =>
      PLATE_FIELDS.map((spec) => ({
        name: `${plate.title} / ${spec.field} (${spec.token}) en ${theme}`,
        theme,
        declared: plate[spec.field],
        token: spec.token,
        opaque: spec.opaque,
      })),
    ),
  );
}

describe('3. Le fond, l’encre et le filet de la plaque suivent leurs jetons', () => {
  it.each(plateFieldCases())('$name', ({ theme, declared, token, opaque }) => {
    const resolved = resolveToken(themeNamed(theme), token);

    expect(
      canonical(declared),
      `${token} en ${theme} — la plaque pose « ${declared} », la feuille déclare « ${resolved} »`,
    ).toBe(canonical(resolved));

    // Un fond ou une encre translucide rendrait la plaque dépendante du thème
    // de la PAGE, ce qu'elle existe précisément pour ne pas être.
    if (opaque) {
      expect(
        isTranslucent(declared),
        `${token} sert de fond ou d'encre à la plaque : une valeur translucide y laisserait ` +
          'le thème du lecteur transparaître à travers la plaque de l’autre thème',
      ).toBe(false);
    }
  });
});

it('l’étiquette de sol de chaque plaque cite le fond qu’elle affiche', () => {
  for (const plate of PLATES) {
    expect(
      plate.groundLabel,
      `${plate.title} — l'étiquette « ${plate.groundLabel} » ne cite pas le fond ${plate.ground}`,
    ).toContain(plate.ground);
  }
});

/* ============================================================================
   4. Le tableau des encres sémantiques

   Ses vignettes portent leur propre fond et leur propre encre en dur, pour la
   même raison que les plaques : le tableau montre les deux thèmes dans une
   page qui n'en rend qu'un.
   ========================================================================== */

const SEMANTIC_THEME: Readonly<Record<'Clair' | 'Sombre', readonly ThemeName[]>> = {
  Clair: THEMES_OF.light,
  Sombre: THEMES_OF.dark,
};

function semanticCases(): readonly {
  readonly name: string;
  readonly theme: ThemeName;
  readonly token: string;
  readonly hex: string;
  readonly plateGround: string;
  readonly plateInk: string;
}[] {
  return SEMANTIC_ROWS.flatMap((row) =>
    SEMANTIC_THEME[row.theme].map((theme) => ({
      name: `${row.token} en ${theme}`,
      theme,
      token: row.token,
      hex: row.hex,
      plateGround: row.plateGround,
      plateInk: row.plateInk,
    })),
  );
}

describe('4. Chaque ligne sémantique affiche l’encre de son thème', () => {
  it.each(semanticCases())('$name', ({ theme, token, hex, plateGround, plateInk }) => {
    const resolvedTheme = themeNamed(theme);

    for (const [label, declared, tokenName] of [
      ['encre', hex, token],
      ['fond de vignette', plateGround, '--site-background'],
      ['encre de vignette', plateInk, '--text-strong'],
    ] as const) {
      const resolved = resolveToken(resolvedTheme, tokenName);

      expect(
        canonical(declared),
        `${token} en ${theme}, ${label} — la ligne affiche « ${declared} », ` +
          `${tokenName} vaut « ${resolved} »`,
      ).toBe(canonical(resolved));
    }
  });
});

/* ============================================================================
   5. LA RÉCIPROQUE — rien n'échappe à la plaque en silence

   Les quatre sections ci-dessus ne peuvent constater qu'une chose : que ce qui
   est affiché est juste. Elles ne disent rien de ce qui N'EST PAS affiché, et
   c'est là que la palette a bougé — `--tc-paper-*` a disparu, six rôles
   d'état sont nés, la famille `--glass-*` est apparue.

   Donc : tout rôle coloré de la feuille est soit plaqué, soit inscrit
   ci-dessous avec sa raison. Ajouter un rôle coloré sans le décider fait
   échouer ce fichier.

   Les primitives `--tc-*` sont hors périmètre par construction : une plaque
   documente des RÔLES, et `primitives.contract.test.ts` tient déjà la couche
   du dessous. C'est le seul filtre en gros, et il est nommé.
   ========================================================================== */

/**
 * Les rôles colorés que les plaques NE montrent pas, et pourquoi.
 *
 * Une exclusion est un engagement, pas un débarras : le test vérifie que
 * chacun de ces jetons existe encore, et qu'aucun n'est en même temps plaqué.
 */
const UNPLATED: readonly { readonly token: string; readonly reason: string }[] = [
  {
    token: '--glass-fill-solid',
    reason:
      'ALIAS de `--surface`, déclaré tel quel dans `materials.css` — la carte de la ' +
      'librairie et la carte de verre du portfolio sont la même carte. Le plaquer donnerait ' +
      'deux pastilles de valeur identique, ce qui laisserait croire à une différence.',
  },
  {
    token: '--glass-shadow',
    reason:
      'ALIAS de `--shadow-ink`, qui est plaqué. Une carte de verre et une carte opaque ' +
      'projettent la même ombre : c’est la définition d’une ombre portée.',
  },
  {
    token: '--status-done-surface',
    reason:
      'ALIAS de `--badge-live-surface`, qui est plaqué. « Acquis » et « en direct » sont la ' +
      'même pastille, et `roles.css` l’écrit en alias plutôt qu’en second littéral.',
  },
  {
    token: '--status-done-text',
    reason: 'ALIAS de `--badge-live-text`, qui est plaqué. Même raison.',
  },
  {
    token: '--danger-quiet',
    reason:
      'Lavis à 0,10 / 0,14 de `--danger`, dont le tableau sémantique montre l’encre et ses ' +
      'deux ratios. Composé sur la carte, il en est à moins de 1,1:1 : une pastille de 24 px ' +
      'n’en dirait rien de lisible. Le § 11 du contrat de couleur mesure ce que la plaque ne ' +
      'peut pas montrer — l’encre tient son seuil sur son propre lavis.',
  },
  {
    token: '--success-quiet',
    reason: 'Lavis de `--success`. Même raison que `--danger-quiet`.',
  },
  {
    token: '--warning-quiet',
    reason:
      'Lavis de `--warning`. Même raison — et c’est celui qui a fait assombrir l’encre de ' +
      '#845d22 à #7b5620, mesure que le tableau sémantique porte en commentaire.',
  },
];

/** Le préfixe des primitives, dont les plaques ne parlent pas. */
const PRIMITIVE_PREFIX = '--tc-';

function platedTokens(): ReadonlySet<string> {
  const plated = new Set<string>();

  for (const plate of PLATES) {
    for (const spec of PLATE_FIELDS) plated.add(spec.token);
    for (const group of plate.groups) {
      for (const swatch of group.swatches) plated.add(swatch.token);
      for (const swatch of group.swatches) {
        // Les jetons cités comme support d'un lavis comptent aussi : ils sont
        // affichés, en toutes lettres, sous la pastille qu'ils portent.
        for (const under of swatch.wash?.over ?? []) plated.add(under);
      }
    }
  }

  for (const row of SEMANTIC_ROWS) plated.add(row.token);

  return plated;
}

describe('5. Aucun rôle coloré n’échappe aux plaques sans décision écrite', () => {
  const light = themeNamed('light');
  const plated = platedTokens();
  const excluded = new Map(UNPLATED.map((entry) => [entry.token, entry.reason]));

  it('chaque exclusion nomme un jeton qui existe encore', () => {
    for (const [token, reason] of excluded) {
      expect(
        light.tokens.has(token),
        `\`${token}\` est exclu des plaques au motif suivant, mais le jeton n'existe plus ` +
          `dans la feuille :\n    ${reason}\n  Une exclusion périmée est un mensonge ` +
          'silencieux : retirez-la, ou corrigez le nom si le jeton a été renommé.',
      ).toBe(true);
    }
  });

  it('aucune exclusion ne contredit une pastille', () => {
    for (const token of excluded.keys()) {
      expect(
        plated.has(token),
        `\`${token}\` est à la fois plaqué et déclaré exclu. L'un des deux est faux.`,
      ).toBe(false);
    }
  });

  it('tout rôle coloré est plaqué ou explicitement exclu', () => {
    const orphans = colourTokens(light)
      .filter((token) => !token.startsWith(PRIMITIVE_PREFIX))
      .filter((token) => !plated.has(token) && !excluded.has(token));

    expect(
      orphans,
      `${orphans.length} rôle(s) coloré(s) ne sont ni plaqués ni exclus : ` +
        `${orphans.join(', ')}.\n  Un rôle ajouté à la feuille doit être décidé : posez-le ` +
        'dans une plaque, ou inscrivez-le dans UNPLATED avec la raison de son absence.',
    ).toEqual([]);
  });
});

/* ============================================================================
   6. Garde-fous de forme

   Bon marché, et ils attrapent la faute de copier-coller que les sections
   précédentes laisseraient passer : deux plaques du même thème, ou une plaque
   dont la clé de rendu se répète.
   ========================================================================== */

describe('6. Les deux plaques restent deux plaques distinctes', () => {
  it('documente un thème clair et un thème sombre, une fois chacun', () => {
    expect(PLATES.map((plate) => plate.theme)).toEqual(['light', 'dark']);
    expect(PLATES.map((plate) => plate.id)).toEqual([LIGHT_PLATE.id, DARK_PLATE.id]);
  });

  it('ne répète aucun jeton dans une même plaque', () => {
    for (const plate of PLATES) {
      const tokens = plate.groups.flatMap((group) => group.swatches.map((swatch) => swatch.token));

      expect(
        [...new Set(tokens)],
        `${plate.title} — un jeton est plaqué deux fois : la clé de rendu de la pastille ` +
          'est `token + hex`, donc deux pastilles du même jeton dans le même thème ' +
          'partageraient leur clé React.',
      ).toEqual(tokens);
    }
  });

  it('plaque les deux thèmes sur exactement les mêmes jetons', () => {
    const tokensOf = (plate: Plate): readonly string[] =>
      plate.groups.flatMap((group) => group.swatches.map((swatch) => swatch.token));

    expect(
      tokensOf(DARK_PLATE),
      'les deux plaques doivent se lire en regard : un jeton montré en clair et absent en ' +
        'sombre laisse le lecteur croire qu’il n’existe pas dans l’autre thème.',
    ).toEqual(tokensOf(LIGHT_PLATE));
  });
});
