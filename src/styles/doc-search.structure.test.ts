import { describe, expect, it } from 'vitest';

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

/** Retire les commentaires : un sélecteur cité en prose n'est pas une règle. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Le corps de la première règle qui cible exactement `selector`.
 *
 * Une correspondance EXACTE sur le prélude, et non un `includes` : `.tc-doc-search__list`
 * apparaît aussi dans `.tc-doc-search__option` par préfixe de nom, et dans des
 * sélecteurs descendants. Un `includes` aurait lu le corps de la mauvaise règle
 * et le test serait passé pour une raison fausse.
 */
function ruleBody(selector: string): string | null {
  const rules = stripComments(docSource).matchAll(/([^{}]+)\{([^}]*)\}/g);

  for (const rule of rules) {
    const preludes = rule[1].split(',').map((part) => part.trim());
    if (preludes.includes(selector)) return rule[2];
  }

  return null;
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
