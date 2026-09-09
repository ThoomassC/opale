import { ChipList } from '../../../components/chip-list';
import { DateRange } from '../../../components/date-range';
import { IconTile } from '../../../components/icon-tile';
import { Timeline, TimelineItem } from '../../../components/timeline';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';

/* =============================================================================
   TIMELINE ET TIMELINEITEM — une seule page, parce qu'aucun des deux ne se
   documente sans l'autre : la frise n'est qu'une `<ol>` nommée, et l'entrée
   n'existe pas hors d'une liste.

   Ce qui est rendu ici est la frise SEULE, avec du contenu de voyage — le
   contenu de l'`@example` du composant. La composition qui empile
   `tc-card tc-card--glass` sur l'entrée, elle, vit sur « Verre et frise » :
   c'est là qu'on la met en regard de la même frise nue, et cette
   mise en regard est tout son intérêt.

   Les entrées déclarent `level={3}` et écrivent un `<h3>` : le titre du
   spécimen est un `<h2>`, donc c'est le niveau juste — et si les deux
   divergeaient, le composant l'écrirait en `console.error`, ce qui ferait
   échouer le test de fumée du site.
   ========================================================================== */

const USAGE = `import { DateRange, IconTile, Timeline, TimelineItem } from '@thomascaron/ui';

<Timeline label="Étapes du voyage">
  <TimelineItem level={3} icon={<IconTile><Glyphe /></IconTile>}>
    <DateRange start={{ dateTime: '2025-04-02', label: '2 avril 2025' }} />
    <h3>Kyoto</h3>
    <p className="tc-timeline__meta">Kansai, Japon</p>
    <p>Trois jours de temples et de ruelles.</p>
  </TimelineItem>
</Timeline>`;

export const timelinePage: DocPage = {
  slug: 'composants/timeline',
  label: 'Timeline',
  group: 'composants',
  title: 'Timeline',
  lede: (
    <>
      Une <code>&lt;ol&gt;</code> nommée et son entrée — <code>&lt;ol&gt;</code> parce que l’ordre
      porte du sens. Le <strong>contenu</strong> de l’entrée est libre, mais pas son{' '}
      <strong>plan</strong> : le niveau du titre est déclaré, et une discordance est signalée.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de Timeline et TimelineItem" code={USAGE} />

      <Specimen
        title="La frise — géométrie, typographie, et rien d’autre"
        note={
          <>
            C’est l’état nu qu’il faut regarder pour juger le <strong>rythme</strong> : date, titre
            et ligne de lieu doivent former un seul bloc serré, puis le texte se détacher.
          </>
        }
      >
        <Timeline label="Étapes du voyage, entrées nues">
          <TimelineItem
            level={3}
            icon={
              <IconTile>
                <span>◆</span>
              </IconTile>
            }
          >
            <DateRange start={{ dateTime: '2025-04-02', label: '2 avril 2025' }} />
            <h3>Kyoto</h3>
            <p className="tc-timeline__meta">Kansai, Japon</p>
            <p>Trois jours de temples et de ruelles.</p>
            <ChipList label="Moyens de transport de l’étape de Kyoto" items={['Train', 'Marche']} />
          </TimelineItem>
          <TimelineItem
            level={3}
            icon={
              <IconTile>
                <span>◇</span>
              </IconTile>
            }
          >
            <DateRange
              start={{ dateTime: '2025-04-05', label: '5 avril 2025' }}
              end={{ dateTime: '2025-04-09', label: '9 avril 2025' }}
            />
            <h3>La vallée de Kiso</h3>
            <p className="tc-timeline__meta">Nagano, Japon</p>
            <p>
              L’ancienne route de Nakasendō, d’un relais à l’autre. La plage est fermée : deux{' '}
              <code>&lt;time&gt;</code> distincts.
            </p>
            <ChipList
              label="Moyens de transport de l’étape de Kiso"
              items={['Marche', 'Train régional']}
            />
          </TimelineItem>
        </Timeline>
      </Specimen>

      <Specimen
        title="Une entrée sans tuile, et une frise nommée par un titre visible"
        note={
          <>
            <code>label</code> et <code>aria-labelledby</code> sont exclusifs l’un de l’autre : la
            frise ci-dessous est nommée par le titre visible qui la précède, ce qui vaut mieux qu’un{' '}
            <code>aria-label</code>.
          </>
        }
      >
        <h3 className="tc-doc-cardtitle" id="frise-sans-tuile">
          Retours de voyage
        </h3>
        <Timeline aria-labelledby="frise-sans-tuile">
          <TimelineItem level={3}>
            <DateRange start={{ dateTime: '2025-04-12', label: '12 avril 2025' }} />
            <h3>Retour par Tokyo</h3>
            <p className="tc-timeline__meta">Sans tuile : une seule colonne</p>
            <p>Le corps de l’entrée occupe toute la largeur, la gouttière disparaît.</p>
          </TimelineItem>
        </Timeline>
      </Specimen>

      <PropsTable
        id="timeline"
        title="Timeline — l’interface"
        note={
          <>
            <code>
              Omit&lt;ComponentPropsWithoutRef&lt;&apos;ol&apos;&gt;, &apos;aria-label&apos; |
              &apos;aria-labelledby&apos;&gt; &amp; AccessibleNameProps
            </code>{' '}
            : les deux <code>aria-*</code> sont retirés du type de base pour que{' '}
            <code>AccessibleNameProps</code> soit seul à les décider —{' '}
            <strong>un nom, et un seul</strong>, jamais zéro.
          </>
        }
        rows={[
          {
            name: 'label',
            type: 'string',
            description: (
              <>
                Branche 1 du nom, posée en <code>aria-label</code>. Exige{' '}
                <code>aria-labelledby?: never</code>.
              </>
            ),
          },
          {
            name: 'aria-labelledby',
            type: 'string',
            description: (
              <>
                Branche 2 : l’identifiant d’un titre <strong>visible</strong>, à préférer ; exige{' '}
                <code>label?: never</code>.
              </>
            ),
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: (
              <>
                Les entrées, une <code>&lt;li&gt;</code> chacune — en pratique des{' '}
                <code>TimelineItem</code>.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-timeline</code>, jamais écrasée.
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLOListElement>',
            description: (
              <>
                Posée sur la <code>&lt;ol&gt;</code>.
              </>
            ),
          },
        ]}
      />

      <PropsTable
        id="timeline-item"
        title="TimelineItem — l’interface"
        note={
          <>
            <code>ComponentPropsWithoutRef&lt;&apos;li&apos;&gt;</code> plus les deux props
            ci-dessous, rendues en un <code>&lt;li&gt;</code>, la tuile, puis un corps{' '}
            <code>.tc-timeline__body--h&lt;level&gt;</code>.
          </>
        }
        rows={[
          {
            name: 'icon',
            type: 'ReactNode',
            description: (
              <>
                La tuile d’illustration, typiquement un{' '}
                <a className="tc-doc-link" href={hrefFor('composants/icon-tile')}>
                  IconTile
                </a>{' '}
                ; sa présence ouvre la seconde colonne, son absence laisse le contenu occuper toute
                la largeur.
              </>
            ),
          },
          {
            name: 'level',
            type: 'TimelineItemLevel = 3 | 4',
            defaultValue: '3',
            description: (
              <>
                Le niveau du titre que vous écrivez à l’intérieur ; une discordance part en{' '}
                <code>console.error</code> — sauf si le titre est enveloppé dans un fragment, où il
                échappe au contrôle.
              </>
            ),
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: (
              <>
                Le contenu <strong>libre</strong> de l’entrée : le composant fournit la géométrie et
                la typographie, pas un modèle de données.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-timeline__item</code> — c’est par là que passe le matériau,
                comme sur{' '}
                <a className="tc-doc-link" href={hrefFor('compositions/verre-et-frise')}>
                  Verre et frise
                </a>
                .
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLLIElement>',
            description: (
              <>
                Posée sur le <code>&lt;li&gt;</code>.
              </>
            ),
          },
        ]}
      />

      <p className="tc-doc-prose">
        L’entrée ne porte aucun matériau à dessein : celui de{' '}
        <a className="tc-doc-link" href={hrefFor('composants/card')}>
          Card
        </a>{' '}
        arrive par les classes, pour n’avoir qu’une définition.
      </p>
    </PageBody>
  ),
};
