import { Sidebar } from '../magic';
import type { DocPage } from './doc-model';
import { GROUPS, hrefFor } from './doc-model';
import { UI_VERSION } from './version';

export interface DocNavProps {
  readonly pages: readonly DocPage[];
  /**
   * Le slug de la page RÉELLEMENT rendue, repli compris. La coquille passe
   * `page.slug` et non le fragment brut : sur `#/inconnu`, c'est l'accueil qui
   * est à l'écran, donc c'est l'accueil qui porte `aria-current`.
   */
  readonly currentSlug: string;
}

/**
 * La barre de navigation du site de documentation, bâtie avec le `Sidebar` de
 * la librairie.
 *
 * =============================================================================
 * CE QUI A CHANGÉ, ET CE QUI N'A PAS BOUGÉ
 *
 * La colonne était du HTML natif habillé par `doc.css`. Elle est désormais un
 * `Sidebar` — `Sidebar`, `.Header` et `.Items` — parce que la vitrine doit
 * manger sa propre cuisine. Les liens et les groupes pliables restent natifs :
 * le composant vendoré ne sait pas porter ces deux sémantiques sans les
 * dégrader.
 *
 * `Sidebar.Item` N'EST PAS EMPLOYÉ, ET C'EST LA SEULE PIÈCE NON ADOPTÉE.
 * Il est câblé sur `<button>` — `ComponentPropsWithoutRef<"button">`,
 * `forwardRef<HTMLButtonElement>`, aucune prop `as`. Les vingt et une entrées
 * du sommaire sont des ADRESSES : les rendre en boutons retirerait le clic
 * milieu, le « copier le lien », l'ouverture dans un onglet, et ferait annoncer
 * « bouton » là où un lecteur d'écran doit dire « lien ». `Sidebar.Items` est un
 * `<nav>` nu qui rend ses enfants : les vrais `<a href>` y vivent, et `doc.css`
 * les accorde au reste. Corriger `Sidebar.Item` demanderait de toucher du code
 * vendoré, ce qui n'est pas une décision de ce fichier.
 *
 * AUCUN TITRE DE SECTION ICI, ET C'EST DÉLIBÉRÉ. La nav précède le contenu
 * dans le DOM ; un `<h2>` par groupe placerait quatre titres de niveau 2 avant
 * le `<h1>` de la page, c'est-à-dire un plan de document inversé pour qui
 * navigue par titres. Les titres de groupe sont donc des `<summary>` visibles —
 * ni `<h2>` ni `<h3>` —, et chaque liste est nommée par `aria-label` : elle
 * s'annonce « Fondations, liste, 5 éléments » sans rien ajouter au plan.
 *
 * PLIABLE PAR GROUPE, EN `<details>`/`<summary>` NATIFS. Aucun composant de la
 * librairie n'offre un groupe pliable, donc les quatre `<details>` restent :
 * ils sont focusables, ils s'actionnent à `Entrée` comme à `Espace`, et ils
 * s'annoncent « Composants, groupe réduit » chez NVDA, JAWS et VoiceOver, ce
 * qu'un `<div>` plus `aria-expanded` n'obtiendrait qu'en réimplémentant les
 * trois.
 *
 * `open` EST ÉCRIT EN DUR ET NON CALCULÉ, et c'est la décision qui fait que le
 * pliage par groupe tient. React n'écrit un attribut dans le DOM que lorsque sa
 * valeur CHANGE d'un rendu à l'autre : à `open` constant, un groupe replié à la
 * main le reste, parce que rien ne vient le rouvrir. Calculer
 * `open={groupeCourant}` paraissait mieux — le groupe de la page lue serait
 * toujours ouvert — mais la valeur change alors à chaque navigation, donc React
 * réécrit l'attribut, et un groupe que le visiteur venait d'ouvrir se refermait
 * sous ses yeux dès qu'il changeait de page. Le prix de ce choix est assumé et
 * il est réel : un groupe replié cache le lien `aria-current` de la page en
 * cours. C'est le visiteur qui l'a replié, et il est à un clic.
 *
 * `aria-label` ET NON `aria-labelledby` VERS LE TITRE DE GROUPE, après mesure.
 * Le libellé est fixé directement sur le contrôle afin que le chevron peint par
 * CSS n'entre pas dans son nom accessible.
 * ==========================================================================
 */
export function DocNav({ pages, currentSlug }: DocNavProps) {
  return (
    /* L'ENVELOPPE EST À MOI, POUR LA MÊME RAISON QUE CELLE DE LA BARRE DU
       HAUT : `Sidebar` rend son `<aside>` dans un `Glass`, dont l'enveloppe
       est un contexte d'empilement et dont la largeur est `fit-content`. Le
       collant, la piste de grille et le sol opaque vivent donc dehors. Elle
       porte la surface visible, tandis que le `<details>` natif ci-dessous
       porte l'état du sommaire global. */
    <div className="tc-doc-nav">
      <Sidebar
        className="tc-doc-nav__panel"
        /* L'ENVELOPPE A BESOIN DE SON PROPRE CROCHET, et pas seulement le
           contenu : c'est elle qui porte le rayon, le fond et l'arête de la
           coquille. `className` va sur l'`<aside>`, à l'intérieur du verre ;
           `rootClassName` va sur l'enveloppe, qui est la surface visible. */
        rootClassName="tc-doc-nav__glass"
      >
        {/* L'EN-TÊTE PORTE L'IDENTITÉ DE LA DOCUMENTATION. La version reste
            dans la nav, juste au-dessus du pli global, afin de rester visible
            quand le sommaire est fermé. */}
        <Sidebar.Header className="tc-doc-nav__head">
          <div className="tc-doc-nav__heading">
            <span className="tc-doc-nav__eyebrow">Opale UI</span>
            <span className="tc-doc-nav__title">Documentation</span>
          </div>
        </Sidebar.Header>

        {/* `Sidebar.Items` EST LE POINT DE REPÈRE DE NAVIGATION. C'est un
            `<nav>` nu : le nommer « Sommaire » est ce qui le fait annoncer
            « Sommaire, navigation », et c'est par ce nom que toute la suite de
            tests le trouve. L'`<aside>` du `Sidebar` reste, lui, un
            `complementary` sans nom — un point de repère de plus, vrai et non
            redondant : le nommer aussi ferait dire « Sommaire » deux fois. */}
        <Sidebar.Items className="tc-doc-nav__items" aria-label="Sommaire">
          {/* La version reste le premier élément de la navigation : elle donne
              immédiatement le contexte de la documentation, sans dépendre
              d'un groupe ou de la liste des pages. */}
          <p className="tc-doc-nav__version">
            <span className="tc-doc-nav__versionnumber">v{UI_VERSION}</span>
            <span className="tc-doc-nav__versionnote">
              stable <span aria-hidden="true">·</span> React ≥ 19
            </span>
          </p>

          {/* LE SOMMAIRE ENTIER SE PLIE. Le contrôle reste volontairement réduit
              à une flèche : la région est déjà nommée par `Sidebar.Items`,
              tandis que le `<summary>` natif annonce l'état ouvert/fermé. */}
          <details className="tc-doc-nav__all" open>
            <summary
              className="tc-doc-nav__alltitle"
              aria-label="Afficher ou masquer le sommaire"
              title="Afficher ou masquer le sommaire"
            >
              <span aria-hidden="true" />
            </summary>

            {GROUPS.map((group) => {
              const groupPages = pages.filter((page) => page.group === group.id);

              /* Un groupe vide ne rend NI son titre ni sa liste : un titre suivi
             de rien s'annonce comme une section vide, et un `<ul>` sans `<li>`
             est une liste de zéro élément que le lecteur d'écran énonce quand
             même. */
              if (groupPages.length === 0) return null;

              return (
                <details className="tc-doc-nav__group" key={group.id} open>
                  {/* Le chevron est peint par la feuille sur `::before` du
                  `<summary>` et non écrit ici : c'est `[open]` qui le tourne,
                  donc l'indice d'état suit l'élément qui porte l'état. Le
                  marqueur natif est retiré côté CSS — il n'est pas stylable de
                  la même façon dans les trois moteurs. */}
                  {/* `aria-label` protège le nom accessible du chevron peint par
                  CSS. Le libellé reste le contenu visible du contrôle. */}
                  <summary className="tc-doc-nav__grouptitle" aria-label={group.label}>
                    {group.label}
                  </summary>
                  <ul className="tc-doc-nav__list" aria-label={group.label}>
                    {groupPages.map((page) => (
                      <li key={page.slug}>
                        <a
                          className="tc-doc-nav__link"
                          href={hrefFor(page.slug)}
                          /* `undefined` et non `'false'` : `aria-current="false"`
                         est une valeur valide que certains lecteurs annoncent,
                         et l'attribut ne doit désigner qu'UN lien. */
                          aria-current={page.slug === currentSlug ? 'page' : undefined}
                        >
                          {page.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </details>
        </Sidebar.Items>
      </Sidebar>
    </div>
  );
}
