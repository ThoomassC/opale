import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

/* =============================================================================
   LA PORTE D'ENTRÉE.

   Le site est une vitrine, pas l'archive : le raisonnement long vit dans les
   commentaires d'en-tête de `src/components/*.tsx`, dans `src/tokens/roles.css`
   et dans le `README.md`. Cette page ne garde que les faits, et le chapeau
   tient en deux phrases.

   Chaque affirmation chiffrée vient de `README.md`, de `src/index.ts` ou de
   `package.json`. Le compte des composants est celui des exports réels :
   DIX-SEPT fonctions exportées par l'entrée `.`, pour SEIZE entrées de
   catalogue, parce que `Timeline` et `TimelineItem` se documentent ensemble.
   ========================================================================== */

const INSTALL = `npm i "@thomascaron/opale@github:ThoomassC/opale#v1.2.0"`;

const IMPORTS = `// 1. Les jetons : la palette, les échelles, le focus, le mouvement.
import '@thomascaron/opale/tokens.css';
// 2. Les composants, une seule fois par application.
import '@thomascaron/opale/ui.css';

import { Button, Field, Input } from '@thomascaron/opale';

// L'entrée de développement, pour mesurer sa propre palette.
import { contrastRatio, parseThemes } from '@thomascaron/opale/contract';`;

export const introductionPage: DocPage = {
  slug: '',
  label: 'Présentation',
  group: 'introduction',
  title: 'Le socle commun',
  lede: (
    <>
      Le socle commun de <strong>portfolio</strong> et de <strong>travels_in_world</strong> : une
      palette teal et cuivre, huit pas d’espacement, huit pas typographiques et des composants sans
      état. Six jetons avaient divergé entre les deux sites ; cette librairie est ce qui les tient
      désormais ensemble.
    </>
  ),
  render: () => (
    <PageBody>
      <p className="tc-doc-prose">
        Rien ici n’est illustratif : les pages sont rendues dans la palette qu’elles documentent.
      </p>

      <Specimen title="Ce que la 1.0 publie">
        <ul className="tc-doc-checklist">
          <li>
            <strong>Seize entrées au catalogue, dix-sept composants exportés</strong> par l’entrée{' '}
            <code>.</code> — <code>Timeline</code> et <code>TimelineItem</code> se documentent
            ensemble.
          </li>
          <li>
            <strong>
              Aucun état React, aucun hook, aucun <code>&quot;use client&quot;</code>
            </strong>{' '}
            : tout état visuel est un sélecteur CSS, d’où l’import unique de <code>ui.css</code> par
            application.
          </li>
          <li>
            <strong>Aucun composant ne lève.</strong> <code>ChipList</code>, <code>Pill</code> et{' '}
            <code>TimelineItem</code> signalent par <code>console.error</code>, jamais par{' '}
            <code>throw</code> : un throw en rendu client démonte la racine React.
          </li>
          <li>
            <strong>Un contrat de couleur exécutable</strong>, recalculé en intégration continue :
            un ratio faux fait échouer la suite.
          </li>
          <li>
            <strong>Les quatre manquements AA sont publiés</strong>, chacun avec l’encre de
            remplacement qui tient au même endroit.
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
            <code>ui.css</code> ne déclare aucun jeton : chargée sans <code>tokens.css</code>, elle
            n’a que des <code>var()</code> sans valeur.
          </>
        }
      >
        <UsageBlock label="Imports minimaux" code={IMPORTS} />
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
            <a className="tc-doc-link" href={hrefFor('composants/button')}>
              Button
            </a>{' '}
            — où se lit la règle « un aplat plein est le monopole du teal ».
          </li>
          <li>
            <a className="tc-doc-link" href={hrefFor('accessibilite')}>
              Le contrat d’accessibilité
            </a>{' '}
            — focus, couleur, taille de cible.
          </li>
          <li>
            <a className="tc-doc-link" href={hrefFor('compositions/verre-et-frise')}>
              Verre et frise
            </a>{' '}
            — ce qui ne se juge qu’assemblé : jsdom ne peint pas, cette page est le seul garde du
            rendu du verre.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
