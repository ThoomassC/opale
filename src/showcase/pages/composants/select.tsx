import { Field } from '../../../components/field';
import { Select } from '../../../components/select';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Field, Select } from '@thomascaron/opale';

<Field id="transport" label="Moyen de transport">
  {(control) => (
    <Select {...control} name="transport" defaultValue="velo">
      <option value="marche">À pied</option>
      <option value="velo">À vélo</option>
    </Select>
  )}
</Field>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: (
      <>
        Les <code>&lt;option&gt;</code> et <code>&lt;optgroup&gt;</code>, écrits en clair — le
        composant n’accepte pas de tableau de valeurs.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-select</code>, jamais substitué.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLSelectElement>',
    description: (
      <>
        Atterrit sur le <code>&lt;select&gt;</code>.
      </>
    ),
  },
];

export const selectPage: DocPage = {
  slug: 'composants/select',
  label: 'Select',
  group: 'composants',
  title: 'Select',
  lede: (
    <>
      Une liste déroulante <strong>native</strong>, chevron du système compris : la librairie
      s’interdit toute ressource, même une <code>url()</code> en ligne. Le liseré, la hauteur (
      <code>--target-min</code>, 44&nbsp;px) et le rayon sont ceux d’
      <a className="tc-doc-link" href={hrefFor('composants/input')}>
        Input
      </a>
      .
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appel représentatif de Select" code={USAGE} />

      <Specimen
        title="Les états de la liste déroulante"
        note="L’erreur n’est pas déclarée sur le Select mais sur le Field qui l’enveloppe : c’est lui qui pose aria-invalid et qui annonce le message."
      >
        <div className="tc-doc-form">
          <Field
            id="select-demo-moyen"
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
            id="select-demo-voyage"
            label="Voyage de rattachement"
            error="Ce voyage a été archivé : choisissez-en un autre."
          >
            {(control) => (
              <Select {...control} defaultValue="">
                <option value="">Choisir un voyage…</option>
                <option value="japon">Japon, printemps 2024</option>
                <option value="islande">Islande, été 2023</option>
              </Select>
            )}
          </Field>

          <Field
            id="select-demo-statut"
            label="Statut de publication"
            hint="Verrouillé tant que l’étape n’a pas de date."
          >
            {(control) => (
              <Select {...control} defaultValue="brouillon" disabled>
                <option value="brouillon">Brouillon</option>
                <option value="publie">Publié</option>
              </Select>
            )}
          </Field>
        </div>
      </Specimen>

      {/* Les groupes d'options, qui ne se voient nulle part ailleurs et qui
          sont la seule raison sérieuse de préférer le menu natif à une liste
          maison : `<optgroup>` est annoncé par les lecteurs d'écran, et une
          fausse liste en `<div>` ne l'annonce pas. */}
      <Specimen
        title="Les options groupées"
        note="Le libellé d’un optgroup est annoncé par le lecteur d’écran comme le nom du groupe, ce qu’aucune fausse liste bâtie en <div> ne sait faire sans le reconstruire à l’ARIA."
      >
        <div className="tc-doc-form">
          <Field id="select-demo-etape" label="Étape de départ">
            {(control) => (
              <Select {...control} defaultValue="kyoto">
                <optgroup label="Japon">
                  <option value="kyoto">Kyoto</option>
                  <option value="kiso">Vallée de Kiso</option>
                </optgroup>
                <optgroup label="Islande">
                  <option value="reykjavik">Reykjavík</option>
                  <option value="vik">Vík</option>
                </optgroup>
              </Select>
            )}
          </Field>
        </div>
      </Specimen>

      <Specimen
        title="Le focus de la liste"
        note="Tabulez dans le cadre : le double anneau se pose sur le contrôle fermé, le menu ouvert étant peint par le système."
      >
        <div className="tc-doc-focusdemo">
          <Field id="select-demo-focus" label="Une liste">
            {(control) => (
              <Select {...control} defaultValue="velo">
                <option value="marche">À pied</option>
                <option value="velo">À vélo</option>
              </Select>
            )}
          </Field>
        </div>
      </Specimen>

      <PropsTable
        id="select"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;select&apos;&gt;</code> sans rien
            retirer ni rien ajouter : tous les attributs natifs traversent jusqu’à l’élément.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        Un <code>Select</code> ne fabrique pas son nom accessible : montez-le dans un{' '}
        <a className="tc-doc-link" href={hrefFor('composants/field')}>
          Field
        </a>
        , qui câble le <code>&lt;label for&gt;</code>.
      </p>
    </PageBody>
  ),
};
