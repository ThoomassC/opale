import { SectionHeading } from '../../../components/section-heading';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';

/* =============================================================================
   SECTIONHEADING — la page où les niveaux de titre sont le SUJET.

   Partout ailleurs sur ce site, un titre de spécimen est un `<h2>` et tout ce
   qu'il contient commence à `<h3>`. Ici, le premier spécimen rend vraiment un
   `h2`, un `h3` et un `h4` : c'est le SUJET de la page, et c'est une fratrie et
   non un saut — l'ordre du document est h2 (titre du spécimen), h2, h3, h4,
   puis h2 (spécimen suivant) et h3. Aucun niveau n'est sauté vers le bas, ce
   qui est la seule chose que WCAG 1.3.1 interdit ; la rangée est en tête de
   page pour que la fratrie se lise avant tout titre plus profond.
   ========================================================================== */

const USAGE = `import { SectionHeading } from '@thomascaron/ui';

<section aria-labelledby="titre-parcours">
  <SectionHeading
    headingId="titre-parcours"
    eyebrow="Expérience"
    title="Un parcours construit sur le produit et sa qualité."
    lede="Du développement d'outils à l'automatisation des tests."
  />
</section>`;

const LEDE_TEXT = 'Onze jours entre Kyoto et la vallée de Kiso, à pied et en train régional.';

export const sectionHeadingPage: DocPage = {
  slug: 'composants/section-heading',
  label: 'SectionHeading',
  group: 'composants',
  title: 'SectionHeading',
  lede: (
    <>
      Sourcil, titre, chapô. Le <strong>niveau du titre est choisi par l’appelant</strong> — un
      composant ne connaît pas sa profondeur dans le document — et la <strong>taille</strong> se
      déduit du niveau.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de SectionHeading" code={USAGE} />

      <Specimen
        title="Le bloc de titre — le sourcil est en cuivre, l’échelle suit le niveau"
        note={
          <>
            Les trois tailles sont épinglées par un test qui lit la feuille —{' '}
            <code>--text-display-md</code> au niveau 2, <code>--text-display-sm</code> au niveau 3,{' '}
            <code>--text-lg</code> au niveau 4 — et le sourcil est rendu en{' '}
            <code>--accent-secondary</code>, la couche éditoriale du contrat de couleur.
          </>
        }
      >
        <div className="tc-doc-stack">
          <SectionHeading
            level={2}
            eyebrow="level 2 — titre de section"
            title="Étapes du printemps"
            lede={LEDE_TEXT}
          />
          <SectionHeading
            level={3}
            eyebrow="level 3 — titre de panneau"
            title="Étapes du printemps"
            lede={LEDE_TEXT}
          />
          <SectionHeading
            level={4}
            eyebrow="level 4 — intertitre"
            title="Étapes du printemps"
            lede={LEDE_TEXT}
          />
        </div>
      </Specimen>

      <Specimen
        title="La variante compacte, et le titre qui nomme sa section"
        note={
          <>
            <code>headingId</code> pose l’identifiant <strong>sur le titre</strong> et non sur le
            conteneur : c’est ce qui permet à la <code>&lt;section&gt;</code> englobante de se
            nommer par <code>aria-labelledby</code>.
          </>
        }
      >
        <section aria-labelledby="demo-heading-compact">
          <SectionHeading
            compact
            level={3}
            headingId="demo-heading-compact"
            eyebrow="compact"
            title="Le bloc centré, sans marge"
            lede="Cette section est nommée par son propre titre : aria-labelledby pointe sur headingId."
          />
        </section>
      </Specimen>

      <PropsTable
        id="section-heading"
        note={
          <>
            <code>
              Omit&lt;ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;, &apos;children&apos; |
              &apos;title&apos;&gt;
            </code>{' '}
            : le composant rend son contenu à partir de ses props, et sa prop <code>title</code>{' '}
            remplace l’attribut HTML du même nom.
          </>
        }
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            required: true,
            description: (
              <>
                Le titre, rendu dans la balise dictée par <code>level</code>.
              </>
            ),
          },
          {
            name: 'level',
            type: 'SectionHeadingLevel = 2 | 3 | 4',
            defaultValue: '2',
            description: (
              <>
                La balise rendue, et donc la taille ; <code>1</code> est volontairement absent.
              </>
            ),
          },
          {
            name: 'eyebrow',
            type: 'ReactNode',
            description: (
              <>
                Le mot de catégorie au-dessus du titre, en cuivre — jamais un titre, il n’entre pas
                dans le plan du document.
              </>
            ),
          },
          {
            name: 'lede',
            type: 'ReactNode',
            description: 'Une phrase sous le titre ; passe en seconde colonne au-delà de 62 rem.',
          },
          {
            name: 'compact',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Marge nulle, alignement centré, hors de la mise en deux colonnes.',
          },
          {
            name: 'headingId',
            type: 'string',
            description: (
              <>
                Identifiant posé sur le <strong>titre</strong> ; le <code>id</code> ordinaire part
                sur le conteneur.
              </>
            ),
          },
          {
            name: 'className',
            type: 'string',
            description: (
              <>
                Fusionnée avec <code>tc-section-heading</code>, jamais écrasée.
              </>
            ),
          },
          {
            name: 'ref',
            type: 'Ref<HTMLDivElement>',
            description: (
              <>
                Posée sur le <code>&lt;div&gt;</code> conteneur, pas sur le titre.
              </>
            ),
          },
        ]}
      />

      <p className="tc-doc-prose">
        Le même raisonnement a donné son <code>level</code> à{' '}
        <a className="tc-doc-link" href={hrefFor('composants/timeline')}>
          TimelineItem
        </a>
        , qui <em>vérifie</em> en plus le niveau réellement écrit.
      </p>
    </PageBody>
  ),
};
