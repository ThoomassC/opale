import { Field } from '../../../components/field';
import { Input } from '../../../components/input';
import { Select } from '../../../components/select';
import { Textarea } from '../../../components/textarea';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Field, Input } from '@thomascaron/ui';

<Field id="email" label="Adresse e-mail" hint="Nous ne l’affichons jamais." error={error}>
  {(control) => <Input {...control} type="email" name="email" />}
</Field>`;

/* Le seul cas où l'appelant a le droit d'écrire son propre
   `aria-describedby` : il COMPOSE celui que `Field` a calculé au lieu de
   l'écraser. Rendu en bloc de code parce que le défaut qu'il évite est
   silencieux — ni le typage ni le rendu ne le signalent. */
const COMPOSE_DESCRIBEDBY = `{(control) => (
  <Input
    {...control}
    aria-describedby={[control['aria-describedby'], 'ma-note']
      .filter(Boolean)
      .join(' ')}
  />
)}`;

const PROPS: readonly PropRow[] = [
  {
    name: 'id',
    type: 'string',
    required: true,
    description: (
      <>
        Identifiant du contrôle, <strong>requis</strong> faute de <code>useId</code> ;{' '}
        <code>{'${id}-hint'}</code> et <code>{'${id}-error'}</code> en sont dérivés, donc
        collisionnables.
      </>
    ),
  },
  {
    name: 'label',
    type: 'ReactNode',
    required: true,
    description: (
      <>
        Libellé visible, câblé au contrôle par <code>htmlFor</code>.
      </>
    ),
  },
  {
    name: 'hint',
    type: 'ReactNode',
    description: (
      <>
        Aide permanente, référencée par <code>aria-describedby</code>.
      </>
    ),
  },
  {
    name: 'error',
    type: 'ReactNode',
    description: (
      <>
        Message d’erreur : sa présence pose <code>aria-invalid</code>, complète{' '}
        <code>aria-describedby</code>, et <strong>annonce</strong> le message.
      </>
    ),
  },
  {
    name: 'children',
    type: '(control: FieldControlProps) => ReactNode',
    required: true,
    description: <>Fonction-enfant recevant les attributs calculés.</>,
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-field</code> et, en erreur, <code>tc-field--invalid</code>.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description: 'Atterrit sur le <div> enveloppe, non sur le contrôle.',
  },
];

const CONTROL_PROPS: readonly PropRow[] = [
  {
    name: 'id',
    type: 'string',
    required: true,
    description: (
      <>
        L’<code>id</code> reçu, tel quel : c’est lui que désigne le <code>&lt;label for&gt;</code>.
      </>
    ),
  },
  {
    name: 'aria-describedby',
    type: 'string | undefined',
    required: true,
    description: (
      <>
        Les identifiants de l’aide puis de l’erreur, séparés par une espace ; <code>undefined</code>{' '}
        s’il n’y en a aucun.
      </>
    ),
  },
  {
    name: 'aria-invalid',
    type: 'true | undefined',
    required: true,
    description: (
      <>
        <code>true</code> dès qu’une erreur est présente, <code>undefined</code> sinon — jamais{' '}
        <code>&quot;false&quot;</code>.
      </>
    ),
  },
];

export const fieldPage: DocPage = {
  slug: 'composants/field',
  label: 'Field',
  group: 'composants',
  title: 'Field',
  lede: (
    <>
      L’enveloppe d’un contrôle de formulaire : libellé, aide, message d’erreur, et le câblage ARIA
      entre les trois. <code>id</code> est <strong>requise</strong> — <code>useId</code> est un hook
      et interdirait le rendu en Server Component — et les attributs calculés sont remis à une
      fonction-enfant plutôt qu’injectés par <code>cloneElement</code>.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appel représentatif de Field" code={USAGE} />

      <Specimen title="Champs — les six états">
        <div className="tc-doc-form">
          <Field id="field-demo-nom" label="Nom de l’étape">
            {(control) => <Input {...control} defaultValue="Col du Galibier" />}
          </Field>

          <Field
            id="field-demo-altitude"
            label="Altitude"
            hint="En mètres, arrondie à la dizaine. Laissez vide si la mesure manque."
          >
            {(control) => <Input {...control} inputMode="numeric" placeholder="2 642" />}
          </Field>

          <Field
            id="field-demo-date"
            label="Date de passage"
            hint="Format JJ/MM/AAAA."
            error="Cette date est postérieure à l’arrivée du voyage."
          >
            {(control) => <Input {...control} defaultValue="31/02/2024" />}
          </Field>

          <Field
            id="field-demo-moyen"
            label="Moyen de transport"
            hint="Ce qui a servi sur la majorité du tronçon."
          >
            {(control) => (
              <Select {...control} defaultValue="velo">
                <option value="marche">À pied</option>
                <option value="velo">À vélo</option>
                <option value="train">En train</option>
                <option value="bateau">En bateau</option>
              </Select>
            )}
          </Field>

          <Field
            id="field-demo-ref"
            label="Référence interne"
            hint="Attribuée à la publication, non modifiable."
          >
            {(control) => <Input {...control} defaultValue="TIW-2024-018" disabled />}
          </Field>

          <Field
            id="field-demo-recit"
            label="Récit"
            hint="Deux paragraphes suffisent. La zone se redimensionne en hauteur seulement."
          >
            {(control) => (
              <Textarea
                {...control}
                defaultValue="La route monte sans une ligne droite, et le vent tourne à chaque lacet."
              />
            )}
          </Field>
        </div>
      </Specimen>

      {/* Le focus, qui ne se voit que sur la page d'accessibilité alors qu'il
          fait partie du contrat de ce composant : le liseré du champ et
          l'anneau double sont deux couches distinctes, et l'une ne remplace
          pas l'autre. */}
      <Specimen
        title="Le focus du contrôle"
        note="Tabulez dans le cadre : le double anneau se pose sur le contrôle, et ses deux couches s’inversent entre les thèmes pour que l’une contraste toujours avec le fond local."
      >
        <div className="tc-doc-focusdemo">
          <Field id="field-demo-focus" label="Un champ" hint="L’aide reste lisible sous l’anneau.">
            {(control) => <Input {...control} placeholder="Tabulez jusqu’ici" />}
          </Field>
        </div>
      </Specimen>

      <PropsTable
        id="field"
        note={
          <>
            Le reste de <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> traverse
            jusqu’à l’enveloppe, sauf <code>children</code> et <code>id</code>, redéfinis
            ci-dessous.
          </>
        }
        rows={PROPS}
      />

      <PropsTable
        id="field-control"
        title="Ce que la fonction-enfant reçoit"
        note={
          <>
            <code>FieldControlProps</code> est conçu pour être <strong>étalé tel quel</strong>, en
            dernier : poser son propre <code>aria-describedby</code> après écrase la valeur calculée
            sans que rien ne le signale.
          </>
        }
        rows={CONTROL_PROPS}
      />

      <UsageBlock
        label="Composer sa propre description sans écraser celle de Field"
        code={COMPOSE_DESCRIBEDBY}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>
          L’erreur est annoncée, et le rôle est en dur : <code>role=&quot;alert&quot;</code>
        </strong>{' '}
        — le nœud d’erreur arrive déjà rempli, le cas qu’un <code>aria-live</code> annonce le moins
        fiablement, donc validez à la perte de focus ou à l’envoi et non à chaque frappe (voir{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        ).
      </p>
    </PageBody>
  ),
};
