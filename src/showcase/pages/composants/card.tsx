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
        Le matériau : <code>glass</code> est le verre liquide, <code>flat</code> la surface opaque.
      </>
    ),
  },
  {
    name: 'elevation',
    type: '0 | 1 | 2 | 3',
    defaultValue: '0',
    description: (
      <>
        Cran d’élévation, <strong>réservé à la variante opaque</strong> — <code>never</code> sur la
        branche verre.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-card</code> et la classe de matériau.
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
      liquide est le défaut, l’opaque se demande par <code>variant=&quot;flat&quot;</code> ou par le
      cran d’élévation qui l’implique ; ni l’un ni l’autre n’exige d’arrière-plan.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Card" code={USAGE} />

      <Specimen title="Le verre sur son décor — et l’aplat juste à côté">
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
                pourtant opaque. Si ce texte se lit sans voile coloré au
                travers, la mesure tient. */}
            <Card variant="flat" elevation={1}>
              <h3 className="tc-doc-cardtitle">Aplat opaque</h3>
              <p className="tc-doc-cardmeta">variant=&quot;flat&quot; · elevation=1</p>
              <p className="tc-doc-cardtext">
                Ni <code>position</code> ni <code>isolation</code> : c’est elle que les halos
                recouvraient à <code>z-index: 0</code>. Son intérieur doit rester net.
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
        note="Les deux premières doivent être indiscernables — le verre est le défaut — et la troisième opaque, parce que passer un cran est en soi le choix du matériau."
      >
        <div className="tc-doc-grid">
          <Card>
            <h3 className="tc-doc-cardtitle">Sans aucune prop</h3>
            <p className="tc-doc-cardmeta">&lt;Card&gt;</p>
            <p className="tc-doc-cardtext">
              Verre liquide : fond <code>--glass-fill</code>, ménisque de bord, liseré spéculaire,
              ombre en dur.
            </p>
          </Card>
          <Card variant="glass">
            <h3 className="tc-doc-cardtitle">Verre demandé</h3>
            <p className="tc-doc-cardmeta">variant=&quot;glass&quot;</p>
            <p className="tc-doc-cardtext">Le même rendu, exactement.</p>
          </Card>
          <Card elevation={0}>
            <h3 className="tc-doc-cardtitle">Cran seul</h3>
            <p className="tc-doc-cardmeta">elevation=&#123;0&#125;</p>
            <p className="tc-doc-cardtext">Opaque, cran 0.</p>
          </Card>
        </div>
      </Specimen>

      <PropsTable
        id="card"
        note={
          <>
            <strong>Union discriminée sur le matériau</strong> — <code>CardGlassProps</code> déclare{' '}
            <code>elevation?: never</code> — et les deux branches étendent{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code>.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        Les quatre crans et leurs jetons sont détaillés dans{' '}
        <a className="tc-doc-link" href={hrefFor('elevation')}>
          Élévation
        </a>
        .
      </p>
    </PageBody>
  ),
};
