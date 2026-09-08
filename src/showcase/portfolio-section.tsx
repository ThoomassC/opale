import type { ReactNode } from 'react';
import { Backdrop } from '../components/backdrop';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { ChipList } from '../components/chip-list';
import { DateRange } from '../components/date-range';
import { IconTile } from '../components/icon-tile';
import { Pill } from '../components/pill';
import { SectionHeading } from '../components/section-heading';
import { Tag } from '../components/tag';
import { Timeline, TimelineItem } from '../components/timeline';
import { Section, Specimen } from './section';

/**
 * Ce qui a été porté du portfolio, RENDU.
 *
 * Les six autres sections documentent des jetons et des états ; celle-ci
 * existe pour une raison différente. Le verre liquide, les halos et la tuile
 * d'icône sont des matériaux : leur contrat est mesuré par `src/contract/`,
 * mais aucune mesure ne dit s'ils se composent bien. `glass.structure.test.ts`
 * garde la FORME des règles, jsdom ne peint pas, et il n'y a pas de Playwright
 * dans ce dépôt — donc cette section est le seul endroit du projet où l'on
 * constate le rendu.
 *
 * Elle sert aussi de contre-épreuve à une décision : les disques du `Backdrop`
 * sont posés à `z-index: -1` là où le portfolio les met à `0`, parce qu'à `0`
 * un disque se peint au-dessus de tout enfant NON positionné. La `Card` en
 * variante `flat` ci-dessous est exactement ce cas — c'est pour elle que la
 * divergence existe, et c'est ici qu'on la vérifie à l'œil.
 */

/**
 * Une cellule de spécimen et sa légende.
 *
 * Même `<figure>` / `<figcaption>` que les états de bouton de la section 06 :
 * deux tuiles rigoureusement identiques à l'œil, dont l'une est un lien et
 * l'autre du décor, ne se distinguent que par ce qu'on écrit dessous.
 */
function Case({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="tc-doc-states__cell">
      {children}
      <figcaption className="tc-doc-states__label">{label}</figcaption>
    </figure>
  );
}

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
    title: '@thomascaron/ui',
    meta: 'la librairie que documente cette page',
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

/** Une entrée de frise. `className` porte le matériau, ou rien du tout. */
function Entry({ entry, className }: { entry: EntryData; className?: string }) {
  return (
    <TimelineItem
      className={className}
      // Le titre de l'entrée est un `<h4>` : la section porte un `<h2>` et le
      // spécimen un `<h3>`, donc c'est le niveau juste — et il est DÉCLARÉ,
      // sans quoi la feuille ne le stylerait pas et le composant le signalerait.
      level={4}
      icon={
        <IconTile>
          <span>{entry.glyph}</span>
        </IconTile>
      }
    >
      <DateRange start={entry.start} end={entry.end} />
      <h4>{entry.title}</h4>
      <p className="tc-timeline__meta">{entry.meta}</p>
      <p>{entry.text}</p>
      <ChipList label={entry.chipsLabel} items={entry.chips} />
    </TimelineItem>
  );
}

export function PortfolioSection() {
  return (
    <Section
      id="portfolio"
      index="08"
      title="Portés du portfolio"
      lede={
        <>
          Sept composants sont arrivés d’un coup avec la palette : le décor et ses halos, le bloc de
          titre, la tuile d’icône, la plage de dates, la frise et sa liste de chips. Les six
          sections précédentes les mesurent ; celle-ci les <em>rend</em>, parce qu’un matériau
          translucide ne se juge pas sur un tableau de ratios.
        </>
      }
    >
      <Specimen
        title="Le verre sur son décor — et l’aplat juste à côté"
        note="Trois cartes de verre et une carte opaque dans le MÊME Backdrop, pour que la comparaison porte sur le matériau et non sur le fond. Le verre n’exige rien de son arrière-plan : le halo dégrade le contraste, il ne le fournit pas — le meilleur cas est le halo absent. Ce qu’un fond nu ne montre pas, en revanche, c’est le matériau : sans rien à filtrer, un verre ne se lit pas comme du verre."
      >
        <Backdrop className="tc-doc-scene">
          <div className="tc-doc-scene__grid">
            {GLASS_CARDS.map((project) => (
              <Card key={project.title}>
                <h4 className="tc-doc-cardtitle">{project.title}</h4>
                <p className="tc-doc-cardmeta">{project.meta}</p>
                <p className="tc-doc-cardtext">{project.text}</p>
              </Card>
            ))}

            {/* La carte qui a fait bouger le décor. `flat` ne pose ni
                `position` ni `isolation` : à `z-index: 0`, les disques du
                Backdrop se peignaient PAR-DESSUS ce texte, sur un fond
                pourtant opaque. Si vous lisez ces trois lignes sans voile
                coloré au travers, la mesure tient. */}
            <Card variant="flat" elevation={1}>
              <h4 className="tc-doc-cardtitle">Aplat opaque</h4>
              <p className="tc-doc-cardmeta">variant=&quot;flat&quot; · elevation=1</p>
              <p className="tc-doc-cardtext">
                Même carte, matériau opaque. Elle ne porte ni <code>position</code> ni{' '}
                <code>isolation</code> : c’est elle que les halos recouvraient tant qu’ils étaient à{' '}
                <code>z-index: 0</code>. Son intérieur doit rester net.
              </p>
            </Card>
          </div>
        </Backdrop>
      </Specimen>

      <Specimen
        title="La frise — l’entrée NUE, sans matériau"
        note="Une entrée de frise n’est pas une carte : elle ne porte que la géométrie à deux colonnes et la typographie de ce qu’on y met. Son contenu est libre, parce que la même frise sert une chronologie professionnelle et un carnet d’étapes ; fixer « poste » et « entreprise » en props aurait figé le vocabulaire de l’un des deux usages. C’est cet état-là qu’il faut regarder pour juger le RYTHME : date, titre et ligne de lieu doivent former un seul bloc serré, puis le texte se détacher."
      >
        <Timeline label="Expériences professionnelles, entrées nues">
          {ENTRIES.map((entry) => (
            <Entry key={entry.title} entry={entry} />
          ))}
        </Timeline>
      </Specimen>

      {/* LE SPÉCIMEN QUI MANQUAIT, et c'était le plus important de la section.
          Le titre du spécimen précédent annonçait « la composition que le
          portfolio réalise » alors qu'il rendait des entrées NUES : chez le
          portfolio, `.timeline-item` est aussi un `liquid-card`. La composition
          documentée par `TimelineItem` — empiler `tc-card tc-card--glass` par
          `className` — n'était donc rendue nulle part, et c'est précisément
          celle dont trois choses ne peuvent se vérifier qu'à l'écran :
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
        note="TimelineItem className=&quot;tc-card tc-card--glass&quot;, dans un Backdrop. C’est mot pour mot ce que fait le portfolio, et la seule façon de vérifier que la géométrie de l’entrée survit au matériau de la carte : la tuile doit rester dans sa colonne, le coussin valoir 24 px des deux côtés, et les deux pseudo-éléments du verre ne prendre aucune cellule de la grille."
      >
        <Backdrop className="tc-doc-scene">
          <div className="tc-doc-scene__stack">
            <Timeline label="Expériences professionnelles, sur carte de verre">
              {ENTRIES.map((entry) => (
                <Entry key={entry.title} entry={entry} className="tc-card tc-card--glass" />
              ))}
            </Timeline>
          </div>
        </Backdrop>
      </Specimen>

      {/* LES TROIS NIVEAUX CÔTE À CÔTE, et il faut les trois. Le bloc de titre
          ne rendait qu'un `level={4}`, si bien que la question qui compte —
          est-ce que l'échelle suit le niveau ? — ne se voyait pas. Elle se
          voyait même à l'envers : ce `h4` se peignait à 49,9 px, soit plus du
          double du `h3` de 23 px du spécimen qui le contient. L'échelle suit
          désormais la balise, et cette rangée est ce qui le montre. */}
      <Specimen
        title="Le bloc de titre — le sourcil est en cuivre, l’échelle suit le niveau"
        note="Le sourcil est rendu en --accent-secondary, la couche éditoriale du contrat de couleur : jamais l’accent teal, qui est réservé à ce qui s’actionne. Le niveau est une prop parce qu’un composant ne peut pas connaître sa profondeur dans le plan du document — mais la TAILLE, elle, se déduit du niveau. Les trois blocs ci-dessous ne diffèrent que par leur prop level, et un titre plus profond ne doit jamais se peindre plus gros que le titre qui le contient."
      >
        <div className="tc-doc-stack">
          <SectionHeading
            level={2}
            eyebrow="level 2 — titre de section"
            title="Étapes du printemps"
            lede="Onze jours entre Kyoto et la vallée de Kiso, à pied et en train régional."
          />
          <SectionHeading
            level={3}
            eyebrow="level 3 — titre de panneau"
            title="Étapes du printemps"
            lede="Onze jours entre Kyoto et la vallée de Kiso, à pied et en train régional."
          />
          <SectionHeading
            level={4}
            eyebrow="level 4 — intertitre"
            title="Étapes du printemps"
            lede="Onze jours entre Kyoto et la vallée de Kiso, à pied et en train régional."
          />
        </div>
      </Specimen>

      <Specimen
        title="Les trois pastilles d’avancement"
        note="Chaque pastille porte un glyphe ET un libellé, et le libellé est le garde-fou réel : mesurées en simulation deutéranope, les trois couleurs sont indiscernables. Un libellé vide fait échouer le rendu — le composant lève plutôt que de publier une pastille muette, et les deux consommateurs étant prérendus, la faute se voit au build."
        inline
      >
        <Pill tone="done">Acquis</Pill>
        <Pill tone="progress">En cours</Pill>
        <Pill tone="upcoming">À venir</Pill>
      </Specimen>

      <Specimen
        title="Les étiquettes — la chip du portfolio est le défaut"
        note="Sans variante, une étiquette est la chip de stack technique : pilule, sans-serif, aucun glyphe. Les trois variantes de charte se distinguent par la forme de la bordure et par le glyphe, jamais par la seule couleur."
        inline
      >
        <Tag>Vitest</Tag>
        <Tag variant="measured">Mesuré</Tag>
        <Tag variant="proposed">Proposé</Tag>
        <Tag variant="open">Question ouverte</Tag>
      </Specimen>

      <Specimen
        title="Les boutons — et le bouton qui est un lien"
        note="href fait basculer l’élément rendu de <button> à <a> : une navigation doit être un lien, sinon elle perd l’ouverture en nouvel onglet, la copie d’adresse et l’annonce « lien » du lecteur d’écran. aria-disabled plutôt que disabled : l’élément reste focusable, donc atteignable au clavier, et le composant neutralise le clic lui-même."
        inline
      >
        <Button>Publier l’étape</Button>
        <Button variant="secondary">Enregistrer le brouillon</Button>
        <Button variant="danger">Supprimer l’étape</Button>
        <Button href="#palette" variant="secondary">
          Revenir à la palette
        </Button>
        <Button aria-disabled="true">Publier l’étape</Button>
      </Specimen>

      <Specimen
        title="Les tuiles d’icône — deux encres, deux rôles, deux formats"
        note="Même silhouette et même matériau dégradé, mais ni la même encre ni le même format : le décor est en cuivre à 48 px, le contrôle en teal à 44 px — le plancher de cible tactile, et la valeur du portfolio pour la même tuile. Les 4 px d’écart se voient dans cette rangée alors qu’ils ne se voient jamais dans une page, où les deux ne se côtoient pas. La tuile décorative est un <span> et reçoit aria-hidden ; la tuile en lien est un <a>, ne le reçoit jamais — un élément focusable masqué à l’arbre d’accessibilité est un piège au clavier — et son nom accessible est EXIGÉ PAR LE TYPE — la prop label, rendue en texte masqué visuellement — l’icône étant son seul contenu visible."
      >
        <div className="tc-doc-states">
          <Case label="decor — un <span>, aria-hidden, 48 px">
            <IconTile>
              <span>◆</span>
            </IconTile>
          </Case>
          <Case label="action — un <a>, nommé par sa prop label, 44 px">
            <IconTile href="#composants" label="Aller au catalogue des composants">
              <span aria-hidden="true">◆</span>
            </IconTile>
          </Case>
        </div>
      </Specimen>
    </Section>
  );
}
