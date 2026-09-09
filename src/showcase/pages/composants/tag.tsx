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
        <code>plain</code> — pilule neutre, sans glyphe&nbsp;; <code>measured</code> — bordure
        pleine, losange plein&nbsp;; <code>proposed</code> — bordure tiretée, losange creux&nbsp;;{' '}
        <code>open</code> — bordure pointillée, cercle creux.
      </>
    ),
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: (
      <>
        Le libellé, et la seule chose que le lecteur d’écran entend : le glyphe est{' '}
        <code>aria-hidden</code>.
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
      Une étiquette, neutre par défaut : <code>plain</code> est la chip de stack technique du
      portfolio. Les trois variantes de charte se séparent par la{' '}
      <strong>forme de la bordure</strong> — pleine, tiretée, pointillée — et par le glyphe, jamais
      par la seule couleur.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Tag" code={USAGE} />

      <Specimen title="Étiquettes — le défaut est neutre" inline>
        <Tag>TypeScript</Tag>
        <Tag>PostgreSQL</Tag>
        <Tag>Vitest</Tag>
      </Specimen>

      <Specimen
        title="Étiquettes — les trois variantes de charte"
        note="Imprimées en noir et blanc, les trois restent distinctes : la forme de la bordure et le glyphe survivent, la couleur non."
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
      <Specimen title="Les quatre dans la même rangée" inline>
        <Tag>Vitest</Tag>
        <Tag variant="measured">Mesuré</Tag>
        <Tag variant="proposed">Proposé</Tag>
        <Tag variant="open">Question ouverte</Tag>
      </Specimen>

      <PropsTable
        id="tag"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;span&apos;&gt;</code> : les
            attributs natifs traversent jusqu’au <code>&lt;span&gt;</code> racine, et l’étiquette ne
            pose aucun rôle.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        Le glyphe est <code>aria-hidden</code> : le sens est porté par le libellé, qu’il faut donc
        écrire en clair — la démonstration en niveaux de gris est dans{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        .
      </p>
    </PageBody>
  ),
};
