import { Backdrop } from '../../../components/backdrop';
import { Card } from '../../../components/card';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

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

const USAGE = `import { Backdrop, Card } from '@thomascaron/ui';

<Backdrop>
  <Card>
    <h2>Titre</h2>
  </Card>
</Backdrop>

<Card variant="flat" elevation={2}>Panneau flottant</Card>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'variant',
    type: "'glass' | 'flat'",
    defaultValue: "'glass'",
    description: (
      <>
        Le matériau. <code>glass</code> est le verre liquide du portfolio et le rendu par défaut ;{' '}
        <code>flat</code> est la surface opaque, qui reste nécessaire là où il n’y a rien à filtrer.
      </>
    ),
  },
  {
    name: 'elevation',
    type: '0 | 1 | 2 | 3',
    defaultValue: '0',
    description: (
      <>
        Cran d’élévation, <strong>réservé à la variante opaque</strong> : sur la branche verre le
        type le déclare <code>never</code>. En passer un implique{' '}
        <code>variant=&quot;flat&quot;</code>, puisque c’est le seul des deux matériaux à porter un
        cran.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-card</code> et la classe de matériau. C’est par là que{' '}
        <code>TimelineItem</code> reçoit <code>tc-card tc-card--glass</code>.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description: 'Atterrit sur le <div> racine.',
  },
];

export const cardPage: DocPage = {
  slug: 'composants/card',
  label: 'Card',
  group: 'composants',
  title: 'Card',
  lede: (
    <>
      Une surface de contenu, <strong>purement présentationnelle</strong> : elle n’impose aucun
      rôle, et c’est à l’appelant de rendre le bon élément sémantique à l’intérieur. Le verre
      liquide est le rendu par défaut — le portfolio gagne — et la surface opaque se demande, par{' '}
      <code>variant=&quot;flat&quot;</code> ou par le cran d’élévation qui l’implique. Le verre
      n’exige rien de son arrière-plan : le halo <em>dégrade</em> le contraste, il ne le fournit
      pas, donc le meilleur cas est le halo absent.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Card" code={USAGE} />

      <Specimen
        title="Le verre sur son décor — et l’aplat juste à côté"
        note="Trois cartes de verre et une carte opaque dans le MÊME Backdrop, pour que la comparaison porte sur le matériau et non sur le fond. Le verre n’exige rien de son arrière-plan : le halo dégrade le contraste, il ne le fournit pas — le meilleur cas est le halo absent. Ce qu’un fond nu ne montre pas, en revanche, c’est le matériau : sans rien à filtrer, un verre ne se lit pas comme du verre."
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
                pourtant opaque. Si vous lisez ces trois lignes sans voile
                coloré au travers, la mesure tient. */}
            <Card variant="flat" elevation={1}>
              <h3 className="tc-doc-cardtitle">Aplat opaque</h3>
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

      <Specimen title="Cartes — les quatre élévations">
        <div className="tc-doc-grid tc-doc-grid--elev">
          {([0, 1, 2, 3] as const).map((level) => (
            <Card elevation={level} key={level}>
              <h3 className="tc-doc-cardtitle">Élévation {level}</h3>
              <p className="tc-doc-cardtext">
                Fond <code>--surface</code>, liseré <code>--border-subtle</code>, rayon{' '}
                <code>--radius-md</code>.
              </p>
            </Card>
          ))}
        </div>
      </Specimen>

      {/* Les deux écritures que l'union rend équivalentes, rendues côte à côte :
          c'est la seule façon de vérifier à l'œil que l'inférence n'a pas
          changé le matériau en chemin. */}
      <Specimen
        title="Les trois écritures du même appel"
        note='Card sans prop, Card variant="glass" et Card elevation={0} : les deux premières doivent être indiscernables — le verre est le défaut — et la troisième doit être opaque, parce que passer un cran est en soi le choix du matériau opaque. Une carte de verre posée sur une page nue, comme ici, est le cas de contraste le plus FAVORABLE, jamais un défaut à signaler.'
      >
        <div className="tc-doc-grid">
          <Card>
            <h3 className="tc-doc-cardtitle">Sans aucune prop</h3>
            <p className="tc-doc-cardmeta">&lt;Card&gt;</p>
            <p className="tc-doc-cardtext">
              Verre liquide : fond <code>--glass-fill</code>, ménisque de bord, liseré spéculaire,
              ombre portée en dur.
            </p>
          </Card>
          <Card variant="glass">
            <h3 className="tc-doc-cardtitle">Verre demandé</h3>
            <p className="tc-doc-cardmeta">variant=&quot;glass&quot;</p>
            <p className="tc-doc-cardtext">
              Le même rendu, exactement. Le dire ne change rien — c’est le défaut.
            </p>
          </Card>
          <Card elevation={0}>
            <h3 className="tc-doc-cardtitle">Cran seul</h3>
            <p className="tc-doc-cardmeta">elevation=&#123;0&#125;</p>
            <p className="tc-doc-cardtext">
              Opaque, cran 0 : le rendu que <code>&lt;Card&gt;</code> donnait avant que le verre
              devienne le défaut.
            </p>
          </Card>
        </div>
      </Specimen>

      <PropsTable
        id="card"
        note={
          <>
            L’interface est une <strong>union discriminée sur le matériau</strong> :{' '}
            <code>CardGlassProps</code> déclare <code>elevation?: never</code>, si bien que{' '}
            <code>&lt;Card variant=&quot;glass&quot; elevation=&#123;2&#125;&gt;</code> est une
            erreur de compilation et non une prop silencieusement ignorée — le verre porte son ombre
            en dur, il n’y a pas de cran à choisir. Les deux branches étendent{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> : tout attribut natif
            traverse jusqu’au <code>&lt;div&gt;</code> racine.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        La polarité de l’élévation s’inverse entre les thèmes : en clair c’est l’ombre qui détache
        la carte du sol, en sombre c’est le liseré — une ombre composée y mesure ΔE&nbsp;2,2, sous
        le seuil de perceptibilité. Les deux sont donc toujours posés ensemble ; les quatre crans et
        leurs jetons sont détaillés dans{' '}
        <a className="tc-doc-link" href={hrefFor('elevation')}>
          Élévation
        </a>
        .
      </p>
    </PageBody>
  ),
};
