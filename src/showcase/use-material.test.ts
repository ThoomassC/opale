import { act, render, renderHook } from '@testing-library/react';
import { StrictMode, createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMaterial } from './use-material';

const STORAGE_KEY = 'tc-material';

/**
 * Peint le sol de la page avec une FEUILLE, comme dans `use-theme.test.ts`.
 *
 * Il n'y a rien à peindre pour ce hook — c'est justement le point. Le sol n'est
 * ici que l'appât d'un garde : sans couleur peinte, une implémentation qui se
 * mettrait à réécrire `theme-color` (par recopie de `useTheme`) ne trouverait
 * rien à écrire et le garde passerait quand même.
 */
function paintGround(css: string): void {
  const style = document.createElement('style');
  style.dataset.testGround = '';
  style.textContent = css;
  document.head.append(style);
}

function addThemeColorMeta(initial = 'intact'): HTMLMetaElement {
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

describe('useMaterial', () => {
  describe('matériau appliqué', () => {
    it('devrait partir de l’aplat quand rien n’a été choisi', () => {
      const { result } = renderHook(() => useMaterial());

      expect(result.current.material).toBe('flat');
      expect(result.current.isGlass).toBe(false);
    });

    it('devrait restaurer le verre quand il a été choisi', () => {
      window.localStorage.setItem(STORAGE_KEY, 'glass');

      const { result } = renderHook(() => useMaterial());

      expect(result.current.material).toBe('glass');
      expect(result.current.isGlass).toBe(true);
    });

    it('devrait restaurer l’aplat quand il a été choisi', () => {
      // « N'a jamais choisi » et « a choisi l'aplat » rendent la même page, et
      // c'est assumé : contrairement au thème, il n'y a pas d'OS à consulter
      // derrière, donc pas de troisième état à distinguer d'eux.
      window.localStorage.setItem(STORAGE_KEY, 'flat');

      const { result } = renderHook(() => useMaterial());

      expect(result.current.material).toBe('flat');
    });

    it('devrait retomber sur l’aplat quand la valeur stockée est inconnue', () => {
      window.localStorage.setItem(STORAGE_KEY, 'frosted');

      const { result } = renderHook(() => useMaterial());

      expect(result.current.material).toBe('flat');
    });

    it('devrait retomber sur l’aplat quand la lecture du stockage échoue', () => {
      // En navigation privée, la SIMPLE LECTURE lève — c'est écrit dans
      // `use-theme.ts` et dans `index.html`, et c'est pourquoi la lecture est
      // dans un `try`.
      vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('storage blocked');
      });

      const { result } = renderHook(() => useMaterial());

      expect(result.current.material).toBe('flat');
      expect(result.current.isGlass).toBe(false);
    });
  });

  describe('écriture dans le stockage', () => {
    it('ne devrait rien écrire au montage, avant tout choix de l’utilisateur', () => {
      const setItem = vi.spyOn(window.localStorage, 'setItem');

      renderHook(() => useMaterial());

      // Même garantie STRUCTURELLE que dans `useTheme` : `setItem` ne vit que
      // dans le gestionnaire de clic, jamais dans l'effet ni dans un
      // initialiseur de `useState`.
      expect(setItem).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ne devrait rien écrire au double montage du mode strict', () => {
      // `StrictMode` est actif dans `main.tsx` : React monte, démonte et
      // remonte. Rien ne doit être persisté au passage, et aucune référence n'a
      // à s'en souvenir puisque l'écriture n'est pas dans l'effet.
      const setItem = vi.spyOn(window.localStorage, 'setItem');

      renderHook(() => useMaterial(), { wrapper: StrictMode });

      expect(setItem).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ne devrait pas réécrire un choix restauré tel quel', () => {
      window.localStorage.setItem(STORAGE_KEY, 'glass');
      const setItem = vi.spyOn(window.localStorage, 'setItem');

      renderHook(() => useMaterial(), { wrapper: StrictMode });

      expect(setItem).not.toHaveBeenCalled();
    });

    it('devrait écrire le verre au premier basculement', () => {
      const { result } = renderHook(() => useMaterial());

      act(() => {
        result.current.toggleMaterial();
      });

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('glass');
    });

    it('devrait réécrire l’aplat au basculement suivant', () => {
      const { result } = renderHook(() => useMaterial());

      act(() => {
        result.current.toggleMaterial();
      });
      act(() => {
        result.current.toggleMaterial();
      });

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('flat');
      expect(result.current.material).toBe('flat');
    });

    it('devrait rester fonctionnel quand l’écriture est refusée', () => {
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('storage blocked');
      });
      const { result } = renderHook(() => useMaterial());

      act(() => {
        result.current.toggleMaterial();
      });

      // Le matériau vit le temps de la session, et c'est acceptable.
      expect(result.current.material).toBe('glass');
      expect(document.documentElement).toHaveAttribute('data-material', 'glass');
    });
  });

  /* ==========================================================================
     L'ATTRIBUT — DEUX VALEURS, UNE SEULE ÉCRITE.

     `glass` pose `data-material="glass"` ; `flat` RETIRE l'attribut. La feuille
     n'a aucun sélecteur `[data-material='flat']`, et ce n'est pas un oubli :
     aucune préférence système ne peut imposer le verre — il n'existe pas de
     `prefers-material` — donc il n'y a jamais rien à CONTREDIRE.
     `data-theme="light"`, lui, doit pouvoir contredire un OS en sombre, ce qui
     est exactement pourquoi ses deux valeurs s'écrivent. Écrire `flat`
     inviterait quelqu'un à écrire la règle qui va avec, et cette règle
     n'aurait rien à annuler.
     ======================================================================== */
  describe('attribut data-material sur documentElement', () => {
    it('ne devrait poser aucun data-material pendant le rendu', () => {
      // L'ATTRIBUT NE SE POSE QUE DANS L'EFFET, comme `data-theme`. Le flash,
      // lui, est fermé en amont par le script bloquant d'`index.html` : c'est
      // le seul endroit d'où l'attribut peut être posé avant la première
      // peinture, et un `useState` qui écrirait pendant le rendu arriverait de
      // toute façon trop tard.
      window.localStorage.setItem(STORAGE_KEY, 'glass');
      const seenDuringRender: (string | null)[] = [];

      function Probe() {
        useMaterial();
        seenDuringRender.push(document.documentElement.getAttribute('data-material'));
        return null;
      }

      render(createElement(Probe));

      expect(seenDuringRender[0]).toBeNull();
      // L'effet a tourné entre-temps : la deuxième moitié du contrat.
      expect(document.documentElement).toHaveAttribute('data-material', 'glass');
    });

    it('ne devrait JAMAIS écrire data-material="flat" au montage', () => {
      renderHook(() => useMaterial(), { wrapper: StrictMode });

      expect(
        document.documentElement.getAttribute('data-material'),
        `l'aplat a écrit data-material="${document.documentElement.getAttribute('data-material')}" ` +
          `— l'aplat est l'ABSENCE d'attribut, et écrire la valeur inviterait à ` +
          `écrire dans la feuille une règle qui n'aurait rien à annuler`,
      ).toBeNull();
    });

    it('devrait RETIRER l’attribut en revenant à l’aplat, et non l’écrire', () => {
      // Le chemin qui compte : `delete` et non une seconde valeur. Un hook qui
      // écrirait `flat` laisserait derrière lui un attribut que la feuille ne
      // sait pas lire, et qui ferait croire à un état.
      window.localStorage.setItem(STORAGE_KEY, 'glass');
      const { result } = renderHook(() => useMaterial());

      expect(document.documentElement).toHaveAttribute('data-material', 'glass');

      act(() => {
        result.current.toggleMaterial();
      });

      expect(
        document.documentElement.getAttribute('data-material'),
        `le retour à l'aplat laisse data-material="${document.documentElement.getAttribute('data-material')}"`,
      ).toBeNull();
    });

    it('devrait poser data-material dès le montage quand le verre est restauré', () => {
      window.localStorage.setItem(STORAGE_KEY, 'glass');

      renderHook(() => useMaterial());

      expect(document.documentElement).toHaveAttribute('data-material', 'glass');
    });

    it('devrait poser l’attribut au basculement', () => {
      const { result } = renderHook(() => useMaterial());

      expect(document.documentElement).not.toHaveAttribute('data-material');

      act(() => {
        result.current.toggleMaterial();
      });

      expect(document.documentElement).toHaveAttribute('data-material', 'glass');
    });

    it('ne devrait pas toucher à data-theme', () => {
      // Deux axes INDÉPENDANTS. Un matériau qui déplacerait le thème ferait
      // basculer la page entière sur un clic qui ne le demandait pas.
      document.documentElement.dataset.theme = 'dark';
      const { result } = renderHook(() => useMaterial());

      act(() => {
        result.current.toggleMaterial();
      });

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  /* ==========================================================================
     CE QUE CE HOOK NE FAIT PAS, et ce sont des décisions, pas des oublis.

     Ces deux gardes existent pour que les deux différences avec `useTheme`
     soient EXÉCUTABLES et non seulement commentées. Elles rougissent au premier
     copier-coller de trop depuis l'autre hook.
     ======================================================================== */
  describe('les deux mécaniques que useTheme a et que celui-ci n’a pas', () => {
    it('ne devrait consulter AUCUNE préférence système', () => {
      // Il n'existe pas de `prefers-material` : aucun média ne dit si
      // l'utilisateur veut du verre, donc il n'y a aucun magasin extérieur à
      // écouter et `useSyncExternalStore` s'abonnerait à rien. C'est pour cela
      // que ce hook se contente de `useState` + `useEffect`.
      const matchMedia = vi.spyOn(window, 'matchMedia');

      const { result } = renderHook(() => useMaterial(), { wrapper: StrictMode });
      act(() => {
        result.current.toggleMaterial();
      });

      expect(
        matchMedia.mock.calls.map(([query]) => query),
        `le hook a interrogé ${matchMedia.mock.calls.length} média(s) : ` +
          `${matchMedia.mock.calls.map(([query]) => String(query)).join(', ')}`,
      ).toEqual([]);
    });

    it('ne devrait pas réécrire la balise theme-color', () => {
      // Le verre ne touche pas au SOL de la page : il pose un
      // `backdrop-filter`, un ménisque et un liseré spéculaire sur les surfaces
      // qui flottent au-dessus. La barre d'adresse n'a donc rien à apprendre
      // d'un changement de matériau — et le sol est bien peint ici, si bien
      // qu'une implémentation qui recopierait l'effet de `useTheme` aurait
      // vraiment une couleur à écrire.
      const meta = addThemeColorMeta();
      paintGround(`body { background-color: rgb(255, 255, 255) }`);
      const { result } = renderHook(() => useMaterial());

      act(() => {
        result.current.toggleMaterial();
      });

      expect(
        meta.getAttribute('content'),
        `la barre d'adresse a été réécrite en « ${meta.getAttribute('content')} » ` +
          `par un changement de matériau`,
      ).toBe('intact');
    });
  });
});
