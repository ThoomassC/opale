import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from './use-theme';

const STORAGE_KEY = 'tc-theme';

/**
 * Le setup global fournit un `matchMedia` figé sur `matches: false`. Pour
 * piloter la préférence système on le remplace ici — le setup ne nous
 * appartient pas.
 */
function stubSystemDarkPreference(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();

  const query = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };

  vi.spyOn(window, 'matchMedia').mockReturnValue(query as unknown as MediaQueryList);

  return {
    set(next: boolean) {
      matches = next;
      act(() => {
        listeners.forEach((listener) => listener());
      });
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

/**
 * Peint le sol de la page POUR DE VRAI, avec une feuille et non un faux.
 *
 * L'ancienne version de ces tests remplaçait `getPropertyValue` pour rendre
 * `--site-background` ; c'était le seul moyen de piloter une propriété
 * personnalisée, que jsdom ne compose pas. Le hook lisant désormais la valeur
 * calculée de `background-color` — une propriété que jsdom, lui, résout bien —
 * un `<style>` injecté fait le travail sans aucun mock : la cascade est réelle,
 * les sélecteurs sont réels, et un test peut donc faire dépendre la couleur du
 * `data-theme` présent sur le document exactement comme `doc.css` le fait.
 *
 * `var()` reste l'exception : jsdom ne le substitue pas et rend le littéral.
 * C'est ce qui rend le garde correspondant écrivable, plus bas.
 */
function paintGround(css: string): void {
  const style = document.createElement('style');
  style.dataset.testGround = '';
  style.textContent = css;
  document.head.append(style);
}

function addThemeColorMeta(initial = 'initial'): HTMLMetaElement {
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', initial);
  document.head.append(meta);
  return meta;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.head
    .querySelectorAll('meta[name="theme-color"], style[data-test-ground]')
    .forEach((node) => {
      node.remove();
    });
});

describe('useTheme', () => {
  describe('thème appliqué', () => {
    it('devrait suivre le système en clair quand rien n’a été choisi', () => {
      stubSystemDarkPreference(false);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
      expect(result.current.isDarkTheme).toBe(false);
    });

    it('devrait suivre le système en sombre quand rien n’a été choisi', () => {
      stubSystemDarkPreference(true);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDarkTheme).toBe(true);
    });

    it.each(['light', 'dark'] as const)(
      'devrait préférer le choix stocké %s à la préférence système opposée',
      (stored) => {
        stubSystemDarkPreference(stored === 'light');
        window.localStorage.setItem(STORAGE_KEY, stored);

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe(stored);
      },
    );

    it('devrait retomber sur le système quand la valeur stockée est inconnue', () => {
      stubSystemDarkPreference(true);
      window.localStorage.setItem(STORAGE_KEY, 'purple');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('devrait retomber sur le système face au « system » stocké par la v0.2.0', () => {
      // La bascule à trois états persistait littéralement « system ». La
      // migration est silencieuse et gratuite : la valeur n'est plus un thème
      // connu, donc elle se lit comme « n'a jamais choisi » — soit exactement
      // ce qu'elle voulait dire.
      stubSystemDarkPreference(true);
      window.localStorage.setItem(STORAGE_KEY, 'system');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('devrait retomber sur le système quand la lecture du stockage échoue', () => {
      stubSystemDarkPreference(true);
      vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('storage blocked');
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });
  });

  describe('écriture dans le stockage', () => {
    it('ne devrait rien écrire au montage, avant tout choix de l’utilisateur', () => {
      const setItem = vi.spyOn(window.localStorage, 'setItem');

      renderHook(() => useTheme());

      // Persister au montage effacerait la différence entre « n'a jamais
      // choisi » et « a choisi », et rendrait le premier irréversible. Ici
      // `setItem` ne vit que dans le gestionnaire de clic : la garantie est
      // structurelle, plus seulement testée.
      expect(setItem).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ne devrait rien écrire au double montage du mode strict', () => {
      const setItem = vi.spyOn(window.localStorage, 'setItem');

      renderHook(() => useTheme(), { wrapper: StrictMode });

      expect(setItem).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ne devrait pas réécrire un choix restauré tel quel', () => {
      window.localStorage.setItem(STORAGE_KEY, 'dark');
      const setItem = vi.spyOn(window.localStorage, 'setItem');

      renderHook(() => useTheme(), { wrapper: StrictMode });

      expect(setItem).not.toHaveBeenCalled();
    });

    it('devrait écrire le thème obtenu au premier basculement', () => {
      stubSystemDarkPreference(false);
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark');
    });

    it('devrait réécrire le thème au basculement suivant', () => {
      stubSystemDarkPreference(false);
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });
      act(() => {
        result.current.toggleTheme();
      });

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('light');
      expect(result.current.theme).toBe('light');
    });

    it('devrait rester fonctionnel quand l’écriture est refusée', () => {
      stubSystemDarkPreference(false);
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('storage blocked');
      });
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('attribut data-theme sur documentElement', () => {
    it('ne devrait poser aucun data-theme pendant le rendu', () => {
      // L'ATTRIBUT NE SE POSE QUE DANS L'EFFET, et ce test est ce qui le tient.
      // Tant qu'il n'est pas posé, le document est nu et c'est le bloc
      // `@media (prefers-color-scheme: dark)` de `roles.css` qui porte le thème
      // — le seul chemin disponible avant hydratation et pour un consommateur
      // prérendu sans JavaScript. Écrire l'attribut pendant le rendu (ou dans
      // un initialiseur de `useState`) fermerait ce chemin en silence.
      stubSystemDarkPreference(true);
      const seenDuringRender: (string | null)[] = [];

      function Probe() {
        useTheme();
        seenDuringRender.push(document.documentElement.getAttribute('data-theme'));
        return null;
      }

      render(createElement(Probe));

      expect(seenDuringRender[0]).toBeNull();
      // L'effet a tourné entre-temps : la deuxième moitié du contrat.
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it.each(['light', 'dark'] as const)(
      'devrait poser data-theme=%s dès le montage, même sans choix explicite',
      (systemTheme) => {
        stubSystemDarkPreference(systemTheme === 'dark');

        renderHook(() => useTheme());

        // Différence assumée avec la bascule à trois états : l'attribut est
        // TOUJOURS écrit une fois l'effet passé, y compris quand il ne fait que
        // recopier la préférence du système. C'est ce qui rend la bascule à deux
        // états prévisible — et c'est aussi pourquoi le bloc `@media` reste la
        // seule couverture d'avant hydratation.
        expect(document.documentElement).toHaveAttribute('data-theme', systemTheme);
      },
    );

    it('devrait poser data-theme dès le montage quand un choix est restauré', () => {
      stubSystemDarkPreference(false);
      window.localStorage.setItem(STORAGE_KEY, 'dark');

      renderHook(() => useTheme());

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('devrait mettre l’attribut à jour au basculement', () => {
      stubSystemDarkPreference(false);
      const { result } = renderHook(() => useTheme());

      expect(document.documentElement).toHaveAttribute('data-theme', 'light');

      act(() => {
        result.current.toggleTheme();
      });

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('couleur de la barre d’adresse (meta theme-color)', () => {
    it('ne devrait RIEN écrire quand rien ne peint le sol de la page', () => {
      // C'EST LE GARDE, et il vaut son test. Le portfolio codait les deux fonds
      // en dur dans le TypeScript, à charge pour un humain de les tenir alignés
      // sur `--site-background` : c'est la dérive que ce dépôt existe pour
      // empêcher. La couleur est donc LUE dans la feuille — et là où la lecture
      // ne donne rien (aucune feuille appliquée : `background-color` rend la
      // sérialisation de `transparent`), ne rien annoncer vaut mieux
      // qu'annoncer une couleur fausse.
      const meta = addThemeColorMeta('intact');
      stubSystemDarkPreference(true);

      renderHook(() => useTheme());

      expect(meta).toHaveAttribute('content', 'intact');
    });

    it('devrait écrire le fond calculé de body', () => {
      const meta = addThemeColorMeta();
      stubSystemDarkPreference(false);
      paintGround(`body { background-color: rgb(255, 255, 255) }`);

      renderHook(() => useTheme());

      expect(meta).toHaveAttribute('content', 'rgb(255, 255, 255)');
    });

    /* ======================================================================
       LA GARDE DU DÉFAUT, et elle aurait rougi sur la version d'avant.

       La vitrine a un sol BLANC : `doc.css` déclare `--doc-ground` et peint
       `body` avec, SANS toucher au jeton publié `--site-background`, qui reste
       #deedf0 parce que c'est lui que reçoivent `portfolio` et
       `travels_in_world` et lui que mesure `src/contract/`. Le hook lisait ce
       jeton : la barre d'adresse mobile annonçait donc du mist sur une page
       blanche, et l'écart était pile celui entre le paquet et son document.

       Les deux valeurs sont ici DIFFÉRENTES ET PRÉSENTES dans la même feuille.
       C'est ce qui distingue « lit le sol » de « lit le jeton » : un test qui
       n'aurait déclaré que l'un des deux passerait des deux façons.
       ====================================================================== */
    it('devrait annoncer le sol PEINT et non le jeton publié --site-background', () => {
      const meta = addThemeColorMeta();
      stubSystemDarkPreference(false);
      paintGround(`
        :root { --site-background: rgb(222, 237, 240) }
        body { background-color: rgb(255, 255, 255) }
      `);

      renderHook(() => useTheme());

      expect(
        meta.getAttribute('content'),
        `la barre d'adresse annonce « ${meta.getAttribute('content')} » alors que ` +
          `body est peint en rgb(255, 255, 255) — lire --site-background fait ` +
          `annoncer le mist du paquet par-dessus le sol blanc de la vitrine`,
      ).toBe('rgb(255, 255, 255)');
    });

    /* La seconde moitié de la même garde : c'est `body` que les deux feuilles
       peignent, et la racine n'est peinte par personne. Un hook qui lirait
       `documentElement` — l'élément que l'ancienne version interrogeait —
       n'aurait plus jamais rien à annoncer. */
    it('devrait lire le fond de body et non celui de la racine', () => {
      const meta = addThemeColorMeta('intact');
      stubSystemDarkPreference(false);
      paintGround(`
        :root { background-color: rgb(222, 237, 240) }
        body { background-color: rgb(255, 255, 255) }
      `);

      renderHook(() => useTheme());

      expect(
        meta.getAttribute('content'),
        `lu sur la racine au lieu de body : la vitrine peint body, et la racine ` +
          `n'est peinte par personne`,
      ).toBe('rgb(255, 255, 255)');
    });

    it('ne devrait rien écrire quand le sol est transparent', () => {
      const meta = addThemeColorMeta('intact');
      stubSystemDarkPreference(false);
      paintGround(`body { background-color: transparent }`);

      renderHook(() => useTheme());

      expect(meta).toHaveAttribute('content', 'intact');
    });

    it('ne devrait rien écrire quand la substitution de var() n’a pas eu lieu', () => {
      // jsdom ne substitue pas `var()` et rend le littéral `var(--doc-ground)`
      // ; un navigateur, lui, résout toujours. Écrire ce littéral dans
      // `theme-color` ne serait pas annoncer une couleur fausse, ce serait
      // annoncer quelque chose qui n'est pas une couleur.
      const meta = addThemeColorMeta('intact');
      stubSystemDarkPreference(false);
      paintGround(`
        :root { --doc-ground: rgb(255, 255, 255) }
        body { background-color: var(--doc-ground) }
      `);

      renderHook(() => useTheme());

      expect(
        meta.getAttribute('content'),
        `« ${meta.getAttribute('content')} » a été annoncé à la barre d'adresse`,
      ).toBe('intact');
    });

    it('devrait lire la feuille APRÈS avoir posé data-theme', () => {
      // Lire avant, c'est lire la couleur du thème qu'on quitte. La feuille
      // fait ici dépendre le sol du `data-theme` réellement présent sur le
      // document — comme `doc.css` — si bien qu'une inversion de l'ordre des
      // deux écritures de l'effet se trahit au premier basculement.
      const meta = addThemeColorMeta();
      stubSystemDarkPreference(false);
      paintGround(`
        body { background-color: rgb(255, 255, 255) }
        :root[data-theme='dark'] body { background-color: rgb(15, 25, 28) }
      `);
      const { result } = renderHook(() => useTheme());

      expect(meta).toHaveAttribute('content', 'rgb(255, 255, 255)');

      act(() => {
        result.current.toggleTheme();
      });

      expect(meta).toHaveAttribute('content', 'rgb(15, 25, 28)');
    });

    it('devrait rester fonctionnel quand la page n’a pas de balise theme-color', () => {
      stubSystemDarkPreference(true);
      paintGround(`body { background-color: rgb(15, 25, 28) }`);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
      expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
    });
  });

  describe('préférence système', () => {
    it('devrait suivre un changement de préférence tant que rien n’a été choisi', () => {
      const system = stubSystemDarkPreference(false);
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');

      system.set(true);

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('ne devrait plus suivre le système après un choix explicite', () => {
      const system = stubSystemDarkPreference(false);
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });
      system.set(true);
      system.set(false);

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('devrait se désabonner du média au démontage', () => {
      const system = stubSystemDarkPreference(false);
      const { unmount } = renderHook(() => useTheme());

      expect(system.listenerCount).toBe(1);

      unmount();

      expect(system.listenerCount).toBe(0);
    });
  });
});

/**
 * `ThemeToggle` est testé ICI, dans le fichier du hook, et non dans un
 * `theme-toggle.test.tsx` : le lot de fichiers confié à ce chantier est clos, et
 * cinq autres agents travaillent en parallèle sur le même dossier. D'où le
 * `createElement` — un fichier `.ts` ne compile pas de JSX. À extraire dans son
 * propre fichier dès que le dossier est à nouveau à un seul auteur.
 */
describe('ThemeToggle', () => {
  const renderToggle = () => render(createElement(ThemeToggle));

  it('devrait rendre UN bouton, et un seul', () => {
    stubSystemDarkPreference(false);

    renderToggle();

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('devrait garder le nom accessible « Thème sombre » quand il est relâché', () => {
    stubSystemDarkPreference(false);

    renderToggle();

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAccessibleName('Thème sombre');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('devrait garder le nom accessible « Thème sombre » quand il est enfoncé', () => {
    // LE NOM NE BASCULE PAS AVEC L'ÉTAT, et c'est le point du test. Un libellé
    // qui passerait à « Thème clair » en même temps qu'`aria-pressed` devient
    // vrai s'annoncerait « Thème clair, activé » : double négation, l'auditeur
    // ne peut plus savoir ce qui est allumé. Ici l'énoncé reste « Thème sombre,
    // activé » / « Thème sombre » — le nom dit la CHOSE, l'état dit le OUI.
    stubSystemDarkPreference(true);

    renderToggle();

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAccessibleName('Thème sombre');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('devrait garder le même nom accessible de part et d’autre d’un clic', async () => {
    const user = userEvent.setup();
    stubSystemDarkPreference(false);
    renderToggle();

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAccessibleName('Thème sombre');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    // Le MÊME nœud, le MÊME nom : seul l'état a bougé.
    expect(screen.getByRole('button')).toBe(toggle);
    expect(toggle).toHaveAccessibleName('Thème sombre');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('devrait basculer le document et le stockage au clic', async () => {
    const user = userEvent.setup();
    stubSystemDarkPreference(false);
    renderToggle();

    await user.click(screen.getByRole('button', { name: 'Thème sombre' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('devrait masquer son glyphe aux technologies d’assistance', () => {
    // Le portfolio tire son icône de `@tabler/icons-react`, qui n'est pas une
    // dépendance de ce dépôt et ne doit pas le devenir : une librairie de socle
    // qui traîne un paquet d'icônes l'impose à tous ses consommateurs. Un glyphe
    // textuel, masqué, fait le même travail — mais il ne doit pas s'ajouter au
    // nom accessible, sans quoi le bouton s'appellerait « ☾ Thème sombre ».
    stubSystemDarkPreference(false);

    const { container } = renderToggle();

    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph).not.toBeNull();
    expect(glyph).toHaveTextContent('☾');
  });

  it('devrait être un bouton de type button, hors de toute soumission', () => {
    stubSystemDarkPreference(false);

    renderToggle();

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
