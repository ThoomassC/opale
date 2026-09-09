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
      Sourcil, titre, chapô. Le <strong>niveau du titre est choisi par l’appelant</strong>, parce
      qu’un composant ne connaît pas sa profondeur dans le document : la même en-tête vit sous le{' '}
      <code>h1</code> d’une page — elle est donc un <code>h2</code> — comme à l’intérieur d’un
      panneau déjà titré, où elle est un <code>h3</code>. Deviner produirait un plan de document
      faux une fois sur deux, et un plan faux est exactement ce sur quoi un lecteur d’écran navigue.
      La <strong>taille</strong>, elle, se déduit du niveau.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Appel de SectionHeading" code={USAGE} />

      <Specimen
        title="Le bloc de titre — le sourcil est en cuivre, l’échelle suit le niveau"
        note={
          <>
            Le sourcil est rendu en <code>--accent-secondary</code>, la couche éditoriale du contrat
            de couleur : jamais l’accent teal, qui est réservé à ce qui s’actionne. Le niveau est
            une prop parce qu’un composant ne peut pas connaître sa profondeur dans le plan du
            document — mais la taille, elle, se déduit du niveau. Les trois blocs ci-dessous ne
            diffèrent que par leur prop <code>level</code>, et un titre plus profond ne doit jamais
            se peindre plus gros que le titre qui le contient.
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

      <p className="tc-doc-prose tc-doc-aside">
        Les trois tailles sont épinglées par un test qui lit la feuille :{' '}
        <code>--text-display-md</code> au niveau 2, <code>--text-display-sm</code> au niveau 3,{' '}
        <code>--text-lg</code> au niveau 4. Le choix n’est pas gratuit — <code>--text-xl</code> (28
        px fixe) dépasserait <code>--text-display-sm</code> (24 → 34 px) entre 923 et 1077 px de
        fenêtre, et le niveau 4 repasserait devant le niveau 3 dans cette bande. Le quatrième niveau
        quitte d’ailleurs l’échelle d’affichage : à 23 px, le resserrage de −0,02 em et
        l’interlignage de 1,08 d’un grand titre cognent les jambages. C’est un intertitre, il se
        compose comme tel.
      </p>

      <Specimen
        title="La variante compacte, et le titre qui nomme sa section"
        note={
          <>
            <code>compact</code> annule la marge, centre le bloc dans sa boîte parente et le sort de
            la mise en deux colonnes du grand écran : il est fait pour vivre dans une grille qui lui
            est propre. <code>headingId</code>, lui, pose l’identifiant{' '}
            <strong>sur le titre</strong> et non sur le conteneur — c’est ce qui permet à la{' '}
            <code>&lt;section&gt;</code> englobante de se nommer par <code>aria-labelledby</code>,
            le conteneur gardant son <code>id</code> propre pour l’ancre de navigation. Les deux ne
            peuvent pas être le même attribut, d’où la prop.
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
            : le composant rend son contenu à partir de ses props — il n’y a pas de place pour des{' '}
            <code>children</code> — et sa prop <code>title</code> remplace l’attribut HTML du même
            nom, qui n’aurait rien à faire ici : une infobulle au survol d’un bloc de titre n’est ni
            atteignable au clavier ni lisible au toucher.
          </>
        }
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            required: true,
            description: (
              <>
                Le titre de la section, rendu dans la balise dictée par <code>level</code> avec la
                classe <code>tc-section-heading__title</code>.
              </>
            ),
          },
          {
            name: 'level',
            type: 'SectionHeadingLevel = 2 | 3 | 4',
            defaultValue: '2',
            description: (
              <>
                La balise rendue, et donc la taille. <code>1</code> est{' '}
                <strong>volontairement absent</strong> : le titre de premier niveau est celui de la
                page, il n’appartient pas à une section.
              </>
            ),
          },
          {
            name: 'eyebrow',
            type: 'ReactNode',
            description: (
              <>
                Le mot de catégorie posé au-dessus du titre, en cuivre. Absent, aucun{' '}
                <code>&lt;p&gt;</code> n’est rendu — et ce n’est jamais un titre : il ne doit pas
                entrer dans le plan du document.
              </>
            ),
          },
          {
            name: 'lede',
            type: 'ReactNode',
            description: (
              <>
                Une phrase sous le titre. Passe en seconde colonne au-delà de 62 rem, sauf en
                variante compacte.
              </>
            ),
          },
          {
            name: 'compact',
            type: 'boolean',
            defaultValue: 'false',
            description: (
              <>
                Marge nulle, alignement centré, hors de la mise en deux colonnes. Ajoute{' '}
                <code>tc-section-heading--compact</code>.
              </>
            ),
          },
          {
            name: 'headingId',
            type: 'string',
            description: (
              <>
                Identifiant posé sur le <strong>titre</strong>. Le <code>id</code> ordinaire, lui,
                part sur le conteneur avec le reste des attributs de <code>&lt;div&gt;</code>.
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
        Le même raisonnement — un composant ne devine pas sa profondeur — est ce qui a donné son{' '}
        <code>level</code> à{' '}
        <a className="tc-doc-link" href={hrefFor('composants/timeline')}>
          TimelineItem
        </a>
        , à ceci près que la frise, elle, <em>vérifie</em> le niveau réellement écrit dans son
        contenu.
      </p>
    </PageBody>
  ),
};
