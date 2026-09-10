import { describe, expect, it } from 'vitest';

import { ruleBody as findRule, stripComments } from '../test/css-rules';
import docSource from './doc.css?raw';

/* =============================================================================
   LES DEUX CALQUES DE LA RECHERCHE, ÉPINGLÉS.

   Ce fichier existe à cause d'une régression que j'ai introduite en corrigeant
   autre chose, et qu'aucun des cent tests de la recherche n'a vue.

   Le message « Aucune page ne correspond. » vivait DANS la `listbox`, en
   `role="presentation"`. C'était une violation d'ARIA — une `listbox` doit
   contenir des `option`, et `axe-core` la relevait en `critical`. Le sortir du
   `<ul>` était donc juste. Mais l'enveloppe de la recherche est
   `display: flex`, si bien que le message est devenu un ENFANT FLEXIBLE de la
   pilule : sans position, il s'est posé DANS le champ.

   Mesuré : la barre du haut passait de 72,0 px à 122,2 px dès qu'une requête
   ne trouvait rien, poussant toute la page vers le bas, et le champ tombait à
   4,0 px de large — l'utilisateur ne pouvait plus lire ce qu'il venait de
   taper. À 320 px le message débordait sur la bascule de thème, dont une bande
   de 12 px cessait d'être cliquable.

   POURQUOI UN TEST DE STRUCTURE ET NON UN TEST DE COMPOSANT. Le défaut est
   entièrement dans la CSS : le DOM était correct, l'arbre d'accessibilité
   était correct, `axe-core` était vert, et les 2 137 tests l'étaient aussi.
   jsdom ne peint pas, donc rien de ce qui s'exécute dans ce dépôt ne pouvait
   l'attraper. Ce qui SE VÉRIFIE en texte, en revanche, c'est que les deux
   calques déclarent bien être des calques.

   Ce garde ne remplace pas un harnais navigateur — il rend seulement impossible
   de retirer en silence la déclaration qui a coûté cette régression. Le harnais
   reste en tête de « ce qui reste à décider » du README.
   ========================================================================== */

/**
 * Le corps d'une règle de `doc.css`, at-rule exigée si on la nomme.
 *
 * LE LECTEUR LOCAL A ÉTÉ REMPLACÉ PAR UN LECTEUR PARTAGÉ, et ce n'est pas de la
 * mise en ordre. Sa version d'origine, `/([^{}]+)\{([^}]*)\}/g`, ne survit pas
 * aux at-rules : `[^}]*` n'exclut pas `{`, donc la première correspondance d'un
 * bloc `@media` avale le prélude de l'at-rule ET la règle qui l'ouvre. Les
 * sélecteurs gardés ici étaient lus correctement par CHANCE. Voir
 * `src/test/css-rules.ts`, qui balaie à accolades équilibrées, et son test, qui
 * porte les deux contre-exemples.
 */
function ruleBody(selector: string, within?: string): string | null {
  return findRule(docSource, selector, within === undefined ? {} : { within });
}

/**
 * Les deux calques qui se remplacent l'un l'autre sous la pilule de recherche.
 *
 * Ils sont exclusifs par construction : l'un s'affiche quand il y a des
 * suggestions, l'autre quand il n'y en a aucune. C'est ce qui rend l'oubli
 * possible — le second n'est visible que dans un état qu'on ne regarde pas en
 * développant, et il s'était mis dans le champ sans que rien ne proteste.
 */
const LAYERS = ['.tc-doc-search__list', '.tc-doc-search__empty'] as const;

/**
 * Les déclarations d'une propriété personnalisée, dans l'ordre du fichier.
 *
 * Une par bloc de thème, donc trois attendues : le bloc clair, le bloc
 * `prefers-color-scheme: dark` et le bloc `[data-theme='dark']`.
 */
function declarationsOf(token: string): readonly string[] {
  const pattern = new RegExp(`${token}\\s*:\\s*([^;]+);`, 'g');
  return [...stripComments(docSource).matchAll(pattern)].map((match) => match[1].trim());
}

describe('les deux calques flottants de la recherche', () => {
  it.each(LAYERS)('%s devrait exister dans doc.css', (selector) => {
    expect(
      ruleBody(selector),
      `aucune règle ne cible exactement ${selector} : le calque a été renommé ou retiré, ` +
        'et ce garde ne garde plus rien.',
    ).not.toBeNull();
  });

  it.each(LAYERS)('%s devrait être SORTI DU FLUX de la pilule', (selector) => {
    /* `position: absolute` est la déclaration dont l'absence a coûté la
       régression. Sans elle, l'élément est un enfant flexible de
       `.tc-doc-search`, donc il grandit la barre du haut au lieu de flotter
       sous elle. */
    expect(
      ruleBody(selector) ?? '',
      `${selector} ne déclare pas « position: absolute ». Il redevient alors un enfant ` +
        'flexible de la pilule de recherche : mesuré, la barre du haut passe de 72 px à ' +
        '122 px et le champ tombe à 4 px de large.',
    ).toMatch(/position:\s*absolute/);
  });

  it.each(LAYERS)('%s devrait se décaler SOUS la pilule et non dedans', (selector) => {
    /* Le décalage est `calc(100% + …)` : 100 % de la hauteur de l'enveloppe,
       plus un coussin. Un calque sorti du flux mais sans décalage se
       superposerait au champ, ce qui est visuellement le même défaut. */
    expect(
      ruleBody(selector) ?? '',
      `${selector} ne déclare pas d'« inset-block-start: calc(100% + … ) » : sorti du flux ` +
        'sans décalage, il se peint PAR-DESSUS le champ.',
    ).toMatch(/inset-block-start:\s*calc\(100%/);
  });

  it.each(LAYERS)('%s devrait être OPAQUE, parce qu’il recouvre le contenu', (selector) => {
    /* Les deux calques passent au-dessus de la page, et c'est la seule surface
       du site dont le dessous défile pendant qu'elle est ouverte. Un fond
       translucide y laisserait passer les titres en mouvement. `--surface` est
       un aplat opaque des deux thèmes. */
    expect(
      ruleBody(selector) ?? '',
      `${selector} ne pose pas « background: var(--surface) » : un calque qui recouvre du ` +
        'contenu défilant doit être opaque.',
    ).toMatch(/background:\s*var\(--surface\)/);
  });
});

/* =============================================================================
   LE LISERÉ DE LA PILULE, ÉPINGLÉ PAR SES DEUX BOUTS.

   Il a été ramené de `--control-border` (5,73:1 en clair, 6,42:1 en sombre —
   un cerne noir à 1 px sur le blanc de la barre) à `--doc-field-border`, une
   marche posée au plancher de 1.4.11 : 3,11:1 en clair, 3,12:1 en sombre.

   Deux façons de casser ça en silence, et ce sont les deux qui sont gardées.
   La première : retirer le liseré. Il ne peut pas disparaître — c'est la seule
   information visuelle qui identifie le champ, le fond de la pilule ne valant
   que 1,11:1 contre le sol. La seconde : oublier un bloc de thème, auquel cas
   le sombre hérite de la valeur claire — #859599 sur #0f191c, un trait presque
   blanc là où on voulait le plancher.
   ========================================================================== */

const FIELD_BORDER = '--doc-field-border';

describe('le liseré de la pilule de recherche', () => {
  it('devrait rester un liseré, et venir du rôle de vitrine', () => {
    /* `1px solid var(--doc-field-border)` : ni `0`, ni `transparent`, ni
       `--control-border`. Un champ sans limite visible échoue 1.4.11, parce
       qu'il ne reste alors que la loupe et le texte de substitution pour dire
       que c'est un champ. */
    expect(
      ruleBody('.tc-doc-search') ?? '',
      'la pilule de recherche ne déclare plus « border: 1px solid var(--doc-field-border) » : ' +
        'un champ dont la limite disparaît échoue WCAG 1.4.11, son fond ne valant que 1,11:1 ' +
        'contre le sol de la barre.',
    ).toMatch(/border:\s*1px\s+solid\s+var\(--doc-field-border\)/);
  });

  it('devrait éteindre l’anneau du champ SOUS LA CONDITION de son remplaçant', () => {
    /* LES DEUX EXTINCTIONS ET LEUR REMPLAÇANT DOIVENT VIVRE SOUS LA MÊME
       CONDITION. `tokens.css` porte une règle universelle `:focus-visible` qui
       pose un `outline` ET deux `box-shadow` sur tout élément focusable ; le
       champ les éteint pour que l'anneau soit porté par l'enveloppe, via une
       règle en `:has()`.

       Si les extinctions étaient inconditionnelles — elles l'ont été — alors
       dans tout contexte où `:has()` ne s'applique pas il ne resterait AUCUN
       indicateur de focus sur le champ. Pas un anneau dégradé : aucun. Ce n'est
       pas un manquement aujourd'hui, les trois moteurs livrés gérant `:has()` ;
       c'est le seul `outline: none` du dépôt qui n'aurait pas de filet.

       Le garde exige donc que la règle soit DANS le `@supports`, et non
       seulement qu'elle existe. */
    const guarded = ruleBody('.tc-doc-search__input', '@supports selector(:has(*))');
    const bare = findRule(docSource, '.tc-doc-search__input');

    expect(
      guarded,
      '.tc-doc-search__input n’éteint pas son anneau dans « @supports selector(:has(*)) ».',
    ).not.toBeNull();

    expect(guarded ?? '', 'l’extinction doit couvrir outline ET box-shadow.').toMatch(
      /outline:\s*none/,
    );
    expect(guarded ?? '').toMatch(/box-shadow:\s*none/);

    expect(
      bare === null || !/outline:\s*none|box-shadow:\s*none/.test(bare),
      'une extinction d’anneau subsiste HORS du @supports : un moteur sans `:has()` ' +
        'n’aurait alors plus aucun indicateur de focus sur le champ de recherche.',
    ).toBe(true);
  });

  it('devrait déclarer sa couleur une fois par bloc de thème', () => {
    expect(
      declarationsOf(FIELD_BORDER),
      `doc.css doit déclarer ${FIELD_BORDER} dans les trois blocs de thème ` +
        "(clair, prefers-color-scheme: dark, [data-theme='dark']) : un bloc qui manque fait " +
        'hériter la valeur claire, donc un trait presque blanc sur le sol sombre.',
    ).toHaveLength(3);
  });

  it('ne devrait citer que des marches mesurées au plancher de 1.4.11', () => {
    /* Les deux seules valeurs mesurées : #859599 sur le blanc de la barre
       (3,11:1) et #59696d sur #0f191c (3,12:1). Toute autre marche est un
       ratio qui n'a pas été mesuré — y compris `--control-border`, qui est
       précisément le cerne dont on sort. */
    const allowed = ['var(--tc-mist-658)', 'var(--tc-mist-509)'];

    for (const value of declarationsOf(FIELD_BORDER)) {
      expect(
        allowed,
        `${FIELD_BORDER} vaut « ${value} », dont le contraste contre le sol de la barre n'a ` +
          'pas été mesuré. Les marches mesurées sont --tc-mist-658 (3,11:1 sur #ffffff) et ' +
          '--tc-mist-509 (3,12:1 sur #0f191c).',
      ).toContain(value);
    }
  });
});
