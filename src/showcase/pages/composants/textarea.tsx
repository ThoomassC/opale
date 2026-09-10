import { Field } from '../../../components/field';
import { Textarea } from '../../../components/textarea';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Field, Textarea } from '@thomascaron/opale';

<Field id="recit" label="Récit" hint="Deux paragraphes suffisent.">
  {(control) => <Textarea {...control} name="recit" rows={8} />}
</Field>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'rows',
    type: 'number',
    defaultValue: '4',
    description:
      'La hauteur initiale, en lignes — un défaut, pas une limite : la zone reste redimensionnable.',
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-textarea</code>, jamais substitué.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLTextAreaElement>',
    description: (
      <>
        Atterrit sur le <code>&lt;textarea&gt;</code>.
      </>
    ),
  },
];

export const textareaPage: DocPage = {
  slug: 'composants/textarea',
  label: 'Textarea',
  group: 'composants',
  title: 'Textarea',
  lede: (
    <>
      Une zone de saisie multiligne, redimensionnable <strong>en hauteur seulement</strong> (
      <code>resize: vertical</code>) : un élargissement libre casserait la largeur de ligne bornée
      du formulaire. Le liseré, le rayon et l’état d’erreur sont ceux d’
      <a className="tc-doc-link" href={hrefFor('composants/input')}>
        Input
      </a>
      , et <code>rows</code> vaut 4 par défaut.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appel représentatif de Textarea" code={USAGE} />

      <Specimen
        title="Les états de la zone multiligne"
        note="Attrapez le coin inférieur droit — la zone s’étire vers le bas, jamais vers la droite — et notez que l’erreur est déclarée sur le Field qui enveloppe, pas sur la zone."
      >
        <div className="tc-doc-form">
          <Field
            id="textarea-demo-recit"
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

          <Field
            id="textarea-demo-notes"
            label="Notes de terrain"
            hint="rows=&#123;8&#125; — huit lignes, parce qu’on en attend huit."
          >
            {(control) => (
              <Textarea {...control} rows={8} placeholder="Ce qui ne rentre pas ailleurs…" />
            )}
          </Field>

          <Field
            id="textarea-demo-resume"
            label="Résumé"
            hint="280 caractères au plus."
            error="Le résumé dépasse de 42 caractères."
          >
            {(control) => (
              <Textarea
                {...control}
                rows={3}
                defaultValue="Onze jours entre Kyoto et la vallée de Kiso, à pied et en train régional, avec deux nuits en ryokan et une journée entière perdue à chercher un col qui n’existait plus depuis 1997."
              />
            )}
          </Field>

          <Field
            id="textarea-demo-archive"
            label="Récit archivé"
            hint="Non modifiable : l’étape est publiée."
          >
            {(control) => (
              <Textarea
                {...control}
                rows={2}
                defaultValue="Version publiée le 18 juin 2024."
                disabled
              />
            )}
          </Field>
        </div>
      </Specimen>

      <Specimen
        title="Le focus de la zone"
        note="Tabulez dans le cadre : l’anneau est peint par outline et box-shadow, donc il épouse la boîte réelle même après un redimensionnement."
      >
        <div className="tc-doc-focusdemo">
          <Field id="textarea-demo-focus" label="Une zone de texte">
            {(control) => <Textarea {...control} rows={3} placeholder="Tabulez jusqu’ici" />}
          </Field>
        </div>
      </Specimen>

      <PropsTable
        id="textarea"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;textarea&apos;&gt;</code> sans
            rien retirer : tous les attributs natifs traversent jusqu’à l’élément.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <code>maxLength</code> tronque la frappe en silence : annoncez la limite dans le{' '}
        <code>hint</code> du{' '}
        <a className="tc-doc-link" href={hrefFor('composants/field')}>
          Field
        </a>
        , et refusez l’envoi par un <code>error</code>, qui porte{' '}
        <code>role=&quot;alert&quot;</code>.
      </p>
    </PageBody>
  ),
};
