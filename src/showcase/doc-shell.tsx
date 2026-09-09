import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import type { DocPage } from './doc-model';
import { HOME_SLUG, findPage, hrefFor } from './doc-model';
import { DocNav } from './doc-nav';
import { PageBoundary } from './page-boundary';
import { ThemeToggle } from './theme-toggle';
import { useRoute } from './use-route';

/** Le nom du paquet, affiché dans la barre du haut et dans `document.title`. */
const SITE_NAME = '@thomascaron/ui';

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

      {/* La barre du haut porte l'identité et la bascule de thème, et rien
          d'autre : le sommaire est en colonne, il n'a pas de doublon ici. */}
      <header className="tc-doc-topbar">
        <a className="tc-doc-topbar__brand" href={hrefFor(HOME_SLUG)}>
          <span className="tc-doc-topbar__glyph" aria-hidden="true">
            ◆
          </span>
          {SITE_NAME}
        </a>
        {/* Le conteneur n'est pas décoratif : il pousse la bascule en fin de
            ligne ET annule la marge haute que `.tc-doc-themetoggle` portait
            pour l'ancien grand en-tête, sans modifier sa règle. */}
        <div className="tc-doc-topbar__actions">
          <ThemeToggle />
        </div>
      </header>

      <div className="tc-doc-body">
        <DocNav pages={pages} currentSlug={page.slug} />

        <div className="tc-doc-column">
          {/* `tabIndex={-1}` sur `<main>` reste le FILET du lien d'évitement :
              son `href="#contenu"` doit continuer de déplacer le focus si le
              gestionnaire de clic n'a pas encore été attaché. Le focus visé
              par le code, lui, est le titre juste en dessous. */}
          <main className="tc-doc-main" id="contenu" tabIndex={-1}>
            <h1 className="tc-doc-page__title" ref={titleRef} tabIndex={-1}>
              {page.title}
            </h1>
            {page.lede ? <p className="tc-doc-prose tc-doc-page__lede">{page.lede}</p> : null}
            {/* La frontière n'entoure QUE le contenu de la page : le titre, le
                sommaire et la bascule de thème restent rendus quoi qu'il
                arrive. Une page sur vingt-trois qui jette ne doit pas emporter
                les vingt-deux autres avec elle — c'est l'incident que
                `src/index.ts` documente, arrivé une fois avec un `Pill`. */}
            <PageBoundary resetKey={page.slug}>
              <PageContent page={page} />
            </PageBoundary>
          </main>

          <footer className="tc-doc-footer">
            <div className="tc-doc-shell">
              <p className="tc-doc-prose">
                Les ratios affichés sont recalculés en intégration continue à partir de la feuille
                de jetons par <code>src/contract/</code>. Un chiffre faux fait échouer la suite : ce
                ne sont pas des annotations.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
