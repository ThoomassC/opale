import { Pill } from '../../../components/pill';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';

const USAGE = `import { Pill } from '@thomascaron/ui';

<Pill tone="done">Obtenu</Pill>
<Pill tone="progress">En cours</Pill>
<Pill tone="upcoming">À venir</Pill>`;

/* L'appel FAUTIF, rendu en TEXTE et non en JSX : le composant signale la
   faute en `console.error`, et un test de fumée rend toutes les pages en
   échouant sur `console.error`. La documenter ne doit pas la commettre. */
const FALLBACK = `// La faute, telle qu'elle arrive vraiment : la donnée est vide.
<Pill tone="progress">{project.status}</Pill>
//   → rend « En cours », le nom du ton
//   → console.error: Pill: aucun libellé textuel reçu (tone="progress")…`;

const PROPS: readonly PropRow[] = [
  {
    name: 'tone',
    type: "'done' | 'progress' | 'upcoming'",
    required: true,
    description: 'L’avancement : acquis, en cours, à venir. C’est aussi le libellé de repli.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: (
      <>
        Le libellé lisible ; absent ou vide, le nom du ton prend sa place et la faute part en{' '}
        <code>console.error</code>.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné avec <code>tc-pill</code> et la classe de ton, jamais substitué.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLSpanElement>',
    description: 'Atterrit sur le <span> racine.',
  },
];

export const pillPage: DocPage = {
  slug: 'composants/pill',
  label: 'Pill',
  group: 'composants',
  title: 'Pill',
  lede: (
    <>
      Une pastille d’<strong>avancement</strong> — acquis, en cours, à venir ; la sévérité est le
      vocabulaire de{' '}
      <a className="tc-doc-link" href={hrefFor('composants/message')}>
        Message
      </a>
      . Le sens ne repose jamais sur la couleur : chaque pastille porte un glyphe et un libellé, et
      le libellé est <strong>toujours rendu</strong>.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Pill" code={USAGE} />

      <Specimen
        title="Pastilles — l’avancement"
        note="Mesuré : l’aplat de l’acquis tombe à 2,20:1 contre une carte sombre, sous le seuil de WCAG 1.4.11 — c’est sa bordure en currentColor, à 18,48:1, qui rattrape la forme — et en simulation deutéranope l’ambre et le violet tombent à 1,16:1 l’un contre l’autre."
        inline
      >
        <Pill tone="done">Obtenu</Pill>
        <Pill tone="progress">En cours</Pill>
        <Pill tone="upcoming">À venir</Pill>
      </Specimen>

      {/* Les trois glyphes SEULS ne se lisent qu'ensemble : c'est leur
          remplissage — plein, à moitié, vide — qui porte la progression en
          niveaux de gris, et une rangée les met en regard. Les libellés
          diffèrent de ceux du spécimen ci-dessus exprès : le composant ne
          connaît pas le vocabulaire de l'appelant, seulement son ton. */}
      <Specimen title="Le libellé appartient à l’appelant, le ton au composant" inline>
        <Pill tone="done">Diplômé</Pill>
        <Pill tone="progress">En alternance</Pill>
        <Pill tone="upcoming">Rentrée 2026</Pill>
      </Specimen>

      <PropsTable
        id="pill"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;span&apos;&gt;</code> : les
            attributs natifs traversent jusqu’au <code>&lt;span&gt;</code> racine, et la pastille ne
            pose aucun rôle.
          </>
        }
        rows={PROPS}
      />

      <UsageBlock label="Ce que produit un libellé manquant" code={FALLBACK} />
    </PageBody>
  ),
};
