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
    description: (
      <>
        L’avancement : acquis, en cours, à venir. <strong>Requis</strong> — une pastille sans état
        n’existe pas dans cette charte — et c’est aussi ce qui rend le libellé de repli possible.
      </>
    ),
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: (
      <>
        Le libellé lisible, et le <strong>garde-fou réel</strong> du composant. Absent ou vide, le
        nom du ton prend sa place et la faute part en <code>console.error</code> : la pastille est
        toujours rendue, et elle porte toujours un libellé.
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
      Une pastille d’<strong>avancement</strong> — et l’axe est bien l’avancement, pas la sévérité :{' '}
      <code>success | warning | danger</code> a quitté ce composant pour{' '}
      <a className="tc-doc-link" href={hrefFor('composants/message')}>
        Message
      </a>
      , parce que deux composants qui prétendent porter le même sens ne disent plus lequel choisir.
      Le sens ne repose jamais sur la couleur : chaque pastille porte un glyphe (masqué aux
      technologies d’assistance, il double le texte) <em>et</em> un libellé lisible — les trois
      teintes sont mesurées indiscernables en deutéranopie, donc le libellé est le garde-fou réel,
      et il est <strong>toujours rendu</strong>.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Pill" code={USAGE} />

      <Specimen
        title="Pastilles — l’avancement"
        note="Trois tons d’avancement, et rien d’autre : la sévérité (succès, attention, erreur) est le vocabulaire de Message, pas celui d’une pastille. La bordure en currentColor n’est pas décorative — l’aplat de l’acquis mesure 2,20:1 contre une carte sombre, sous le seuil de WCAG 1.4.11, et c’est elle qui rattrape la forme à 18,48:1. Le glyphe non plus n’est pas un ornement : en simulation deutéranope, l’ambre et le violet tombent à 1,16:1 l’un contre l’autre. Retirez la couleur : le remplissage du glyphe et le libellé restent."
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
      <Specimen
        title="Le libellé appartient à l’appelant, le ton au composant"
        note="Les mêmes trois tons, avec le vocabulaire d’un autre domaine. Le glyphe et la couleur viennent du ton ; le mot, jamais — c’est pourquoi children n’est pas une énumération. Ce que le composant garantit, c’est qu’un mot est toujours là."
        inline
      >
        <Pill tone="done">Diplômé</Pill>
        <Pill tone="progress">En alternance</Pill>
        <Pill tone="upcoming">Rentrée 2026</Pill>
      </Specimen>

      <PropsTable
        id="pill"
        note={
          <>
            Le type étend <code>ComponentPropsWithoutRef&lt;&apos;span&apos;&gt;</code> :{' '}
            <code>id</code>, <code>title</code>, <code>data-*</code> et le reste des attributs
            natifs traversent jusqu’au <code>&lt;span&gt;</code> racine. La pastille ne pose{' '}
            <em>aucun</em> rôle et n’est pas une région dynamique : une liste de dix pastilles qui
            s’annoncent au chargement est un bruit, pas une information.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>Le libellé manquant replie, il ne lève plus.</strong> Le composant levait, et le
        raisonnement était «&nbsp;les deux consommateurs sont prérendus, la faute se voit au
        build&nbsp;». C’est faux, et vérifié faux : le portfolio fait{' '}
        <code>tsc -b &amp;&amp; vite build</code>, sans <code>react-dom/server</code> ni plugin de
        prérendu, son <code>main.tsx</code> est un <code>createRoot</code> nu, et il n’y a pas d’
        <code>ErrorBoundary</code> — un <code>vite build</code> ne rend aucun composant React. Une
        pastille au libellé vide passait donc le build, passait <code>tsc</code>, et démontait la
        racine React au chargement : page blanche pour tous les visiteurs, à cause d’un badge. Le
        repli est le seul arbitrage défendable&nbsp;: un libellé imprécis est un défaut sur{' '}
        <em>un</em> élément, une racine démontée est la perte totale du contenu pour tout le monde.
        Une librairie peut signaler une faute bruyamment ; elle ne peut pas emporter la page avec
        elle.
      </p>

      <UsageBlock label="Ce que produit un libellé manquant" code={FALLBACK} />

      <p className="tc-doc-prose tc-doc-aside">
        <strong>Ce que le garde n’attrape pas, et ne peut pas attraper.</strong> Tout élément React
        est tenu pour visible sans être inspecté :{' '}
        <code>&lt;Pill tone=&quot;done&quot;&gt;&lt;span /&gt;&lt;/Pill&gt;</code> passe donc à
        travers et rend une pastille muette. Descendre dans un arbre d’enfants demanderait de
        connaître le rendu de chacun, ce qu’un composant ne peut pas faire. Le mode de défaillance
        réel — une chaîne vide venue des données — est, lui, couvert ; <code>{'{0}'}</code> aussi,
        qui est un libellé légitime. Le rendu en niveaux de gris de ces trois pastilles, qui est la
        vraie démonstration de leur indiscernabilité, se regarde dans{' '}
        <a className="tc-doc-link" href={hrefFor('accessibilite')}>
          Le contrat d’accessibilité
        </a>
        .
      </p>
    </PageBody>
  ),
};
