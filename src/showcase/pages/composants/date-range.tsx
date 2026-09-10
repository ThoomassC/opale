import { DateRange } from '../../../components/date-range';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';

/* =============================================================================
   DATERANGE — toute sa valeur est SÉMANTIQUE, donc invisible.

   C'est la page la plus ingrate du site : les trois formes de la plage se
   ressemblent à l'œil, et ce qui distingue le composant d'un `<p>` écrit à la
   main — deux `<time dateTime>` distincts, un séparateur PARLÉ, une fin ouverte
   qui n'est pas une date — ne s'entend qu'au lecteur d'écran. Le balisage émis
   est donc rendu en clair sous les spécimens : c'est la seule façon de montrer
   ce qu'on achète.
   ========================================================================== */

const USAGE = `import { DateRange } from '@thomascaron/opale';

// Plage fermée : deux <time> distincts.
<DateRange
  start={{ dateTime: '2023-09', label: 'Septembre 2023' }}
  end={{ dateTime: '2025-06', label: 'Juin 2025' }}
/>

// Plage OUVERTE : pas de \`end\`, la fin est du texte.
<DateRange start={{ dateTime: '2025-07', label: 'Juillet 2025' }} />`;

const EMITTED = `<p class="tc-daterange">
  <time datetime="2023-09">Septembre 2023</time>
  <span class="tc-visually-hidden"> à </span>
  <span aria-hidden="true"> — </span>
  <time datetime="2025-06">Juin 2025</time>
</p>`;

export const dateRangePage: DocPage = {
  slug: 'composants/date-range',
  label: 'DateRange',
  group: 'composants',
  title: 'DateRange',
  lede: (
    <>
      Une plage de dates, et <strong>toute sa valeur est sémantique</strong> : deux{' '}
      <code>&lt;time dateTime&gt;</code> distincts, là où un <code>dateTime</code> unique ne
      documenterait que le début. La relation « de … à … » est portée par un <strong>mot</strong>{' '}
      masqué visuellement et non par le cadratin, que NVDA, JAWS et VoiceOver ne prononcent pas à
      leur réglage de ponctuation par défaut.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de DateRange" code={USAGE} />

      <Specimen
        title="Les trois formes de la plage"
        note={
          <>
            Ce qui les sépare est le balisage : la première émet deux <code>&lt;time&gt;</code>, les
            deux suivantes un seul — leur fin est du <strong>texte simple</strong>, puisque «
            Aujourd’hui » n’est pas une date.
          </>
        }
      >
        <div className="tc-doc-stack">
          <DateRange
            start={{ dateTime: '2023-09', label: 'Septembre 2023' }}
            end={{ dateTime: '2025-06', label: 'Juin 2025' }}
          />
          <DateRange start={{ dateTime: '2025-07', label: 'Juillet 2025' }} />
          <DateRange
            start={{ dateTime: '2025-07', label: 'Juillet 2025' }}
            presentLabel="En cours"
          />
        </div>
      </Specimen>

      <Specimen
        title="Ce que le composant émet — le séparateur est un mot"
        note={
          <>
            Sans le mot masqué, on entendait « Septembre 2023 Juin 2025 » — deux dates juxtaposées,
            sans savoir laquelle est le début (WCAG 1.3.1) ; le cadratin, lui, est{' '}
            <code>aria-hidden</code>.
          </>
        }
      >
        <UsageBlock label="Balisage émis pour une plage fermée" code={EMITTED} />
      </Specimen>

      <PropsTable
        id="date-range"
        note={
          <>
            <code>
              DateRangeProps extends Omit&lt;ComponentPropsWithoutRef&lt;&apos;p&apos;&gt;,
              &apos;children&apos;&gt;
            </code>{' '}
            : le composant rend son contenu depuis les bornes, donc <code>children</code> est retiré
            du type.
          </>
        }
        rows={[
          {
            name: 'start',
            type: 'DateMark',
            required: true,
            description: (
              <>
                La borne de début. Toujours rendue en <code>&lt;time&gt;</code>.
              </>
            ),
          },
          {
            name: 'end',
            type: 'DateMark',
            description: (
              <>
                La borne de fin ; <strong>absente, la plage est ouverte</strong> et se termine sur{' '}
                <code>presentLabel</code>.
              </>
            ),
          },
          {
            name: 'presentLabel',
            type: 'string',
            defaultValue: 'Aujourd’hui',
            description: (
              <>
                Le texte de fin d’une plage ouverte, ignoré quand <code>end</code> est fourni.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-daterange</code>, jamais écrasée.
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLParagraphElement>',
            description: (
              <>
                Posée sur le <code>&lt;p&gt;</code>.
              </>
            ),
          },
        ]}
      />

      <PropsTable
        id="date-mark"
        title="DateMark — une borne, en deux moitiés"
        note={
          <>
            La date <strong>lisible par la machine</strong> et son libellé{' '}
            <strong>lisible par l’humain</strong> sont séparés à dessein.
          </>
        }
        rows={[
          {
            name: 'dateTime',
            type: 'string',
            required: true,
            description: (
              <>
                Une valeur de date valide au sens HTML, à la granularité de ce que le libellé
                affirme.
              </>
            ),
          },
          {
            name: 'label',
            type: 'string',
            required: true,
            description: <>Le texte affiché pour cette borne.</>,
          },
        ]}
      />

      <p className="tc-doc-prose">
        C’est la première ligne d’une entrée de frise : on le voit à sa place sur{' '}
        <a className="tc-doc-link" href={hrefFor('composants/timeline')}>
          Timeline
        </a>{' '}
        et dans les compositions de{' '}
        <a className="tc-doc-link" href={hrefFor('compositions/verre-et-frise')}>
          Verre et frise
        </a>
        .
      </p>
    </PageBody>
  ),
};
