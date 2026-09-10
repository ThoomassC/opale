import { describe, expect, it } from 'vitest';

import glassSource from './glass.css?raw';
import mainSource from '../main.tsx?raw';
import { parseCustomProperties, ruleBodies, stripComments } from '../contract/stylesheet';

/* ============================================================================
   LE GARDE DU THÈME « VERRE LIQUIDE », ET CE QU'IL NE GARDE PAS.

   Même limite que `glass.structure.test.ts`, dont ce fichier reprend la
   méthode : jsdom ne peint pas, il n'y a pas de Playwright dans ce dépôt, donc
   aucun test d'ici ne peut dire si le verre RESSEMBLE à du verre. Cela s'est
   regardé à l'écran, sur les quatre combinaisons de thème et de matériau, et
   ça continuera de devoir se regarder.

   Ce qui se vérifie sans peindre, c'est la FORME de la feuille — et pour ce
   thème-ci, la forme porte cinq promesses dont AUCUNE ne casse le build quand
   elle tombe :

     1. « tous les composants sont en verre » n'est une phrase vraie que si
        quelque chose l'exécute. Un dix-septième composant ajouté sans règle de
        verre doit rougir, en le NOMMANT ;
     2. un `backdrop-filter` sans son doublet `-webkit-` est une panne pour
        100 % du public visé — la cible d'un thème Liquid Glass est Safari ;
     3. une règle de verre sur `::after` ferait disparaître le seul indicateur
        d'attente du bouton, en mode verre uniquement, sans un rouge ;
     4. l'ordre des sections EST le contrat : les replis de préférence en
        dernier, sans quoi activer le verre DÉFAIT une préférence
        d'accessibilité ;
     5. « la couleur par le jeton, la matière par la feuille » est la seule
        écriture qui gagne contre les règles d'état à (0,4,0) des composants.

   On lit donc le CSS en TEXTE, COMMENTAIRES RETIRÉS. Sans quoi ce test
   passerait en ne lisant que de la prose : l'en-tête de `glass.css` cite
   `::after`, `background`, `border-color` et `[data-material='flat']` en
   toutes lettres, précisément pour les interdire.
   ========================================================================== */

const css = stripComments(glassSource);

/** Le porteur du thème, écrit une seule fois pour que le test ne le paraphrase pas. */
const CARRIER = "[data-material='glass']";

/* ----------------------------------------------------------------------------
   LES DEUX LISTES ÉPINGLÉES.

   Elles ne décrivent pas la feuille, elles sont sa DÉCISION — et le § « recette
   de matière » de `glass.css` porte la raison de chaque appartenance. Un
   sélecteur ajouté ou retiré dans la feuille sans passer ici rougit deux fois :
   la liste ne le contient pas, et la feuille ne contient pas la liste.
   -------------------------------------------------------------------------- */

/**
 * Les sept surfaces qui reçoivent un `backdrop-filter`.
 *
 * Sept, et la règle de tri est la CARDINALITÉ : un filtre coûte une passe de
 * composition par élément, donc rien de ce qui se répète dans une liste — une
 * chip, une pastille — n'en reçoit.
 */
const BLURRED = [
  '.tc-btn--secondary',
  '.tc-btn--danger',
  '.tc-input',
  '.tc-select',
  '.tc-textarea',
  '.tc-message',
  '.tc-icontile',
] as const;

/**
 * Les neuf surfaces qui reçoivent le liseré spéculaire, sur `::before`.
 *
 * Deux ne sont pas dans `BLURRED`, et c'est mesuré : `.tc-btn--primary` garde
 * son aplat opaque (`--accent` exige alpha ≥ 0,892 pour que le blanc tienne
 * 4,5:1), `.tc-tag` et `.tc-pill--*` sont des objets de liste. Trois de
 * `BLURRED` ne sont pas ici, et c'est structurel : `<input>`, `<select>` et
 * `<textarea>` ne génèrent aucune boîte de pseudo-élément.
 */
const RIMMED = [
  '.tc-btn--primary',
  '.tc-btn--secondary',
  '.tc-btn--danger',
  '.tc-message',
  '.tc-icontile',
  '.tc-tag',
  '.tc-pill--done',
  '.tc-pill--progress',
  '.tc-pill--upcoming',
] as const;

/* ----------------------------------------------------------------------------
   LA TABLE D'EXCLUSIONS, EXPLICITE ET COMMENTÉE.

   Une exclusion IMPLICITE est un trou : un composant oublié n'est simplement
   pas dans la liste, exactement comme un composant délibérément écarté. La
   table donne à chaque composant non verré une raison ÉCRITE, et cette raison
   apparaît dans le titre du test — c'est ce qu'on lira dans six mois.

   Les clés sont des NOMS DE MODULE de `src/components/`, et la liste des
   modules est lue par le bundler : un composant ajouté demain apporte son
   fichier, donc son entrée manquante fait rougir sans que personne n'ait à
   penser à mettre ce tableau à jour.
   -------------------------------------------------------------------------- */
const EXCLUDED = new Map<string, string>([
  [
    'backdrop.tsx',
    "c'est le SOL et non une surface : l'hôte peint --site-background et ses six " +
      'halos sont ce que le verre doit révéler. Un filtre ici flouterait la page ' +
      'derrière le décor, et il ne se passe rien derrière le décor',
  ],
  [
    'card.tsx',
    'le verre de Card EXISTE DÉJÀ et ne bouge pas — recette complète à deux ' +
      'anneaux, liseré masqué, deux replis, dans components/card.css. Et la ' +
      "variante `flat` reste opaque : c'est l'échappatoire par composant que " +
      "card.tsx promet, donc aucun sélecteur .tc-card--elev-* n'est écrit",
  ],
  [
    'checkbox.tsx',
    'la rangée est du texte sans surface, et la case est dessinée par ' +
      "l'agent utilisateur : la verrer demanderait `appearance: none`, ce qui " +
      "coûterait la coche système, le rendu forced-colors et l'état indéterminé",
  ],
  [
    'chip-list.tsx',
    'conteneur en flex sans fond — il ne peint rien, et les chips qu’il aligne ' +
      'sont des Tag, qui reçoivent leur liseré de leur côté',
  ],
  [
    'date-range.tsx',
    'du texte en capitales et rien d’autre : pas de fond, pas de liseré, pas de ' +
      'boîte à border-radius sur laquelle un anneau aurait un sens',
  ],
  [
    'field.tsx',
    'conteneur de mise en page et trois blocs de texte (libellé, aide, erreur) ; ' +
      'la surface du champ est celle du contrôle, qui est verré de son côté',
  ],
  [
    'glass-lens.tsx',
    "il ne peint AUCUN pixel : c'est un porte-définitions, un <svg> de taille " +
      'nulle qui ne contient que le filtre de déplacement que lens.css référence. ' +
      "Le verrer n'aurait pas de surface à verrer, et le filtre qu'il porte n'est " +
      "pas du matériau — c'est de la géométrie",
  ],
  [
    'section-heading.tsx',
    'un sourcil, un titre et un chapô : du texte, aucune surface — et une grille ' +
      'à deux colonnes au-delà de 62rem, qui n’est pas un matériau',
  ],
  [
    'timeline.tsx',
    'ne porte que la GÉOMÉTRIE de la frise, jamais un matériau — son en-tête le ' +
      "dit. L'appelant empile `tc-card tc-card--glass` sur l'entrée, donc le " +
      'verre lui arrive déjà par Card',
  ],
]);

/**
 * Les modules de composant, lus par le bundler pour que la liste ne se fige pas.
 *
 * Les fichiers de test sont écartés : ils citent des classes de la VITRINE
 * (`tc-doc-*`) et des classes utilitaires, ce qui les ferait passer pour des
 * composants sans surface à exclure.
 */
const COMPONENTS = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../components/*.tsx', {
      query: '?raw',
      import: 'default',
      eager: true,
    }),
  )
    .filter(([path]) => !path.endsWith('.test.tsx'))
    .map(([path, source]) => [path.slice(path.lastIndexOf('/') + 1), source]),
);

/**
 * Les préfixes de classe qu'un module émet.
 *
 * Des PRÉFIXES et non des classes complètes, parce qu'un modificateur est
 * construit : `button.tsx` écrit `` `tc-btn--${variant}` ``, et chercher
 * `tc-btn--primary` dans sa source ne le trouverait jamais. Les commentaires
 * sont retirés d'abord — de ligne comme de bloc — sans quoi une classe citée
 * en prose ferait passer un composant pour verré.
 */
function emittedPrefixes(source: string): readonly string[] {
  const code = stripComments(source).replace(/\/\/[^\n]*/g, ' ');
  return [...new Set([...code.matchAll(/tc-[a-z0-9_-]*/g)].map((match) => match[0]))];
}

/**
 * `selector` descend-il de `prefix` ?
 *
 * L'égalité ou une frontière BEM — `--` pour un modificateur, `__` pour un
 * élément — et RIEN d'AUTRE. Un `startsWith` nu était trop laxiste, et la
 * preuve de mutation l'a montré : `.tc-tagg`, une faute de frappe sur
 * `.tc-tag`, passait pour un descendant légitime de `tc-tag` et le garde
 * réciproque ne le voyait pas. Il rougissait quand même par la liste épinglée,
 * mais par accident — un garde qui attrape par accident n'attrape pas.
 */
function descendsFrom(selector: string, prefix: string): boolean {
  return (
    selector === prefix || selector.startsWith(`${prefix}--`) || selector.startsWith(`${prefix}__`)
  );
}

/** Les classes `tc-*` que `glass.css` cite. */
const GLASSED_CLASSES = [
  ...new Set([...css.matchAll(/\.(tc-[a-z0-9_-]+)/g)].map((match) => match[1])),
];

/* ----------------------------------------------------------------------------
   LA LECTURE DE LA FEUILLE.

   `ruleBodies` de `contract/stylesheet` ne descend volontairement PAS dans
   `@media` ni `@supports` — un bloc conditionnel n'a pas à se faire passer
   pour la règle de base. Or les gardes 2 et 5 doivent regarder TOUTES les
   règles, celles des conditionnels comprises : c'est justement dans un
   `@media` qu'un `backdrop-filter` orphelin de son doublet `-webkit-`
   passerait inaperçu. D'où l'aplatissement ci-dessous, qui GARDE le prélude de
   chaque at-règle englobante au lieu de l'oublier.
   -------------------------------------------------------------------------- */

/** Index du `}` fermant le `{` en `open`, ou -1 si la source est cassée. */
function matchingBrace(source: string, open: number): number {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

/**
 * Les déclarations de premier niveau d'un corps de règle, `prop` → `valeur`.
 *
 * Même forme que l'utilitaire de `glass.structure.test.ts`, et non partagé avec
 * lui : vingt lignes de lecture ne valent pas un troisième fichier à maintenir
 * entre deux gardes qui n'ont ni la même feuille ni la même question. Le
 * découpage se fait aux `;` de PROFONDEUR ZÉRO, sans quoi la virgule d'un
 * `linear-gradient()` ou d'une liste de masques couperait une déclaration en
 * deux.
 */
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

interface StyleRule {
  /** Les membres de la liste de sélecteurs, espaces normalisés. */
  readonly selectors: readonly string[];
  readonly declarations: ReadonlyMap<string, string>;
  /** Les préludes des at-règles englobantes, du plus extérieur au plus intérieur. */
  readonly conditions: readonly string[];
}

/** Toutes les règles de style de la feuille, at-règles traversées. */
function styleRules(source: string): readonly StyleRule[] {
  const rules: StyleRule[] = [];
  const stack: string[] = [];
  let preludeStart = 0;
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === ';') {
      index += 1;
      preludeStart = index;
      continue;
    }

    // Seule une at-règle laisse son `}` atteindre cette boucle : une règle de
    // style est consommée entière par `matchingBrace` ci-dessous.
    if (char === '}') {
      stack.pop();
      index += 1;
      preludeStart = index;
      continue;
    }

    if (char !== '{') {
      index += 1;
      continue;
    }

    const prelude = source.slice(preludeStart, index).trim().replace(/\s+/g, ' ');

    if (prelude.startsWith('@')) {
      stack.push(prelude);
      index += 1;
      preludeStart = index;
      continue;
    }

    const close = matchingBrace(source, index);
    expect(close, `accolade non refermée après \`${prelude}\``).toBeGreaterThan(-1);

    rules.push({
      selectors: prelude
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0),
      declarations: declarations(source.slice(index + 1, close)),
      conditions: [...stack],
    });

    index = close + 1;
    preludeStart = index;
  }

  return rules;
}

const RULES = styleRules(css);

/** La position d'une chaîne dans la feuille, avec un rouge qui la nomme. */
function positionOf(needle: string): number {
  const at = css.indexOf(needle);
  expect(at, `\`${needle}\` introuvable dans glass.css`).toBeGreaterThan(-1);
  return at;
}

/** Les règles dont TOUS les sélecteurs visent le pseudo-élément `pseudo`. */
function rulesOnPseudo(pseudo: string): readonly StyleRule[] {
  return RULES.filter((rule) => rule.selectors.every((selector) => selector.endsWith(pseudo)));
}

/** Les sélecteurs attendus pour une liste épinglée, porteur compris. */
function scoped(selectors: readonly string[], pseudo = ''): readonly string[] {
  return selectors.map((selector) => `${CARRIER} ${selector}${pseudo}`);
}

describe('1. La liste des surfaces verrées est épinglée, et croisée avec les composants', () => {
  /*
   * LE GARDE QUI REND EXÉCUTABLE LA PHRASE « TOUS LES COMPOSANTS SONT EN
   * VERRE », sur le modèle de ce que `registry.test.tsx` fait pour les pages du
   * site : il lit les modules RÉELLEMENT présents et exige de chacun soit une
   * règle de verre, soit une entrée dans la table d'exclusions.
   */
  it('trouve bien les modules de composant : sans quoi tout ce bloc serait vide', () => {
    const found = Object.keys(COMPONENTS).sort();

    expect(found.length, `modules trouvés : ${found.join(', ')}`).toBeGreaterThanOrEqual(16);
    expect(found).toContain('button.tsx');
    expect(found.filter((name) => name.endsWith('.test.tsx'))).toEqual([]);
  });

  it.each(Object.entries(COMPONENTS))(
    '%s est soit verré, soit exclu avec sa raison',
    (name, source) => {
      const glassed = GLASSED_CLASSES.filter((selector) =>
        emittedPrefixes(source).some((prefix) => descendsFrom(selector, prefix)),
      );
      const excused = EXCLUDED.get(name);

      expect(
        glassed.length > 0 || excused !== undefined,
        `${name} ne reçoit AUCUNE règle de verre et n'est pas dans la table d'exclusions. ` +
          'Soit ce composant a une surface et il lui manque sa règle dans glass.css, soit il ' +
          "n'en a pas et son exclusion doit être ÉCRITE, avec la mesure ou la raison. " +
          'Une omission silencieuse est le mécanisme par lequel un composant reste plat.',
      ).toBe(true);

      expect(
        glassed.length > 0 && excused !== undefined,
        `${name} est à la fois verré (${glassed.join(', ')}) et exclu (« ${excused} ») : ` +
          "l'une des deux affirmations est périmée.",
      ).toBe(false);
    },
  );

  it.each([...EXCLUDED])('%s est exclu, et voici pourquoi — %s', (name, reason) => {
    expect(
      Object.keys(COMPONENTS),
      `la table d'exclusions nomme ${name}, qui n'est plus un module de composant. ` +
        'Une entrée périmée exempte un fichier qui a changé de nom.',
    ).toContain(name);
    expect(
      reason.length,
      `la raison donnée pour ${name} est trop courte pour en être une`,
    ).toBeGreaterThan(40);
  });

  /*
   * LE RÉCIPROQUE, et il attrape la faute la plus banale : une classe mal tapée
   * dans `glass.css`. Une règle qui ne correspond à rien ne casse rien, ne
   * rougit nulle part, et laisse le composant plat.
   */
  it('ne cite aucune classe qu’aucun composant n’émet', () => {
    const emitted = Object.values(COMPONENTS).flatMap(emittedPrefixes);
    const unknown = GLASSED_CLASSES.filter(
      (selector) => !emitted.some((prefix) => descendsFrom(selector, prefix)),
    );

    expect(
      unknown,
      `classes citées par glass.css et émises par aucun composant : ${unknown.join(', ')}`,
    ).toEqual([]);
  });

  it('applique le flou aux sept surfaces épinglées, et à elles seules', () => {
    const filtered = RULES.filter(
      (rule) => rule.declarations.has('backdrop-filter') && rule.conditions.length === 0,
    );

    expect(filtered, 'aucune règle de flou hors at-règle : la recette a disparu').toHaveLength(1);
    expect(filtered[0].selectors).toEqual(scoped(BLURRED));
  });

  it('applique le liseré aux neuf surfaces épinglées, et à elles seules', () => {
    const rims = rulesOnPseudo('::before').filter((rule) => rule.declarations.has('content'));

    expect(rims, 'aucune règle de liseré : le `::before` spéculaire a disparu').toHaveLength(1);
    expect(rims[0].selectors).toEqual(scoped(RIMMED, '::before'));
  });

  /*
   * Un liseré posé sur un hôte non positionné se rattache au premier ancêtre
   * positionné — ou au bloc initial — et va tracer son anneau ailleurs sur la
   * page. Et sans `isolation: isolate`, le `z-index: -1` du liseré passe
   * DERRIÈRE le fond de cet ancêtre, c'est-à-dire hors de l'élément. Les deux
   * propriétés sont indissociables, la panne est silencieuse dans les deux
   * sens, d'où ce garde sur l'hôte et pas seulement sur le pseudo-élément.
   */
  it('positionne et isole chaque hôte de liseré : le `z-index: -1` en dépend', () => {
    const hosts = RULES.filter(
      (rule) => rule.declarations.get('position') === 'relative' && rule.conditions.length === 0,
    );

    expect(hosts, "la règle d'hôte du liseré a disparu").toHaveLength(1);
    expect(hosts[0].selectors).toEqual(scoped(RIMMED));
    expect(hosts[0].declarations.get('isolation')).toBe('isolate');
  });

  it('garde le liseré sous le contenu et sur le fond (z-index: -1)', () => {
    const rims = rulesOnPseudo('::before').filter((rule) => rule.declarations.has('content'));

    expect(rims[0].declarations.get('z-index')).toBe('-1');
    expect(rims[0].declarations.get('pointer-events')).toBe('none');
  });

  /*
   * `data-material` n'a QU'UNE valeur, et l'absence signifie « normal ».
   * `data-theme` a besoin de `"light"` parce que l'OS peut imposer le sombre par
   * `prefers-color-scheme` : il faut pouvoir le contredire. Il n'existe aucune
   * `prefers-material`, donc rien à contredire — et un second nom pour l'état
   * par défaut serait un état qu'on peut oublier de poser.
   */
  it("n'écrit nulle part un sélecteur `[data-material='flat']`", () => {
    const values = [
      ...new Set([...css.matchAll(/\[data-material=['"]?([a-z-]+)['"]?\]/g)].map((m) => m[1])),
    ];

    expect(values, `valeurs de data-material trouvées : ${values.join(', ')}`).toEqual(['glass']);
  });
});

describe('2. Tout `backdrop-filter` porte son doublet `-webkit-`', () => {
  /*
   * LA CIBLE D'UN THÈME LIQUID GLASS EST SAFARI, et Safari n'a livré la forme
   * non préfixée qu'en 18 : l'oubli du doublet n'est pas une dégradation, c'est
   * une panne pour 100 % du public visé. `card.css` porte les deux sur ses
   * trois couches ; rien ne le vérifiait à l'échelle d'une feuille, et la mise
   * à `none` du § 5 est exactement l'endroit où l'on oublie la seconde ligne.
   */
  it('sur chaque règle qui en déclare un', () => {
    const offenders = RULES.filter(
      (rule) =>
        rule.declarations.has('backdrop-filter') &&
        !rule.declarations.has('-webkit-backdrop-filter'),
    ).map((rule) => `${rule.conditions.join(' > ')} { ${rule.selectors[0]} … }`);

    expect(
      offenders,
      `règles sans \`-webkit-backdrop-filter\` :\n  ${offenders.join('\n  ')}\n` +
        'Safari < 18 ne connaît que la forme préfixée.',
    ).toEqual([]);
  });

  it('et les deux valeurs ne divergent pas', () => {
    const mismatched = RULES.filter((rule) => {
      const standard = rule.declarations.get('backdrop-filter');
      const prefixed = rule.declarations.get('-webkit-backdrop-filter');
      return standard !== undefined && prefixed !== undefined && standard !== prefixed;
    }).map((rule) => rule.selectors[0]);

    expect(mismatched, `valeurs divergentes sur : ${mismatched.join(', ')}`).toEqual([]);
  });

  /*
   * Le flou de LECTURE de la carte (32 px) posé sur un contrôle de 44 px
   * échantillonne son voisinage et non son arrière-plan : à ±1σ il couvre
   * 64 px, soit 1,45 fois la hauteur de l'élément, et l'intérieur devient la
   * moyenne de la bande qui l'entoure. Le jeton dédié PORTE la mesure ;
   * l'employer est le contrat.
   */
  it('emploie `--glass-blur-control` et jamais `--glass-blur`', () => {
    for (const rule of RULES) {
      const value = rule.declarations.get('backdrop-filter');
      if (value === undefined || value === 'none') continue;
      expect(
        value,
        `\`${rule.selectors[0]}\` floute son fond sans le jeton des contrôles`,
      ).toContain('var(--glass-blur-control)');
    }

    expect(
      css.includes('var(--glass-blur)'),
      'glass.css cite `--glass-blur` : 32 px de flou sur un contrôle de 44 px ' +
        'échantillonnent au-delà de l’élément.',
    ).toBe(false);
  });
});

describe('3. Aucune règle ne cible `::after`', () => {
  /*
   * `button.css` tient les points de suspension du bouton en attente sur
   * `.tc-btn[aria-busy='true']::after`, à (0,2,0). Une règle de verre sur
   * `::after` pèserait (0,3,0) et gagnerait de surcroît par l'ordre du
   * document : elle ferait DISPARAÎTRE LE SEUL INDICATEUR D'ATTENTE DU BOUTON,
   * en mode verre uniquement. Aucun test ne rougirait, le bouton resterait
   * `aria-busy` pour le lecteur d'écran, et l'œil ne verrait plus rien.
   */
  it('le seul indicateur d’attente du bouton vit là, et il doit y rester seul', () => {
    const offenders = RULES.flatMap((rule) =>
      rule.selectors.filter((selector) => selector.includes('::after')),
    );

    expect(
      offenders,
      `sélecteurs visant ::after : ${offenders.join(', ')}\n` +
        "`.tc-btn[aria-busy='true']::after` porte les points de suspension du bouton en " +
        'attente. Le liseré spéculaire va sur `::before`.',
    ).toEqual([]);
  });

  it('et le liseré est bien sur `::before`', () => {
    expect(rulesOnPseudo('::before').length).toBeGreaterThan(0);
  });
});

describe('4. L’ordre des cinq sections est le contrat', () => {
  const REDUCED = '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)';
  const FORCED = '@media (forced-colors: active)';
  const ENGINE = '@supports not';

  it('déclare les trois replis', () => {
    const preludes = [...new Set(RULES.flatMap((rule) => rule.conditions))];

    for (const expected of [ENGINE, REDUCED, FORCED]) {
      expect(
        preludes.some((prelude) => prelude.startsWith(expected)),
        `le repli \`${expected}\` a disparu. Préludes trouvés :\n  ${preludes.join('\n  ')}`,
      ).toBe(true);
    }
  });

  /*
   * L'APLATISSEMENT EST OBLIGATOIRE, ET IL EST DÉJÀ ARRIVÉ QU'IL MANQUE.
   * `roles.css` et `materials.css` aplatissent leurs lavis sous ces deux
   * préférences, mais leurs blocs ne pèsent pas plus que cette feuille et sont
   * déclarés AVANT elle : un `backdrop-filter` posé ici leur survivrait. Une
   * personne qui demande à ne pas dépendre de ce qui passe derrière obtiendrait
   * alors des valeurs mesurées composées sur un support qui n'est pas celui de
   * la mesure — c'est exactement le défaut corrigé dans `card.css` et
   * `backdrop.css`.
   */
  /*
   * ET LES DEUX BLOCS, PAS UN SEUL — c'est une correction venue de la sonde, non
   * de l'intuition. L'intuition dit que `forced-colors` est couvert par le
   * premier bloc, puisque Chromium est censé faire correspondre
   * `forced-colors: active` à `prefers-contrast: more`. Relevé par `matchMedia`
   * sous `Emulation.setEmulatedMedia` avec la seule caractéristique
   * `forced-colors: active` : `prefers-contrast: more` vaut FALSE, et
   * `prefers-reduced-transparency` aussi. Sous le seul mode contraste élevé, le
   * premier bloc ne s'applique donc pas du tout, et sans le second les sept
   * filtres continueraient de flouter les bords de quelqu'un qui demande le
   * contraste maximal.
   */
  it.each([REDUCED, FORCED])('%s éteint les sept filtres, doublet -webkit- compris', (prelude) => {
    const flattening = RULES.filter(
      (rule) =>
        rule.declarations.get('backdrop-filter') === 'none' &&
        rule.conditions.some((condition) => condition.startsWith(prelude)),
    );

    expect(flattening, `\`${prelude}\` ne met aucun filtre à \`none\``).toHaveLength(1);
    expect(flattening[0].selectors).toEqual(scoped(BLURRED));
    expect(flattening[0].declarations.get('-webkit-backdrop-filter')).toBe('none');
  });

  /*
   * LES DEUX CONDITIONS, TOUJOURS. `prefers-reduced-transparency` est du
   * Chromium seul — Safari ne l'a pas, Firefox le tient derrière une préférence
   * désactivée. `prefers-contrast: more` est le seul levier universel de cette
   * famille, et c'est le défaut qui vient d'être corrigé dans `card.css` et
   * `backdrop.css` : ne pas le réintroduire ici.
   */
  it('énonce les deux conditions dans chaque requête d’aplatissement', () => {
    const preludes = [...new Set(RULES.flatMap((rule) => rule.conditions))].filter((prelude) =>
      prelude.includes('prefers-reduced-transparency'),
    );

    expect(preludes, 'aucune requête de transparence réduite dans glass.css').not.toHaveLength(0);

    for (const prelude of preludes) {
      expect(
        prelude,
        `« ${prelude} » n'énonce pas « prefers-contrast: more » — et ` +
          '`prefers-reduced-transparency` est du Chromium seul, donc un utilisateur Safari ' +
          'ou Firefox en contraste élevé n’obtiendrait aucun aplatissement.',
      ).toContain('prefers-contrast: more');
    }
  });

  /*
   * Les trois replis retirent le liseré, chacun pour SA raison : sans filtre il
   * n'y a pas de matériau et l'anneau devient un reflet posé sur rien ; sous les
   * deux préférences, un dégradé étalé sur 1,5 px adoucit une arête dont on
   * demande justement la netteté ; sous `forced-colors`, un `::before` masqué en
   * `exclude` voit sa peinture forcée réapparaître en opaque et recouvre le
   * contenu de l'élément.
   */
  it.each([ENGINE, REDUCED, FORCED])('%s retire les neuf liserés', (prelude) => {
    const removed = RULES.filter(
      (rule) =>
        rule.declarations.get('display') === 'none' &&
        rule.conditions.some((condition) => condition.startsWith(prelude)),
    );

    expect(removed, `\`${prelude}\` ne retire aucun liseré`).toHaveLength(1);
    expect(removed[0].selectors).toEqual(scoped(RIMMED, '::before'));
  });

  /*
   * L'ORDRE, ET C'EST LE PLUS FRAGILE DU FICHIER parce que rien ne le rappelle
   * à la lecture. Le bloc de jetons pèse (0,2,0) comme les deux blocs sombres de
   * `roles.css` ; la recette doit précéder ses propres replis ; et les
   * préférences DOIVENT fermer la feuille, sans quoi elles se feraient écraser à
   * spécificité égale par une recette déclarée après elles.
   */
  it('déclare jetons → recette → liseré → repli moteur → préférences', () => {
    const order = [
      [":root[data-material='glass']", 'le bloc de jetons'],
      ['backdrop-filter: blur(', 'la recette de matière'],
      ['::before', 'le liseré spéculaire'],
      [ENGINE, 'le repli moteur'],
      [REDUCED, 'la transparence réduite'],
      [FORCED, 'les couleurs forcées'],
    ] as const;

    const positions = order.map(([needle]) => positionOf(needle));

    for (let index = 1; index < positions.length; index += 1) {
      expect(
        positions[index],
        `${order[index][1]} est déclaré AVANT ${order[index - 1][1]} : ` +
          "l'ordre des sections est le contrat, et les préférences ferment la feuille.",
      ).toBeGreaterThan(positions[index - 1]);
    }
  });

  /*
   * L'INVARIANT D'IMPORT, et il ne vit pas dans la feuille :
   * `:root[data-material='glass']` pèse exactement le poids de
   * `:root[data-theme='dark']`. Chargée avant `tokens.css`, cette feuille
   * perdrait ses deux jetons EN THÈME SOMBRE SEULEMENT — invisible en clair, et
   * aucun test de jetons ne le verrait puisque les deux feuilles resteraient
   * valides.
   */
  it('est importée après tokens.css et ui.css, avant doc.css', () => {
    const at = (specifier: string): number => {
      const index = mainSource.indexOf(specifier);
      expect(index, `main.tsx n'importe pas \`${specifier}\``).toBeGreaterThan(-1);
      return index;
    };

    expect(at('./styles/glass.css')).toBeGreaterThan(at('./tokens/tokens.css'));
    expect(at('./styles/glass.css')).toBeGreaterThan(at('./styles/ui.css'));
    expect(at('./styles/doc.css')).toBeGreaterThan(at('./styles/glass.css'));
  });

  /*
   * `glass.css` est copiée dans `dist/` À PLAT par `build:css`, alors que les
   * jetons vont dans `dist/tokens/` : un `@import '../tokens/…'` sortirait du
   * paquet chez le consommateur. Le bloc de jetons est donc écrit DANS le
   * fichier, et cette règle-ci est ce qui l'y maintient.
   */
  it('ne contient aucun `@import` : dans dist/ l’arborescence est aplatie', () => {
    const offenders = [...css.matchAll(/@import[^;]*/g)].map((match) => match[0].trim());

    expect(offenders, `@import trouvés : ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('5. La couleur par le jeton, la matière par la feuille', () => {
  /*
   * LA FORME EXÉCUTABLE DE LA DISCIPLINE CENTRALE, et elle n'est pas
   * esthétique. Les règles d'état des composants pèsent jusqu'à (0,4,0) —
   * `.tc-btn--primary:not(:disabled):not([aria-disabled='true']):active` — là où
   * un `[data-material='glass'] .tc-btn--secondary:hover` ne pèse que (0,3,0) :
   * une feuille de matière qui repeint des fonds PERD sur le survol et sur
   * l'appui, c'est-à-dire là où l'utilisateur regarde. Elle devrait recopier les
   * `:not()` de chaque composant pour rester devant, et redeviendrait fausse au
   * premier état ajouté.
   *
   * Onze des treize surfaces de la librairie sont DÉJÀ translucides : ce qui
   * leur manque pour être du verre n'est pas une couleur, c'est un filtre, un
   * liseré et un contexte d'empilement. La feuille n'a donc aucune raison de
   * déclarer une couleur, et ce bloc est ce qui l'en empêche.
   */
  const FORBIDDEN = [
    'color',
    'background-color',
    'background-image',
    'border',
    'border-color',
    'border-block-color',
    'border-inline-color',
    'outline',
    'outline-color',
    'box-shadow',
    'text-decoration-color',
    'accent-color',
    'caret-color',
    'fill',
    'stroke',
  ] as const;

  it.each(FORBIDDEN)('ne déclare jamais `%s`', (property) => {
    const offenders = RULES.filter((rule) => rule.declarations.has(property)).map(
      (rule) => `${rule.selectors[0]} { ${property}: ${rule.declarations.get(property)} }`,
    );

    expect(
      offenders,
      `déclarations trouvées :\n  ${offenders.join('\n  ')}\n` +
        'La couleur passe par les deux jetons du § 1 ; cette feuille ne porte que des ' +
        'propriétés de matière, sans quoi elle perd contre les règles d’état des composants.',
    ).toEqual([]);
  });

  /*
   * `background` A UNE SEULE EXCEPTION NOMMÉE, et elle n'est pas une couleur :
   * `--glass-specular` est un `linear-gradient`, donc une IMAGE, et il n'est
   * déclaré que sur les `::before` du liseré — là où aucune feuille de composant
   * n'écrit quoi que ce soit (vérifié par grep : le seul `::before` de la
   * librairie est celui de `.tc-card--glass`, qui n'est pas ciblé ici). Un
   * `background` ailleurs, ou une autre valeur ici, est une couleur déguisée.
   */
  it('ne déclare `background` que pour le dégradé spéculaire du liseré', () => {
    const offenders = RULES.filter((rule) => rule.declarations.has('background'))
      .filter(
        (rule) =>
          rule.declarations.get('background') !== 'var(--glass-specular)' ||
          !rule.selectors.every((selector) => selector.endsWith('::before')),
      )
      .map((rule) => `${rule.selectors[0]} { background: ${rule.declarations.get('background')} }`);

    expect(
      offenders,
      `\`background\` hors du liseré :\n  ${offenders.join('\n  ')}\n` +
        'Seul `background: var(--glass-specular)` sur un `::before` est admis.',
    ).toEqual([]);
  });

  /*
   * ET AUCUNE COULEUR ÉCRITE EN CLAIR, sous aucune forme. `card.css` écrit
   * `linear-gradient(#000 0 0)` dans son masque de liseré et rien ne le voit —
   * le garde de `primitives.contract.test.ts` ne cherchait des hexadécimaux que
   * dans `roles.css` et `materials.css`. `glass.css` y est désormais inscrite,
   * et ce test-ci ferme les fonctions de couleur que l'hexadécimal laissait
   * passer. Le masque peint donc en `currentColor` : un masque ne lit que le
   * canal ALPHA, la teinte y est arbitraire, et une valeur arbitraire n'a aucune
   * raison d'être écrite en dur.
   */
  it('n’écrit aucune couleur littérale, hexadécimal ou fonction', () => {
    const offenders = [
      ...css.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/gi),
    ].map((match) => {
      const at = match.index ?? 0;
      return `${match[0]} — « …${css.slice(Math.max(0, at - 40), at + match[0].length)}… »`;
    });

    expect(offenders, `couleurs littérales trouvées :\n  ${offenders.join('\n  ')}`).toEqual([]);
  });

  /*
   * LE BLOC DE JETONS EST FERMÉ À DEUX ENTRÉES, et chaque autre rôle a sa raison
   * mesurée de rester dehors : `--surface` est le sol du modèle de mesure
   * (`contract/backdrop.ts` lève si la couche la plus basse est translucide) ;
   * `--accent` exige alpha ≥ 0,892 pour que le blanc tienne 4,5:1 ;
   * `--control-border` n'a que 0,18 de marge sur le plancher dur de WCAG
   * 1.4.11 ; `--status-*-surface` n'a que 0,13. `--border-subtle` et `--rule`
   * sont les deux seuls que `roles.css` déclare « décoratif seul », et passer
   * leur alpha de 0,138 à 0,25 ne peut que les faire GAGNER en contraste. C'est
   * la seule retouche de couleur du thème, et elle va dans le sens sûr.
   */
  it('ne remappe que `--border-subtle` et `--rule`, tous deux vers `--glass-border`', () => {
    const bodies = ruleBodies(css, ":root[data-material='glass']");

    expect(bodies, 'le bloc de jetons a disparu de la feuille').toHaveLength(1);

    expect([...parseCustomProperties(bodies[0])].sort()).toEqual([
      ['--border-subtle', 'var(--glass-border)'],
      ['--rule', 'var(--glass-border)'],
    ]);
  });
});
