import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

/* =============================================================================
   LA PORTE D'ENTRÉE, RÉÉCRITE POUR LA 2.0.

   CE QUE CETTE PAGE DISAIT ET QUI EST DEVENU FAUX : « seize entrées au
   catalogue, dix-sept composants exportés », « aucun état React, aucun hook,
   aucun "use client" », « l'import unique de ui.css par application », « aucun
   composant ne lève », « les quatre manquements AA sont publiés ». Chacune de
   ces phrases décrivait les dix-huit composants d'Opale, que la 2.0 supprime.
   Aucune ne s'applique aux quatorze composants qui les remplacent : ils
   tiennent de l'état, appellent des hooks, exigent donc `"use client"` en App
   Router, et aucun de leurs ratios de contraste n'a été mesuré.

   D'OÙ LA FORME DE CETTE PAGE : deux spécimens symétriques, « ce que la 2.0
   garantit » et « ce qu'elle ne garantit pas ». Le second n'est pas une
   précaution rédactionnelle, c'est la moitié la plus utile de la page — un
   lecteur qui installe ce paquet en croyant y trouver la librairie de la 1.0
   se tromperait sur les quatre points qui y sont listés.

   Chaque affirmation chiffrée vient de `package.json`, de `src/magic/index.ts`,
   de `src/magic/README.md` ou de `THIRD-PARTY-NOTICES.md` — jamais d'un
   souvenir de la version précédente.
   ========================================================================== */

const INSTALL = `npm i "@thomascaron/opale@github:ThoomassC/opale#v2.0.0"`;

/* LES TROIS LIGNES D'INSTALLATION, ET ELLES SUIVENT `exports` AU MOT.
   `package.json` déclare quatre entrées : `.` vers `dist/magic/index.js`,
   `./contract`, `./tokens.css` et `./opale.css` vers `dist/magic/magic.css`.
   La 1.0 en publiait cinq de plus — `ui.css`, `glass.css`, `lens.css`,
   `magic.css` et `./magic` — qui n'existent plus. Un spécimen qui les citerait
   encore ferait échouer l'installation d'un lecteur, pas seulement sa lecture. */
const IMPORTS = `// 1. Les jetons : la palette, les échelles, le focus, le mouvement.
import '@thomascaron/opale/tokens.css';
// 2. La feuille des composants, une seule fois par application.
import '@thomascaron/opale/opale.css';

import { Button, Glass } from '@thomascaron/opale';

// L'entrée de développement, pour mesurer sa propre palette.
import { contrastRatio, parseThemes } from '@thomascaron/opale/contract';`;

export const introductionPage: DocPage = {
  slug: '',
  label: 'Présentation',
  group: 'introduction',
  title: 'Le socle commun',
  lede: (
    <>
      Une <strong>charte graphique mesurée</strong> — palette teal et cuivre, huit pas d’espacement,
      huit pas typographiques — accompagnée d’un <strong>contrat de couleur exécutable</strong> qui
      recalcule ses propres ratios à chaque exécution de la suite. Et, depuis la 2.0, quatorze
      composants <strong>verre liquide vendorés</strong> qui ne consomment rien de cette charte.
    </>
  ),
  render: () => (
    <PageBody>
      <p className="tc-doc-prose">
        Rien ici n’est illustratif : les pages sont rendues dans la palette qu’elles documentent.
      </p>

      <Specimen
        title="Ce que la 2.0 garantit"
        note={
          <>
            Ces quatre points portent sur <code>src/tokens/**</code> et <code>src/contract/**</code>{' '}
            — la charte. Ils ne portent pas sur les composants.
          </>
        }
      >
        <ul className="tc-doc-checklist">
          <li>
            <strong>Un contrat de couleur exécutable</strong>, recalculé en intégration continue à
            partir de la feuille de jetons : un ratio faux fait échouer la suite. Ce ne sont pas des
            annotations, c’est du code qui lit le CSS et refait l’arithmétique OKLab.
          </li>
          <li>
            <strong>La palette et les échelles, inchangées</strong> depuis la 1.0 — deux encres,
            leurs ratios mesurés, et{' '}
            <a className="tc-doc-link" href={hrefFor('palette')}>
              les quatre manquements AA publiés
            </a>{' '}
            avec l’encre de remplacement qui tient au même endroit.
          </li>
          <li>
            <strong>Le double anneau de focus, porté par les jetons</strong> et non par un composant
            : <code>tokens.css</code> déclare une règle universelle <code>:focus-visible</code>,
            donc n’importe quel élément focusable de la page en hérite — y compris les quatorze
            composants vendorés, qui n’en savent rien.
          </li>
          <li>
            <strong>Zéro requête hors origine.</strong> Pas de police distante, pas de{' '}
            <code>@font-face</code>, pas même un <code>preconnect</code> — y compris dans la feuille
            des composants, dont l’<code>@import</code> Google Fonts d’origine a été retiré.
          </li>
        </ul>
      </Specimen>

      <Specimen
        title="Ce que la 2.0 ne garantit pas"
        note={
          <>
            Les quatorze composants sont du code <strong>vendoré</strong>, gardé fidèle au caractère
            : leurs défauts sont documentés, pas corrigés.
          </>
        }
      >
        <ul className="tc-doc-checklist">
          <li>
            <strong>Aucun ratio de contraste n’est mesuré sur un composant.</strong> Le contrat
            porte sur les jetons de la charte ; les composants n’en emploient aucun. Leurs couleurs
            sont des blancs semi-transparents et cinq dégradés de variante, et rien ne les vérifie.
          </li>
          <li>
            <strong>
              Les libellés sont peints en <code>#ffffff</code> en dur.
            </strong>{' '}
            Sur un fond clair, un libellé blanc vaut 1,00:1 — il disparaît. C’est pourquoi toutes
            les scènes de cette vitrine sont sombres, plancher mesuré 13,22:1, et pourquoi ces
            composants exigent un fond sombre chez leurs consommateurs aussi.
          </li>
          <li>
            <strong>
              Ils tiennent de l’état et appellent des hooks : <code>&quot;use client&quot;</code>{' '}
              est obligatoire
            </strong>{' '}
            en App Router. La 1.0 promettait l’inverse — dix-huit composants sans état, rendus comme
            Server Components, à coût nul pour le budget JavaScript d’un consommateur. Cette
            promesse est retirée.
          </li>
          <li>
            <strong>La garantie d’accessibilité d’Opale ne les couvre pas.</strong> Trois défauts
            sont vérifiés et volontairement conservés — voir{' '}
            <a className="tc-doc-link" href={hrefFor('composants/badge')}>
              Badge
            </a>{' '}
            (la pilule n’existe pas),{' '}
            <a className="tc-doc-link" href={hrefFor('composants/checkbox')}>
              Checkbox
            </a>{' '}
            (état coché non annoncé, libellé non cliquable au clavier) et{' '}
            <a className="tc-doc-link" href={hrefFor('composants/glass')}>
              Glass
            </a>{' '}
            (identifiant de filtre dupliqué). Chaque page nomme les siens.
          </li>
        </ul>
      </Specimen>

      <Specimen
        title="Installation"
        note={
          <>
            Le paquet <strong>n’est pas publié sur npm</strong> : il s’installe depuis son dépôt et
            se compile par le script <code>prepare</code>.
          </>
        }
      >
        <UsageBlock label="Installation du paquet" code={INSTALL} />
      </Specimen>

      <Specimen
        title="Les deux feuilles, dans cet ordre"
        note={
          <>
            <code>opale.css</code> ne déclare aucun jeton de la charte : chargée sans{' '}
            <code>tokens.css</code>, elle perd le <code>box-sizing</code> et l’anneau de focus que
            les composants n’apportent pas eux-mêmes.
          </>
        }
      >
        <UsageBlock label="Imports minimaux" code={IMPORTS} />
      </Specimen>

      <Specimen title="La provenance des composants">
        <p className="tc-doc-prose">
          Les quatorze composants sont copiés de{' '}
          <a
            className="tc-doc-link"
            href="https://github.com/tweeedlex/react-magic-ui"
            rel="noreferrer noopener"
          >
            react-magic-ui
          </a>{' '}
          de <code>@tweeedlex</code> — licence MIT, Copyright (c) 2025 tweeedlex, reproduite dans{' '}
          <code>THIRD-PARTY-NOTICES.md</code>. Ils sont gardés <strong>fidèles au caractère</strong>{' '}
          : les corriger ici ferait diverger la copie de son amont et rendrait toute mise à jour
          illisible. Ce qui se corrige se corrige chez eux ; ce qui ne l’est pas encore est écrit
          sur la page du composant concerné.
        </p>
      </Specimen>

      <Specimen title="Où aller ensuite">
        <ul className="tc-doc-checklist">
          <li>
            <a className="tc-doc-link" href={hrefFor('palette')}>
              La palette
            </a>{' '}
            — les deux encres, leurs ratios mesurés et les quatre manquements AA.
          </li>
          <li>
            <a className="tc-doc-link" href={hrefFor('accessibilite')}>
              Le contrat d’accessibilité
            </a>{' '}
            — ce que les jetons tiennent, et ce qui n’est plus tenu par aucun composant.
          </li>
          <li>
            <a className="tc-doc-link" href={hrefFor('composants/glass')}>
              Glass
            </a>{' '}
            — l’enveloppe dont les treize autres composants héritent : c’est par elle qu’on comprend
            leurs signatures.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
