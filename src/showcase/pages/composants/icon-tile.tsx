import { IconTile } from '../../../components/icon-tile';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';

/* =============================================================================
   ICONTILE — deux branches, et le type les tient séparées.

   La rangée de spécimens vient de la section « Portés du portfolio » : deux
   tuiles rigoureusement identiques à l'œil, dont l'une est un lien et l'autre
   du décor. C'est le cas d'école du `<figure>` / `<figcaption>` — sans légende,
   la différence est invisible.

   Le cas `href=""` n'est PAS rendu ici : il part en `console.error`, et un test
   de fumée rend toutes les pages en échouant sur la moindre écriture en
   console. Il est décrit dans le tableau, à sa ligne.
   ========================================================================== */

const USAGE = `import { IconTile } from '@thomascaron/ui';

// Décor : un <span aria-hidden>, encre cuivre. Le sens est dans le titre voisin.
<IconTile>
  <MonGlyphe />
</IconTile>

// Lien : un <a>, encre teal, et le nom accessible est EXIGÉ PAR LE TYPE.
<IconTile href={profil} label="Profil LinkedIn (nouvelle fenêtre)">
  <GlypheLinkedIn aria-hidden="true" />
</IconTile>`;

export const iconTilePage: DocPage = {
  slug: 'composants/icon-tile',
  label: 'IconTile',
  group: 'composants',
  title: 'IconTile',
  lede: (
    <>
      Une tuile en squircle portant une icône : géométrie fixe, matériau dégradé (
      <code>--icon-surface-start</code> → <code>--icon-surface-end</code>), liseré, ombre basse.
      Elle est <strong>présentationnelle par défaut et sait rendre un lien</strong> quand un{' '}
      <code>href</code> est fourni — parce que le rôle et l’encre sont liés par le contrat de
      couleur, et qu’une tuile décorative enveloppée dans le <code>&lt;a&gt;</code> de l’appelant
      serait exactement l’appariement que ce contrat interdit.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel d’IconTile" code={USAGE} />

      <Specimen
        title="Les tuiles d’icône — deux encres, deux rôles, deux formats"
        note={
          <>
            Même silhouette et même matériau dégradé, mais ni la même encre ni le même format : le
            décor est en cuivre à 48 px, le contrôle en teal à 44 px — le plancher de cible tactile,
            et la valeur du portfolio pour la même tuile. Les 4 px d’écart se voient dans cette
            rangée alors qu’ils ne se voient jamais dans une page, où les deux ne se côtoient pas.
            La tuile décorative est un <code>&lt;span&gt;</code> et reçoit <code>aria-hidden</code>{' '}
            ; la tuile en lien est un <code>&lt;a&gt;</code>, ne le reçoit jamais — un élément
            focusable masqué à l’arbre d’accessibilité est un piège au clavier — et son nom
            accessible est <strong>exigé par le type</strong>, la prop <code>label</code> rendue en
            texte masqué visuellement, l’icône étant son seul contenu visible.
          </>
        }
      >
        <div className="tc-doc-states">
          <figure className="tc-doc-states__cell">
            <IconTile>
              <span>◆</span>
            </IconTile>
            <figcaption className="tc-doc-states__label">
              decor — un &lt;span&gt;, aria-hidden, 48 px
            </figcaption>
          </figure>
          <figure className="tc-doc-states__cell">
            {/* Le lien va vraiment quelque part : `hrefFor` et non un fragment
                écrit à la main, sans quoi la tuile de démonstration serait le
                seul lien mort du site. */}
            <IconTile
              href={hrefFor('composants/button')}
              label="Aller à la page du composant Button"
            >
              <span aria-hidden="true">◆</span>
            </IconTile>
            <figcaption className="tc-doc-states__label">
              action — un &lt;a&gt;, nommé par sa prop label, 44 px
            </figcaption>
          </figure>
        </div>
      </Specimen>

      <p className="tc-doc-prose tc-doc-aside">
        <strong>La tuile n’est pas un bouton.</strong> Pour une action qui n’est pas une navigation,
        ou pour un contrôle à libellé visible, c’est{' '}
        <a className="tc-doc-link" href={hrefFor('composants/button')}>
          Button
        </a>{' '}
        qu’il faut : cette tuile ne porte ni la hauteur de cible d’un bouton (48 px) ni sa
        silhouette en pilule. Le seul cas légitime d’une encre d’action sans lien — la tuile est
        l’unique contenu visible d’un <code>&lt;button&gt;</code> rendu par l’appelant — passe par
        la <strong>classe</strong> et non par la prop :{' '}
        <code>&lt;IconTile className=&quot;tc-icontile--action&quot;&gt;</code>. Elle dit la même
        chose de l’encre, à l’endroit où l’appelant assume aussi le rôle, le nom et la focusabilité
        de son contrôle.
      </p>

      <PropsTable
        id="icon-tile-decor"
        title="IconTileDecorProps — la tuile décorative"
        note={
          <>
            La branche par défaut : <code>ComponentPropsWithoutRef&lt;&apos;span&apos;&gt;</code>{' '}
            plus les trois props ci-dessous. Le composant pose lui-même{' '}
            <code>aria-hidden=&quot;true&quot;</code> — c’est du décor, l’annoncer n’ajoute rien.
          </>
        }
        rows={[
          {
            name: 'tone',
            type: "'decor'",
            defaultValue: "'decor'",
            description: (
              <>
                <strong>Figé.</strong> Le type l’acceptait librement, et{' '}
                <code>&lt;IconTile tone=&quot;action&quot;&gt;</code> sans <code>href</code> était
                légal : un carré de 44 px à l’encre des actions, sans rôle, sans nom, sans{' '}
                <code>aria-hidden</code>, non focusable, et qui prenait même le film de survol. Un
                objet qui promet une action à l’œil et n’en offre aucune au clavier.
              </>
            ),
          },
          {
            name: 'href',
            type: 'never',
            description: (
              <>
                Interdit sur cette branche — sa présence <em>fait</em> l’autre branche. Il est
                néanmoins extrait du reste au rendu :{' '}
                <code>&lt;IconTile href=&#123;p.url&#125;&gt;</code> avec une URL vide est un appel
                légitime qui atterrit ici à l’exécution, et React poserait sinon l’attribut tel quel
                sur le <code>&lt;span&gt;</code>.
              </>
            ),
          },
          {
            name: 'label',
            type: 'never',
            description: (
              <>
                Interdit ici : il n’y a rien à nommer. Même extraction du reste, et pour la même
                raison — <code>label</code> n’existe pas comme attribut HTML.
              </>
            ),
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: <>Le glyphe. Il est déjà masqué avec la tuile, qui porte l’attribut.</>,
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-icontile tc-icontile--decor</code>. C’est aussi
                l’échappatoire de l’encre d’action décrite ci-dessus.
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLSpanElement>',
            description: (
              <>
                Posée sur le <code>&lt;span&gt;</code>.
              </>
            ),
          },
        ]}
      />

      <PropsTable
        id="icon-tile-link"
        title="IconTileLinkProps — la tuile qui est un lien"
        note={
          <>
            <code>
              Omit&lt;ComponentPropsWithoutRef&lt;&apos;a&apos;&gt;, &apos;aria-label&apos;&gt;
            </code>{' '}
            plus les trois props ci-dessous. <code>aria-label</code> est <strong>retiré</strong> du
            type : deux noms pour un même lien, dont un seul gagne, est une divergence silencieuse —
            et le nom accessible d’un lien doit correspondre à son libellé (WCAG 2.5.3), ce qui n’a
            de sens qu’à un seul nom. <code>aria-labelledby</code> reste disponible pour désigner un
            titre visible ; il gagne alors sur le texte masqué, comme le veut la spécification.
          </>
        }
        rows={[
          {
            name: 'href',
            type: 'string',
            required: true,
            description: (
              <>
                Sa présence fait de la tuile un <code>&lt;a&gt;</code>.{' '}
                <strong>La chaîne vide compte pour absente</strong> : la branche est choisie sur une
                chaîne non vide, parce que <code>&lt;a href=&quot;&quot;&gt;</code> est un lien vers
                l’adresse courante — cliquer rechargeait la page. Dans ce cas la tuile retombe sur
                son <code>&lt;span&gt;</code> décoratif et le signale en <code>console.error</code>,
                sans jamais lever.
              </>
            ),
          },
          {
            name: 'label',
            type: 'string',
            required: true,
            description: (
              <>
                Le nom accessible du lien, rendu en <code>.tc-visually-hidden</code>. L’icône étant
                le seul contenu <em>visible</em>, sans lui le lien n’a aucun nom : VoiceOver annonce
                « lien, losange noir », ou rien (WCAG 4.1.2 et 2.4.4). Une <strong>prop</strong> et
                non l’exigence d’un <code>aria-label</code> — un <code>aria-*</code> est un attribut
                parmi cent, qu’on peut oublier ou mal orthographier sans que rien ne le dise, alors
                qu’une prop nommée est refusée à la compilation. Nommez la destination, et signalez
                une nouvelle fenêtre.
              </>
            ),
          },
          {
            name: 'tone',
            type: "'action'",
            defaultValue: "'action'",
            description: (
              <>
                <strong>Figé.</strong> Une tuile qui <em>est</em> le lien est le seul contenu
                visible d’un contrôle : son encre porte du sens, elle ne peut pas retomber sur la
                couche décorative. Un cuivre sur un contrôle efface la promesse d’action.
              </>
            ),
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: (
              <>
                Le glyphe, à masquer vous-même (<code>aria-hidden=&quot;true&quot;</code>) : le nom
                du lien vient de <code>label</code>, et le composant n’a aucun moyen de toucher à
                votre nœud. Extrait explicitement du reste au rendu — un <code>&lt;a&gt;</code> dont
                le contenu n’arrive que par un étalement de props est indistinguable d’un lien vide,
                pour le linter comme pour le relecteur.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-icontile tc-icontile--action</code>.
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLAnchorElement>',
            description: (
              <>
                Posée sur le <code>&lt;a&gt;</code>.
              </>
            ),
          },
        ]}
      />

      <p className="tc-doc-prose">
        La tuile est la première colonne d’une entrée de frise : elle se voit à sa place sur{' '}
        <a className="tc-doc-link" href={hrefFor('composants/timeline')}>
          Timeline
        </a>
        . Les deux encres et leur interdiction croisée sont sur la{' '}
        <a className="tc-doc-link" href={hrefFor('palette')}>
          page de la palette
        </a>
        .
      </p>
    </PageBody>
  ),
};
