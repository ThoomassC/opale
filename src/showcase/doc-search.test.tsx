import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DocPage } from './doc-model';
import { DocSearch } from './doc-search';

/* ============================================================================
   CE QUE CE FICHIER GARDE

   `doc-search.tsx` implémente le motif « Combobox » de l'APG dans sa forme à
   liste, et le commentaire en tête du fichier le dit : « c'est le motif le plus
   facile à rater de tout ARIA, et le rater ne se voit pas à la souris ». Ce
   fichier est la seule chose qui puisse le voir.

   Ce qui est vérifié est le CÂBLAGE OBSERVABLE, pas l'état interne : les
   attributs que le lecteur d'écran lit (`aria-expanded`,
   `aria-activedescendant`, `aria-selected`), les touches que l'APG impose, et
   l'adresse écrite au choix d'une suggestion. `activeIndex` n'est jamais lu :
   ce n'est pas un contrat, c'est une variable.

   LE REGISTRE EST FABRIQUÉ, comme dans `search-model.test.ts` : un garde du
   clavier écrit sur `PAGES` compterait les vraies pages, donc rougirait au
   prochain composant publié. Les groupes, eux, sont de vrais `DocGroupId` —
   `search-model.ts` indexe les noms de groupe depuis le `GROUPS` réel.
   ========================================================================== */

const BUTTON: DocPage = {
  slug: 'composants/button',
  label: 'Button',
  group: 'composants',
  title: 'Button',
  render: () => <p>corps de Button</p>,
};

const BULLE: DocPage = {
  slug: 'composants/bulle',
  label: 'Bulle',
  group: 'composants',
  title: 'La bulle de dialogue',
  render: () => <p>corps de Bulle</p>,
};

const BADGE: DocPage = {
  slug: 'composants/badge',
  label: 'Badge',
  group: 'composants',
  title: 'Badge',
  render: () => <p>corps de Badge</p>,
};

/** Aucun « b » dans son libellé, son titre ni son groupe : le témoin négatif. */
const ELEVATION: DocPage = {
  slug: 'elevation',
  label: 'Élévation',
  group: 'fondations',
  title: 'Élévation',
  render: () => <p>corps d’Élévation</p>,
};

/** Trois correspondances pour « b », une seule pour « elev ». */
const PAGES: readonly DocPage[] = [BUTTON, BULLE, BADGE, ELEVATION];

/** Les libellés des trois suggestions de « b », dans l'ordre du registre. */
const B_LABELS = ['Button', 'Bulle', 'Badge'];

/** Dix correspondances pour « b » : de quoi dépasser le plafond de huit. */
const TEN_PAGES: readonly DocPage[] = [
  'Badge',
  'Bandeau',
  'Barre',
  'Bloc',
  'Bordure',
  'Bouton',
  'Breadcrumb',
  'Bulle',
  'Button',
  'Brouillon',
].map((label, index) => ({
  slug: `composants/b-${index}`,
  label,
  group: 'composants' as const,
  title: label,
  render: () => <p>corps de {label}</p>,
}));

const FIELD_NAME = 'Rechercher une page';

function field(): HTMLElement {
  return screen.getByRole('combobox', { name: FIELD_NAME });
}

/** Les options RÉELLEMENT exposées : la liste masquée n'en expose aucune. */
function options(): HTMLElement[] {
  return screen.queryAllByRole('option');
}

function optionLabels(): string[] {
  return options().map(
    (option) => option.querySelector('.tc-doc-search__label')?.textContent ?? '',
  );
}

/**
 * L'option désignée par `aria-activedescendant`, résolue DANS LE DOCUMENT.
 *
 * Le point de la résolution : un `aria-activedescendant` qui pointe vers un
 * identifiant absent est pire qu'absent — le lecteur d'écran n'annonce rien et
 * l'utilisateur croit s'être déplacé. C'est ce qu'on vérifie, pas la valeur de
 * la chaîne.
 */
function activeOption(): HTMLElement | null {
  const id = field().getAttribute('aria-activedescendant');
  return id === null ? null : document.getElementById(id);
}

/** Le libellé de l'option désignée, ou `null` s'il n'y en a pas. */
function activeLabel(): string | null {
  return activeOption()?.querySelector('.tc-doc-search__label')?.textContent ?? null;
}

/**
 * Le texte de la région d'annonce.
 *
 * Cherché par `aria-live` et non par rôle : le compte est porté par un `<p>`
 * visuellement masqué, qui n'a pas de rôle ARIA — c'est justement `aria-live`
 * qui est le contrat.
 */
function announcement(): string {
  const region = document.querySelector('[aria-live="polite"]');
  expect(
    region,
    'aucune région aria-live="polite" : le compte n’est jamais annoncé',
  ).not.toBeNull();
  return region?.textContent ?? '';
}

/** Remet l'adresse à la racine, sans passer par le composant. */
function resetRoute(): void {
  window.history.replaceState(null, '', '/');
}

beforeEach(resetRoute);

afterEach(() => {
  cleanup();
  resetRoute();
});

describe('DocSearch — le câblage ARIA du combobox', () => {
  it('devrait exposer le champ comme combobox nommé « Rechercher une page »', async () => {
    render(<DocSearch pages={PAGES} />);

    // Un vrai `<label>` masqué, et non un `placeholder` : le nom doit survivre
    // à la première frappe.
    expect(field()).toHaveAccessibleName(FIELD_NAME);
    await userEvent.setup().type(field(), 'b');
    expect(field()).toHaveAccessibleName(FIELD_NAME);
  });

  it('devrait annoncer aria-autocomplete="list"', () => {
    render(<DocSearch pages={PAGES} />);

    expect(field()).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('devrait annoncer aria-expanded="false" au repos', () => {
    render(<DocSearch pages={PAGES} />);

    expect(field()).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait garder aria-expanded="false" quand le champ a le focus et la requête est vide', async () => {
    /* `aria-expanded` DIT LA LISTE, PAS L'INTENTION. Le focus n'ouvre rien :
       il n'y a aucune suggestion à annoncer, et se dire développé est un
       mensonge que le lecteur d'écran répète. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.click(field());

    expect(field()).toHaveFocus();
    expect(field()).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait garder aria-expanded="false" pour une requête d’espaces seuls', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), '   ');

    expect(field()).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait passer aria-expanded="true" dès qu’une requête non vide est saisie', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'b');

    expect(field()).toHaveAttribute('aria-expanded', 'true');
  });

  it('devrait faire pointer aria-controls vers un élément qui existe, au repos comme ouvert', async () => {
    /* LA LISTE EXISTE TOUJOURS DANS LE DOM, et c'est ce qui rend
       `aria-controls` honnête : certaines technologies d'assistance résolvent
       la référence au chargement, avant toute frappe. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    const controlled = field().getAttribute('aria-controls') ?? '';
    expect(controlled, 'aria-controls est absent ou vide').not.toBe('');
    expect(
      document.getElementById(controlled),
      `aria-controls="${controlled}" ne désigne aucun élément du document`,
    ).not.toBeNull();

    await user.type(field(), 'b');

    expect(document.getElementById(controlled)).not.toBeNull();
    expect(field().getAttribute('aria-controls')).toBe(controlled);
  });

  it('devrait faire de l’élément contrôlé la liste de suggestions nommée', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    const listbox = screen.getByRole('listbox');

    expect(listbox).toHaveAttribute('id', field().getAttribute('aria-controls'));
    expect(listbox, 'la liste n’a pas de nom accessible').toHaveAccessibleName('Suggestions');
  });

  it('ne devrait exposer aucune liste ni aucune option au repos', () => {
    render(<DocSearch pages={PAGES} />);

    // `hidden` retire la liste de l'arbre d'accessibilité : rien ne doit être
    // atteignable avant la première frappe.
    expect(screen.queryAllByRole('listbox')).toHaveLength(0);
    expect(options()).toHaveLength(0);
  });

  it('devrait exposer une option par suggestion, dans l’ordre du classement', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'b');

    expect(optionLabels()).toEqual(B_LABELS);
  });

  it('devrait afficher le libellé lisible du groupe sous chaque suggestion', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'elev');

    expect(screen.getByRole('option')).toHaveTextContent('Fondations');
  });
});

describe('DocSearch — aria-activedescendant', () => {
  it('ne devrait porter aucun aria-activedescendant au repos', () => {
    render(<DocSearch pages={PAGES} />);

    expect(field()).not.toHaveAttribute('aria-activedescendant');
  });

  it('ne devrait porter aucun aria-activedescendant quand la liste s’ouvre sans option désignée', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'b');

    expect(options()).toHaveLength(3);
    expect(
      field(),
      `aria-activedescendant="${field().getAttribute('aria-activedescendant')}" alors ` +
        `qu'aucune option n'a été désignée — la première serait annoncée comme choisie`,
    ).not.toHaveAttribute('aria-activedescendant');
  });

  it('devrait désigner l’option courante par un identifiant qui existe dans le DOM', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.keyboard('{ArrowDown}');

    const id = field().getAttribute('aria-activedescendant');
    expect(id, 'aucun aria-activedescendant après ArrowDown').not.toBeNull();
    expect(
      document.getElementById(id ?? ''),
      `aria-activedescendant="${id}" ne désigne aucun élément — rien n'est annoncé`,
    ).toBe(options()[0]);
  });

  it('devrait marquer aria-selected="true" sur l’option désignée, et sur elle seule', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.keyboard('{ArrowDown}{ArrowDown}');

    const selected = options().filter((option) => option.getAttribute('aria-selected') === 'true');

    expect(
      selected,
      `${selected.length} option(s) portent aria-selected="true" — la liste annonce ` +
        `plusieurs choix simultanés`,
    ).toHaveLength(1);
    expect(selected[0]).toBe(activeOption());
    expect(activeLabel()).toBe('Bulle');
  });

  it('devrait annuler l’option courante à la frappe suivante', async () => {
    /* L'OPTION COURANTE EST REMISE À ZÉRO À CHAQUE FRAPPE. La garder
       désignerait une autre page dès que la liste change de contenu : on aurait
       désigné « Button » puis validé « Badge » sans rien voir bouger. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');
    await user.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Button');

    await user.type(field(), 'u');

    expect(
      field(),
      `aria-activedescendant survit à la frappe : il désigne « ${activeLabel()} » ` +
        `dans une liste qui vient de changer`,
    ).not.toHaveAttribute('aria-activedescendant');
    expect(options().filter((one) => one.getAttribute('aria-selected') === 'true')).toHaveLength(0);
  });
});

describe('DocSearch — le clavier', () => {
  it('devrait descendre d’une option à chaque ArrowDown', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Button');

    await user.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Bulle');

    await user.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Badge');
  });

  it('devrait rouvrir la liste fermée et y descendre au premier ArrowDown', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');
    await user.keyboard('{Escape}');
    expect(field()).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowDown}');

    expect(field()).toHaveAttribute('aria-expanded', 'true');
    expect(activeLabel()).toBe('Button');
  });

  it('devrait boucler sur la première option quand ArrowDown dépasse la dernière', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');

    expect(
      activeLabel(),
      `après la dernière des ${B_LABELS.length} options, ArrowDown désigne ` +
        `« ${activeLabel()} » au lieu de revenir en tête`,
    ).toBe('Button');
  });

  it('devrait boucler sur la dernière option quand ArrowUp remonte au-delà de la première', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');
    await user.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Button');

    await user.keyboard('{ArrowUp}');

    expect(activeLabel()).toBe('Badge');
  });

  it('devrait remonter d’une option à chaque ArrowUp', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(activeLabel()).toBe('Badge');

    await user.keyboard('{ArrowUp}');

    expect(activeLabel()).toBe('Bulle');
  });

  it('devrait désigner la dernière option au premier ArrowUp sur une liste sans option courante', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'b');
    await user.keyboard('{ArrowUp}');

    expect(activeLabel()).toBe('Badge');
  });

  it('ne devrait PAS voler Début et Fin à l’édition du texte', async () => {
    /* CE TEST GARDE UN COMPORTEMENT RETIRÉ, et son sens s'est inversé. Les deux
       touches désignaient la première et la dernière suggestion,
       `preventDefault` compris. L'APG l'autorise pour un combobox NON éditable
       et dit l'inverse pour un champ de saisie — « if the combobox is editable,
       returns focus to the combobox and places the cursor on the first
       character » — en les marquant OPTIONNELLES.

       Le coût mesuré : requête « buton », la faute est au début, `Début` ne
       bougeait pas le curseur et désignait la première suggestion à la place.
       Pour qui relit son champ à la synthèse vocale, la relecture était
       impossible dès qu'il y avait un résultat.

       Ce qui est vérifié ici : les deux touches ne touchent plus à l'option
       courante, et le caret se déplace. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const designatedBefore = activeLabel();

    await user.keyboard('{Home}');

    expect(
      activeLabel(),
      'Début a déplacé l’option courante : la touche est volée à l’édition du texte.',
    ).toBe(designatedBefore);
    expect(
      (field() as HTMLInputElement).selectionStart,
      'Début n’a pas ramené le caret au premier caractère.',
    ).toBe(0);

    await user.keyboard('{End}');

    expect(activeLabel(), 'Fin a déplacé l’option courante.').toBe(designatedBefore);
    expect(
      (field() as HTMLInputElement).selectionStart,
      'Fin n’a pas porté le caret en fin de texte.',
    ).toBe(1);
  });

  it('ne devrait rien désigner quand ArrowDown est pressé sur une requête vide', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.click(field());
    await user.keyboard('{ArrowDown}');

    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(field()).not.toHaveAttribute('aria-activedescendant');
  });

  it('ne devrait pas naviguer sur Entrée sans option courante', async () => {
    /* SANS SUGGESTION COURANTE, `Entrée` NE FAIT RIEN — et surtout pas
       « ouvrir la première ». Valider une page qu'on n'a pas désignée envoie
       ailleurs celui qui tapait encore. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.keyboard('{Enter}');

    expect(
      window.location.hash,
      `Entrée a navigué vers « ${window.location.hash} » sans qu'aucune option ` +
        `ne soit désignée`,
    ).toBe('');
    expect(field()).toHaveValue('b');
  });

  it('devrait naviguer sur Entrée avec une option courante', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeLabel()).toBe('Bulle');

    await user.keyboard('{Enter}');

    expect(window.location.hash).toBe('#/composants/bulle');
  });

  it('devrait fermer la liste en gardant le texte au premier Escape', async () => {
    /* DEUX ÉCHAPPEMENTS, ET C'EST L'APG : vider dès le premier fait perdre une
       requête qu'on voulait juste corriger. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'bu');

    await user.keyboard('{Escape}');

    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(options()).toHaveLength(0);
    expect(field(), 'le premier Escape a vidé le champ').toHaveValue('bu');
  });

  it('devrait vider le champ au second Escape', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'bu');

    await user.keyboard('{Escape}{Escape}');

    expect(field()).toHaveValue('');
    expect(field()).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait fermer la liste sur Tab sans retenir le focus', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.tab();

    expect(field()).not.toHaveFocus();
    expect(field()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('DocSearch — la navigation', () => {
  it('devrait écrire le fragment de la suggestion choisie au clic', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.click(screen.getByRole('option', { name: /Bulle/ }));

    // `#/` + le slug, la forme canonique de `hrefFor` : tout le routage de la
    // vitrine lit le fragment.
    expect(window.location.hash).toBe('#/composants/bulle');
  });

  it('devrait vider le champ après le choix d’une suggestion', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.click(screen.getByRole('option', { name: /Badge/ }));

    expect(field()).toHaveValue('');
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(options()).toHaveLength(0);
  });

  it('devrait désigner l’option survolée à la souris', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.hover(screen.getByRole('option', { name: /Badge/ }));

    expect(activeLabel()).toBe('Badge');
    expect(screen.getByRole('option', { name: /Badge/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('ne devrait pas retirer le focus au champ en choisissant à la souris', async () => {
    /* LA CORRECTION D'UN DÉFAUT CLASSIQUE, câblée par `onMouseDown` +
       `preventDefault` : sans elle, appuyer sur une option retire le focus au
       champ AVANT que le clic ne soit émis, le `blur` ferme le panneau,
       l'option disparaît sous le doigt et le clic n'atteint plus rien. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');

    await user.click(screen.getByRole('option', { name: /Bulle/ }));

    expect(field()).toHaveFocus();
  });

  it('devrait fermer la liste quand le focus quitte le composant', async () => {
    const user = userEvent.setup();
    render(
      <>
        <DocSearch pages={PAGES} />
        <button type="button">ailleurs</button>
      </>,
    );
    await user.type(field(), 'b');

    await user.click(screen.getByRole('button', { name: 'ailleurs' }));

    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(options()).toHaveLength(0);
    expect(field(), 'le texte a été perdu en quittant le champ').toHaveValue('b');
  });

  it('devrait écrire « #/ » pour la page d’accueil, dont le slug est vide', async () => {
    const HOME: DocPage = {
      slug: '',
      label: 'Accueil',
      group: 'introduction',
      title: 'Le socle',
      render: () => <p>corps de l’accueil</p>,
    };
    const user = userEvent.setup();
    render(<DocSearch pages={[HOME]} />);
    await user.type(field(), 'accueil');

    await user.click(screen.getByRole('option', { name: /Accueil/ }));

    expect(window.location.hash).toBe('#/');
  });

  it('devrait naviguer sur Entrée vers l’option amenée par la souris', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'b');
    await user.hover(screen.getByRole('option', { name: /Bulle/ }));

    await user.keyboard('{Enter}');

    expect(window.location.hash).toBe('#/composants/bulle');
  });
});

describe('DocSearch — le compte annoncé', () => {
  it('ne devrait pas annoncer À CHAQUE FRAPPE', async () => {
    /* `aria-live="polite"` MET EN FILE, il ne regroupe pas — le commentaire du
       composant affirmait le contraire et il a été corrigé. Mesuré avant le
       report : trois mutations du nœud pour le mot « button », donc trois
       énoncés successifs chez NVDA et JAWS.

       Ce qui est gardé : juste après une frappe, la région est encore VIDE, et
       elle se remplit ensuite. Le report est de 400 ms et ne porte que sur la
       chaîne annoncée — le filtrage, lui, est immédiat, ce que la seconde
       assertion vérifie. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'b');

    expect(
      announcement(),
      'la région a parlé immédiatement : le report de 400 ms ne s’applique pas.',
    ).toBe('');
    expect(options().length, 'le filtrage doit rester immédiat, lui').toBeGreaterThan(0);

    await waitFor(() => expect(announcement()).toBe('3 pages trouvées.'));
  });

  it('ne devrait rien annoncer avant la première frappe', () => {
    render(<DocSearch pages={PAGES} />);

    expect(announcement()).toBe('');
  });

  it('devrait annoncer « 1 page trouvée. » au singulier', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'elev');

    await waitFor(() => expect(announcement()).toBe('1 page trouvée.'));
  });

  it('devrait annoncer le nombre au pluriel', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'b');

    await waitFor(() => expect(announcement()).toBe('3 pages trouvées.'));
  });

  it('devrait annoncer le TOTAL et la troncature au-delà de huit', async () => {
    /* IL DIT LE TOTAL ET NON LE NOMBRE AFFICHÉ : annoncer « 8 » là où il y en
       a dix laisserait croire qu'affiner la requête ne sert à rien. */
    const user = userEvent.setup();
    render(<DocSearch pages={TEN_PAGES} />);

    await user.type(field(), 'b');

    expect(options()).toHaveLength(8);
    await waitFor(() =>
      expect(announcement()).toBe('10 pages trouvées, les 8 premières sont proposées.'),
    );
  });

  it('devrait borner la remontée à la liste AFFICHÉE et non au total', async () => {
    /* Dix correspondances, huit rangées. Ce test bornait `End` ; la touche a été
       rendue à l'édition du texte, donc il borne maintenant le BOUCLAGE de
       `ArrowUp`, qui est le seul chemin restant vers la dernière option. Ce qui
       est gardé est le même invariant : rien ne peut désigner une dixième
       option qui n'existe pas dans le DOM. */
    const user = userEvent.setup();
    render(<DocSearch pages={TEN_PAGES} />);
    await user.type(field(), 'b');

    await user.keyboard('{ArrowUp}');

    expect(activeOption()).toBe(options()[7]);
    expect(activeLabel()).toBe('Bulle');
  });

  it('devrait annoncer « Aucune page ne correspond. » sans résultat', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'xyzzy');

    await waitFor(() => expect(announcement()).toBe('Aucune page ne correspond.'));
  });
});

describe('DocSearch — l’absence de résultat', () => {
  it('ne devrait pas annoncer « aucune page » DEUX fois', async () => {
    /* `role="presentation"` retire la sémantique d'une rangée, PAS son texte de
       l'arbre d'accessibilité. La phrase existait donc deux fois — la rangée
       visible et la région live —, si bien qu'elle était annoncée par la région
       puis relue en parcourant la liste. La rangée est désormais
       `aria-hidden` : elle reste lisible à l'œil, et la région live est la
       seule à la porter dans l'arbre. Ce test garde la paire.

       Le texte reste présent DEUX fois dans le DOM, et c'est voulu : ce qui est
       vérifié n'est pas son unicité mais que la copie visible soit retirée de
       l'arbre. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'xyzzy');

    const visible = document.querySelector('.tc-doc-search__empty');
    expect(visible, 'la rangée visible « aucune page » a disparu du DOM').not.toBeNull();
    expect(
      visible?.getAttribute('aria-hidden'),
      'la rangée visible n’est pas aria-hidden : sa phrase est dans l’arbre en ' +
        'plus de celle de la région live, donc annoncée deux fois.',
    ).toBe('true');

    await waitFor(() =>
      expect(announcement(), 'la région live doit rester la porteuse de l’annonce').toBe(
        'Aucune page ne correspond.',
      ),
    );
  });

  it('ne devrait exposer NI liste NI option quand rien ne correspond', async () => {
    /* UNE `role="listbox"` DOIT CONTENIR DES `option` — ARIA 1.2 l'exige, et
       `axe-core` le relève en `critical` : « Required ARIA children role not
       present: group, option ». La rangée « aucun résultat » y a vécu en
       `role="presentation"`, ce qui retire le rôle du `<li>` mais LAISSE SON
       TEXTE dans l'arbre : l'arbre exposait `listbox → StaticText`.

       La liste est donc retirée de l'arbre dès qu'elle n'a aucune option, et
       `aria-expanded` suit — sinon le champ annoncerait une liste déployée qui
       n'existe pas, avec un `aria-controls` vers un élément absent de l'arbre.
       Ce test garde les trois faits ensemble. */
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);

    await user.type(field(), 'xyzzy');

    expect(
      screen.queryByRole('listbox'),
      'une listbox sans option est exposée : ARIA l’interdit et axe-core la relève.',
    ).toBeNull();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(
      field(),
      'aria-expanded annonce une liste déployée alors qu’aucune ne l’est.',
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('ne devrait rien désigner quand rien ne correspond', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'xyzzy');

    await user.keyboard('{ArrowDown}{ArrowUp}{Home}{End}');

    expect(field()).not.toHaveAttribute('aria-activedescendant');
  });

  it('ne devrait pas naviguer sur Entrée quand rien ne correspond', async () => {
    const user = userEvent.setup();
    render(<DocSearch pages={PAGES} />);
    await user.type(field(), 'xyzzy');

    await user.keyboard('{ArrowDown}{Enter}');

    expect(window.location.hash).toBe('');
  });
});

/* ============================================================================
   LE DÉFAUT TROUVÉ — CE BLOC EST ROUGE, ET IL DOIT LE RESTER.

   `doc-search.tsx` justifie son `preventDefault` sur `Entrée` en ces termes :
   « `Entrée` soumet le formulaire s'il y en a un autour — la barre du haut n'en
   a pas aujourd'hui, mais un champ de recherche qui dépend de l'absence de
   formulaire est un champ fragile ».

   Le code ne tient pas cette phrase. `preventDefault()` est appelé À
   L'INTÉRIEUR du `if (activeSuggestion)` (`doc-search.tsx:130-132`), donc
   uniquement dans le cas où l'on navigue déjà. Le cas majoritaire — on tape une
   requête et on appuie sur Entrée sans avoir touché aux flèches — laisse
   l'événement passer, et la soumission implicite du formulaire part.

   Ce n'est pas une hypothèse : le test ci-dessous compte les soumissions.
   ========================================================================== */
describe('DocSearch — la soumission implicite du formulaire', () => {
  it('ne devrait pas soumettre le formulaire environnant sur Entrée sans option courante', async () => {
    let submits = 0;
    const user = userEvent.setup();
    render(
      <form
        onSubmit={(event) => {
          // Sans ce `preventDefault`, jsdom se plaint d'une navigation non
          // implémentée : en vrai, la page serait rechargée et la requête
          // perdue.
          event.preventDefault();
          submits += 1;
        }}
      >
        <DocSearch pages={PAGES} />
        <button type="submit">Valider</button>
      </form>,
    );
    await user.type(field(), 'b');

    await user.keyboard('{Enter}');

    expect(
      submits,
      `${submits} soumission(s) : Entrée sans option courante n'est pas ` +
        `« preventDefault » — le formulaire part, la page se recharge et la ` +
        `requête est perdue. Le correctif tient en une ligne : sortir ` +
        `event.preventDefault() du if (activeSuggestion) dans doc-search.tsx.`,
    ).toBe(0);
  });

  it('ne devrait pas soumettre le formulaire environnant sur Entrée avec une option courante', async () => {
    // Le cas déjà couvert par le code : ce test-ci est vert, et c'est lui qui
    // prouve que le rouge du précédent tient au CHEMIN et non au montage.
    let submits = 0;
    const user = userEvent.setup();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submits += 1;
        }}
      >
        <DocSearch pages={PAGES} />
        <button type="submit">Valider</button>
      </form>,
    );
    await user.type(field(), 'b');
    await user.keyboard('{ArrowDown}');

    await user.keyboard('{Enter}');

    expect(submits).toBe(0);
    expect(window.location.hash).toBe('#/composants/button');
  });
});
