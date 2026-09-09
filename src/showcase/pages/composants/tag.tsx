import { Tag } from '../../../components/tag';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Tag } from '@thomascaron/ui';

<Tag>TypeScript</Tag>
<Tag variant="measured">Mesuré</Tag>
<Tag variant="proposed">Proposé</Tag>
<Tag variant="open">Question ouverte</Tag>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'variant',
    type: "'plain' | 'measured' | 'proposed' | 'open'",
    defaultValue: "'plain'",
    description: (
      <>
        <code>plain</code> — étiquette neutre : pilule sans-serif, aucun glyphe, c’est la chip de
        stack technique du portfolio&nbsp;; <code>measured</code> — donnée mesurée, bordure{' '}
        <strong>pleine</strong>, losange plein&nbsp;; <code>proposed</code> — proposée et non encore
        vérifiée, bordure <strong>tiretée</strong>, losange creux&nbsp;; <code>open</code> —
        question ouverte, bordure <strong>pointillée</strong>, cercle creux.
      </>
    ),
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: (
      <>
        Le libellé, rendu dans <code>.tc-tag__label</code>. C’est la seule chose que le lecteur
        d’écran entend : le glyphe des trois variantes de charte est <code>aria-hidden</code>.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-tag</code> et la classe de variante, jamais substitué.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLSpanElement>',
    description: 'Atterrit sur le <span> racine.',
  },
];

export const tagPage: DocPage = {
  slug: 'composants/tag',
  label: 'Tag',
  group: 'composants',
  title: 'Tag',
  lede: (
    <>
      Une étiquette, neutre par défaut. <code>plain</code> est la chip de stack technique du
      portfolio, et c’est le <strong>défaut</strong> : là où le préfixe désigne un emplacement et
      non un sens, il n’y a rien à distinguer. Les trois variantes de charte se séparent, elles, par
      la <strong>forme de la bordure</strong> — pleine, tiretée, pointillée — et par le glyphe,
      jamais par la seule couleur : imprimé en noir et blanc, le tableau reste lisible.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Tag" code={USAGE} />

      <Specimen
        title="Étiquettes — le défaut est neutre"
        note="Sans variante, une étiquette est une chip : pilule, sans-serif, aucun glyphe. C’est ce qu’attend une liste de stack technique, où l’emplacement ne porte aucun sens à distinguer."
        inline
      >
        <Tag>TypeScript</Tag>
        <Tag>PostgreSQL</Tag>
        <Tag>Vitest</Tag>
      </Specimen>

      <Specimen
        title="Étiquettes — les trois variantes de charte"
        note="Elles restent parce que cette page en a besoin : c’est son seul moyen de marquer une donnée mesurée, proposée ou restée ouverte. La distinction passe par la forme de la bordure — pleine, tiretée, pointillée — et par le glyphe. Imprimée en noir et blanc, la nuance survit."
        inline
      >
        <Tag variant="measured">Mesuré</Tag>
        <Tag variant="proposed">Proposé</Tag>
        <Tag variant="open">Question ouverte</Tag>
      </Specimen>

      {/* Les quatre ensemble, ce que ni l'un ni l'autre des deux spécimens
          ci-dessus ne montre : la question réelle, à l'usage, est de savoir si
          une chip neutre se distingue d'une variante de charte dans la MÊME
          rangée — sinon les deux vocabulaires se mélangent à l'œil. */}
      <Specimen
        title="Les quatre dans la même rangée"
        note="La chip neutre à côté des trois variantes. C’est la seule disposition qui répond à la question qui compte : les deux vocabulaires — l’emplacement et le statut — restent-ils séparables quand ils voisinent ? Le glyphe est ce qui les sépare, et plain n’en a pas."
        inline
      >
        <Tag>Vitest</Tag>
        <Tag variant="measured">Mesuré</Tag>
        <Tag variant="proposed">Proposé</Tag>
        <Tag variant="open">Question ouverte</Tag>
      </Specimen>

      <PropsTable
        id="tag"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;span&apos;&gt;</code> :{' '}
            <code>id</code>, <code>title</code>, <code>lang</code>, <code>data-*</code> et le reste
            des attributs natifs traversent jusqu’au <code>&lt;span&gt;</code> racine. L’étiquette
            ne pose aucun rôle et n’est pas une région dynamique.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>Le glyphe est un renfort, pas une information.</strong> <code>.tc-tag__glyph</code>{' '}
        porte <code>aria-hidden=&quot;true&quot;</code> : une étiquette <code>measured</code>{' '}
        désignée par un <code>aria-describedby</code> produit la description «&nbsp;Mesuré&nbsp;»,
        sans le losange. Ce qui porte le sens est donc le libellé — écrivez-le en clair, et non
        «&nbsp;M&nbsp;». La démonstration en niveaux de gris des quatre variantes est dans{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        , et le vocabulaire d’<em>avancement</em>, qui n’est pas celui-ci, appartient à{' '}
        <a className="tc-doc-link" href={hrefFor('composants/pill')}>
          Pill
        </a>
        .
      </p>
    </PageBody>
  ),
};
