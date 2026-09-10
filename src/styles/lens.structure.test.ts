import { describe, expect, it } from 'vitest';

import lensSource from './lens.css?raw';

/* =============================================================================
   LE GARDE DE POLARITÉ DE LA LENTILLE.

   Il existe parce qu'un manquement à 1.4.3 est passé à travers 2 033 tests, une
   relecture adverse et une revue visuelle. Le lavis d'état du bouton bulle
   empruntait `--panel-surface-hover` / `-active`, c'est-à-dire l'échelle d'état
   des panneaux. Elle CREUSE en clair et ÉCLAIRCIT en sombre, ce qui est juste
   pour un panneau — dont l'encre est du côté opposé — et faux pour la lentille,
   dont le voile va dans l'autre sens et dont l'encre suit le voile. Chaque état
   rapprochait donc la plaque du libellé : mesuré, 5,32:1 au repos → 4,47:1 au
   survol → 4,26:1 à l'appui en clair, et 4,72 → 3,60 → 3,30 en sombre.

   AUCUN TEST DE PRÉSENCE N'AURAIT VU ÇA. Les blocs étaient là, les jetons
   étaient thémés, les trois replis étaient déclarés, et la valeur était fausse.
   Ce qui se vérifie ici n'est donc pas qu'une règle existe : c'est que le lavis
   et le voile viennent de la MÊME FAMILLE DE PRIMITIVES dans chaque thème. Deux
   couches de la même famille s'ajoutent dans le même sens, et « le même sens »
   est la seule propriété qui rende l'état sûr sans le remesurer.

   Ce garde ne remplace pas la mesure — il empêche la mesure de se périmer en
   silence. Les ratios eux-mêmes ne sont rejoués par rien, et c'est écrit en
   tête de « ce qui reste à décider » dans le README.
   ========================================================================== */

/** Retire les commentaires : un exemple cité en prose n'est pas une règle. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Les déclarations d'une propriété personnalisée, dans l'ordre du fichier.
 *
 * Une par bloc de thème, donc trois attendues pour un jeton thémé : le bloc
 * clair, le bloc `prefers-color-scheme: dark` et le bloc `[data-theme='dark']`.
 */
function declarationsOf(source: string, token: string): readonly string[] {
  const pattern = new RegExp(`${token}\\s*:\\s*([^;]+);`, 'g');
  return [...stripComments(source).matchAll(pattern)].map((match) => match[1].trim());
}

/** La famille de primitive citée par une valeur `var(--tc-<famille>-…)`. */
function familyOf(value: string): string | null {
  const match = /var\(\s*--tc-([a-z]+)-/.exec(value);
  return match ? match[1] : null;
}

const VEIL = '--lens-veil';
const WASHES = ['--lens-wash-hover', '--lens-wash-active'] as const;

describe('la polarité du lavis d’état de la lentille', () => {
  it('devrait déclarer le voile une fois par bloc de thème', () => {
    /* Trois et non deux : sans le bloc `[data-theme='dark']`, un visiteur qui
       CHOISIT le thème sombre sur un système en clair garderait le voile
       clair — la panne qui se voit un jour sur deux. */
    expect(
      declarationsOf(lensSource, VEIL),
      'lens.css doit déclarer --lens-veil dans les trois blocs de thème ' +
        "(clair, prefers-color-scheme: dark, [data-theme='dark']).",
    ).toHaveLength(3);
  });

  it.each(WASHES)('devrait déclarer %s une fois par bloc de thème', (wash) => {
    expect(
      declarationsOf(lensSource, wash),
      `lens.css déclare ${wash} un nombre de fois différent de --lens-veil : ` +
        'un lavis qui manque dans un bloc hérite de la valeur claire, donc ' +
        'change de polarité sans que rien ne le dise.',
    ).toHaveLength(3);
  });

  it.each(WASHES)('devrait tirer %s de la même famille que le voile, bloc par bloc', (wash) => {
    const veils = declarationsOf(lensSource, VEIL);
    const washes = declarationsOf(lensSource, wash);

    expect(washes).toHaveLength(veils.length);

    veils.forEach((veil, index) => {
      const veilFamily = familyOf(veil);
      const washFamily = familyOf(washes[index] ?? '');

      expect(
        veilFamily,
        `--lens-veil vaut « ${veil} », qui ne cite aucune primitive --tc-* : ` +
          'la polarité du voile devient invérifiable.',
      ).not.toBeNull();

      expect(
        washFamily,
        `${wash} vaut « ${washes[index]} », qui ne cite aucune primitive --tc-*.`,
      ).not.toBeNull();

      expect(
        washFamily,
        `bloc de thème nº ${index + 1} : le voile est de la famille ` +
          `« ${veilFamily} » et ${wash} de la famille « ${washFamily} ». ` +
          'Les deux couches s’empilent, donc des familles opposées font ' +
          'un état qui va VERS l’encre du libellé au lieu de s’en éloigner — ' +
          'c’est le manquement à 1.4.3 mesuré à 4,26:1 en clair et 3,30:1 en ' +
          'sombre, sur l’état où l’on est sur le point de cliquer.',
      ).toBe(veilFamily);
    });
  });

  it('ne devrait plus citer l’échelle d’état des panneaux pour son lavis', () => {
    /* La faute d'origine, épinglée par son nom. `--panel-surface-*` reste
       LÉGITIME dans les blocs de repli, où la plaque est l'aplat opaque
       `--surface` et où la polarité redevient juste : le test ne l'interdit
       donc que dans une déclaration de `--lens-state-wash` ou de
       `--lens-wash-*`. */
    const offenders = [...stripComments(lensSource).matchAll(/--lens-(?:state-)?wash[^;]*;/g)]
      .map((match) => match[0])
      .filter((declaration) => declaration.includes('--panel-surface'));

    expect(
      offenders,
      'un lavis de lentille cite --panel-surface-* :\n  ' +
        offenders.join('\n  ') +
        '\nCette échelle a la polarité INVERSE du voile dans les deux thèmes.',
    ).toEqual([]);
  });
});
