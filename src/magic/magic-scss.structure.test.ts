import { describe, expect, it } from 'vitest';

import magicSource from './magic.scss?raw';

/* =============================================================================
   LE SEUL FICHIER DE `src/magic/**` QUI DÉVIE, ET SON COMPTE D'ÉCARTS.

   POURQUOI CE TEST EXISTE. `magic.scss` est le seul fichier du dossier qui
   n'est pas une copie fidèle de `react-magic-ui` : c'est là que vivent les
   écarts assumés, chacun numéroté et justifié. Son bandeau annonce combien il
   y en a — et il a MENTI. Il promettait « les trois écarts commentés
   ci-dessous » alors que la feuille en portait déjà six, dont deux qui
   changent le rendu chez un consommateur (le reste du Preflight, et les neuf
   couleurs de thème rendues effectives).

   Ce n'est pas un détail de rédaction. Ce bandeau est la PREMIÈRE chose que
   lit quelqu'un qui veut savoir en quoi la copie diffère de l'original, et
   c'est la seule promesse de fidélité que porte le dossier. Un compte faux
   laisse croire que trois écarts ont été audités quand six ont été écrits.

   Le compte est donc vérifié au lieu d'être promis — exactement le
   raisonnement de `doc-focus.structure.test.ts` sur les `box-shadow` : dans ce
   dépôt, une phrase qui peut se démentir toute seule devient un test.

   CE QUE CE FICHIER NE VÉRIFIE PAS : que chaque écart soit JUSTIFIÉ, ni qu'il
   soit encore vrai. Seulement qu'on ne puisse pas en ajouter un septième sans
   toucher au bandeau, ni en retirer un sans que le bandeau le dise.
   ========================================================================== */

/** Les marqueurs `ÉCART n` de la feuille, dans l'ordre où elle les sert. */
function ecartNumbers(): readonly number[] {
  return [...magicSource.matchAll(/ÉCART (\d+)/g)].map((match) => Number(match[1]));
}

/** Le compte annoncé par le bandeau, ou `null` s'il ne l'annonce plus. */
function announcedCount(): number | null {
  const match = /il porte les\s+(\d+)\s+écarts/.exec(magicSource);
  return match === null ? null : Number(match[1]);
}

describe('le bandeau de magic.scss et ses écarts', () => {
  it('devrait annoncer un compte lisible', () => {
    expect(
      announcedCount(),
      'le bandeau de `magic.scss` n’annonce plus de nombre d’écarts sous la forme ' +
        '« il porte les N écarts ». Ce compte est la seule promesse de fidélité du dossier : ' +
        'reformule le bandeau en gardant le chiffre, ou retire ce test en disant ce qu’il ' +
        'cesse de garantir.',
    ).not.toBeNull();
  });

  it('devrait annoncer EXACTEMENT le nombre d’écarts écrits dans la feuille', () => {
    /* LE DÉFAUT QUE CE TEST EXISTE POUR EMPÊCHER, et il s'était déjà produit :
       bandeau à trois, feuille à six. */
    const numbers = ecartNumbers();

    expect(
      numbers.length,
      `le bandeau annonce ${announcedCount()} écart(s) et la feuille en porte ${numbers.length} ` +
        `(${numbers.join(', ')}). Le bandeau est ce que lit quelqu’un qui veut savoir en quoi ` +
        'la copie diffère de l’original : un compte faux laisse croire qu’un écart non audité ' +
        'a été relu. Mets le bandeau à jour, et ajoute l’écart à `src/magic/README.md`.',
    ).toBe(announcedCount());
  });

  it('devrait numéroter les écarts de 1 à n, sans trou ni doublon', () => {
    /* Un trou dans la numérotation ferait passer le compte pour juste tout en
       rendant un écart introuvable — « voir l'écart 4 » qui n'existe pas. */
    const numbers = ecartNumbers();

    expect(
      numbers,
      'les écarts de `magic.scss` ne sont pas numérotés 1..n : ' +
        `${numbers.join(', ')}. Un trou ou un doublon rend une référence croisée fausse ` +
        '(`src/magic/README.md` renvoie aux écarts par leur numéro).',
    ).toEqual(numbers.map((_, index) => index + 1));
  });

  it('devrait garder la notice de droit d’auteur MIT en tête', () => {
    /* LA MIT EXIGE QUE SA NOTICE ACCOMPAGNE TOUTE PORTION SUBSTANTIELLE, et
       cette feuille est dérivée de leur `src/tailwind.css`. Le bandeau n'est
       pas décoratif : c'est la conformité. `THIRD-PARTY-NOTICES.md` porte le
       texte complet, mais un fichier déplacé ou recopié emporte le sien. */
    expect(
      magicSource.slice(0, 400),
      'le bandeau de provenance a disparu de la tête de `magic.scss`. Cette feuille est dérivée ' +
        'de `src/tailwind.css` de react-magic-ui (MIT) : la notice de droit d’auteur doit ' +
        'accompagner la portion copiée.',
    ).toMatch(/MIT, Copyright \(c\) 2025 tweeedlex/);
  });
});
