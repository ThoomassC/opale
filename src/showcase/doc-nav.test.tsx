import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { DocNav } from './doc-nav';
import { GROUPS, HOME_SLUG } from './doc-model';
import { PAGES } from './pages';
import { UI_VERSION } from './version';

/* ============================================================================
   LES DEUX NIVEAUX DE PLI DU SOMMAIRE.

   Le sommaire se plie à deux échelles : chaque groupe, et le sommaire entier.
   Les deux sont des `<details>` NATIFS avec `open` écrit en dur, et c'est ce
   choix qui est vérifié ici — pas la mise en page.

   POURQUOI CE FICHIER N'EXISTAIT PAS AVANT. `doc-shell.test.tsx` garde l'ordre
   des entrées, la note de version et le repli d'adresse ; il ne dit rien du
   pliage, qui était pourtant la demande d'origine du sommaire. Le pliage par
   groupe a donc vécu plusieurs versions sans un seul test : il marchait, mais
   rien ne l'aurait dit s'il avait cessé de marcher.

   CE QUI EST HORS DE PORTÉE ICI, et qu'il faut dire plutôt que laisser croire :
   la LARGEUR rendue à la page par un sommaire replié est de la CSS pure
   (`:has()` + une piste de grille). jsdom ne peint pas, donc aucun test de ce
   fichier ne peut la voir. Elle est mesurée au navigateur — 288 → 140,5 px à
   1280 — et gardée en texte par `doc-nav.structure.test.ts`.
   ========================================================================== */

afterEach(cleanup);

function renderNav(currentSlug: string = HOME_SLUG) {
  return render(<DocNav pages={PAGES} currentSlug={currentSlug} />);
}

/** Le `<details>` du sommaire entier. */
function pli(): HTMLDetailsElement {
  const nav = screen.getByRole('navigation', { name: 'Sommaire' });
  const details = nav.querySelector('details.tc-doc-nav__all');
  if (!(details instanceof HTMLDetailsElement)) {
    throw new Error('aucun <details class="tc-doc-nav__all"> dans le sommaire');
  }
  return details;
}

/** Les `<details>` de groupe, dans l'ordre du DOM. */
function groupes(): readonly HTMLDetailsElement[] {
  return [...pli().querySelectorAll('details.tc-doc-nav__group')].filter(
    (node): node is HTMLDetailsElement => node instanceof HTMLDetailsElement,
  );
}

describe('DocNav — le pli du sommaire entier', () => {
  it('devrait être ouvert au premier rendu', () => {
    /* Fermé par défaut, le site s'ouvrirait sans sommaire visible : c'est une
       navigation qu'il faut alors deviner. Le pli est une commande offerte,
       pas un état initial. */
    renderNav();
    expect(pli().open, 'le sommaire doit être déplié au chargement').toBe(true);
  });

  it('devrait contenir tous les groupes, et non l’inverse', () => {
    /* L'imbrication est le tout du dispositif : si les groupes n'étaient pas
       DANS le pli, replier le sommaire ne replierait rien. Le test regarde
       donc la relation d'ancêtre et pas seulement la présence des deux. */
    renderNav();
    expect(groupes()).toHaveLength(GROUPS.length);
  });

  it('devrait laisser le numéro de version HORS du pli', () => {
    /* La version est la première chose qu'on cherche sur un site de librairie
       — elle dit si la page décrit le paquet installé. La mettre dans le pli
       l'aurait fait disparaître avec le sommaire. */
    renderNav();
    const numero = screen.getByText(`v${UI_VERSION}`);
    expect(
      pli().contains(numero),
      'le numéro de version est DANS le pli : replier le sommaire l’effacerait aussi.',
    ).toBe(false);
  });

  it('devrait se replier à la souris et cacher les liens', async () => {
    const user = userEvent.setup();
    renderNav();

    const avant = within(pli()).getAllByRole('link');
    expect(avant.length).toBeGreaterThan(0);

    const resume = pli().querySelector('summary');
    if (!(resume instanceof HTMLElement)) throw new Error('pli sans contrôle');
    await user.click(resume);

    expect(pli().open).toBe(false);
  });

  it('devrait être atteignable au clavier, sans `tabindex` ajouté', async () => {
    /* CE QUE CE TEST VÉRIFIE, ET CE QU'IL NE PEUT PAS VÉRIFIER.
       Il vérifie que le pli est atteignable au clavier NATIVEMENT : la
       tabulation l'atteint, sans qu'on ait posé de `tabindex`. C'est la moitié
       qui se mesure.

       Il ne vérifie PAS que `Entrée` et `Espace` l'actionnent. J'ai essayé, et
       le test échouait pour une raison qui n'était pas le code : jsdom ne
       traduit pas une frappe en activation sur un `<summary>`. Essayé ensuite
       au navigateur, avec le même résultat pour une autre raison — un
       `KeyboardEvent` construit en script est un événement NON FIABLE, et un
       événement non fiable ne déclenche jamais l'action par défaut. Mon harnais
       n'a pas de canal d'entrée fiable (capture d'écran et `--dump-dom`, pas de
       pilotage CDP).

       ELLE A DEPUIS ÉTÉ MESURÉE, ET CE COMMENTAIRE DISAIT « supposée » À TORT.
       Le `chrome-headless-shell` accepte `--remote-debugging-port`, donc
       `Input.dispatchKeyEvent` produit des événements FIABLES. Mesuré dans
       Chromium 151, sur les deux niveaux : pli `Entrée` `true → false`,
       `Entrée` `→ true`, `Espace` `→ false` ; groupe `Entrée` `true → false`,
       `Espace` `→ true`. Le `display: block` du `<summary>` ne casse donc PAS
       l'activation dans Chromium.

       Ce qui reste supposé est le seul moteur qui motivait ce `display: block` :
       WebKit. Il n'y a pas de Safari sur cette machine, et le risque qu'il
       perde le dépliage quand un `<summary>` quitte `list-item` est la raison
       écrite du contournement — un risque qu'on évite pour rien, faute de
       pouvoir le constater. */
    const user = userEvent.setup();
    renderNav();
    const resume = pli().querySelector('summary');
    if (!(resume instanceof HTMLElement)) throw new Error('pli sans contrôle');

    expect(
      resume.hasAttribute('tabindex'),
      'un `tabindex` sur le <summary> signale qu’on a réimplémenté ce que le natif donne.',
    ).toBe(false);

    await user.tab();
    expect(
      document.activeElement,
      'la première tabulation dans le sommaire doit atteindre le pli.',
    ).toBe(resume);
  });

  it('devrait être ouvert au premier rendu d’une page qui n’est PAS l’accueil', () => {
    /* CETTE ASSERTION MANQUAIT, ET SON ABSENCE RENDAIT LE FICHIER VERT DANS LA
       MAUVAISE DIRECTION. Tous les tests du pli partaient de l'accueil, donc ils
       ne couvraient que le sens où une valeur calculée aurait déjà valu `false`.
       Sous la mutation `open={currentSlug === HOME_SLUG}` — littéralement le
       défaut que le commentaire de `doc-nav.tsx` existe pour interdire — les
       trois premiers tests restaient verts, alors que le sommaire serait replié
       au premier rendu de 25 pages sur 26.

       Un lien profond, `#/composants/button`, est le cas normal sur un site de
       doc : on n'arrive presque jamais par l'accueil. */
    renderNav('composants/button');
    expect(
      pli().open,
      'le sommaire est replié au premier rendu d’une page profonde : `open` est calculé ' +
        'au lieu d’être écrit en dur.',
    ).toBe(true);
  });

  it('ne devrait PAS être rouvert par un changement de page', () => {
    /* LA PANNE QUE `open` ÉCRIT EN DUR ÉVITE. React n'écrit un attribut dans le
       DOM que lorsque sa valeur change d'un rendu à l'autre. À `open` constant,
       un sommaire replié à la main le reste. Calculer `open={…}` paraissait
       mieux et rouvrait le pli sous les yeux du visiteur à chaque navigation.

       Le test re-rend avec un `currentSlug` DIFFÉRENT, ce qui est exactement ce
       que fait la coquille quand on change de page. */
    const { rerender } = renderNav(HOME_SLUG);

    pli().open = false;

    rerender(<DocNav pages={PAGES} currentSlug="composants/button" />);
    expect(pli().open, 'une navigation a rouvert le sommaire replié').toBe(false);

    rerender(<DocNav pages={PAGES} currentSlug="composants/card" />);
    expect(pli().open, 'la seconde navigation a rouvert le sommaire replié').toBe(false);
  });

  it('ne devrait PAS être rouvert par un RETOUR sur l’accueil', () => {
    /* LE SECOND SENS, ET C'EST LUI QUI ATTRAPE LA MUTATION. Le test ci-dessus
       part de l'accueil et navigue AILLEURS : sous `open={currentSlug ===
       HOME_SLUG}` la valeur calculée y vaut déjà `false`, donc il passe. Il
       faut replier depuis une page profonde puis REVENIR à l'accueil, là où la
       valeur calculée repasse à `true` et rouvre le pli. */
    const { rerender } = renderNav('composants/button');

    pli().open = false;

    rerender(<DocNav pages={PAGES} currentSlug={HOME_SLUG} />);
    expect(
      pli().open,
      'revenir sur l’accueil a rouvert le sommaire que le visiteur venait de replier.',
    ).toBe(false);
  });
});

describe('DocNav — le pli par groupe', () => {
  it('devrait ouvrir tous les groupes au premier rendu', () => {
    renderNav();
    expect(groupes().map((groupe) => groupe.open)).toEqual(GROUPS.map(() => true));
  });

  it('ne devrait replier QUE le groupe actionné', async () => {
    const user = userEvent.setup();
    renderNav();
    const [premier, second] = groupes();
    if (!premier || !second) throw new Error('moins de deux groupes rendus');

    const resume = premier.querySelector('summary');
    if (!(resume instanceof HTMLElement)) throw new Error('groupe sans <summary>');
    await user.click(resume);

    expect(premier.open, 'le groupe actionné doit se replier').toBe(false);
    expect(second.open, 'les autres groupes ne doivent pas suivre').toBe(true);
  });

  it('ne devrait PAS être rouvert par un changement de page', () => {
    const { rerender } = renderNav(HOME_SLUG);
    const [premier] = groupes();
    if (!premier) throw new Error('aucun groupe rendu');

    premier.open = false;
    rerender(<DocNav pages={PAGES} currentSlug="composants/button" />);

    expect(premier.open, 'une navigation a rouvert un groupe replié').toBe(false);
  });

  it('devrait nommer le pli par `aria-label`, comme les groupes', () => {
    /* LE DÉFAUT QUE CE FICHIER N'A PAS VU EN NAISSANT. Le pli a été ajouté
       sans `aria-label`, et l'arbre d'accessibilité de Chromium donnait :

         summary.tc-doc-nav__alltitle    name = '› SOMMAIRE'
         summary.tc-doc-nav__grouptitle  name = 'Introduction'

       Le chevron du `::before` entrait dans le nom (Accname 1.2 § 2.6.2), et
       `text-transform: uppercase` s'y ajoutait. L'`aria-label` des groupes
       protège de ces DEUX choses, et le cinquième `<summary>` n'en avait aucune.

       CE TEST NE MESURE PAS LE NOM CALCULÉ, ET IL FAUT LE DIRE : jsdom ne rend
       pas le contenu généré, donc il ne peut pas voir le chevron ; `axe-core`
       non plus, sa `accessibleText` ne lisant pas les pseudo-éléments — vérifié,
       elle rendait « Sommaire ». Le défaut n'est visible que dans l'arbre
       d'accessibilité d'un vrai moteur. Ce qui SE vérifie ici, c'est la présence
       de l'attribut qui le ferme, sur TOUS les `<summary>` — les trois groupes
       plus le pli — et non sur les seuls groupes. */
    renderNav();

    const nonNommes = [...pli().parentElement!.querySelectorAll('summary')].filter(
      (resume) => resume.getAttribute('aria-label') === null,
    );

    expect(
      nonNommes.map((resume) => resume.className),
      'des <summary> du sommaire n’ont pas d’`aria-label` : leur nom accessible reçoit alors ' +
        'le chevron du `::before` et la capitalisation forcée.',
    ).toEqual([]);

    expect(
      pli().querySelector('summary')?.getAttribute('aria-label'),
      'la flèche doit rester nommée pour annoncer la commande de pliage.',
    ).toBe('Afficher ou masquer le sommaire');
  });

  it('devrait nommer chaque groupe sans le chevron du `::before`', () => {
    /* Accname 1.2 § 2.6.2 : le contenu généré d'un `::before` est préfixé au
       nom SANS espace. Le chevron entrait donc dans le nom du `<summary>`.
       `aria-label` fixe le nom ; ce test épingle qu'il est là et qu'il vaut le
       libellé nu. */
    renderNav();

    for (const group of GROUPS) {
      const resume = pli().querySelector(`summary[aria-label="${group.label}"]`);
      expect(
        resume,
        `aucun <summary> nommé « ${group.label} » : le chevron du ::before peut être revenu dans le nom.`,
      ).not.toBeNull();
    }
  });
});
