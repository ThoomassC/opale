import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Le seul état de tout le dépôt, et il vit dans la VITRINE — pas dans
 * `src/components`. La librairie reste sans hook pour rester utilisable telle
 * quelle en Server Component ; c'est le document qui se paie une bascule.
 *
 * ET IL N'Y A PAS D'ENTRÉE `./client` : ce hook n'est pas publiable, parce
 * qu'il n'y a pas UNE bascule à publier mais trois mécaniques incompatibles.
 * Celle-ci veut deux états et écrit toujours `data-theme` ; celle qu'il
 * faudrait à un site prérendu veut un script en `<head>` ou un cookie, pas un
 * `localStorage` lu dans un initialiseur de `useState` — qui produit un flash.
 * Publier l'une reviendrait à publier la mauvaise deux fois.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tc-theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Le choix explicite de l'utilisateur, ou `null` s'il n'en a jamais fait.
 *
 * `null` n'est pas un défaut, c'est une information : tant qu'il vaut `null`,
 * l'OS est la référence. Le « system » que persistait la bascule à trois états
 * n'est plus un thème connu, il se relit donc comme `null` — la migration est
 * silencieuse et dit exactement ce que l'ancienne valeur voulait dire.
 */
function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // Stockage refusé (navigation privée, cookies bloqués) : on n'insiste pas.
    return null;
  }
}

function subscribeSystemTheme(onStoreChange: () => void): () => void {
  const query = window.matchMedia(DARK_SCHEME_QUERY);
  query.addEventListener('change', onStoreChange);
  return () => query.removeEventListener('change', onStoreChange);
}

function readSystemPrefersDark(): boolean {
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

/** Rendu serveur : pas de `matchMedia`, on part du clair. */
function readSystemPrefersDarkOnServer(): boolean {
  return false;
}

/**
 * La couleur que la barre d'adresse mobile doit prendre, LUE DANS LA FEUILLE.
 *
 * Le portfolio, dont cette bascule est reprise, code ses deux fonds en dur dans
 * du TypeScript, avec un commentaire qui reconnaît devoir « rester aligné » sur
 * `--site-background`. C'est précisément la dérive que ce dépôt existe pour
 * empêcher : une couleur écrite deux fois finit par diverger. On la lit donc là
 * où elle est déclarée, et il n'y a plus de seconde copie à tenir.
 *
 * L'appelant doit avoir posé `data-theme` AVANT d'appeler : la valeur calculée
 * dépend du thème actif, lire d'abord rendrait la couleur du thème qu'on quitte.
 *
 * Une chaîne vide est un résultat normal, pas une anomalie : jsdom ne compose
 * pas les propriétés personnalisées héritées d'une feuille comme un navigateur.
 * L'appelant n'écrit alors rien du tout — ne pas annoncer de couleur est
 * toujours préférable à en annoncer une fausse.
 */
function readSiteBackground(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--site-background').trim();
}

export interface ThemeControl {
  /** Le thème réellement appliqué : le choix mémorisé, sinon celui de l'OS. */
  readonly theme: Theme;
  readonly isDarkTheme: boolean;
  readonly toggleTheme: () => void;
}

/**
 * Bascule clair / sombre, à DEUX états.
 *
 * Le thème appliqué est dérivé pendant le rendu — choix explicite mémorisé s'il
 * existe, sinon préférence du système — jamais reconstruit dans un effet.
 *
 * `useSyncExternalStore` plutôt qu'un `useEffect` + `useState` : la préférence
 * système est un magasin extérieur, pas un état dérivé, l'abonnement se nettoie
 * tout seul et le hook a un instantané serveur. Le seul `useEffect` ici
 * synchronise deux systèmes extérieurs — l'attribut `data-theme` du document et
 * la balise `theme-color` — ce pour quoi il est fait.
 *
 * `localStorage` N'EST ÉCRIT QU'AU CLIC, jamais au montage, et cette fois la
 * garantie est structurelle plutôt que gardée : l'écriture ne vit que dans
 * `toggleTheme`. Persister au montage effacerait la différence entre « n'a
 * jamais choisi » et « a choisi », et rendrait le premier état irréversible
 * sans vider le stockage à la main. Le double montage du mode strict de React
 * n'écrit donc rien sans qu'aucune référence n'ait à s'en souvenir — la version
 * précédente y employait un `useRef` mémorisant la dernière valeur persistée,
 * devenu inutile du jour où l'écriture a quitté l'effet.
 *
 * L'attribut `data-theme`, lui, n'est posé QUE dans l'effet et jamais pendant
 * le rendu : avant hydratation le document reste nu, et c'est le bloc
 * `@media (prefers-color-scheme: dark)` de `roles.css` qui porte le thème.
 * C'est le seul chemin dont dispose un consommateur prérendu sans JavaScript,
 * et c'est pourquoi ce bloc reste vivant même si cette bascule ne l'atteint
 * plus jamais.
 */
export function useTheme(): ThemeControl {
  const [storedTheme, setStoredTheme] = useState<Theme | null>(readStoredTheme);

  const prefersDark = useSyncExternalStore(
    subscribeSystemTheme,
    readSystemPrefersDark,
    readSystemPrefersDarkOnServer,
  );

  // Dérivé pendant le rendu, jamais dans un effet.
  const theme: Theme = storedTheme ?? (prefersDark ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta === null) return;

    const background = readSiteBackground();
    if (background === '') return;

    meta.setAttribute('content', background);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Le thème vivra le temps de la session, et c'est acceptable.
    }

    setStoredTheme(nextTheme);
  }, [theme]);

  return { theme, isDarkTheme: theme === 'dark', toggleTheme };
}
