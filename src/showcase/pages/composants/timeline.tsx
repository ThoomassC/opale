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
      Une <code>&lt;ol&gt;</code> nommée et son entrée. <code>&lt;ol&gt;</code> et non{' '}
      <code>&lt;ul&gt;</code> parce que l’ordre porte du sens — c’est une chronologie, le retirer
      perdrait l’information. Le <strong>contenu</strong> de l’entrée est libre : la même frise sert
      une chronologie professionnelle et un carnet d’étapes, et fixer « poste » ou « entreprise » en
      props aurait figé le vocabulaire de l’un des deux usages. Ce qui n’est <em>pas</em> libre,
      c’est le <strong>plan</strong> : le niveau du titre est déclaré, et une discordance est
      signalée.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de Timeline et TimelineItem" code={USAGE} />

      <Specimen
        title="La frise — géométrie, typographie, et rien d’autre"
        note={
          <>
            Une entrée de frise n’est pas une carte : elle ne porte ni fond, ni liseré, ni ombre —
            seulement la géométrie à deux colonnes, la gouttière, le coussin et la typographie de ce
            qu’on y met. Deux classes sont à votre disposition à l’intérieur :{' '}
            <code>tc-timeline__meta</code> pour la ligne secondaire sous le titre (un lieu, un
            employeur, un rôle), et la typographie du titre et des <code>&lt;p&gt;</code> est déjà
            posée. C’est cet état-là qu’il faut regarder pour juger le <strong>rythme</strong> :
            date, titre et ligne de lieu doivent former un seul bloc serré, puis le texte se
            détacher.
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
            La tuile est optionnelle : sa présence <strong>ouvre la seconde colonne</strong> de la
            grille, son absence laisse le contenu occuper toute la largeur. La frise ci-dessous est
            nommée par le titre visible qui la précède plutôt que par un <code>aria-label</code> —{' '}
            <code>label</code> et <code>aria-labelledby</code> sont exclusifs l’un de l’autre, et le
            nom visible est le meilleur des deux.
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

      <p className="tc-doc-prose tc-doc-aside">
        <strong>Pourquoi le niveau est déclaré.</strong> La feuille stylait <code>:is(h3, h4)</code>{' '}
        à l’identique, si bien qu’un <code>&lt;h4&gt;</code> posé sous un <code>&lt;h2&gt;</code> —
        un saut de niveau, WCAG 1.3.1 — était visuellement indistinguable du <code>&lt;h3&gt;</code>{' '}
        correct : le défaut n’existait qu’à l’oreille, ce qui est la définition d’un défaut qui
        survit à la relecture. La déclaration sert donc deux fois. La feuille ne style que la balise
        déclarée (<code>.tc-timeline__body--h3 h3</code>), donc un titre au mauvais niveau perd la
        typographie de l’entrée et <em>se voit</em> ; et le composant journalise la discordance en{' '}
        <code>console.error</code>, donc elle <em>s’entend</em> aussi en développement. Limite
        assumée : <code>Children.toArray</code> aplatit les tableaux mais ne descend ni dans un
        fragment ni dans un composant intermédiaire — un titre enveloppé échappe au contrôle. Ce qui
        est attrapé est le mode d’écriture réel, celui où le titre est un enfant direct de l’entrée,
        et c’est là que la faute se commet.
      </p>

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
            <code>AccessibleNameProps</code> soit seul à les décider. Une liste anonyme s’annonce «
            liste, 6 éléments » et laisse l’auditeur deviner ; deux noms dont un seul gagne est une
            divergence silencieuse. <strong>Un nom, et un seul.</strong>
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
                Branche 2 : l’identifiant d’un titre <strong>visible</strong>. À préférer — il gagne
                sur <code>aria-label</code> au sens de la spécification, d’où{' '}
                <code>label?: never</code> ici. Ne rien passer du tout ne compile pas non plus.
              </>
            ),
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: (
              <>
                Les entrées, une <code>&lt;li&gt;</code> chacune. En pratique des{' '}
                <code>TimelineItem</code> : rien ne l’impose, mais c’est là que vit la géométrie.
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
            ci-dessous. Le composant rend un <code>&lt;li&gt;</code>, puis la tuile, puis un corps{' '}
            <code>.tc-timeline__body--h&lt;level&gt;</code> qui reçoit vos enfants.
          </>
        }
        rows={[
          {
            name: 'icon',
            type: 'ReactNode',
            description: (
              <>
                La tuile d’illustration, en tête de l’entrée — typiquement un{' '}
                <a className="tc-doc-link" href={hrefFor('composants/icon-tile')}>
                  IconTile
                </a>
                . Sa présence ajoute <code>tc-timeline__item--with-icon</code> et ouvre la seconde
                colonne ; son absence laisse le contenu occuper toute la largeur.
              </>
            ),
          },
          {
            name: 'level',
            type: 'TimelineItemLevel = 3 | 4',
            defaultValue: '3',
            description: (
              <>
                Le niveau du titre que vous écrivez à l’intérieur. <code>1</code> et <code>2</code>{' '}
                sont absents — une entrée de frise vit dans une section, donc sous un titre ;{' '}
                <code>5</code> et <code>6</code> aussi — une frise imbriquée à cette profondeur est
                un signe de structure, pas un cas à servir. Une discordance avec la balise
                réellement écrite part en <code>console.error</code>, et l’entrée est rendue quand
                même : bruyant pour l’auteur, jamais fatal pour le visiteur.
              </>
            ),
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: (
              <>
                Le contenu <strong>libre</strong> de l’entrée. Le composant ne connaît ni poste, ni
                entreprise, ni mission : il fournit la géométrie et la typographie, pas un modèle de
                données.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-timeline__item</code>, jamais écrasée. C’est par là que
                passe le matériau :{' '}
                <code>&lt;TimelineItem className=&quot;tc-card tc-card--glass&quot;&gt;</code> est
                la composition du portfolio, rendue sur{' '}
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
        L’entrée ne porte aucun matériau à dessein : la carte est un composant à part entière de
        cette librairie, et l’écrire une seconde fois ici donnerait deux définitions du même
        matériau, qui divergeraient.{' '}
        <a className="tc-doc-link" href={hrefFor('composants/card')}>
          Card
        </a>{' '}
        rendant un <code>&lt;div&gt;</code>, la composition se fait donc par les classes.
      </p>
    </PageBody>
  ),
};
