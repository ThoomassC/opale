import { Checkbox } from '../../../components/checkbox';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Checkbox } from '@thomascaron/opale';

<Checkbox name="options" value="draft" label="Conserver un brouillon local" />
<Checkbox name="options" value="publish" label="Publier l’étape" defaultChecked />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'label',
    type: 'ReactNode',
    required: true,
    description: (
      <>
        Libellé cliquable ; la case est <strong>imbriquée</strong> dedans, donc ni <code>id</code>{' '}
        ni <code>htmlFor</code> à fournir.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné sur la <strong>ligne</strong> — le <code>&lt;label&gt;</code> racine — et non sur
        la case.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLInputElement>',
    description: (
      <>
        Atterrit sur l’<code>&lt;input&gt;</code>, pas sur la ligne.
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
      Une case à cocher dont le contrôle est <strong>imbriqué dans son libellé</strong> : aucun{' '}
      <code>id</code> à fournir, aucun hook, et toute la ligne est cliquable. La coche reste le
      rendu natif du système, teinté par <code>accent-color: var(--accent)</code>.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Checkbox" code={USAGE} />

      <Specimen
        title="Cases à cocher"
        note="Toute la ligne est cliquable, et elle mesure au moins 44 px."
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
        note="Une case contrôlée sans onChange doit porter readOnly, sinon React signale un contrôle dont la valeur ne peut pas changer."
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
            : tous les attributs natifs traversent jusqu’à l’<code>&lt;input&gt;</code>, seul{' '}
            <code>type</code> est refusé.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>La ligne est la cible</strong> : <code>min-block-size: var(--target-min)</code> lui
        garantit 44&nbsp;px, le plancher que la charte réserve à un contrôle en liste — voir{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        .
      </p>
    </PageBody>
  ),
};
