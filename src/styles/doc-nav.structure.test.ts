import { describe, expect, it } from 'vitest';

import { ruleBody as findRule } from '../test/css-rules';
import docSource from './doc.css?raw';

/* =============================================================================
   LE PLI DU SOMMAIRE, ÉPINGLÉ PAR CE QUI NE SE MESURE PAS EN JSDOM.

   `doc-nav.test.tsx` garde le COMPORTEMENT : le pli est ouvert au départ, il
   contient les quatre groupes, il laisse la version dehors, il survit à une
   navigation. Tout ça se rend en jsdom.

   Ce qui ne s'y rend pas, c'est le seul intérêt du pli : RENDRE LA LARGEUR À LA
   PAGE. Elle est produite par deux règles CSS et par rien d'autre — une piste
   de grille qui passe en `auto`, et la note de version qui s'efface pour ne pas
   épingler la colonne. jsdom ne peint pas, donc les cent tests du sommaire
   resteraient verts si les deux disparaissaient : le sommaire se replierait
   toujours, et la colonne garderait ses 288 px.

   MESURÉ AU NAVIGATEUR, à 1280 px : piste 288,0 → 140,5 px, contenu 992,0 →
   1139,5 px, 26 liens visibles → 0. Et l'étape intermédiaire vaut d'être
   écrite, parce qu'elle est la raison de la seconde règle : sans l'effacement
   de la note, le pli ne faisait passer la piste que de 288 à 244,8 px — 43 px,
   c'est-à-dire rien. La note « stable · React ≥ 19 » épinglait la colonne à la
   largeur qu'on venait de lui retirer.

   Ce garde ne remplace pas un harnais navigateur — il rend impossible de
   retirer en silence les deux déclarations qui font tout le travail.
   ========================================================================== */

/**
 * Le corps d'une règle, avec son at-rule exigée.
 *
 * LE LECTEUR EST PARTAGÉ ET IL A ÉTÉ RÉÉCRIT. La version locale de ce fichier
 * découpait la feuille avec `/([^{}]+)\{([^}]*)\}/g`, et cette expression est
 * fausse : `[^}]*` n'exclut pas `{`, donc la première correspondance d'un bloc
 * `@media` avalait le prélude de l'at-rule ET sa première règle. Les deux
 * sélecteurs gardés ici étaient lus correctement PAR CHANCE — l'accolade
 * fermante de l'at-rule décalait les correspondances suivantes de la bonne
 * quantité. Échanger l'ordre de deux règles dans le bloc, CSS strictement
 * équivalente, faisait rougir ce fichier sans qu'un octet de comportement ait
 * changé.
 *
 * `src/test/css-rules.ts` balaie à accolades équilibrées et rend le CONTEXTE de
 * chaque règle. C'est ce qui permet à `LARGE` d'exister ci-dessous.
 */
const LARGE = '@media (min-width: 60rem)';

function ruleBody(selector: string, within?: string): string | null {
  return findRule(docSource, selector, within === undefined ? {} : { within });
}

const TRACK = '.tc-doc-body:has(.tc-doc-nav__all:not([open]))';
const NOTE = '.tc-doc-nav:has(.tc-doc-nav__all:not([open])) .tc-doc-nav__versionnote';
const TITLE = '.tc-doc-nav__alltitle';

describe('le pli du sommaire — ce que jsdom ne voit pas', () => {
  it('devrait rétrécir la piste de gauche quand le sommaire est replié', () => {
    /* `:has()` ET NON UN ATTRIBUT POSÉ PAR REACT : le pli est un `<details>`
       natif sans état React, donc c'est la feuille qui lit l'état de
       l'élément. Sans cette règle, le sommaire se replie et la colonne reste
       à sa largeur dépliée — un pli qui ne rend rien. */
    expect(
      ruleBody(TRACK, LARGE),
      `aucune règle ne cible « ${TRACK} » DANS « ${LARGE} » : le sommaire se replie sans ` +
        'rendre sa piste à la page. Mesuré, la colonne resterait à 288 px au lieu de 140,5.',
    ).not.toBeNull();

    /* LES DEUX PISTES, ET NON LA PREMIÈRE SEULE. Cette assertion ne regardait
       que « auto », donc écraser la piste de CONTENU à `minmax(0, 0px)` la
       laissait verte — et rend la page illisible dès qu'on plie. La seconde
       piste est justement celle que l'en-tête de ce fichier mesure
       (« contenu 992,0 → 1139,5 px ») : elle doit être assertée. */
    expect(
      ruleBody(TRACK, LARGE) ?? '',
      `${TRACK} ne redéclare pas « grid-template-columns: auto minmax(0, 1fr) » : la piste ` +
        'de contenu doit reprendre toute la place rendue, pas une largeur fixe.',
    ).toMatch(/grid-template-columns:\s*auto\s+minmax\(\s*0\s*,\s*1fr\s*\)/);
  });

  it('devrait effacer la note de version, qui sinon épingle la colonne', () => {
    /* La piste est en `auto` : sa largeur est celle du contenu le plus large
       qui reste. Le numéro de version reste — c'est ce qu'on cherche sur un
       site de librairie — mais la note, elle, mesurait plus large que tout le
       reste du sommaire replié. */
    expect(
      ruleBody(NOTE, LARGE),
      `aucune règle ne cible « ${NOTE} » DANS « ${LARGE} » : la note de version reste visible ` +
        'sous un sommaire replié, et une piste en `auto` prend alors sa largeur. Mesuré : le ' +
        'pli ne rendait que 43 px au lieu de 147,5.',
    ).not.toBeNull();

    expect(ruleBody(NOTE, LARGE) ?? '', `${NOTE} ne déclare pas « display: none ».`).toMatch(
      /display:\s*none/,
    );
  });

  it('devrait garder les deux règles DANS le bloc 60 rem, et non au global', () => {
    /* LE DÉFAUT QUE `within` REND VISIBLE, ET QU'AUCUN GARDE NE POUVAIT VOIR.
       Sorties de leur `@media`, les deux règles s'appliquent aussi en une
       colonne : mesuré à 375 × 700, replier le sommaire passe alors la page en
       DEUX colonnes de 139,5 et 235,5 px, la colonne de contenu remontant à
       côté de la nav, et efface la note de version. Le pli d'un téléphone
       casserait la page.

       Le test s'écrit à l'envers de l'habitude : ce qui doit être NUL, c'est la
       règle SANS contexte. */
    for (const selector of [TRACK, NOTE]) {
      const global = findRule(docSource, selector);
      const large = findRule(docSource, selector, { within: LARGE });

      expect(large, `« ${selector} » n'existe pas dans « ${LARGE} ».`).not.toBeNull();

      expect(
        global,
        `« ${selector} » existe HORS du bloc ${LARGE} : le pli s'appliquerait en une colonne, ` +
          'où mesuré il passe la page en deux colonnes de 139,5 et 235,5 px sur un téléphone.',
      ).toBe(large);
    }
  });

  it('devrait garder le `<summary>` en `display: block`, contre le défaut WebKit', () => {
    /* RISQUE SUPPOSÉ ET NON MESURÉ, et c'est écrit comme tel dans `doc.css` :
       WebKit a un défaut ancien où un `<summary>` dont le `display` quitte
       `list-item` peut perdre son dépliage — le `<details>` ne s'ouvre plus du
       tout. Je n'ai pas de Safari ici pour le constater. Le prix de l'éviter
       est nul, le prix de se tromper est un sommaire définitivement replié
       dans un moteur sur trois. Ce test épingle donc le contournement, pas le
       défaut. */
    expect(ruleBody(TITLE) ?? '', `${TITLE} ne déclare pas « display: block ».`).toMatch(
      /display:\s*block/,
    );
  });

  it('devrait retirer les DEUX marqueurs natifs du `<summary>`', () => {
    /* `list-style: none` couvre les moteurs qui rendent le marqueur comme une
       puce de `list-item` ; `::-webkit-details-marker` couvre WebKit, qui le
       rend par un pseudo-élément propre. Il en faut deux, et l'oubli du second
       laisse un triangle À CÔTÉ du chevron dessiné par la feuille. */
    expect(ruleBody(TITLE) ?? '', `${TITLE} ne déclare pas « list-style: none ».`).toMatch(
      /list-style:\s*none/,
    );

    expect(
      ruleBody(`${TITLE}::-webkit-details-marker`),
      `aucune règle ne cible « ${TITLE}::-webkit-details-marker » : WebKit affiche alors son ` +
        'triangle à côté du chevron de la feuille.',
    ).not.toBeNull();
  });

  it('devrait tourner le chevron sur l’état, et non sur une classe', () => {
    /* L'indice d'état est porté par `[open]`, c'est-à-dire par l'élément qui
       PORTE l'état. Une classe posée par un script serait une seconde source
       de vérité à tenir synchronisée avec le natif. */
    expect(
      ruleBody(`.tc-doc-nav__all[open] > ${TITLE}::before`),
      'le chevron du pli ne tourne pas sur `[open]` : l’indice d’état ne suit plus l’état.',
    ).not.toBeNull();
  });
});
