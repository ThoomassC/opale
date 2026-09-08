import { describe, expect, it } from 'vitest';

import { GLASS_BACKDROPS, GLASS_LAYERS, STATE_WASHES, resolveBackdrop, withWash } from './backdrop';
import type { BackdropSpec } from './backdrop';
import { compositeLayers, parseRgba, withAlpha } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme, ThemeName } from './stylesheet';
import materialsSource from '../tokens/materials.css?raw';
import primitivesSource from '../tokens/primitives.css?raw';
import rolesSource from '../tokens/roles.css?raw';

/**
 * Les gardes de `backdrop.ts` lui-même. Les RATIOS vivent dans
 * `glass.contract.test.ts` ; ici on ne vérifie qu'une chose, mais c'est celle
 * dont tout le reste dépend : qu'une pile nommée se compose comme le
 * navigateur la peindrait, et qu'un échec dise LAQUELLE des piles est cassée.
 *
 * On mesure contre la VRAIE feuille et non une fixture. Une fixture prouverait
 * que l'algèbre est juste ; ce qu'on veut prouver en plus, c'est que le modèle
 * tient sur la feuille qui part en production — notamment que `--halo-opacity`
 * s'y décline bien par thème, ce qu'aucune fixture n'imposerait.
 */

const stylesheet = `${primitivesSource}\n${rolesSource}\n${materialsSource}`;
const themes = parseThemes(stylesheet);

const THEME_NAMES = ['light', 'dark-os', 'dark-explicit'] as const satisfies readonly ThemeName[];

function themeNamed(name: ThemeName): Theme {
  const found = themes.find((theme) => theme.name === name);

  if (found === undefined) {
    throw new Error(
      `thème « ${name} » absent — reçus : ${themes.map((theme) => theme.name).join(', ') || '(aucun)'}`,
    );
  }

  return found;
}

const light = themeNamed('light');

describe('resolveBackdrop compose la pile telle que le navigateur la peint', () => {
  it('aplatit un jeton translucide sur son sol', () => {
    // rgba(255, 255, 255, 0.4) sur #deedf0 : 0,4 × 255 + 0,6 × 222 = 235,2 …
    expect(
      resolveBackdrop(light, {
        label: 'la carte sur la page nue',
        layers: [GLASS_LAYERS.page, GLASS_LAYERS.glassFill],
      }),
    ).toBe('rgb(235.2, 244.2, 246)');
  });

  it('rend le sol tel quel quand la pile n’a qu’une couche', () => {
    expect(resolveBackdrop(light, { label: 'la page nue', layers: [GLASS_LAYERS.page] })).toBe(
      resolveToken(light, '--site-background'),
    );
  });

  it('accepte un littéral pour la couleur qui n’est pas un jeton', () => {
    // Le cas réel : une valeur LUE dans le corps d'une règle (`.liquid-card`
    // sous `prefers-contrast: more`), qu'on ne veut pas recopier en dur.
    expect(
      resolveBackdrop(light, {
        label: 'un fond lu dans une règle',
        layers: [{ literal: ' #deedf0 ' }, GLASS_LAYERS.glassFill],
      }),
    ).toBe('rgb(235.2, 244.2, 246)');
  });
});

describe('l’opacité de couche est LUE dans la feuille, jamais codée en dur', () => {
  /*
   * C'est la raison d'être de `opacity?: string`. `--halo-opacity` vaut 0,9 en
   * clair et 0,8 en sombre : une constante écrite ici mesurerait, en sombre, un
   * halo que personne ne voit — et le ferait en silence, puisque le résultat
   * reste une couleur parfaitement plausible.
   */
  it('les deux thèmes ne déclarent pas la même opacité de halo', () => {
    expect(resolveToken(light, '--halo-opacity')).toBe('0.9');
    expect(resolveToken(themeNamed('dark-os'), '--halo-opacity')).toBe('0.8');
  });

  it.each(THEME_NAMES)('le halo froid composé suit l’opacité du thème — %s', (name) => {
    const theme = themeNamed(name);
    const expected = compositeLayers([
      resolveToken(theme, '--site-background'),
      withAlpha(resolveToken(theme, '--halo-tint'), Number(resolveToken(theme, '--halo-opacity'))),
    ]);

    expect(
      resolveBackdrop(theme, {
        label: 'le halo froid',
        layers: [GLASS_LAYERS.page, GLASS_LAYERS.coolHalo],
      }),
    ).toBe(expected);
  });

  it('refuse un jeton d’opacité qui n’est pas un nombre', () => {
    expect(() =>
      resolveBackdrop(light, {
        label: 'un halo à opacité de couleur',
        layers: [GLASS_LAYERS.page, { token: '--halo-tint', opacity: '--site-background' }],
      }),
    ).toThrow(/un halo à opacité de couleur[\s\S]*--site-background[\s\S]*\[0, 1\]/);
  });

  it('refuse un jeton d’opacité hors de [0, 1]', () => {
    expect(() =>
      resolveBackdrop(light, {
        label: 'un halo à opacité de saturation',
        layers: [GLASS_LAYERS.page, { token: '--halo-tint', opacity: '--glass-saturate' }],
      }),
    ).toThrow(/un halo à opacité de saturation[\s\S]*--glass-saturate[\s\S]*« 1\.6 »/);
  });
});

describe('un échec nomme le support fautif', () => {
  /*
   * `compositeLayers` dit « substrat translucide », ce qui est vrai et
   * inutilisable : sur soixante piles, la ligne rouge ne dit pas laquelle est
   * cassée. Chacun des messages ci-dessous porte le `label` — c'est la
   * différence entre un test qu'on répare en trente secondes et un qu'on
   * abandonne.
   */
  const cases: readonly (readonly [string, BackdropSpec, RegExp])[] = [
    [
      'sol translucide',
      { label: 'le verre sans son sol', layers: [GLASS_LAYERS.glassFill] },
      /le verre sans son sol[\s\S]*--glass-fill[\s\S]*alpha 0\.4/,
    ],
    [
      'pile vide',
      { label: 'un support sans couche', layers: [] },
      /un support sans couche[\s\S]*aucune couche/,
    ],
    [
      'sol qui n’est pas une couleur',
      { label: 'un sol en pixels', layers: [{ token: '--glass-blur' }] },
      /un sol en pixels[\s\S]*--glass-blur[\s\S]*ne compose pas/,
    ],
    [
      'couche haute qui n’est pas une couleur',
      { label: 'une carte floutée', layers: [GLASS_LAYERS.page, { token: '--glass-blur' }] },
      /une carte floutée[\s\S]*--glass-blur/,
    ],
    [
      'jeton absent',
      { label: 'un halo inventé', layers: [GLASS_LAYERS.page, { token: '--halo-tint-cold' }] },
      /un halo inventé[\s\S]*--halo-tint-cold[\s\S]*absent/,
    ],
    [
      'littéral porteur d’un var()',
      { label: 'un littéral paresseux', layers: [{ literal: 'var(--surface)' }] },
      /un littéral paresseux[\s\S]*var\(\)[\s\S]*token/,
    ],
  ];

  it.each(cases)('%s', (_name, backdrop, message) => {
    expect(() => resolveBackdrop(light, backdrop)).toThrow(message);
  });

  it('conserve la cause d’origine', () => {
    try {
      resolveBackdrop(light, { label: 'le verre sans son sol', layers: [GLASS_LAYERS.glassFill] });
      expect.unreachable('la pile devait être refusée');
    } catch (error) {
      // La cause est ce qui permet de remonter à `compositeLayers` ou à
      // `resolveToken` sans avoir à relire le contrat pour comprendre le mot.
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('le verre sans son sol');
    }
  });
});

describe('withWash empile un lavis sans détruire le support', () => {
  const card: BackdropSpec = {
    label: 'la carte sur le halo froid',
    layers: [GLASS_LAYERS.page, GLASS_LAYERS.coolHalo, GLASS_LAYERS.glassFill],
  };

  it('ajoute une couche et ALLONGE le libellé', () => {
    const washed = withWash(card, '--panel-surface-active');

    expect(washed.layers).toStrictEqual([...card.layers, { token: '--panel-surface-active' }]);
    // Remplacer le libellé par le seul nom du lavis produirait un message
    // d'échec qui nomme un jeton, pas un support — donc irréparable.
    expect(washed.label).toBe('la carte sur le halo froid, lavis --panel-surface-active posé');
  });

  it('ne mute pas le support d’origine', () => {
    withWash(card, '--panel-surface');

    expect(card.layers).toHaveLength(3);
    expect(card.label).toBe('la carte sur le halo froid');
  });

  it('se compose et déplace réellement la couleur', () => {
    const bare = resolveBackdrop(light, card);
    const washed = resolveBackdrop(light, withWash(card, '--panel-surface-active'));

    expect(washed).not.toBe(bare);
    expect(parseRgba(washed).alpha).toBe(1);
  });

  it('s’empile deux fois sans perdre le sol', () => {
    // Un lavis sur un lavis n'a pas de sens en CSS, mais la fonction doit rester
    // composable : ce qui est interdit, c'est de partir d'un support translucide.
    const twice = withWash(withWash(card, '--panel-surface'), '--panel-surface-hover');

    expect(parseRgba(resolveBackdrop(light, twice)).alpha).toBe(1);
  });
});

describe('GLASS_BACKDROPS est la liste FERMÉE des supports de carte', () => {
  it('porte exactement les cinq chemins de rendu, et ces cinq-là', () => {
    /*
     * Assertion sur les PILES et non sur les libellés : ce qui est contractuel,
     * c'est le modèle — page nue, carte sur page nue, carte sur chacun des deux
     * halos, repli opaque. Un consommateur qui invente un sixième support
     * l'ajoute ici, et toutes les encres sont remesurées du même coup.
     */
    expect(GLASS_BACKDROPS.map((backdrop) => backdrop.layers)).toStrictEqual([
      [GLASS_LAYERS.page],
      [GLASS_LAYERS.page, GLASS_LAYERS.glassFill],
      [GLASS_LAYERS.page, GLASS_LAYERS.coolHalo, GLASS_LAYERS.glassFill],
      [GLASS_LAYERS.page, GLASS_LAYERS.warmHalo, GLASS_LAYERS.glassFill],
      [GLASS_LAYERS.opaqueCard],
    ]);
  });

  it('donne un libellé distinct à chaque support', () => {
    const labels = GLASS_BACKDROPS.map((backdrop) => backdrop.label);

    expect(new Set(labels).size).toBe(labels.length);
  });

  it.each(
    THEME_NAMES.flatMap((theme) =>
      GLASS_BACKDROPS.map((backdrop) => ({ theme, label: backdrop.label, backdrop })),
    ),
  )('$label rend un aplat opaque — $theme', ({ theme, backdrop }) => {
    // Un support translucide n'a pas de contraste : `contrastRatio` le refuse.
    // Que les cinq soient opaques est donc la condition d'existence du § suivant.
    expect(parseRgba(resolveBackdrop(themeNamed(theme), backdrop)).alpha).toBe(1);
  });
});

describe('STATE_WASHES ne sont PAS des sols', () => {
  /*
   * Le rappel qui a coûté le plus cher : depuis la v0.3.0 les trois lavis sont
   * translucides. Mesurer une encre contre `--panel-surface-hover` seul rendrait
   * le ratio contre du blanc pur — un chiffre faux et rassurant.
   */
  it.each(THEME_NAMES.flatMap((theme) => STATE_WASHES.map((wash) => ({ theme, wash }))))(
    '$wash reste translucide — $theme',
    ({ theme, wash }) => {
      expect(parseRgba(resolveToken(themeNamed(theme), wash)).alpha).toBeLessThan(1);
    },
  );
});
