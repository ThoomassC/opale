import type { ReactElement } from 'react';
import { Backdrop } from '../../../components/backdrop';
import { Card } from '../../../components/card';
import { ChipList } from '../../../components/chip-list';
import { DateRange } from '../../../components/date-range';
import { IconTile } from '../../../components/icon-tile';
import { Timeline, TimelineItem } from '../../../components/timeline';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, UsageBlock } from '../api';

/* =============================================================================
   CE QUI NE SE JUGE QU'ASSEMBLÉ.

   Les pages de composants documentent des jetons, des types et des états ;
   celle-ci existe pour une raison différente. Le verre liquide, les halos et la
   tuile d'icône sont des MATÉRIAUX : leur contrat est mesuré par
   `src/contract/`, mais aucune mesure ne dit s'ils se composent bien.
   `glass.structure.test.ts` garde la FORME des règles, jsdom ne peint pas, et
   il n'y a pas de Playwright dans ce dépôt — donc cette page est le seul
   endroit du projet où l'on constate le rendu.

   Elle sert aussi de contre-épreuve à une décision : les disques du `Backdrop`
   sont posés à `z-index: -1` là où le portfolio les met à `0`, parce qu'à `0`
   un disque se peint au-dessus de tout enfant NON positionné. La `Card` en
   variante `flat` ci-dessous est exactement ce cas — c'est pour elle que la
   divergence existe, et c'est ici qu'on la vérifie à l'œil.

   Pas de `PropsTable` sur cette page : aucune des trois scènes ne documente un
   composant, elles documentent un ASSEMBLAGE. Les interfaces sont sur les pages
   des composants, qui sont liées depuis ici.

   À savoir avant de comparer les deux scènes : les disques du décor sont
   positionnés en POURCENTAGE de la boîte de l'hôte, donc une scène plus haute
   les répartit autrement. Les deux images ne sont pas deux photographies du
   même décor — seule la composition de l'entrée s'y compare.
   ========================================================================== */

const USAGE = `import { Backdrop, IconTile, Timeline, TimelineItem } from '@thomascaron/opale';

// La composition du portfolio, mot pour mot : l'entrée de frise EST une carte
// de verre, et le matériau arrive par la classe — jamais par une prop.
<Backdrop>
  <Timeline label="Expériences professionnelles">
    <TimelineItem className="tc-card tc-card--glass" level={3} icon={<IconTile>…</IconTile>}>
      …
    </TimelineItem>
  </Timeline>
</Backdrop>`;

interface ProjectCard {
  readonly title: string;
  readonly meta: string;
  readonly text: string;
}

/** Les trois cartes de verre. Contenu réel : ce sont les trois dépôts servis. */
const GLASS_CARDS: readonly ProjectCard[] = [
  {
    title: 'travels_in_world',
    meta: 'Next.js 16 · contenu en fichiers',
    text: 'Carte SVG rendue côté serveur, frise par étapes, aucun appel hors origine. Premier consommateur de cette librairie.',
  },
  {
    title: '@thomascaron/opale',
    meta: 'la librairie que documente ce site',
    text: 'Jetons mesurés, contrat de couleur exécutable, composants sans état — rendables tels quels en Server Components.',
  },
  {
    title: 'portfolio',
    meta: 'Vite · React 19 · CSS à jetons',
    text: 'La source de cette palette : verre liquide, halos, tuiles d’icône et pastilles d’avancement en viennent tous.',
  },
];

interface EntryData {
  readonly glyph: string;
  readonly start: { readonly dateTime: string; readonly label: string };
  readonly end?: { readonly dateTime: string; readonly label: string };
  readonly title: string;
  readonly meta: string;
  readonly text: string;
  readonly chipsLabel: string;
  readonly chips: readonly string[];
}

/**
 * Les deux entrées de frise, SORTIES DU JSX POUR ÊTRE RENDUES DEUX FOIS.
 *
 * Les deux spécimens de frise qui suivent servent le même contenu, et c'est
 * tout leur intérêt : le premier sans matériau, le second empilé sur la carte
 * de verre comme le portfolio le fait. Ce qui diffère entre les deux images est
 * alors nécessairement le matériau, et rien d'autre.
 */
const ENTRIES: readonly EntryData[] = [
  {
    glyph: '◆',
    start: { dateTime: '2023-09', label: 'Septembre 2023' },
    title: 'Ingénieur logiciel',
    meta: 'Blue Soft — Lille',
    text: 'Applications métier en TypeScript, de la modélisation PostgreSQL au rendu serveur. Mise en place du socle de tests et de la chaîne de déploiement.',
    chipsLabel: 'Technologies employées chez Blue Soft',
    chips: ['TypeScript', 'Next.js', 'PostgreSQL', 'Terraform'],
  },
  {
    glyph: '◇',
    start: { dateTime: '2022-09', label: 'Septembre 2022' },
    end: { dateTime: '2023-08', label: 'Août 2023' },
    title: 'Alternance — développement back',
    meta: 'CESI — projet BricoLoc',
    text: 'Dix micro-services de location d’outils entre voisins : découpage par domaine, messagerie asynchrone, conteneurisation de bout en bout.',
    chipsLabel: 'Technologies du projet BricoLoc',
    chips: ['Node.js', 'Docker', 'RabbitMQ', 'Vitest'],
  },
];

/**
 * Une entrée de frise. `className` porte le matériau, ou rien du tout.
 *
 * Une fonction et non un composant local : une page de doc n'exporte que sa
 * constante `DocPage`, et un composant défini ici sans être exporté ferait
 * perdre le rafraîchissement à chaud du module entier.
 */
function renderEntry(entry: EntryData, className?: string): ReactElement {
  return (
    <TimelineItem
      key={entry.title}
      className={className}
      // Le titre de l'entrée est un `<h3>` : le spécimen porte un `<h2>`, donc
      // c'est le niveau juste — et il est DÉCLARÉ, sans quoi la feuille ne le
      // stylerait pas et le composant le signalerait en console.
      level={3}
      icon={
        <IconTile>
          <span>{entry.glyph}</span>
        </IconTile>
      }
    >
      <DateRange start={entry.start} end={entry.end} />
      <h3>{entry.title}</h3>
      <p className="tc-timeline__meta">{entry.meta}</p>
      <p>{entry.text}</p>
      <ChipList label={entry.chipsLabel} items={entry.chips} />
    </TimelineItem>
  );
}

export const verreEtFrisePage: DocPage = {
  slug: 'compositions/verre-et-frise',
  label: 'Verre et frise',
  group: 'compositions',
  title: 'Le verre, la frise, et ce qui ne se juge qu’assemblé',
  lede: (
    <>
      Les pages de composants les <em>mesurent</em> ; celle-ci les <em>rend</em>, parce qu’un
      matériau translucide ne se juge pas sur un tableau de ratios. jsdom ne peint pas et il n’y a
      aucun harnais navigateur dans ce dépôt :{' '}
      <strong>cette page est le seul garde qui reste</strong>, et il est humain.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="La composition du portfolio" code={USAGE} />

      <Specimen
        title="Le verre sur son décor — et l’aplat juste à côté"
        note="Trois cartes de verre et une carte opaque dans le MÊME Backdrop : l’intérieur de la carte opaque doit rester net, sans voile coloré au travers."
      >
        <Backdrop className="tc-doc-scene">
          <div className="tc-doc-scene__grid">
            {GLASS_CARDS.map((project) => (
              <Card key={project.title}>
                <h3 className="tc-doc-cardtitle">{project.title}</h3>
                <p className="tc-doc-cardmeta">{project.meta}</p>
                <p className="tc-doc-cardtext">{project.text}</p>
              </Card>
            ))}

            {/* La carte qui a fait bouger le décor. `flat` ne pose ni
                `position` ni `isolation` : à `z-index: 0`, les disques du
                Backdrop se peignaient PAR-DESSUS ce texte, sur un fond
                pourtant opaque. Si vous le lisez sans voile coloré au
                travers, la mesure tient. */}
            <Card variant="flat" elevation={1}>
              <h3 className="tc-doc-cardtitle">Aplat opaque</h3>
              <p className="tc-doc-cardmeta">variant=&quot;flat&quot; · elevation=1</p>
              <p className="tc-doc-cardtext">
                Même carte, matériau opaque. Elle ne porte ni <code>position</code> ni{' '}
                <code>isolation</code> : c’est elle que les halos recouvraient à{' '}
                <code>z-index: 0</code>.
              </p>
            </Card>
          </div>
        </Backdrop>
      </Specimen>

      <Specimen
        title="La frise — l’entrée NUE, sans matériau"
        note="C’est cet état-là qu’il faut regarder pour juger le RYTHME : date, titre et ligne de lieu doivent former un seul bloc serré, puis le texte se détacher."
      >
        <Timeline label="Expériences professionnelles, entrées nues">
          {ENTRIES.map((entry) => renderEntry(entry))}
        </Timeline>
      </Specimen>

      {/* LE SPÉCIMEN QUI MANQUAIT, et c'était le plus important de la série.
          Chez le portfolio, `.timeline-item` est aussi un `liquid-card` : la
          composition documentée par `TimelineItem` — empiler
          `tc-card tc-card--glass` par `className` — n'était rendue nulle part,
          et c'est précisément celle dont trois choses ne peuvent se vérifier
          qu'à l'écran :
            — que la grille de l'entrée l'emporte sur le `display: block` de la
              carte, sans quoi tuile et texte s'empilent ;
            — que les deux `padding` déclarés valent bien la même chose, sans
              quoi le coussin dépend de l'ordre d'import ;
            — que les deux pseudo-éléments du verre ne prennent PAS de cellule
              de grille, sans quoi la tuile se décale d'une colonne.
          Le même contenu que ci-dessus, exprès : ce qui change d'une image à
          l'autre est le matériau, et rien d'autre. */}
      <Specimen
        title="La même frise, empilée sur le verre — la composition du portfolio"
        note="La géométrie de l’entrée doit survivre au matériau de la carte : la tuile doit rester dans sa colonne, le coussin valoir 24 px des deux côtés, et les deux pseudo-éléments du verre ne prendre aucune cellule de la grille."
      >
        <Backdrop className="tc-doc-scene">
          <div className="tc-doc-scene__stack">
            <Timeline label="Expériences professionnelles, sur carte de verre">
              {ENTRIES.map((entry) => renderEntry(entry, 'tc-card tc-card--glass'))}
            </Timeline>
          </div>
        </Backdrop>
      </Specimen>

      <p className="tc-doc-prose">
        Les interfaces sont sur les pages des composants —{' '}
        <a className="tc-doc-link" href={hrefFor('composants/backdrop')}>
          Backdrop
        </a>
        ,{' '}
        <a className="tc-doc-link" href={hrefFor('composants/card')}>
          Card
        </a>
        ,{' '}
        <a className="tc-doc-link" href={hrefFor('composants/timeline')}>
          Timeline
        </a>{' '}
        et{' '}
        <a className="tc-doc-link" href={hrefFor('composants/icon-tile')}>
          IconTile
        </a>{' '}
        — et les quatre manquements AA publiés sur la{' '}
        <a className="tc-doc-link" href={hrefFor('palette')}>
          page de la palette
        </a>
        .
      </p>
    </PageBody>
  ),
};
