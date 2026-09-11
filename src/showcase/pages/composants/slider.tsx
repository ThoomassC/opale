import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { SliderSizeScene, SliderStepScene } from './scenes';
import { MagicGroundNote, MagicPreamble } from './stage';

const USAGE = `import { Slider } from '@thomascaron/opale';
import '@thomascaron/opale/opale.css';

const [zoom, setZoom] = useState(50);

// \`enableClickAnimation\` active la déformation liquide au clic.
<Slider value={zoom} onChange={setZoom} min={0} max={100} step={5} />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'number',
    defaultValue: '50',
    description: (
      <>
        <strong>Aucun état interne.</strong> Sans <code>value</code> ni <code>onChange</code>, le
        curseur reste à 50 et le glisser ne le déplace pas.
      </>
    ),
  },
  {
    name: 'onChange',
    type: '(value: number) => void',
    description: (
      <>
        Appelé pendant le glisser, <strong>seulement si la valeur arrondie change</strong> — le
        composant compare à <code>value</code> avant d’émettre.
      </>
    ),
  },
  {
    name: 'min / max / step',
    type: 'number',
    defaultValue: '0 / 100 / 1',
    description: (
      <>
        L’arrondi est <code>Math.round(newValue / step) * step</code> appliqué à la valeur{' '}
        <em>absolue</em> et non à l’écart depuis <code>min</code> : avec un <code>min</code> qui
        n’est pas un multiple du pas, les positions atteignables ne tombent pas sur <code>min</code>
        .
      </>
    ),
  },
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: 'Épaisseur de la piste et taille du curseur.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: 'Coupe le glisser et atténue la piste.',
  },
  {
    name: 'showValue',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        <strong>Sans aucun effet.</strong> Déstructurée puis jamais lue. Le fichier porte un{' '}
        <code>eslint-disable</code> qui le dit.
      </>
    ),
  },
  {
    name: 'enableClickAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: (
      <>
        Active la déformation liquide au clic. À <code>false</code>, la surface reste statique.
      </>
    ),
  },
];

export const sliderPage: DocPage = {
  slug: 'composants/slider',
  label: 'Slider',
  group: 'composants',
  title: 'Slider',
  lede: (
    <>
      Un curseur de valeur sur une surface Liquid Glass. La piste reste inutilisable au clavier, et
      <code>showValue</code> n’a aucun effet : ces défauts sont conservés tels quels.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Slider" code={USAGE} />

      <Specimen
        title="Les trois crans — glissez-les à la souris"
        note={
          <>
            <strong>À la souris seulement</strong> : la piste est un <code>&lt;div&gt;</code> avec{' '}
            <code>onMouseDown</code>, sans <code>tabindex</code>, sans rôle et sans gestion du
            clavier. <MagicGroundNote />
          </>
        }
      >
        <SliderSizeScene />
      </Specimen>

      <Specimen
        title="Le pas, et l’état désactivé"
        note={
          <>
            Avec <code>step={'{25}'}</code>, le pointeau ne s’arrête que sur cinq positions —
            l’arrondi est visible à l’œil pendant le glisser.
          </>
        }
      >
        <SliderStepScene />
      </Specimen>

      <PropsTable
        id="magic-slider"
        note={
          <>
            Sept props propres et rien d’autre : ni <code>ComponentPropsWithoutRef</code>, ni{' '}
            <code>GlassProps</code>. Le <code>{'{...props}'}</code> du composant est donc toujours
            vide, et{' '}
            <strong>
              aucun <code>aria-*</code> n’est passable
            </strong>{' '}
            — ce qui rend les manques ci-dessous irrattrapables depuis l’appelant.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Ce composant n’est pas utilisable sans souris, et ce n’est pas rattrapable.</strong>{' '}
        Il n’y a ni <code>role=&quot;slider&quot;</code>, ni{' '}
        <code>aria-valuenow / valuemin / valuemax</code>, ni <code>tabindex</code>, ni écoute du
        clavier, ni gestion du tactile (<code>onMouseDown</code> seul, pas de{' '}
        <code>pointerdown</code>). Comme le type n’accepte aucun attribut supplémentaire, un
        appelant ne peut rien ajouter. Un <code>&lt;input type=&quot;range&quot;&gt;</code> habillé
        obtiendrait les six gratuitement — c’est ce qu’il faudrait remonter en amont chez{' '}
        <code>@tweeedlex</code>.
      </p>

      <p className="tc-doc-prose">
        Ce curseur est le seul de la librairie. La 1.0 n’en avait aucun : elle publiait un{' '}
        <code>DateRange</code> qui choisissait l’inverse — deux champs natifs plutôt qu’un contrôle
        reconstruit —, et la 2.0 ne le publie plus. Il n’y a donc plus, dans ce paquet, de contrôle
        de plage bâti sur un élément natif.
      </p>
    </PageBody>
  ),
};
