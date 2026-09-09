import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

/* =============================================================================
   LA PORTE D'ENTRÉE.

   Le chapeau de cette page est celui de l'ancienne page de charte, repris :
   c'est la meilleure prose du projet, et elle dit en cinq lignes pourquoi le
   dépôt existe — le socle commun de deux sites, la palette teal et cuivre, les
   échelles, les composants sans état, et les six jetons qui avaient
   discrètement divergé. Rien de ce qui suit n'a besoin d'être plus enthousiaste
   que ça.

   Chaque affirmation chiffrée vient de `README.md`, de `src/index.ts` ou de
   `package.json`. Le compte des composants est celui des exports réels :
   DIX-SEPT fonctions exportées par l'entrée `.`, pour SEIZE entrées de
   catalogue, parce que `Timeline` et `TimelineItem` se documentent ensemble.
   ========================================================================== */

const INSTALL = `npm i "@thomascaron/ui@github:ThoomassC/ui-commune#v1.0.0"`;

const IMPORTS = `// 1. Les jetons : la palette, les échelles, le focus, le mouvement.
import '@thomascaron/ui/tokens.css';
// 2. Les composants, une seule fois par application.
import '@thomascaron/ui/ui.css';

import { Button, Field, Input } from '@thomascaron/ui';

// L'entrée de développement, pour mesurer sa propre palette.
import { contrastRatio, parseThemes } from '@thomascaron/ui/contract';`;

export const introductionPage: DocPage = {
  slug: '',
  label: 'Présentation',
  group: 'introduction',
  title: 'Le socle commun',
  lede: (
    <>
      Le socle commun de <strong>portfolio</strong> et de <strong>travels_in_world</strong> : une
      palette teal et cuivre, huit pas d’espacement, huit pas typographiques et un jeu de composants
      sans état — dont sept sont arrivés d’un coup avec le verre liquide du portfolio. Les deux
      sites en partageaient déjà l’intention — et six jetons avaient discrètement divergé. Cette
      librairie est ce qui les tient désormais ensemble, et ce site en est le contrat lisible.
    </>
  ),
  render: () => (
    <PageBody>
      <p className="tc-doc-prose">
        Rien ici n’est illustratif : chaque couleur, chaque taille et chaque état provient de la
        feuille de jetons réelle. Les pages sont rendues dans la palette qu’elles documentent — le
        document est une instance de lui-même. Si une règle est fausse, le site se dégrade avec
        elle.
      </p>

      <p className="tc-doc-prose tc-doc-aside">
        Le dépôt existe parce qu’un commentaire n’est pas un garde.{' '}
        <code>travels_in_world/src/styles/tokens.css</code> affirmait que sa palette était «
        délibérément identique à celle du portfolio, pour que les deux sites se lisent comme des
        frères », et demandait que tout changement de couleur y soit répercuté. Six jetons sur six
        avaient divergé, plus les deux fonds sombres, et aucun outil n’a rien dit.
      </p>

      <Specimen
        title="Ce que la 1.0 publie"
        note={
          <>
            Trois choses, dans cet ordre de valeur : un contrat de couleur exécutable, la feuille de
            jetons canonique, et des composants qui ne coûtent rien au budget JavaScript de leurs
            hôtes.
          </>
        }
      >
        <ul className="tc-doc-checklist">
          <li>
            <strong>Seize entrées au catalogue, dix-sept composants exportés</strong> par l’entrée{' '}
            <code>.</code> — <code>Timeline</code> et <code>TimelineItem</code> se documentent
            ensemble, puisque ni l’un ni l’autre ne s’emploie seul.
          </li>
          <li>
            <strong>
              Aucun état React, aucun hook, aucun <code>&quot;use client&quot;</code>.
            </strong>{' '}
            Ils se rendent tels quels en Server Components. Tout état visuel — survol, appui, focus,
            invalide, attente, désactivation — est porté par un sélecteur CSS, ce qui est aussi la
            raison pour laquelle <code>ui.css</code> doit être importé une fois par application.
          </li>
          <li>
            <strong>Aucun des composants ne lève.</strong> Trois décident quelque chose au rendu
            sans frontière client : <code>ChipList</code> rend <code>null</code> sur une liste vide,{' '}
            <code>Pill</code> se replie sur le nom de son ton quand ses enfants ne portent aucun
            libellé lisible, et <code>TimelineItem</code> signale un titre écrit à un autre niveau
            que celui qu’il déclare. Les trois le disent par <code>console.error</code> : un{' '}
            <code>throw</code> en rendu client démonte la racine React, donc une page blanche pour
            tous à cause d’une pastille.
          </li>
          <li>
            <strong>Un contrat de couleur exécutable</strong>, recalculé en intégration continue :
            il lit la feuille de jetons comme du texte, reconstruit ses trois thèmes, recompose les
            couches alpha et recalcule chaque ratio que les commentaires annoncent. Un chiffre faux
            fait échouer la suite le jour où il est écrit — ce ne sont pas des annotations.
          </li>
          <li>
            <strong>Les quatre manquements AA sont publiés</strong>, pas contournés, et chacun porte
            l’encre de remplacement qui tient au même endroit. Une charte qui ne contient que des
            succès est une charte qu’on n’a pas éprouvée.
          </li>
        </ul>
      </Specimen>

      <Specimen
        title="Installation"
        note={
          <>
            Le paquet <strong>n’est pas publié sur npm</strong> et n’a pas vocation à l’être tant
            que deux projets suffisent : il s’installe depuis son dépôt, et se compile à
            l’installation par le script <code>prepare</code>.
          </>
        }
      >
        <UsageBlock label="Installation du paquet" code={INSTALL} />
        <p className="tc-doc-prose tc-doc-aside">
          Point de vigilance en déploiement : si l’hôte n’exécute pas <code>prepare</code> (cache
          npm, image de build minimale), <code>dist/</code> sera absent et le build cassera en
          production sans avoir cassé en local. À vérifier par un déploiement de préversion.
        </p>
      </Specimen>

      <Specimen
        title="Les deux feuilles, dans cet ordre"
        note={
          <>
            <strong>L’ordre n’est pas cosmétique.</strong> <code>tokens.css</code> déclare tout ce
            que <code>ui.css</code> consomme — les jetons, le sol, l’encre, la police et le double
            anneau de focus — et <code>ui.css</code> ne déclare aucun jeton : chargée seule, la
            feuille de composants n’a que des <code>var()</code> sans valeur. À l’autre bout,{' '}
            <code>ui.css</code> se termine sur <code>preferences.css</code>, dont les deux{' '}
            <code>@media</code> — <code>prefers-reduced-motion</code> et <code>forced-colors</code>{' '}
            — redessinent tous les composants au-dessus à spécificité égale. C’est le dernier mot de
            la librairie, et il doit rester le dernier.
          </>
        }
      >
        <UsageBlock label="Imports minimaux" code={IMPORTS} />
      </Specimen>

      <Specimen
        title="Où aller ensuite"
        note="Les fondations d’abord si vous venez consommer la librairie ; le catalogue si vous cherchez une signature ; les compositions si vous venez juger le rendu."
      >
        <ul className="tc-doc-checklist">
          <li>
            <a className="tc-doc-link" href={hrefFor('palette')}>
              La palette
            </a>{' '}
            — les deux encres, leurs ratios mesurés, et les quatre manquements AA avec leur pire
            support.
          </li>
          <li>
            <a className="tc-doc-link" href={hrefFor('composants/button')}>
              Button
            </a>{' '}
            — la première entrée du catalogue, et celle où se lit le mieux la règle « un aplat plein
            est le monopole du teal » : l’action destructrice est un bouton à liseré.
          </li>
          <li>
            <a className="tc-doc-link" href={hrefFor('accessibilite')}>
              Le contrat d’accessibilité
            </a>{' '}
            — le double anneau de focus, la couleur qui n’est jamais seule porteuse de sens, et la
            taille de cible.
          </li>
          <li>
            <a className="tc-doc-link" href={hrefFor('compositions/verre-et-frise')}>
              Verre et frise
            </a>{' '}
            — ce qui ne se juge qu’assemblé. Il n’y a aucun harnais navigateur dans ce dépôt : jsdom
            ne peint pas, et le rendu du verre n’a donc pas d’autre garde que cette page.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
