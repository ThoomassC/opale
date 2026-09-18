import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { Sidebar } from '../magic';
import type { DocPage } from './doc-model';
import { hrefFor, navSectionsForPages } from './doc-model';
import { UI_VERSION } from './version';

export interface DocNavProps {
  readonly pages: readonly DocPage[];
  /**
   * Le slug de la page RÉELLEMENT rendue, repli compris. La coquille passe
   * `page.slug` et non le fragment brut : sur `#/inconnu`, c'est l'accueil qui
   * est à l'écran, donc c'est l'accueil qui porte `aria-current`.
   */
  readonly currentSlug: string;
  /** État contrôlé par la commande du header mobile lorsqu'elle est fournie. */
  readonly mobileNavOpen?: boolean;
  /** Synchronise le pli global avec la commande du header mobile. */
  readonly onMobileNavOpenChange?: (open: boolean) => void;
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
 * `forwardRef<HTMLButtonElement>`, aucune prop `as`. Les entrées
 * du sommaire sont des ADRESSES : les rendre en boutons retirerait le clic
 * milieu, le « copier le lien », l'ouverture dans un onglet, et ferait annoncer
 * « bouton » là où un lecteur d'écran doit dire « lien ». `Sidebar.Items` est un
 * `<nav>` nu qui rend ses enfants : les vrais `<a href>` y vivent, et `doc.css`
 * les accorde au reste. Corriger `Sidebar.Item` demanderait de toucher du code
 * vendoré, ce qui n'est pas une décision de ce fichier.
 *
 * AUCUN TITRE DE SECTION ICI, ET C'EST DÉLIBÉRÉ. La nav précède le contenu
 * dans le DOM ; un `<h2>` par groupe placerait plusieurs titres de niveau 2 avant
 * le `<h1>` de la page, c'est-à-dire un plan de document inversé pour qui
 * navigue par titres. Les titres de groupe sont donc des `<summary>` visibles —
 * ni `<h2>` ni `<h3>` —, et chaque liste est nommée par `aria-label` : elle
 * s'annonce « Fondations, liste, 5 éléments » sans rien ajouter au plan.
 *
 * PLIABLE PAR GROUPE, EN `<details>`/`<summary>` NATIFS. Aucun composant de la
 * librairie n'offre un groupe pliable, donc les familles restent en
 * `<details>` natifs :
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
export function DocNav({ pages, currentSlug, mobileNavOpen, onMobileNavOpenChange }: DocNavProps) {
  const sections = navSectionsForPages(pages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollbar, setScrollbar] = useState({ size: 0.28, offset: 0 });

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    const updateScrollbar = () => {
      const viewport = scrollElement.clientHeight;
      const content = scrollElement.scrollHeight;

      if (!viewport || content <= viewport) {
        setScrollbar({ size: 1, offset: 0 });
        return;
      }

      const size = Math.max(0.14, Math.min(1, viewport / content));
      const travel = Math.max(0, content - viewport);
      const offset = (scrollElement.scrollTop / travel) * (1 - size);

      setScrollbar({ size, offset });
    };

    updateScrollbar();
    scrollElement.addEventListener('scroll', updateScrollbar, { passive: true });
    window.addEventListener('resize', updateScrollbar);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateScrollbar);
    const mutationObserver =
      resizeObserver && typeof MutationObserver !== 'undefined'
        ? new MutationObserver(updateScrollbar)
        : undefined;

    /* Les dimensions d'un conteneur Glass peuvent être nulles au premier
       effet, avant sa mise en page finale. Le recalcul différé n'est utile que
       dans un vrai navigateur : jsdom n'a ni layout ni ResizeObserver, et le
       programmer dans les tests créerait des mises à jour hors `act()`. */
    const frame = resizeObserver ? window.requestAnimationFrame(updateScrollbar) : undefined;
    const timeout = resizeObserver ? window.setTimeout(updateScrollbar, 0) : undefined;
    resizeObserver?.observe(scrollElement);
    mutationObserver?.observe(scrollElement, {
      attributes: true,
      attributeFilter: ['open'],
      childList: true,
      subtree: true,
    });

    return () => {
      scrollElement.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      if (timeout !== undefined) window.clearTimeout(timeout);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [mobileNavOpen, pages.length]);

  const handleNavToggle = (event: { currentTarget: HTMLDetailsElement }) => {
    onMobileNavOpenChange?.(event.currentTarget.open);
  };

  const detailsStateProps =
    mobileNavOpen === undefined
      ? ({ open: true } as const)
      : { open: mobileNavOpen, onToggle: handleNavToggle };

  return (
    /* L'ENVELOPPE EST À MOI, POUR LA MÊME RAISON QUE CELLE DE LA BARRE DU
       HAUT : `Sidebar` rend son `<aside>` dans un `Glass`, dont l'enveloppe
       est un contexte d'empilement et dont la largeur est `fit-content`. Le
       collant, la piste de grille et le sol opaque vivent donc dehors. Elle
       porte la surface visible, tandis que le `<details>` natif ci-dessous
       porte l'état du sommaire global. */
    <div
      className="tc-doc-nav"
      data-open={mobileNavOpen === undefined ? 'true' : String(mobileNavOpen)}
    >
      <Sidebar
        className="tc-doc-nav__panel"
        /* L'ENVELOPPE A BESOIN DE SON PROPRE CROCHET, et pas seulement le
           contenu : c'est elle qui porte le rayon, le fond et l'arête de la
           coquille. `className` va sur l'`<aside>`, à l'intérieur du verre ;
           `rootClassName` va sur l'enveloppe, qui est la surface visible. */
        rootClassName="tc-doc-nav__glass"
      >
        <div className="tc-doc-nav__scroll" ref={scrollRef}>
          {/* L'EN-TÊTE RESTE DANS LA COLONNE DÉFILANTE. Il est masqué visuellement
              par la couche V3 pour laisser le plan CanopUI commencer dès le
              premier groupe, mais sa structure est conservée pour les lecteurs
              et pour les intégrations qui réutilisent ce composant. */}
          <Sidebar.Header className="tc-doc-nav__head">
            <div className="tc-doc-nav__heading">
              <span className="tc-doc-nav__eyebrow">Opale UI</span>
              <span className="tc-doc-nav__title">Documentation</span>
            </div>
          </Sidebar.Header>

          {/* `Sidebar.Items` EST LE POINT DE REPÈRE DE NAVIGATION. C'est un
              `<nav>` nu : le nommer « Sommaire » est ce qui le fait annoncer
              « Sommaire, navigation », et les vrais liens restent des `<a>`. */}
          <Sidebar.Items className="tc-doc-nav__items" aria-label="Sommaire">
            <p className="tc-doc-nav__version">
              <span className="tc-doc-nav__versionnumber">v{UI_VERSION}</span>
              <span className="tc-doc-nav__versionnote">
                stable <span aria-hidden="true">·</span> React ≥ 19
              </span>
            </p>

            {/* LE SOMMAIRE ENTIER SE PLIE. Le bouton reste natif et pilotable
                depuis le header, tandis que les familles gardent leur état
                individuel pour les longues listes de composants. */}
            <details id="tc-doc-nav-content" className="tc-doc-nav__all" {...detailsStateProps}>
              <summary
                className="tc-doc-nav__alltitle"
                aria-label="Afficher ou masquer le sommaire"
                title="Afficher ou masquer le sommaire"
              >
                <span aria-hidden="true" />
              </summary>

              {sections.map((section) => (
                <details className="tc-doc-nav__group" key={section.id} open>
                  <summary className="tc-doc-nav__grouptitle" aria-label={section.label}>
                    {section.label}
                  </summary>
                  <ul className="tc-doc-nav__list" aria-label={section.label}>
                    {section.entries.map(({ page, label }) => (
                      <li key={page.slug}>
                        <a
                          className="tc-doc-nav__link"
                          href={hrefFor(page.slug)}
                          aria-current={page.slug === currentSlug ? 'page' : undefined}
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </details>
          </Sidebar.Items>
        </div>

        <span className="tc-doc-nav__scrollbar" aria-hidden="true">
          <span
            className="tc-doc-nav__scrollbar-thumb"
            style={
              {
                '--tc-doc-nav-thumb-size': `${scrollbar.size * 100}%`,
                '--tc-doc-nav-thumb-offset': `${scrollbar.offset * 100}%`,
              } as CSSProperties
            }
          >
            <span className="tc-doc-nav__scrollbar-grip" />
          </span>
        </span>
      </Sidebar>
    </div>
  );
}
