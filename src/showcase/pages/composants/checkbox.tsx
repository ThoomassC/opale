import { Checkbox } from '../../../components/checkbox';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Checkbox } from '@thomascaron/ui';

<Checkbox name="options" value="draft" label="Conserver un brouillon local" />
<Checkbox name="options" value="publish" label="Publier l’étape" defaultChecked />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'label',
    type: 'ReactNode',
    required: true,
    description: (
      <>
        Libellé cliquable. La case est <strong>imbriquée</strong> dans son{' '}
        <code>&lt;label&gt;</code> : il n’y a donc ni <code>id</code> à fournir ni{' '}
        <code>htmlFor</code> à câbler.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné sur la <strong>ligne</strong> — le <code>&lt;label&gt;</code> racine — et non sur
        la case : c’est la ligne qui se place dans une grille ou une liste.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLInputElement>',
    description: (
      <>
        Atterrit sur l’<code>&lt;input&gt;</code>, pas sur la ligne : c’est le contrôle qu’un
        formulaire veut focaliser.
      </>
    ),
  },
];

export const checkboxPage: DocPage = {
  slug: 'composants/checkbox',
  label: 'Checkbox',
  group: 'composants',
  title: 'Checkbox',
  lede: (
    <>
      Une case à cocher dont le contrôle est <strong>imbriqué dans son libellé</strong> : pas d’
      <code>id</code> à fournir, pas de <code>useId</code> à appeler — donc rien qui interdise le
      rendu serveur — et toute la ligne est cliquable. La coche reste le rendu natif du système,
      simplement teinté par <code>accent-color: var(--accent)</code>.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Checkbox" code={USAGE} />

      <Specimen
        title="Cases à cocher"
        note="Le contrôle est imbriqué dans son libellé : toute la ligne est cliquable, et la ligne fait au moins 44 px."
      >
        <div className="tc-doc-form">
          <Checkbox
            name="checkbox-demo-opt"
            value="brouillon"
            label="Conserver un brouillon local"
          />
          <Checkbox
            name="checkbox-demo-opt"
            value="publier"
            label="Publier l’étape dès l’enregistrement"
            defaultChecked
          />
          <Checkbox
            name="checkbox-demo-opt"
            value="archive"
            label="Archiver (indisponible tant que l’étape est publiée)"
            disabled
          />
        </div>
      </Specimen>

      {/* Le cas contrôlé, qui manquait : `checked` sans `onChange` est le seul
          appel de cette page que React commenterait en console — `readOnly`
          est ce qui le rend légitime, et c'est exactement ce qu'attend une
          case pilotée par le serveur et non par l'utilisateur. */}
      <Specimen
        title="Cochée par l’appelant — l’état contrôlé"
        note="Le composant ne garde aucun état : cochée, il l’est parce que checked le dit. Une case contrôlée sans onChange doit porter readOnly, sinon React signale un contrôle dont la valeur ne peut pas changer ; c’est la forme qu’attend une case pilotée par le serveur plutôt que par l’utilisateur."
      >
        <div className="tc-doc-form">
          <Checkbox
            name="checkbox-demo-controlled"
            value="verrou"
            label="Étape verrouillée par la publication"
            checked
            readOnly
          />
          <Checkbox
            name="checkbox-demo-controlled"
            value="libre"
            label="Étape encore modifiable"
            checked={false}
            readOnly
          />
        </div>
      </Specimen>

      <PropsTable
        id="checkbox"
        note={
          <>
            Le type étend{' '}
            <code>
              Omit&lt;ComponentPropsWithoutRef&lt;&apos;input&apos;&gt;, &apos;type&apos;&gt;
            </code>{' '}
            : <code>name</code>, <code>value</code>, <code>checked</code>,{' '}
            <code>defaultChecked</code>, <code>disabled</code>, <code>onChange</code> et tous les
            autres attributs natifs traversent jusqu’à l’
            <code>&lt;input&gt;</code>. Le seul refusé est <code>type</code> : une case à cocher qui
            ne serait pas <code>type=&quot;checkbox&quot;</code> n’est pas ce composant.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>La ligne est la cible, et elle mesure au moins 44&nbsp;px.</strong>{' '}
        <code>.tc-checkbox</code> porte <code>min-block-size: var(--target-min)</code>, et comme le{' '}
        <code>&lt;label&gt;</code> enveloppe la case, cliquer n’importe où sur la ligne — libellé
        compris — coche. Ce n’est pas une commodité : la coche seule est très en dessous du plancher
        du doigt, et <code>--target-min</code> est précisément la valeur que la charte réserve à un
        «&nbsp;contrôle en liste ou en navigation&nbsp;». Les deux valeurs de cible sont détaillées
        dans{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        .
      </p>
    </PageBody>
  ),
};
