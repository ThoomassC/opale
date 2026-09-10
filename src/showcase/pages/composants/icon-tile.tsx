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

const USAGE = `import { IconTile } from '@thomascaron/opale';

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
      Elle est <strong>présentationnelle par défaut et rend un lien</strong> dès qu’un{' '}
      <code>href</code> est fourni, parce que le contrat de couleur lie l’encre au rôle.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel d’IconTile" code={USAGE} />

      <Specimen
        title="Les tuiles d’icône — deux encres, deux rôles, deux formats"
        note={
          <>
            Décor en cuivre à 48 px, contrôle en teal à 44 px — le plancher de cible tactile ; le{' '}
            <code>&lt;span&gt;</code> reçoit <code>aria-hidden</code>, le <code>&lt;a&gt;</code>{' '}
            jamais, et son nom accessible vient de la prop <code>label</code>.
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

      <p className="tc-doc-prose">
        <strong>La tuile n’est pas un bouton</strong> : pour une action qui n’est pas une
        navigation, c’est{' '}
        <a className="tc-doc-link" href={hrefFor('composants/button')}>
          Button
        </a>{' '}
        qu’il faut.
      </p>

      <PropsTable
        id="icon-tile-decor"
        title="IconTileDecorProps — la tuile décorative"
        note={
          <>
            La branche par défaut : <code>ComponentPropsWithoutRef&lt;&apos;span&apos;&gt;</code>{' '}
            plus les trois props ci-dessous, et le composant pose lui-même{' '}
            <code>aria-hidden=&quot;true&quot;</code>.
          </>
        }
        rows={[
          {
            name: 'tone',
            type: "'decor'",
            defaultValue: "'decor'",
            description: (
              <>
                <strong>Figé</strong> : une tuile sans lien n’emprunte pas l’encre des actions.
              </>
            ),
          },
          {
            name: 'href',
            type: 'never',
            description: (
              <>
                Interdit sur cette branche — sa présence <em>fait</em> l’autre branche.
              </>
            ),
          },
          {
            name: 'label',
            type: 'never',
            description: <>Interdit ici : il n’y a rien à nommer.</>,
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: <>Le glyphe, déjà masqué par la tuile.</>,
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-icontile tc-icontile--decor</code> ; c’est aussi
                l’échappatoire de l’encre d’action (<code>tc-icontile--action</code>) pour une tuile
                posée dans un <code>&lt;button&gt;</code>.
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
            plus les trois props ci-dessous : <code>aria-label</code> est <strong>retiré</strong> du
            type pour qu’un lien n’ait qu’un seul nom (WCAG 2.5.3), <code>aria-labelledby</code>{' '}
            restant disponible pour désigner un titre visible.
          </>
        }
        rows={[
          {
            name: 'href',
            type: 'string',
            required: true,
            description: (
              <>
                Sa présence fait de la tuile un <code>&lt;a&gt;</code>, et{' '}
                <strong>la chaîne vide compte pour absente</strong> : la tuile retombe alors sur son{' '}
                <code>&lt;span&gt;</code> décoratif et le signale en <code>console.error</code>.
              </>
            ),
          },
          {
            name: 'label',
            type: 'string',
            required: true,
            description: (
              <>
                Le nom accessible du lien, rendu en <code>.tc-visually-hidden</code> — l’icône est
                son seul contenu visible (WCAG 4.1.2 et 2.4.4).
              </>
            ),
          },
          {
            name: 'tone',
            type: "'action'",
            defaultValue: "'action'",
            description: (
              <>
                <strong>Figé</strong> : l’encre du seul contenu visible d’un contrôle porte du sens.
              </>
            ),
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: (
              <>
                Le glyphe, à masquer vous-même (<code>aria-hidden=&quot;true&quot;</code>).
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
        La tuile est la première colonne d’une entrée de{' '}
        <a className="tc-doc-link" href={hrefFor('composants/timeline')}>
          Timeline
        </a>
        , et ses deux encres sont sur la{' '}
        <a className="tc-doc-link" href={hrefFor('palette')}>
          page de la palette
        </a>
        .
      </p>
    </PageBody>
  ),
};
