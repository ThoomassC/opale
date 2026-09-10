import { ChipList } from '../../../components/chip-list';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';

/* =============================================================================
   CHIPLIST — la liste d'étiquettes neutres, et sa décision de rendu.

   Deux choses se documentent ici et nulle part ailleurs : le nom accessible
   EXCLUSIF (`label` ou `aria-labelledby`, jamais les deux) et le `null` sur
   liste vide. La seconde ne se voit pas — un composant qui ne rend rien ne
   laisse aucune trace à l'écran — donc elle est rendue côte à côte avec une
   liste peuplée, sous légende.
   ========================================================================== */

const USAGE = `import { ChipList } from '@thomascaron/opale';

// Nommée par un libellé masqué…
<ChipList label="Technologies de l'étape" items={['Bus', 'Train', 'Marche']} />

// …ou, mieux, par un titre VISIBLE qui porte déjà le nom.
<h3 id="stack-bluesoft">Technologies utilisées chez Blue Soft</h3>
<ChipList aria-labelledby="stack-bluesoft" items={stack} />`;

const STACK: readonly string[] = ['TypeScript', 'Next.js', 'PostgreSQL', 'Terraform'];

export const chipListPage: DocPage = {
  slug: 'composants/chip-list',
  label: 'ChipList',
  group: 'composants',
  title: 'ChipList',
  lede: (
    <>
      Une <code>&lt;ul&gt;</code> nommée d’étiquettes neutres, sans ordre, dont chaque entrée est
      rendue par <code>Tag</code> en variante <code>plain</code>. Elle rend{' '}
      <strong>
        <code>null</code> sur une liste vide
      </strong>{' '}
      : un <code>&lt;ul&gt;</code> sans enfant reste annoncé « liste, 0 élément » sous un nom qui
      affirme un contenu inexistant.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de ChipList" code={USAGE} />

      <Specimen
        title="Nommée par son libellé — aria-label"
        note="Nommez ce que la liste énumère et son rattachement, plutôt qu’un « Technologies » répété six fois dans la page."
      >
        <ChipList label="Technologies utilisées chez Blue Soft" items={STACK} />
      </Specimen>

      <Specimen
        title="Nommée par un titre visible — aria-labelledby"
        note={
          <>
            <code>aria-labelledby</code> gagne sur <code>aria-label</code> au sens de la
            spécification, et le type interdit le cumul.
          </>
        }
      >
        {/* `<h3>` : le titre du spécimen est un `<h2>`, celui-ci est donc au
            niveau juste — et il doit être un vrai titre, puisque c'est lui qui
            nomme la liste. */}
        <h3 className="tc-doc-cardtitle" id="chips-bricoloc">
          Technologies du projet BricoLoc
        </h3>
        <ChipList
          aria-labelledby="chips-bricoloc"
          items={['Node.js', 'Docker', 'RabbitMQ', 'Vitest']}
        />
      </Specimen>

      <Specimen
        title="La liste vide ne rend rien du tout"
        note={
          <>
            La cellule de droite est un appel complet avec <code>items=&#123;[]&#125;</code> : il
            n’en sort ni liste, ni nœud dans l’arbre d’accessibilité.
          </>
        }
      >
        {/* `<figure>` / `<figcaption>` et non un `<span>` frère : la cellule de
            droite ne rend AUCUN nœud, et seule une légende reliée à la figure
            distingue « rien, comme prévu » d'un spécimen cassé. Le couple est
            écrit à la main plutôt que dans un composant local : une page de doc
            n'exporte qu'une constante, et un composant non exporté ici ferait
            perdre le rafraîchissement à chaud du module. */}
        <div className="tc-doc-states">
          <figure className="tc-doc-states__cell">
            <ChipList label="Technologies du socle, liste peuplée" items={STACK} />
            <figcaption className="tc-doc-states__label">items — quatre entrées</figcaption>
          </figure>
          <figure className="tc-doc-states__cell">
            <ChipList label="Technologies du socle, liste vide" items={[]} />
            <figcaption className="tc-doc-states__label">
              items=&#123;[]&#125; — le composant rend null
            </figcaption>
          </figure>
        </div>
      </Specimen>

      <PropsTable
        id="chip-list"
        note={
          <>
            <code>
              ChipListProps = Omit&lt;ComponentPropsWithoutRef&lt;&apos;ul&apos;&gt;,
              &apos;children&apos; | &apos;aria-label&apos; | &apos;aria-labelledby&apos;&gt; &amp;
              &#123; items &#125; &amp; AccessibleNameProps
            </code>
            . Les deux <code>aria-*</code> sont retirés du type de base pour que{' '}
            <code>AccessibleNameProps</code> soit seul à les décider :{' '}
            <strong>un nom est requis, un seul</strong>.
          </>
        }
        rows={[
          {
            name: 'items',
            type: 'readonly string[]',
            required: true,
            description: (
              <>
                Les entrées, qui servent aussi de clé de rendu ;{' '}
                <strong>
                  une liste vide fait rendre <code>null</code>
                </strong>
                .
              </>
            ),
          },
          {
            name: 'label',
            type: 'string',
            description: (
              <>
                Branche 1 du nom, posée en <code>aria-label</code> ; exige{' '}
                <code>aria-labelledby?: never</code>.
              </>
            ),
          },
          {
            name: 'aria-labelledby',
            type: 'string',
            description: (
              <>
                Branche 2 du nom : l’identifiant d’un élément <strong>visible</strong> qui porte
                déjà ce nom.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-chips</code>, jamais écrasée.
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLUListElement>',
            description: (
              <>
                Posée sur la <code>&lt;ul&gt;</code>, absente quand le composant rend{' '}
                <code>null</code>.
              </>
            ),
          },
        ]}
      />

      <p className="tc-doc-prose">
        <code>ChipList</code> partage son contrat de nommage avec{' '}
        <a className="tc-doc-link" href={hrefFor('composants/timeline')}>
          Timeline
        </a>
        , et son étiquette avec{' '}
        <a className="tc-doc-link" href={hrefFor('composants/tag')}>
          Tag
        </a>
        .
      </p>
    </PageBody>
  ),
};
