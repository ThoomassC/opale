import { Field } from '../../../components/field';
import { Input } from '../../../components/input';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Field, Input } from '@thomascaron/ui';

<Field id="altitude" label="Altitude" hint="En mètres.">
  {(control) => <Input {...control} inputMode="numeric" name="altitude" />}
</Field>

<Input aria-label="Recherche" type="search" />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'type',
    type: 'HTMLInputTypeAttribute',
    defaultValue: "'text'",
    description: (
      <>
        Le type natif, avec un défaut posé par le composant. Un <code>type</code> mal choisi coûte
        le clavier adapté sur mobile : <code>email</code>, <code>tel</code>, <code>url</code>,{' '}
        <code>search</code> existent, servez-vous en.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-input</code>, jamais substitué.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLInputElement>',
    description: (
      <>
        Atterrit sur l’<code>&lt;input&gt;</code>.
      </>
    ),
  },
];

export const inputPage: DocPage = {
  slug: 'composants/input',
  label: 'Input',
  group: 'composants',
  title: 'Input',
  lede: (
    <>
      Un champ de saisie sur une ligne. Même liseré, même hauteur (<code>--target-min</code>,
      44&nbsp;px) et même rayon (<code>--radius-sm</code>) que{' '}
      <a className="tc-doc-link" href={hrefFor('composants/select')}>
        Select
      </a>{' '}
      et{' '}
      <a className="tc-doc-link" href={hrefFor('composants/textarea')}>
        Textarea
      </a>{' '}
      : les trois se posent dans le même formulaire et doivent s’aligner au pixel. L’état d’erreur
      se déclare par <code>aria-invalid</code> — posé automatiquement quand le champ est monté dans
      un{' '}
      <a className="tc-doc-link" href={hrefFor('composants/field')}>
        Field
      </a>{' '}
      porteur d’un <code>error</code>.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs d’Input" code={USAGE} />

      {/* Tous les spécimens de cette page passent par `Field`, et ce n'est pas
          un raccourci : un champ sans nom accessible n'est pas un spécimen
          valide, et `Field` est la façon dont la librairie le nomme. Les
          appels nus se documentent par le bloc de code ci-dessus. */}
      <Specimen
        title="Les états de la saisie"
        note="Repos, avec aide, en erreur, désactivé, en lecture seule. Aucun n’est porté par du JavaScript : ce sont des sélecteurs CSS — :hover, :focus-visible, [aria-invalid], :disabled, [readonly]. L’erreur, ici, n’est pas déclarée sur l’Input mais sur le Field qui l’enveloppe : c’est lui qui pose aria-invalid."
      >
        <div className="tc-doc-form">
          <Field id="input-demo-nom" label="Nom de l’étape">
            {(control) => <Input {...control} defaultValue="Col du Galibier" />}
          </Field>

          <Field
            id="input-demo-altitude"
            label="Altitude"
            hint="En mètres, arrondie à la dizaine. Laissez vide si la mesure manque."
          >
            {(control) => <Input {...control} inputMode="numeric" placeholder="2 642" />}
          </Field>

          <Field
            id="input-demo-date"
            label="Date de passage"
            hint="Format JJ/MM/AAAA."
            error="Cette date est postérieure à l’arrivée du voyage."
          >
            {(control) => <Input {...control} defaultValue="31/02/2024" />}
          </Field>

          <Field
            id="input-demo-ref"
            label="Référence interne"
            hint="Attribuée à la publication, non modifiable."
          >
            {(control) => <Input {...control} defaultValue="TIW-2024-018" disabled />}
          </Field>

          <Field
            id="input-demo-slug"
            label="Adresse publique"
            hint="Dérivée du nom, en lecture seule : le contrôle reste focusable et sa valeur reste copiable."
          >
            {(control) => <Input {...control} defaultValue="col-du-galibier" readOnly />}
          </Field>
        </div>
      </Specimen>

      <Specimen
        title="Les types qui changent le clavier"
        note="Le composant ne fait rien de spécial de ces valeurs — il les transmet — mais elles sont la moitié de l’ergonomie d’un formulaire mobile : type et inputMode décident du clavier affiché, et un champ numérique servi avec le clavier alphabétique est un champ qu’on remplit deux fois."
      >
        <div className="tc-doc-form">
          <Field id="input-demo-email" label="Adresse e-mail" hint='type="email"'>
            {(control) => <Input {...control} type="email" placeholder="thomas@exemple.fr" />}
          </Field>

          <Field id="input-demo-tel" label="Téléphone" hint='type="tel"'>
            {(control) => <Input {...control} type="tel" placeholder="06 12 34 56 78" />}
          </Field>

          <Field id="input-demo-recherche" label="Rechercher une étape" hint='type="search"'>
            {(control) => <Input {...control} type="search" placeholder="Galibier" />}
          </Field>
        </div>
      </Specimen>

      <Specimen
        title="Le focus du champ"
        note="Tabulez dans le cadre. Le double anneau se peint SUR le liseré du champ sans le remplacer : le liseré dit « ceci est un champ », l’anneau dit « c’est ici que vous êtes »."
      >
        <div className="tc-doc-focusdemo">
          <Field id="input-demo-focus" label="Un champ">
            {(control) => <Input {...control} placeholder="Tabulez jusqu’ici" />}
          </Field>
        </div>
      </Specimen>

      <PropsTable
        id="input"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;input&apos;&gt;</code> sans rien
            retirer : <code>name</code>, <code>value</code>, <code>defaultValue</code>,{' '}
            <code>placeholder</code>, <code>required</code>, <code>disabled</code>,{' '}
            <code>readOnly</code>, <code>inputMode</code>, <code>autoComplete</code>,{' '}
            <code>onChange</code> et tous les autres attributs natifs traversent jusqu’à l’élément.
            Le composant n’ajoute aucune prop propre — il pose un défaut et une classe.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>Un Input a besoin d’un nom accessible, et il ne le fabrique pas.</strong> Montez-le
        dans un <code>Field</code>, qui câble le <code>&lt;label for&gt;</code> ; à défaut — une
        barre de recherche sans libellé visible, par exemple — posez un <code>aria-label</code>. Un{' '}
        <code>placeholder</code> n’est <em>pas</em> un libellé : il disparaît à la première frappe,
        et ce qui reste alors à l’écran ne dit plus ce que le champ attend.
      </p>
    </PageBody>
  ),
};
