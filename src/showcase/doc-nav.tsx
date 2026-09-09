import { Fragment } from 'react';

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
 * navigue par titres. Les titres de groupe sont donc des `<p>` visibles, et
 * chaque liste est nommée par `aria-label` : elle s'annonce « Fondations,
 * liste, 5 éléments » sans rien ajouter au plan.
 *
 * `aria-label` ET NON `aria-labelledby` VERS CE `<p>`, après mesure. Le `<p>`
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

      {GROUPS.map((group) => {
        const groupPages = pages.filter((page) => page.group === group.id);

        /* Un groupe vide ne rend NI son titre ni sa liste : un titre suivi de
           rien s'annonce comme une section vide, et un `<ul>` sans `<li>` est
           une liste de zéro élément que le lecteur d'écran énonce quand même. */
        if (groupPages.length === 0) return null;

        return (
          <Fragment key={group.id}>
            <p className="tc-doc-nav__grouptitle">
              {group.label}
              {group.note ? <span className="tc-doc-nav__groupnote">{group.note}</span> : null}
            </p>
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
          </Fragment>
        );
      })}
    </nav>
  );
}
