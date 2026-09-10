import { Message } from '../../../components/message';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Message } from '@thomascaron/opale';

<Message tone="ok">Palette enregistrée.</Message>

{/* La région existe en permanence : c'est la condition pour que son
    remplissage soit annoncé. */}
<Message tone="error" live="polite">{serverError}</Message>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'tone',
    type: "'ok' | 'warn' | 'error'",
    required: true,
    description: (
      <>
        La nature du message ; elle décide du glyphe (<code>✓</code>, <code>▲</code>, <code>✕</code>
        ), du lavis et du préfixe masqué visuellement.
      </>
    ),
  },
  {
    name: 'live',
    type: "'off' | 'polite' | 'assertive'",
    defaultValue: "'off'",
    description: (
      <>
        L’urgence, orthogonale au ton : <code>off</code> ne pose aucun rôle, <code>polite</code>{' '}
        pose <code>role=&quot;status&quot;</code>, <code>assertive</code> pose{' '}
        <code>role=&quot;alert&quot;</code>, qui interrompt.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-message</code> et la classe de ton.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    description: 'Atterrit sur le <div> racine, celui qui porte le rôle live.',
  },
];

export const messagePage: DocPage = {
  slug: 'composants/message',
  label: 'Message',
  group: 'composants',
  title: 'Message',
  lede: (
    <>
      Un bandeau d’état : glyphe et texte, <strong>jamais la couleur seule</strong>.{' '}
      <code>tone</code> dit la nature du message, <code>live</code> son urgence et donc son rôle
      ARIA — la sévérité vit ici, l’avancement chez{' '}
      <a className="tc-doc-link" href={hrefFor('composants/pill')}>
        Pill
      </a>
      .
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Message" code={USAGE} />

      <Specimen
        title="Messages"
        note="Chaque bandeau porte un préfixe masqué visuellement — « Succès : », « Attention : », « Erreur : » — parce que le glyphe est aria-hidden et que le rôle live transporte l’urgence, pas la nature."
      >
        <div className="tc-doc-stack">
          <Message tone="ok">
            <strong>Palette enregistrée.</strong> Les 47 jetons ont été recalculés, aucun ratio
            n’est passé sous son seuil.
          </Message>
          <Message tone="warn">
            <strong>Marge faible sur --accent-hover en thème sombre.</strong> 4,59:1 pour un seuil à
            4,50:1 : toute retouche de cette teinte doit être remesurée.
          </Message>
          <Message tone="error">
            <strong>Deux jetons divergent entre les deux thèmes sombres.</strong>{' '}
            <code>--rule</code> et <code>--border-subtle</code> sont déclarés dans le bloc média
            mais absents du bloc explicite.
          </Message>
        </div>
      </Specimen>

      {/* Un bandeau court, sans <strong> ni corps de deux lignes : c'est la
          forme qu'un formulaire produit réellement, et le rythme du glyphe
          face à une seule ligne ne se juge que comme ça. */}
      <Specimen title="Le bandeau d’une seule ligne">
        <div className="tc-doc-stack">
          <Message tone="ok">Étape publiée.</Message>
          <Message tone="warn">Trois étapes n’ont pas de date de passage.</Message>
          <Message tone="error">L’envoi a échoué : le serveur n’a pas répondu.</Message>
        </div>
      </Specimen>

      <PropsTable
        id="message"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> :{' '}
            <code>id</code> et <code>aria-*</code> traversent jusqu’au conteneur, ce qui permet de
            le désigner depuis un <code>aria-describedby</code>.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        Le préfixe masqué est ce qui rend le ton audible — la couleur n’est qu’un renfort, comme le
        rappelle{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        .
      </p>
    </PageBody>
  ),
};
