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
 * La barre de navigation du site de documentation.
 *
 * AUCUN TITRE DE SECTION ICI, ET C'EST DÉLIBÉRÉ. La nav précède le contenu
 * dans le DOM ; un `<h2>` par groupe placerait quatre titres de niveau 2 avant
 * le `<h1>` de la page, c'est-à-dire un plan de document inversé pour qui
 * navigue par titres. Les titres de groupe sont donc des `<summary>`
 * visibles — ni `<h2>` ni `<h3>` —, et chaque liste est nommée par `aria-label` : elle s'annonce « Fondations,
 * liste, 5 éléments » sans rien ajouter au plan.
 *
 * PLIABLE PAR GROUPE, EN `<details>`/`<summary>` NATIFS. La coquille et ses
 * composants n'ont pas d'état React — pas un hook, pas un `"use client"` — donc
 * un dépliage porté par `useState` était exclu. `<details>` donne le même
 * comportement sans une ligne de JavaScript : il est focusable, il s'actionne à
 * `Entrée` comme à `Espace`, et il s'annonce « Composants, groupe réduit » chez
 * NVDA, JAWS et VoiceOver, ce qu'un `<div>` plus `aria-expanded` n'obtiendrait
 * qu'en réimplémentant les trois.
 *
 * `open` EST ÉCRIT EN DUR ET NON CALCULÉ, et c'est la décision qui fait que le
 * pliage tient. React n'écrit un attribut dans le DOM que lorsque sa valeur
 * CHANGE d'un rendu à l'autre : à `open` constant, un groupe replié à la main
 * le reste, parce que rien ne vient le rouvrir. Calculer `open={groupeCourant}`
 * paraissait mieux — le groupe de la page lue serait toujours ouvert — mais la
 * valeur change alors à chaque navigation, donc React réécrit l'attribut, et
 * un groupe que le visiteur venait d'ouvrir se refermait sous ses yeux dès
 * qu'il changeait de page. Le prix de ce choix est assumé et il est réel : un
 * groupe replié cache le lien `aria-current` de la page en cours. C'est le
 * visiteur qui l'a replié, et il est à un clic.
 *
 * `aria-label` ET NON `aria-labelledby` VERS LE TITRE DE GROUPE, après mesure.
 * Ce titre — un `<p>` à l'époque de cette mesure, un `<summary>` depuis —
 * contient le libellé PUIS la note, sans aucune espace entre les deux dans le
 * DOM : le nom calculé valait donc « FondationsCe que les composants
 * consomment. », lisible seulement si le navigateur insère une séparation à la
 * frontière du `<span>` — ce que Chromium fait parce que la note est en
 * `display: block`, mais qui n'est garanti par aucune spécification. Faire
 * dépendre le nom d'un point de repère d'une déclaration CSS n'est pas
 * acceptable. La note reste dans le `<p>`, donc lue en linéaire par les
 * technologies d'assistance : elle n'est simplement plus dans le NOM.
 */
export function DocNav({ pages, currentSlug }: DocNavProps) {
  return (
    <nav className="tc-doc-nav" aria-label="Sommaire">
      {/* PREMIER ENFANT DE LA NAV : la version. Sur un site de librairie, c'est
          la première chose qu'on cherche — avant même le sommaire — parce
          qu'elle dit si la page qu'on lit décrit le paquet qu'on a installé.
          `UI_VERSION` et jamais une chaîne littérale : la constante est gardée
          contre `package.json`, une copie ici ne le serait pas.

          Le point médian est `aria-hidden` : certains lecteurs l'énoncent
          « point médian », ce qui transforme une respiration typographique en
          mot parasite au milieu de la première information de la page. */}
      <p className="tc-doc-nav__version">
        <span className="tc-doc-nav__versionnumber">v{UI_VERSION}</span>{' '}
        <span className="tc-doc-nav__versionnote">
          stable <span aria-hidden="true">·</span> React ≥ 19
        </span>
      </p>

      {/* LE SOMMAIRE ENTIER SE PLIE, ET C'EST UN SECOND `<details>` AUTOUR DES
          QUATRE PREMIERS. Les groupes se pliaient déjà un par un ; ce qui
          manquait était de rendre la colonne au contenu d'un seul geste.

          EN `<details>` IMBRIQUÉ ET NON EN ÉTAT REACT, pour la raison qui a
          déjà fait ce choix un cran plus bas : la largeur de la piste de
          gauche est la seule chose que le pliage doit changer côté page, et
          `:has(.tc-doc-nav__all:not([open]))` la lit depuis la feuille. Aucun
          hook, aucun `useState`, donc aucun rendu à provoquer et rien qui
          puisse rouvrir le sommaire dans le dos du visiteur — ce que
          `open` écrit en dur garantit, et qui est vérifié : après un pli
          manuel, `open` reste `false` à travers deux navigations.

          LA VERSION RESTE DEHORS, au-dessus du `<summary>`. C'est la première
          information qu'on cherche sur un site de librairie : la mettre dans
          le pli l'aurait fait disparaître avec le sommaire, alors qu'elle ne
          coûte qu'une ligne à garder. Le pli porte donc les quatre groupes,
          rien de plus. */}
      <details className="tc-doc-nav__all" open>
        {/* `aria-label` OBLIGATOIRE, ET SON ABSENCE ÉTAIT LE DÉFAUT LE PLUS SÉRIEUX
            DE CE CHANGEMENT. Les quatre `<summary>` de groupe le portent depuis
            plusieurs versions, pour la raison écrite vingt lignes plus bas ; le
            cinquième, ajouté par-dessus, ne l'avait pas.

            Mesuré dans l'arbre d'accessibilité de Chromium, pas déduit :

              summary.tc-doc-nav__alltitle    name = '› SOMMAIRE'
              summary.tc-doc-nav__grouptitle  name = 'Introduction'

            Le chevron du `::before` entrait donc dans le nom (Accname 1.2
            § 2.6.2 : le contenu généré est préfixé au texte, sans espace), et
            `text-transform: uppercase` s'y ajoutait — un lecteur réglé sur les
            capitales épelle alors « S-O-M-M-A-I-R-E ». L'`aria-label` des
            groupes protège de CES DEUX CHOSES à la fois, et le pli perdait les
            deux.

            NI `doc-nav.test.tsx` NI `axe-core` NE POUVAIENT LE VOIR : jsdom ne
            rend pas le contenu généré, et la `accessibleText` d'axe-core ne lit
            pas les pseudo-éléments — vérifié, elle rendait « Sommaire ». Le
            défaut n'apparaît que dans l'arbre d'accessibilité d'un vrai moteur.

            LE NOM EST « Sommaire », COMME LE POINT DE REPÈRE QUI L'ENTOURE, et
            c'est assumé : un lecteur énonce « Sommaire, navigation » puis
            « Sommaire, bouton, développé ». Le rôle désambiguïse, et 2.4.6 ne
            l'interdit pas. Un `<summary>` dont le libellé changerait avec
            l'état (« Masquer » / « Afficher ») rendrait la commande
            introuvable au second coup d'œil, et l'état est DÉJÀ annoncé par
            `<details>` — mesuré, `expanded` suit les deux niveaux. */}
        <summary className="tc-doc-nav__alltitle" aria-label="Sommaire">
          Sommaire
        </summary>

        {GROUPS.map((group) => {
          const groupPages = pages.filter((page) => page.group === group.id);

          /* Un groupe vide ne rend NI son titre ni sa liste : un titre suivi de
           rien s'annonce comme une section vide, et un `<ul>` sans `<li>` est
           une liste de zéro élément que le lecteur d'écran énonce quand même. */
          if (groupPages.length === 0) return null;

          return (
            <details className="tc-doc-nav__group" key={group.id} open>
              {/* Le chevron est peint par la feuille sur `::before` du `<summary>`
                et non écrit ici : c'est `[open]` qui le tourne, donc l'indice
                d'état suit l'élément qui porte l'état. Le marqueur natif est
                retiré côté CSS — il n'est pas stylable de la même façon dans
                les trois moteurs. */}
              {/* `aria-label` SUR LE `<summary>`, ET IL FERME DEUX TROUS D'UN COUP.
                Un `<summary>` est une COMMANDE : son nom se calcule depuis son
                contenu, ce qu'un `<p>` inerte ne faisait pas.

                1. le chevron du `::before` ENTRE dans ce nom. Accname 1.2,
                   § 2.6.2 : le contenu généré d'un `::before` est préfixé au
                   texte du nœud, SANS espace. Le nom commençait donc par un
                   guillemet simple pointant à droite, qu'un lecteur en
                   verbosité « toute la ponctuation » énonce ;
                2. le libellé et la note sont adjacents SANS nœud de texte
                   entre eux. C'est exactement le défaut que le bloc ci-dessus
                   décrit pour refuser `aria-labelledby` — « Faire dépendre le
                   nom d'un point de repère d'une déclaration CSS n'est pas
                   acceptable » — et il était revenu, sur un contrôle cette
                   fois. `aria-label` fixe le nom et rend la question sans
                   objet ; la note reste dans le contenu, donc lue en linéaire
                   juste après.

                L'espace littéral est conservé par-dessus : il ne sert plus au
                nom, il sert à ce que le DOM se lise correctement pour tout ce
                qui ignorerait `aria-label`. */}
              <summary className="tc-doc-nav__grouptitle" aria-label={group.label}>
                {group.label}{' '}
                {group.note ? <span className="tc-doc-nav__groupnote">{group.note}</span> : null}
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
    </nav>
  );
}
