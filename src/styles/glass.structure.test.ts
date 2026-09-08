import { describe, expect, it } from 'vitest';

import backdropSource from './components/backdrop.css?raw';
import cardSource from './components/card.css?raw';
import { ruleBodies, stripComments } from '../contract/stylesheet';

/* ============================================================================
   LE SEUL GARDE POSSIBLE SUR LE VERRE, ET IL FAUT SAVOIR CE QU'IL NE GARDE PAS.

   jsdom ne peint pas : `getComputedStyle` y rend les valeurs déclarées, aucun
   pixel n'existe, et il n'y a pas de Playwright dans ce dépôt. Aucun test
   d'ici ne peut donc dire si le verre RESSEMBLE à du verre, ni si le masque du
   liseré spéculaire survit au `backdrop-filter` voisin — c'est précisément le
   bug qu'a coûté leur coexistence (voir le commentaire du `::before` dans
   `components/card.css`), et il ne se voit qu'à l'écran.

   Ce qui se vérifie sans peindre, c'est la FORME de la feuille : les quelques
   propriétés dont l'absence est une panne SILENCIEUSE. Aucune ne casse le
   build, aucune ne rougit un autre test, et chacune produit un décor qui monte
   par-dessus le contenu ou un verre qui n'en est plus un.

   On lit donc le CSS en TEXTE, commentaires retirés — sans quoi les
   commentaires d'en-tête, qui citent `position: absolute` et `z-index: 0` en
   toutes lettres, feraient passer le test en ne lisant que de la prose.
   ========================================================================== */

/** Les déclarations de premier niveau d'un corps de règle, `prop` → `valeur`. */
function declarations(body: string): Map<string, string> {
  const found = new Map<string, string>();
  let depth = 0;
  let start = 0;

  const push = (chunk: string): void => {
    const colon = chunk.indexOf(':');
    if (colon === -1) return;
    const property = chunk.slice(0, colon).trim().toLowerCase();
    const value = chunk
      .slice(colon + 1)
      .trim()
      .replace(/\s+/g, ' ');
    if (property.length > 0) found.set(property, value);
  };

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === ';' && depth === 0) {
      push(body.slice(start, index));
      start = index + 1;
    }
  }
  push(body.slice(start));

  return found;
}

/**
 * Les déclarations de la règle `selector`, toutes occurrences fusionnées.
 *
 * Échoue bruyamment si le sélecteur a disparu : c'est le mode de défaillance
 * qu'on garde, il ne doit pas se traduire par une map vide qui rendrait
 * `undefined` et laisserait un `toBeUndefined()` mal écrit passer.
 */
function ruleOf(source: string, selector: string): Map<string, string> {
  const bodies = ruleBodies(stripComments(source), selector);
  expect(bodies, `la règle \`${selector}\` a disparu de la feuille`).not.toHaveLength(0);
  return new Map(bodies.flatMap((body) => [...declarations(body)]));
}

/**
 * La valeur d'une déclaration, avec un rouge qui NOMME la propriété absente.
 *
 * Sans ce détour, un `toContain` sur un `undefined` rougit bien mais sur
 * « combinaison d'arguments invalide » : le test dirait qu'il est mal écrit
 * plutôt que ce qui a disparu de la feuille.
 */
function valueOf(rule: Map<string, string>, property: string): string {
  const value = rule.get(property);
  expect(value, `déclaration \`${property}\` absente de la règle`).toBeDefined();
  return value ?? '';
}

/**
 * Le corps de la première at-règle dont le prélude satisfait `matches`.
 *
 * `ruleBodies` ne descend volontairement pas dans `@supports` — un bloc
 * conditionnel n'a pas à se faire passer pour la règle de base. Ici on veut
 * justement le conditionnel, donc on l'isole à la main : prélude puis bloc
 * équilibré.
 */
function atRuleBody(source: string, matches: (prelude: string) => boolean): string | undefined {
  const css = stripComments(source);

  for (let index = 0; index < css.length; index += 1) {
    if (css[index] !== '@') continue;
    const brace = css.indexOf('{', index);
    if (brace === -1) return undefined;
    const prelude = css.slice(index, brace).trim().replace(/\s+/g, ' ');
    if (!matches(prelude)) {
      index = brace;
      continue;
    }

    let depth = 0;
    for (let cursor = brace; cursor < css.length; cursor += 1) {
      if (css[cursor] === '{') depth += 1;
      else if (css[cursor] === '}') {
        depth -= 1;
        if (depth === 0) return css.slice(brace + 1, cursor);
      }
    }
    return undefined;
  }

  return undefined;
}

/** La position de la règle `selector` dans la feuille, pour juger de l'ordre. */
function positionOf(source: string, selector: string): number {
  const css = stripComments(source);
  const at = css.indexOf(`${selector} {`);
  expect(at, `sélecteur \`${selector}\` introuvable`).toBeGreaterThan(-1);
  return at;
}

/**
 * Le corps d'une at-règle, avec un rouge qui la NOMME si elle a disparu.
 *
 * `ruleOf` s'applique tel quel au résultat : `stripComments` est idempotent,
 * et les règles d'un corps d'at-règle sont de premier niveau pour lui.
 */
function atRuleOf(source: string, label: string, matches: (prelude: string) => boolean): string {
  const body = atRuleBody(source, matches);
  expect(body, `l'at-règle \`${label}\` a disparu de la feuille`).toBeDefined();
  return body ?? '';
}

/**
 * Les éléments d'une liste CSS, virgules de premier niveau seules retenues.
 *
 * Une virgule dans `var(--x, 26s)` ou dans `scroll(root block)` ne sépare
 * rien : découper au plus simple ferait passer une liste de deux animations
 * pour une liste de trois, et le test compterait juste sur une feuille fausse.
 */
function commaList(value: string): readonly string[] {
  const items: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      items.push(value.slice(start, index));
      start = index + 1;
    }
  }
  items.push(value.slice(start));

  return items.map((item) => item.trim()).filter((item) => item.length > 0);
}

/** Un nombre de secondes, avec un rouge qui montre la valeur illisible. */
function seconds(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)s$/.exec(value);
  expect(
    match,
    `durée \`${value}\` illisible : un nombre de secondes était attendu`,
  ).not.toBeNull();
  return Number(match?.[1] ?? Number.NaN);
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : greatestCommonDivisor(b, a % b);
}

describe("l'hôte du décor (.tc-backdrop)", () => {
  const host = ruleOf(backdropSource, '.tc-backdrop');

  /*
   * Les trois propriétés sont indissociables, et c'est pour ça qu'elles sont
   * testées séparément : un rouge doit dire LAQUELLE manque.
   */
  it('devrait être positionné : sans quoi les disques absolus changent de bloc conteneur', () => {
    expect(host.get('position')).toBe('relative');
  });

  it("devrait isoler son contexte d'empilement : sans quoi z-index: 0 se compare à la page", () => {
    expect(host.get('isolation')).toBe('isolate');
  });

  /*
   * `clip` et non `hidden`, et c'est MESURÉ, pas une préférence d'écriture.
   * Chromium 151 headless, sonde de layout sur trois positions de défilement :
   * un `position: sticky` enfant colle (`rect.top === 0`) sous un hôte en
   * `overflow: clip` comme sous un hôte sans overflow, et ne colle JAMAIS sous
   * `overflow: hidden` (`rect.top` mesuré à −300, −900, −1000). `hidden` crée
   * un conteneur de défilement qui devient le référentiel du sticky ; `clip`
   * n'en crée pas. Un test qui se contenterait de « il y a un clip »
   * accepterait donc la valeur qui casse la barre collante du consommateur,
   * sans un mot d'erreur.
   */
  it('devrait clipper en `clip` — `hidden` casserait un sticky enfant (mesuré)', () => {
    expect(host.get('overflow')).toBe('clip');
  });

  it('devrait peindre le sol de la page', () => {
    expect(host.get('background')).toBe('var(--site-background)');
  });
});

describe('les disques (.tc-backdrop__halo)', () => {
  const halo = ruleOf(backdropSource, '.tc-backdrop__halo');

  it('devrait être absolu : posé en flux, le décor pousserait le contenu vers le bas', () => {
    expect(halo.get('position')).toBe('absolute');
  });

  /*
   * `-1` et non `0`, et le chiffre est MESURÉ (Chromium 151, capture recadrée
   * 48 px à l'intérieur d'une carte opaque, halos visibles puis masqués) :
   *
   *   disques à z-index: -1  →  intérieur de la carte opaque recouvert = false
   *   disques à z-index:  0  →  intérieur de la carte opaque recouvert = true
   *
   * À `0` le disque se peint à l'étape des descendants POSITIONNÉS, donc
   * par-dessus tout enfant en flux — une carte `flat`, un titre, un paragraphe.
   * La source y échappe parce que son contenu est fait de cartes
   * `position: relative` ; `Backdrop`, lui, accepte n'importe quel enfant.
   */
  it('devrait rester sous le contenu, positionné ou non (z-index: -1)', () => {
    expect(halo.get('z-index')).toBe('-1');
  });

  it('devrait laisser passer le pointeur', () => {
    expect(halo.get('pointer-events')).toBe('none');
  });

  it('devrait déclarer les six modificateurs, ni plus ni moins', () => {
    const css = stripComments(backdropSource);
    const declared = new Set(
      [...css.matchAll(/\.tc-backdrop__halo--([a-z]+)\b/g)].map((m) => m[1]),
    );

    expect([...declared].sort()).toEqual(['five', 'four', 'one', 'six', 'three', 'two']);
  });

  /*
   * Trois froids, trois chauds. Le contrat de couleur épingle la PARITÉ des
   * deux teintes (ΔE OKLab 13,28 contre 13,36 en clair) ; déplacer un disque
   * d'une moitié à l'autre laisse une couche dominer visuellement l'autre, ce
   * qui défait la raison même d'avoir une couche chaude. `ruleBodies` retrouve
   * une règle groupée à partir d'un seul de ses membres, donc les trois
   * ordinaux se demandent un par un.
   */
  it('devrait garder trois disques chauds sur six', () => {
    const isWarm = (ordinal: string): boolean =>
      ruleBodies(stripComments(backdropSource), `.tc-backdrop__halo--${ordinal}`).some((body) =>
        declarations(body).get('background')?.includes('--halo-tint-warm'),
      );

    expect(['two', 'four', 'six'].map(isWarm)).toEqual([true, true, true]);
    expect(['one', 'three', 'five'].map(isWarm)).toEqual([false, false, false]);
  });
});

/* ----------------------------------------------------------------------------
   LE MOUVEMENT DES HALOS, ET POURQUOI IL SE TESTE EN TEXTE.

   Ce bloc n'existait pas, et son absence a laissé passer un bug de cascade
   complet : le `@supports (animation-timeline: scroll())` de `backdrop.css`
   redéclarait le RACCOURCI `animation`, plus bas et à spécificité égale
   (0,1,0 — `@supports` n'ajoute rien). Un raccourci remet à leur valeur
   initiale toutes les propriétés qu'il ne cite pas : les cinq
   `animation-duration` / `animation-delay` par disque déclarés juste avant
   retombaient donc à 26s et 0s, et les six halos respiraient sur le même
   cycle, en phase, partout sauf sous Firefox — seul moteur à ne pas satisfaire
   le `@supports`, et donc seul moteur où le commentaire « les halos ne se
   resynchronisent jamais » disait vrai.

   Rien ne pouvait rougir : la feuille était valide, le décor bougeait, et
   aucun test ne lisait une seule propriété d'animation. C'est le mode de
   défaillance que ce fichier existe pour fermer, et c'était un trou.
   -------------------------------------------------------------------------- */

describe('le mouvement des halos', () => {
  const ORDINALS = ['one', 'two', 'three', 'four', 'five', 'six'] as const;

  /* Le disque `--one` ne déclare rien : il prend le repli du `var()`. Les deux
     constantes ci-dessous sont donc vérifiées contre la feuille par le premier
     test, sans quoi elles seraient une fiction du test. */
  const FALLBACK_DURATION = '26s';
  const FALLBACK_DELAY = '0s';

  const motion = atRuleOf(
    backdropSource,
    '@media (prefers-reduced-motion: no-preference)',
    (prelude) =>
      prelude.startsWith('@media') && prelude.includes('prefers-reduced-motion: no-preference'),
  );

  const scrollDriven = atRuleOf(
    backdropSource,
    '@supports (animation-timeline: scroll())',
    (prelude) => prelude.startsWith('@supports') && prelude.includes('animation-timeline'),
  );

  /** La durée et le décalage de respiration d'un disque, repli compris. */
  function breatheTimingOf(ordinal: string): readonly [string, string] {
    let duration = FALLBACK_DURATION;
    let delay = FALLBACK_DELAY;

    for (const body of ruleBodies(motion, `.tc-backdrop__halo--${ordinal}`)) {
      const declared = declarations(body);
      duration = declared.get('--halo-breathe-duration') ?? duration;
      delay = declared.get('--halo-breathe-delay') ?? delay;
    }

    return [duration, delay];
  }

  /*
   * LE GARDE PRINCIPAL. Il ne dit pas « écris des longhands par goût » : un
   * raccourci `animation` dans cette feuille réinitialise silencieusement la
   * durée et le décalage de chaque disque, quel que soit l'endroit où il est
   * écrit, parce que les valeurs par disque sont posées AVANT lui. Le
   * raccourci est donc interdit ici, et l'interdiction est la règle qu'un
   * commentaire ne pouvait pas tenir.
   */
  it('ne devrait employer aucun raccourci `animation` : il réinitialise ce qu’il ne cite pas', () => {
    const offenders = [
      ...stripComments(backdropSource).matchAll(/(?:^|[;{}\s])animation\s*:[^;}]*/g),
    ].map((match) => match[0].trim());

    expect(
      offenders,
      `raccourcis \`animation\` trouvés :\n  ${offenders.join('\n  ')}\n` +
        'Écrire les longhands, une valeur par animation.',
    ).toEqual([]);
  });

  it('devrait porter la respiration en longhands, durée et décalage lus dans un jeton local', () => {
    const halo = ruleOf(motion, '.tc-backdrop__halo');

    expect(valueOf(halo, 'animation-name')).toBe('tc-halo-breathe');
    expect(valueOf(halo, 'animation-duration')).toBe(
      `var(--halo-breathe-duration, ${FALLBACK_DURATION})`,
    );
    expect(valueOf(halo, 'animation-delay')).toBe(`var(--halo-breathe-delay, ${FALLBACK_DELAY})`);
    expect(valueOf(halo, 'animation-timing-function')).toBe('ease-in-out');
    expect(valueOf(halo, 'animation-iteration-count')).toBe('infinite');
    expect(valueOf(halo, 'animation-direction')).toBe('alternate');
  });

  /*
   * La version exécutable du commentaire « durées premières entre elles ». Six
   * durées distinctes ne suffisent pas : 24s et 36s se rejoignent toutes les
   * 72s. Ce qui tient la promesse, c'est que chaque paire soit première entre
   * elle, et c'est calculable.
   */
  it('devrait donner aux six disques des cycles premiers entre eux', () => {
    const durations = ORDINALS.map((ordinal) => seconds(breatheTimingOf(ordinal)[0]));

    const collisions: string[] = [];
    for (let left = 0; left < durations.length; left += 1) {
      for (let right = left + 1; right < durations.length; right += 1) {
        const common = greatestCommonDivisor(durations[left], durations[right]);
        if (common !== 1) {
          collisions.push(
            `${ORDINALS[left]} (${durations[left]}s) et ${ORDINALS[right]} (${durations[right]}s) ` +
              `partagent le facteur ${common} : ils se resynchronisent`,
          );
        }
      }
    }

    expect(collisions, collisions.join('\n  ')).toEqual([]);
  });

  it('devrait décaler les six disques les uns des autres', () => {
    const delays = ORDINALS.map((ordinal) => breatheTimingOf(ordinal)[1]);

    expect(new Set(delays).size, `décalages : ${delays.join(', ')}`).toBe(ORDINALS.length);
  });

  /*
   * Le bloc des animations de défilement superpose une SECONDE animation, donc
   * chaque propriété d'animation devient une liste de deux. C'est là que la
   * durée par disque se perdait : la garder en tête de liste est ce qui la
   * fait retomber sur la respiration, et sur elle seule.
   */
  it('devrait garder la durée du disque en tête de liste sous animations de défilement', () => {
    const halo = ruleOf(scrollDriven, '.tc-backdrop__halo');

    expect(commaList(valueOf(halo, 'animation-name'))).toEqual([
      'tc-halo-breathe',
      'tc-halo-parallax',
    ]);
    expect(commaList(valueOf(halo, 'animation-duration'))[0]).toBe(
      `var(--halo-breathe-duration, ${FALLBACK_DURATION})`,
    );
    expect(commaList(valueOf(halo, 'animation-delay'))[0]).toBe(
      `var(--halo-breathe-delay, ${FALLBACK_DELAY})`,
    );

    /* Une propriété d'animation à UNE valeur se répète sur les deux animations
       (CSS Animations § listes) : la parallaxe hériterait alors du compte
       d'itérations et de la direction de la respiration. Chacune doit donc
       porter ses deux valeurs, explicitement. */
    for (const property of [
      'animation-duration',
      'animation-delay',
      'animation-timing-function',
      'animation-iteration-count',
      'animation-direction',
      'animation-timeline',
    ]) {
      expect(
        commaList(valueOf(halo, property)),
        `\`${property}\` doit porter une valeur par animation`,
      ).toHaveLength(2);
    }
  });
});

/* ----------------------------------------------------------------------------
   LA TRANSPARENCE RÉDUITE, ET LES TROIS COMMENTAIRES QU'ELLE RENDAIT FAUX.

   `materials.css`, `contract/backdrop.ts` et `roles.css` annonçaient tous les
   trois un repli opaque « quand la transparence réduite est demandée ». Les
   JETONS s'aplatissaient bien ; les composants, non — `.tc-card--glass`
   gardait `var(--glass-fill)` à alpha 0,40 et son `backdrop-filter`, et le
   décor restait derrière. Les valeurs aplaties, mesurées sur `--surface`, se
   composaient donc sur un support qui n'était pas celui de la mesure.
   -------------------------------------------------------------------------- */

describe('la transparence réduite', () => {
  const REDUCED = 'prefers-reduced-transparency';

  it('devrait rendre le verre opaque et lui retirer son filtre', () => {
    const flattened = atRuleOf(
      cardSource,
      `@media (${REDUCED}: reduce)`,
      (prelude) => prelude.startsWith('@media') && prelude.includes(REDUCED),
    );
    const glass = ruleOf(flattened, '.tc-card--glass');

    expect(valueOf(glass, 'background')).toBe('var(--glass-fill-solid)');
    expect(valueOf(glass, 'backdrop-filter')).toBe('none');
    expect(valueOf(glass, '-webkit-backdrop-filter')).toBe('none');
  });

  it('devrait retirer le décor : un halo derrière un verre opaque ne se voit plus', () => {
    const flattened = atRuleOf(
      backdropSource,
      `@media (${REDUCED}: reduce)`,
      (prelude) => prelude.startsWith('@media') && prelude.includes(REDUCED),
    );

    expect(ruleOf(flattened, '.tc-backdrop__halo').get('display')).toBe('none');
  });
});

describe('le verre (.tc-card--glass)', () => {
  const glass = ruleOf(cardSource, '.tc-card--glass');
  const core = ruleOf(cardSource, '.tc-card--glass::before');

  it('devrait filtrer son arrière-plan — sans quoi ce n’est plus du verre', () => {
    expect(valueOf(glass, 'backdrop-filter')).toContain('blur(');
    expect(valueOf(glass, '-webkit-backdrop-filter')).toContain('blur(');
  });

  it('devrait garder le ménisque de bord distinct du flou de lecture', () => {
    expect(valueOf(glass, 'backdrop-filter')).toContain('var(--glass-edge-blur)');
    expect(valueOf(core, 'backdrop-filter')).toContain('var(--glass-blur)');
  });

  /*
   * `z-index: -1` place le cœur AU-DESSUS du fond de la carte et SOUS son
   * contenu. Le perdre ne casse rien : le texte passe simplement derrière un
   * calque flouté de 32 px.
   */
  it('devrait garder le cœur sous le contenu et sur le fond (z-index: -1)', () => {
    expect(core.get('z-index')).toBe('-1');
  });

  it('devrait remonter le contenu au-dessus du liseré spéculaire', () => {
    expect(ruleOf(cardSource, '.tc-card--glass > *').get('z-index')).toBe('1');
  });

  /*
   * WCAG 1.4.10 / 1.4.4, et une mesure de `sticky`. Deux choses ici, et elles
   * sont distinctes.
   *
   * 1. Ce qui dépasse la carte était coupé sans barre de défilement et sans
   *    accès clavier : à 200 % de zoom ou en 320 px, une URL non coupable
   *    perdait sa fin, définitivement. La protection est posée sur le SOCLE et
   *    non sur le verre — `overflow-wrap` s'hérite, le composant émet toujours
   *    les deux classes, et le bloc du verre reste un déplacement verbatim.
   *
   * 2. `clip` et NON `hidden`, seul écart de valeur assumé avec la source du
   *    portfolio. `hidden` crée un conteneur de défilement qui devient le
   *    référentiel de tout `position: sticky` enfant ; `clip` n'en crée pas.
   *    Mesuré sur Chromium 151 par la sonde de `backdrop.css` : barre collante
   *    à `rect.top` 0/0/0 sous `clip`, −300/−900/−1000 sous `hidden`. Un
   *    en-tête de tableau collant dans une carte est un cas ordinaire, et le
   *    clip est identique dans les deux cas : aucun coût visuel.
   *
   * Le test refuse donc `hidden` explicitement. Un garde qui aurait seulement
   * vérifié « il y a un clip » aurait accepté la valeur qui casse.
   */
  it('devrait clipper en `clip` et laisser une chaîne insécable se couper', () => {
    expect(valueOf(glass, 'overflow')).toBe('clip');
    expect(ruleOf(cardSource, '.tc-card').get('overflow-wrap')).toBe('anywhere');
  });

  /*
   * Le repli n'est pas un ornement : à alpha 0,40 sans `backdrop-filter`, le
   * texte se lit à même le halo. Il doit rendre le remplissage OPAQUE.
   */
  it('devrait garder son repli `@supports not` pour les moteurs sans backdrop-filter', () => {
    const fallback = atRuleBody(
      cardSource,
      (prelude) => prelude.startsWith('@supports not') && prelude.includes('backdrop-filter'),
    );

    expect(fallback, 'le repli `@supports not (backdrop-filter…)` a disparu').toBeDefined();
    expect(fallback).toContain('.tc-card--glass');
    expect(fallback).toContain('var(--glass-fill-solid)');
  });

  /*
   * `.tc-card` et `.tc-card--glass` ont la MÊME spécificité (une classe) : le
   * fond, le liseré et le rayon du verre ne gagnent que par l'ordre du
   * document. Remonter le bloc verre au-dessus du socle rendrait la carte
   * opaque sans qu'aucune autre vérification ne bouge.
   */
  it('devrait être déclaré après le socle et après les crans d’élévation', () => {
    expect(positionOf(cardSource, '.tc-card--glass')).toBeGreaterThan(
      positionOf(cardSource, '.tc-card'),
    );
    expect(positionOf(cardSource, '.tc-card--glass')).toBeGreaterThan(
      positionOf(cardSource, '.tc-card--elev-3'),
    );
  });
});
