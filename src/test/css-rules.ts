/* =============================================================================
   LIRE UNE FEUILLE CSS EN TEXTE, SANS MENTIR SUR LE CONTEXTE.

   POURQUOI CE FICHIER EXISTE. Trois tests de structure lisaient `doc.css` avec
   la même expression rationnelle, `/([^{}]+)\{([^}]*)\}/g`, et elle est fausse :
   `[^}]*` n'exclut pas `{`, donc la PREMIÈRE correspondance d'un bloc `@media`
   avale le prélude de l'at-rule ET la règle imbriquée entière. Mesuré sur la
   feuille telle qu'elle est :

     ruleBody('@media (min-width: 60rem)')
       -> '\n  .tc-doc-body {\n    grid-template-columns: calc(…) minmax(0, 1fr);\n  '

   Une at-rule était donc lue comme une règle, et le sélecteur qui ouvre un bloc
   `@media` était INATTEIGNABLE — `ruleBody('.tc-doc-body')` rendait la règle de
   base, pas celle du bloc. Les règles suivantes du bloc se réalignaient par
   chance, le `}` de fermeture de l'at-rule étant sauté : c'est la seule raison
   pour laquelle les gardes existants passaient.

   La fragilité était démontrable : échanger l'ordre de deux règles dans un bloc
   `@media` — CSS strictement équivalente — faisait rougir un garde sans qu'un
   seul octet de comportement ait changé.

   CE QUE CE MODULE AJOUTE, ET QUI EST L'ESSENTIEL : un garde peut désormais
   exiger le CONTEXTE d'une règle et pas seulement son existence. Une règle
   sortie de son `@media` est un défaut réel — mesuré, sortir les deux règles du
   pli du sommaire de leur bloc 60 rem passe la page en deux colonnes de 139,5
   et 235,5 px sur un téléphone — et aucun garde ne pouvait le voir.

   IL VIT DANS `src/test/`, ET C'EST DÉLIBÉRÉ : `tsconfig.lib.json` exclut ce
   dossier, donc ce module n'entre pas dans le paquet publié. Un fichier nommé
   « quelque-chose.test-helper.ts » posé dans `src/styles/` y serait entré : le
   motif d'exclusion ne vise que les fichiers dont le nom finit par
   « .test.ts », ce qu'un suffixe « -helper » ne satisfait pas.

   (Le motif lui-même n'est pas recopié ici : il contient une étoile suivie
   d'une barre oblique, qui FERME un commentaire de bloc. C'est ce qui vient
   d'arriver à ce fichier — tout ce qui suivait est devenu du code, et le
   compilateur a signalé « template literal non terminé » quarante lignes plus
   loin. Le même piège s'était déjà refermé sur l'en-tête de `lens.css`.)
   ========================================================================== */

/** Une règle CSS, avec la pile d'at-rules qui la contient. */
export interface CssRule {
  /** Le prélude, tel qu'écrit, espaces en tête et en queue retirés. */
  readonly prelude: string;
  /** Les sélecteurs du prélude, découpés sur la virgule. */
  readonly selectors: readonly string[];
  /** Le corps de la règle, déclarations brutes. */
  readonly body: string;
  /**
   * Les préludes des at-rules qui l'entourent, du plus extérieur au plus
   * intérieur. Vide pour une règle de premier niveau.
   */
  readonly context: readonly string[];
}

/** Retire les commentaires : un sélecteur cité en prose n'est pas une règle. */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Toutes les règles d'une feuille, avec leur contexte d'at-rules.
 *
 * BALAYAGE À ACCOLADES ÉQUILIBRÉES et non expression rationnelle : c'est la
 * seule façon de distinguer un bloc qui contient des déclarations d'un bloc qui
 * contient des règles. Une at-rule est reconnue à son `@` — `@media`,
 * `@supports`, `@layer`, `@container` — et son contenu est parcouru
 * récursivement plutôt que traité comme un corps.
 *
 * Ce qui n'est PAS géré, et qui n'a pas à l'être ici : le CSS imbriqué (une
 * règle dans une règle). Aucune feuille du dépôt n'en contient — vérifié par le
 * test de ce module, qui échouerait si une règle apparaissait dans un corps.
 */
export function parseRules(source: string): readonly CssRule[] {
  const clean = stripComments(source);
  const rules: CssRule[] = [];

  function walk(text: string, offset: number, context: readonly string[]): void {
    let index = offset;
    let preludeStart = offset;

    while (index < text.length) {
      const char = text[index];

      if (char === '}') {
        /* Fin du bloc courant : c'est à l'appelant de continuer. */
        return;
      }

      if (char !== '{') {
        index += 1;
        continue;
      }

      const prelude = text.slice(preludeStart, index).trim();

      /* La borne du bloc, par comptage. `depth` part à 1 sur l'accolade
         ouvrante que l'on vient de lire. */
      let depth = 1;
      let scan = index + 1;
      while (scan < text.length && depth > 0) {
        if (text[scan] === '{') depth += 1;
        else if (text[scan] === '}') depth -= 1;
        scan += 1;
      }
      const bodyEnd = depth === 0 ? scan - 1 : text.length;
      const body = text.slice(index + 1, bodyEnd);

      if (prelude.startsWith('@') && /[{]/.test(body)) {
        /* Une at-rule qui contient des règles : on descend. */
        walk(body, 0, [...context, prelude]);
      } else {
        rules.push({
          prelude,
          selectors: prelude.split(',').map((part) => part.trim()),
          body,
          context,
        });
      }

      index = bodyEnd + 1;
      preludeStart = index;
    }
  }

  walk(clean, 0, []);
  return rules;
}

/** Ce qu'un garde peut exiger d'une règle en plus de son sélecteur. */
export interface RuleQuery {
  /**
   * Le prélude d'une at-rule qui DOIT entourer la règle, comparé sur le texte
   * normalisé (espaces réduits). C'est la moitié qui manquait : une règle sortie
   * de son `@media` reste une règle, et son absence de contexte est un défaut.
   */
  readonly within?: string;
}

/**
 * Normalise un prélude pour la comparaison : TOUT espace retiré, minuscules.
 *
 * Réduire les suites d'espaces à un seul ne suffisait pas, et le test l'a
 * montré : `@media (min-width:60rem)` et `@media (min-width: 60rem)` sont la
 * même at-rule, mais elles diffèrent par un espace APRÈS LE DEUX-POINTS — que
 * `\s+ -> ' '` ne peut pas inventer. Un garde qui exige un contexte ne doit pas
 * dépendre de la façon dont la feuille est formatée, ni de ce que `prettier`
 * décidera l'an prochain.
 *
 * Le risque de retirer tout espace serait de confondre deux at-rules
 * différentes ; il n'existe pas ici, les deux côtés de la comparaison passant
 * par la même normalisation.
 */
function normalizePrelude(prelude: string): string {
  return prelude.replace(/\s+/g, '').toLowerCase();
}

/**
 * Le corps de la première règle dont les sélecteurs contiennent EXACTEMENT
 * `selector`, ou `null`.
 *
 * Correspondance exacte et non `includes` : `.tc-doc-nav__all` est un préfixe de
 * `.tc-doc-nav__alltitle`, et `.tc-doc-search__list` apparaît dans
 * `.tc-doc-search__option` par préfixe de nom. Un `includes` lirait le corps de
 * la mauvaise règle et le garde passerait pour une raison fausse.
 */
export function ruleBody(source: string, selector: string, query: RuleQuery = {}): string | null {
  const wanted = query.within === undefined ? undefined : normalizePrelude(query.within);

  for (const rule of parseRules(source)) {
    if (!rule.selectors.includes(selector)) continue;
    if (wanted === undefined) return rule.body;
    if (rule.context.some((prelude) => normalizePrelude(prelude) === wanted)) return rule.body;
  }

  return null;
}
