import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { Topbar } from '../magic';
import type { DocPage } from './doc-model';
import { HOME_SLUG, findPage, hrefFor } from './doc-model';
import { DocNav } from './doc-nav';
import { DocSearch } from './doc-search';
import { PageBoundary } from './page-boundary';
import { ThemeToggle } from './theme-toggle';
import { useRoute } from './use-route';

/* =============================================================================
   DEUX ÉLÉMENTS ONT ÉTÉ RETIRÉS DE CETTE COQUILLE EN 2.0, ET AUCUN DES DEUX
   N'ÉTAIT UN CHOIX D'APPARENCE.

   `<GlassLens />` était monté ici, une fois pour tout le site, parce qu'il rend
   un `<filter>` à `id` littéral et qu'un identifiant ne vaut qu'une fois par
   document. Le composant n'est plus publié et `lens.css` n'existe plus : il n'y
   a plus de bouton bulle à filtrer.

   `<MaterialToggle />` était la bascule « Verre liquide » de la barre du haut.
   Elle écrivait `data-material="glass"` sur `<html>`, et la SEULE feuille qui
   lisait ce porteur était `src/styles/glass.css`, supprimée. Vérifié :
   `data-material` n'apparaît plus dans `src/tokens/**`, dans `src/magic/**` ni
   dans `doc.css` — zéro lecteur. Un bouton `aria-pressed` qui annonce un état
   sans que rien ne change est pire qu'absent : il promet une commande à
   quelqu'un qui ne peut pas vérifier qu'elle n'a pas marché. `material-toggle`
   et `use-material` sont donc supprimés avec elle.

   CE QUI N'EST PLUS OFFERT, DIT EN CLAIR : la vitrine n'a plus qu'UN axe de
   présentation, le thème. Le matériau en était le second, et il ne reste de lui
   que les jetons — voir la page « Verre », qui documente ce qui survit.
   ========================================================================== */

/** Le nom du paquet, affiché dans la barre du haut et dans `document.title`. */
const SITE_NAME = '@thomascaron/opale';

/**
 * Le repli du repli : un registre sans page d'accueil.
 *
 * `findPage(pages, HOME_SLUG)` peut rendre `undefined` — un registre où le
 * slug `''` manque est un bug, mais il ne doit pas rendre une page blanche ni
 * demander une assertion non nulle. Cette page dit ce qui s'est passé.
 */
const EMPTY_REGISTRY_PAGE: DocPage = {
  slug: HOME_SLUG,
  label: 'Accueil',
  group: 'introduction',
  title: 'Aucune page à servir',
  render: () => (
    <p className="tc-doc-prose">
      Le registre <code>src/showcase/pages/index.tsx</code> ne déclare pas de page de slug{' '}
      <code>&apos;&apos;</code>.
    </p>
  ),
};

export interface DocShellProps {
  readonly pages: readonly DocPage[];
}

/**
 * Le corps de la page, appelé DEPUIS UN COMPOSANT et non depuis la coquille.
 *
 * Cette indirection d'une ligne est tout ce qui sépare la frontière d'erreur
 * de l'inutilité. `<PageBoundary>{page.render()}</PageBoundary>` paraît juste
 * et ne l'est pas : l'appel est évalué pendant le rendu de la COQUILLE, donc
 * au-dessus de la frontière, qui n'en reçoit que le résultat. Une page dont le
 * corps jette était bien bornée ; une page dont `render()` jette lui-même
 * remontait hors de la coquille et démontait la racine — la page blanche que
 * la frontière existe pour empêcher. Rendu ici, l'appel a lieu SOUS la
 * frontière, et les deux cas sont couverts.
 */
function PageContent({ page }: { page: DocPage }): ReactNode {
  return page.render();
}

/**
 * La coquille du site de documentation : barre du haut, barre de gauche,
 * contenu, pied de page.
 *
 * Elle ne connaît AUCUNE page — elle reçoit le registre et lit le fragment.
 * C'est ce qui permet d'écrire les pages sans toucher à la coquille, et
 * inversement.
 *
 * UN FRAGMENT INCONNU SERT L'ACCUEIL, sans redirection. Ni `history.replaceState`
 * ni réécriture du `hash` : réécrire l'adresse ferait perdre au visiteur ce
 * qu'il avait tapé ou suivi, et empêcherait le bouton « retour » de revenir en
 * arrière (le fragment corrigé remplacerait l'entrée d'historique d'origine).
 * L'adresse reste donc fausse et la page rendue est l'accueil, qui est
 * navigable — c'est le repli le moins destructeur des trois.
 */
export function DocShell({ pages }: DocShellProps) {
  const slug = useRoute();
  const page = findPage(pages, slug) ?? findPage(pages, HOME_SLUG) ?? EMPTY_REGISTRY_PAGE;

  /* LE TITRE, ET NON `<main>`, EST LA CIBLE DU FOCUS. Deux raisons mesurées :
     — `<main>` fait la hauteur entière de la page, donc l'anneau de
       `:focus-visible` devenait un rectangle de plusieurs milliers de pixels
       dont on ne voyait que deux traits verticaux, le bord haut passant sous
       la barre collante. Sur le titre, l'anneau se pose là où l'œil doit aller ;
     — un `<main>` sans nom accessible s'annonce « main », c'est-à-dire rien.
       Un titre focalisé s'annonce « Button, titre niveau 1 » chez NVDA, JAWS
       et VoiceOver : le nom de la page, une fois, par le mécanisme le plus
       universel. C'est ce qui a permis de SUPPRIMER la région live qui doublait
       l'annonce. */
  const titleRef = useRef<HTMLHeadingElement>(null);

  /* Synchronisation avec un système extérieur — le titre du document — donc un
     effet est ici l'outil juste. Le titre suit la page RENDUE, repli compris. */
  useEffect(() => {
    document.title = `${page.title} — ${SITE_NAME}`;
  }, [page.title]);

  /* La page rendue lors du dernier passage de cet effet. UNE CHAÎNE ET NON UN
     BOOLÉEN « déjà monté », et c'est ce qui rend le mode strict inoffensif :
     React monte, démonte puis remonte le composant en gardant ses `ref`, si
     bien qu'un drapeau serait déjà à `true` au second montage — la vitrine
     volerait alors le focus au chargement, exactement ce que ce garde existe
     pour empêcher. Avec le slug, le second passage voit la même valeur et ne
     fait rien. */
  const settledSlug = useRef<string | null>(null);

  useEffect(() => {
    if (settledSlug.current === page.slug) return;

    const isFirstRoute = settledSlug.current === null;
    settledSlug.current = page.slug;

    /* Au premier rendu on ne touche à rien : déplacer le focus au chargement
       le volerait à la barre d'adresse et couperait la lecture qui commence
       (WCAG 3.2.1). Le titre est déjà le premier élément du contenu — il n'y a
       rien à faire gagner à personne. */
    if (isFirstRoute) return;

    /* `preventScroll` puis remise à zéro à la main : donner le focus fait
       défiler le navigateur jusqu'à l'élément, ce qui rejouerait le défilement
       qu'on est en train de remettre en haut. */
    titleRef.current?.focus({ preventScroll: true });

    /* `scrollTop` et non `window.scrollTo` : l'accesseur est un simple attribut
       de l'élément défilant, là où `scrollTo` n'est pas implémenté par jsdom et
       y émet une erreur de console à chaque navigation testée. */
    const scroller = document.scrollingElement ?? document.documentElement;
    scroller.scrollTop = 0;
  }, [page.slug]);

  return (
    <div className="tc-doc">
      {/* LE LIEN D'ÉVITEMENT NE DOIT PAS NAVIGUER, et sans ce gestionnaire il
          navigue. Le routage lit TOUT le fragment : laisser le navigateur poser
          `#contenu` dans l'adresse, c'est `parseSlug('#contenu') === 'contenu'`,
          aucune page de ce slug, et le repli sur l'accueil. Le lien censé faire
          gagner du temps faisait donc PERDRE la page qu'on lisait — la panne
          était d'autant plus discrète que le focus, lui, atterrissait au bon
          endroit.

          `href` est conservé : c'est ce qui en fait un lien pour les
          technologies d'assistance et ce qui le fait fonctionner si le
          gestionnaire n'a pas encore été attaché. Le `preventDefault` empêche
          seulement l'écriture du fragment, et le focus est donné à la main —
          `focus()` sans `preventScroll`, pour que le défilement suive comme
          l'aurait fait l'ancre. Il vise le TITRE et non `<main>`, pour la même
          raison que le changement de route : c'est là que la lecture reprend. */}
      <a
        className="tc-doc-skip"
        href="#contenu"
        onClick={(event) => {
          event.preventDefault();
          titleRef.current?.focus();
        }}
      >
        Aller au contenu
      </a>

      {/* =====================================================================
          LA BARRE DU HAUT EST LE `Topbar` DE LA LIBRAIRIE, ET LE `<div>` QUI
          L'ENTOURE N'EST PAS DÉCORATIF.

          `Topbar` rend son `<header>` À L'INTÉRIEUR d'un `Glass`, dont
          l'enveloppe porte depuis peu `z-index: 0` — donc un contexte
          d'empilement. Une barre collante posée sur le composant serait
          enfermée à 0 dans son propre contexte, et le `z-index` qui la met
          au-dessus du contenu ne peut pas vivre là : c'est l'élément qu'on
          positionne AUTOUR qui doit le porter. `.tc-doc-topbar` est donc le
          calque collant (`position: sticky; z-index: 2`) et le sol opaque ; le
          composant est le matériau posé dessus.

          CE `<div>` NE VOLE PAS LE POINT DE REPÈRE. `<header>` prend le rôle
          `banner` dès qu'il n'est pas dans un `article`, `aside`, `main`,
          `nav` ou `section` — un `<div>` n'en fait pas partie, donc la barre
          reste le `banner` du document. Vérifié : `getByRole('banner')` de
          `doc-shell.test.tsx` continue de la trouver.

          LE SOL OPAQUE EST AUSSI CE QUI REND LE VERRE SÛR. `Glass` floute son
          arrière-plan (`backdrop-filter: blur(2px)`) : sur un fond
          TRANSPARENT, ce serait le contenu de la page qui remonterait sous
          l'encre de la barre — le défaut exact que `doc.css` mesurait pour
          refuser le verre sur la barre en 1.x (encre de marque à 2,64:1
          au-dessus d'une plaque sombre qui défile). Avec un sol opaque, le
          flou n'échantillonne qu'un aplat : la surface composée est constante,
          et c'est elle qui est mesurée.

          `elevated={false}`, ET CE N'EST PAS UN CHOIX D'APPARENCE : l'ombre
          d'`elevated` est posée sur le `<header>`, c'est-à-dire À L'INTÉRIEUR
          de l'enveloppe de verre, qui porte `overflow: hidden`. Elle est donc
          rognée par son propre parent et ne se voit pas. La demander serait
          annoncer une élévation que rien ne peint.
          ================================================================== */}
      <div className="tc-doc-topbar">
        <Topbar
          className="tc-doc-topbar__bar"
          rootClassName="tc-doc-topbar__glass"
          size="spacious"
          elevated={false}
        >
          {/* `Topbar.Brand` EST EMPLOYÉ, MAIS NI `icon`, NI `title`, NI
              `subtitle`, et c'est la même raison que pour `Sidebar.Item` :
              les trois rendent des `<span>`. Or la marque est LE LIEN DE
              RETOUR À L'ACCUEIL — clic milieu, « copier le lien », ouverture
              dans un onglet, et une annonce « lien » plutôt que « texte ». Le
              `<a>` est donc passé en enfants, avec l'icône du favicon dedans pour
              qu'il fasse partie de la cible ; le composant apporte la boîte
              (`min-w-0`, l'alignement, la gouttière). */}
          <Topbar.Brand className="tc-doc-topbar__side">
            <a className="tc-doc-topbar__brand" href={hrefFor(HOME_SLUG)}>
              <img className="tc-doc-topbar__glyph" src="/favicon.svg" alt="" aria-hidden="true" />
              {SITE_NAME}
            </a>
          </Topbar.Brand>

          {/* LA RECHERCHE EST LA SECTION ÉLASTIQUE, et `grow` est exactement ce
              que `doc.css` écrivait à la main : `flex: 1 1 auto` avec un
              plancher. Elle reste ENTRE la marque et les contrôles — c'est ce
              qui lui donne la place, la marque se tronquant et la bascule
              ayant une largeur fixe. Le combobox lui-même n'a pas changé d'une
              ligne : il est déplacé, pas réécrit. */}
          <Topbar.Section className="tc-doc-topbar__field" grow align="center">
            <DocSearch pages={pages} />
          </Topbar.Section>

          {/* LE SÉPARATEUR EST DANS LES ACTIONS ET NON ENTRE ELLES ET LE CHAMP,
              et c'est de la géométrie et non du rangement : les deux pistes
              latérales sont égales par construction (`flex: 1 1 0`), donc la
              section du milieu est centrée sur la barre quoi qu'elles portent.
              Un `Topbar.Divider` posé en FRÈRE ajouterait sa largeur et sa
              gouttière — 17 px mesurés — d'un seul côté, et le champ cesserait
              d'être centré. */}
          <Topbar.Actions className="tc-doc-topbar__side tc-doc-topbar__actions">
            <ThemeToggle />
          </Topbar.Actions>
        </Topbar>
      </div>

      <div className="tc-doc-body">
        <DocNav pages={pages} currentSlug={page.slug} />

        <div className="tc-doc-column">
          {/* `tabIndex={-1}` sur `<main>` reste le FILET du lien d'évitement :
              son `href="#contenu"` doit continuer de déplacer le focus si le
              gestionnaire de clic n'a pas encore été attaché. Le focus visé
              par le code, lui, est le titre juste en dessous. */}
          <main
            className={`tc-doc-main${page.group === 'composants' ? ' tc-doc-main--components' : ''}`}
            id="contenu"
            tabIndex={-1}
          >
            <h1 className="tc-doc-page__title" ref={titleRef} tabIndex={-1}>
              {page.title}
            </h1>
            {/* La frontière n'entoure QUE le contenu de la page : le titre, le
                sommaire et les deux bascules restent rendus quoi qu'il
                arrive. Une page sur vingt et une qui jette ne doit pas
                emporter les vingt autres avec elle — c'est l'incident que
                `src/index.ts` documente, arrivé une fois avec un `Pill`. */}
            <PageBoundary resetKey={page.slug}>
              <PageContent page={page} />
            </PageBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
