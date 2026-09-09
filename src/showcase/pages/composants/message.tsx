import { Message } from '../../../components/message';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Message } from '@thomascaron/ui';

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
        La <strong>nature</strong> du message : succès, avertissement, échec. Elle décide du glyphe
        (<code>✓</code>, <code>▲</code>, <code>✕</code>), du lavis et du préfixe masqué
        visuellement.
      </>
    ),
  },
  {
    name: 'live',
    type: "'off' | 'polite' | 'assertive'",
    defaultValue: "'off'",
    description: (
      <>
        L’<strong>urgence</strong>, et elle est orthogonale au ton. <code>off</code> ne pose aucun
        rôle ; <code>polite</code> pose <code>role=&quot;status&quot;</code> — annoncé quand le
        lecteur d’écran a fini sa phrase ; <code>assertive</code> pose{' '}
        <code>role=&quot;alert&quot;</code>, qui interrompt, et se réserve à ce qui bloque
        l’utilisateur.
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
      Un bandeau d’état : glyphe et texte, <strong>jamais la couleur seule</strong>. Deux axes
      indépendants le décrivent — <code>tone</code> dit la nature du message, <code>live</code> dit
      son urgence — et c’est <code>live</code> qui choisit le rôle ARIA, parce qu’un message présent
      au chargement n’a rien à annoncer alors qu’un message qui arrive après un envoi doit se faire
      entendre. C’est aussi ici que vit le vocabulaire de la <em>sévérité</em> : l’avancement, lui,
      est celui de{' '}
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
        note='La prop live choisit le rôle : « polite » pose role="status", « assertive » pose role="alert". Par défaut, aucun rôle — un message présent au chargement n’a rien à annoncer, et les trois spécimens ci-dessous s’en tiennent donc au défaut : une page de catalogue n’a pas à se faire annoncer. Chaque bandeau porte en outre un préfixe masqué visuellement — « Succès : », « Attention : », « Erreur : » — parce que ni le glyphe, qui est aria-hidden, ni role="status", qui transporte l’urgence et non la nature, ne disent le ton.'
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
      <Specimen
        title="Le bandeau d’une seule ligne"
        note="La forme qu’un formulaire produit vraiment. Le glyphe est aligné sur la première ligne du corps et non centré verticalement : centré, il flotterait au milieu d’un message de cinq lignes."
      >
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
            <code>id</code>, <code>aria-*</code> et tout autre attribut natif traversent jusqu’au
            conteneur — ce qui est ce dont on a besoin pour le désigner depuis un{' '}
            <code>aria-describedby</code>. <code>children</code> est le corps du message ; il est
            rendu dans <code>.tc-message__body</code>, après le glyphe et le préfixe de ton.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>
          Le ton est doublé par un préfixe masqué visuellement, et ce n’est pas un ornement.
        </strong>{' '}
        Le glyphe est <code>aria-hidden</code>, et la classe de ton est purement visuelle : sans ce
        préfixe, rien ne distinguait un succès d’une erreur à l’oreille — pas même{' '}
        <code>role=&quot;status&quot;</code>, qui transporte l’urgence et non la nature. Un{' '}
        <code>&lt;Message tone=&quot;error&quot;&gt;Échec de l’envoi&lt;/Message&gt;</code> désigné
        par un <code>aria-describedby</code> produit donc exactement la description
        «&nbsp;Erreur&nbsp;: Échec de l’envoi&nbsp;», glyphe exclu. C’est mesuré par les tests du
        composant, et c’est l’application du principe rappelé dans{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>{' '}
        : la couleur n’est qu’un renfort.
      </p>

      <p className="tc-doc-prose tc-doc-aside">
        <strong>
          Une région dynamique doit exister dans le DOM <em>avant</em> que son contenu change.
        </strong>{' '}
        Un <code>Message</code> monté déjà rempli n’est annoncé de façon fiable par aucun lecteur
        d’écran : si vous comptez sur <code>live</code>, rendez le bandeau en permanence — vide tant
        qu’il n’y a rien à dire — au lieu de le monter à l’apparition du message. C’est précisément
        pour cette raison que{' '}
        <a className="tc-doc-link" href={hrefFor('composants/field')}>
          Field
        </a>{' '}
        n’a <em>pas</em> de prop symétrique et pose <code>role=&quot;alert&quot;</code> en dur : son
        nœud d’erreur, lui, n’existe pas tant qu’il n’y a pas d’erreur. Aucun spécimen de cette page
        ne rend <code>live</code> autrement qu’au défaut : trois bandeaux <code>assertive</code>{' '}
        dans un catalogue interrompraient le lecteur d’écran au chargement de la page pour lui lire
        de la documentation.
      </p>
    </PageBody>
  ),
};
