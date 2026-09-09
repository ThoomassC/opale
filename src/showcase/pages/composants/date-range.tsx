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

const USAGE = `import { DateRange } from '@thomascaron/ui';

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
      <code>&lt;time dateTime&gt;</code> distincts, parce qu’un <code>dateTime</code> unique ne
      documenterait que le début — la fin ne serait plus qu’un morceau de texte pour toute machine
      qui lit la page. La relation « de … à … » est portée par un <strong>mot</strong> masqué
      visuellement, et non par le cadratin : à leur réglage de ponctuation par défaut, NVDA, JAWS et
      VoiceOver ne prononcent pas U+2014.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de DateRange" code={USAGE} />

      <Specimen
        title="Les trois formes de la plage"
        note={
          <>
            Elles se ressemblent à l’œil, et c’est normal : ce qui les sépare est le balisage. La
            première émet deux <code>&lt;time&gt;</code> ; les deux suivantes n’en émettent qu’un,
            leur fin étant du <strong>texte simple</strong>. Poser un <code>&lt;time&gt;</code> sur
            « Aujourd’hui » obligerait à choisir une date — celle du build, ou celle du rendu — et
            cette date serait fausse dès le lendemain.
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
            Le seul porteur de la relation était le cadratin, et on entendait « Septembre 2023 Juin
            2025 » : deux dates juxtaposées, sans savoir laquelle est le début. Sur une frise où
            chaque entrée en porte une, l’ambiguïté est systématique (WCAG 1.3.1). Le mot est donc
            rendu en texte masqué, et le cadratin devient décoratif — <code>aria-hidden</code>, pour
            qu’un lecteur réglé sur « toute la ponctuation » n’entende pas « à tiret cadratin ».
          </>
        }
      >
        <UsageBlock label="Balisage émis pour une plage fermée" code={EMITTED} />
      </Specimen>

      <p className="tc-doc-prose tc-doc-aside">
        La granularité de <code>dateTime</code> est libre — <code>2024</code>, <code>2024-03</code>,{' '}
        <code>2024-03-15</code> — mais elle doit correspondre à ce que le libellé affirme :{' '}
        <code>dateTime=&quot;2024-03-15&quot;</code> sous un libellé « mars 2024 » promet une
        précision que le texte n’a pas. Rien ne le vérifie, c’est une affirmation humaine.
      </p>

      <PropsTable
        id="date-range"
        note={
          <>
            <code>
              DateRangeProps extends Omit&lt;ComponentPropsWithoutRef&lt;&apos;p&apos;&gt;,
              &apos;children&apos;&gt;
            </code>{' '}
            : le composant rend son propre contenu à partir des bornes, donc <code>children</code>{' '}
            est retiré du type — il n’y a pas de place où l’insérer.
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
                La borne de fin. <strong>Absente, la plage est ouverte</strong> et se termine sur{' '}
                <code>presentLabel</code>, en texte simple.
              </>
            ),
          },
          {
            name: 'presentLabel',
            type: 'string',
            defaultValue: 'Aujourd’hui',
            description: (
              <>
                Le texte de fin d’une plage ouverte. Ignoré quand <code>end</code> est fourni.
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
            <strong>lisible par l’humain</strong> sont séparés à dessein : c’est ce qui permet
            d’écrire « Septembre 2023 » sans perdre <code>2023-09</code>.
          </>
        }
        rows={[
          {
            name: 'dateTime',
            type: 'string',
            required: true,
            description: (
              <>
                Une valeur de date valide au sens HTML, posée sur l’attribut <code>datetime</code>.
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
        Le composant a été porté pour la frise : c’est la première ligne d’une entrée. On le voit à
        sa place sur{' '}
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
