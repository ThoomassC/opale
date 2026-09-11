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
 * La sérialisation de `transparent` — ce que rend `background-color` quand RIEN
 * ne peint l'élément. CSSOM normalise ainsi la valeur initiale dans tous les
 * moteurs, jsdom compris, où aucune feuille n'est appliquée : c'est donc la
 * réponse par défaut sous test, et elle veut dire « je ne sais pas ».
 */
const UNPAINTED = 'rgba(0, 0, 0, 0)';

/**
 * La couleur que la barre d'adresse mobile doit prendre : LE FOND RÉELLEMENT
 * PEINT, lu sur `body`.
 *
 * CE N'EST PLUS `--site-background`, ET C'EST UNE CORRECTION. La vitrine a
 * désormais un sol BLANC : `doc.css` déclare son propre jeton `--doc-ground` et
 * peint `body` avec, sans toucher au jeton publié `--site-background` — qui
 * reste `#deedf0`, mesuré, et sert les deux consommateurs. Lire le jeton faisait
 * donc annoncer du mist par-dessus une page blanche : la barre d'adresse mentait
 * d'exactement l'écart entre le paquet et son propre document.
 *
 * LE FOND PEINT PLUTÔT QU'UN AUTRE JETON, et le choix se défend. Lire
 * `--doc-ground` aurait corrigé le symptôme en gardant la maladie : le hook
 * saurait encore QUEL jeton peint le sol, donc il redeviendrait faux le jour où
 * ce n'est plus celui-là — un renommage, une seconde couche, un consommateur qui
 * ne charge pas `doc.css`. Le fond calculé de `body`, lui, est juste par
 * construction : c'est la couleur que l'œil voit, quelle que soit la règle qui
 * l'a posée. Aucun repli sur un jeton n'est donc gardé — il serait mort partout
 * où il compte (dans un navigateur `body` est toujours peint ; sous jsdom
 * `--doc-ground` ne résout pas plus que `--site-background`) et il rouvrirait la
 * porte par laquelle le défaut est entré.
 *
 * ET RIEN N'EST RECOPIÉ EN CONSTANTE TYPESCRIPT : la valeur reste lue dans la
 * feuille, ce que défendent l'en-tête d'`index.html` et celui de ce fichier. Le
 * portfolio, dont cette bascule est reprise, code ses deux fonds en dur avec un
 * commentaire qui reconnaît devoir « rester aligné » — c'est la dérive que ce
 * dépôt existe pour empêcher, et le fond peint est la lecture qui n'a aucune
 * seconde copie à tenir.
 *
 * `body` ET NON `documentElement` : c'est `body` que `tokens.css` puis `doc.css`
 * peignent. La racine, elle, n'est peinte par personne et rend `transparent`.
 *
 * L'appelant doit avoir posé `data-theme` AVANT d'appeler : la valeur calculée
 * dépend du thème actif, lire d'abord rendrait la couleur du thème qu'on quitte.
 *
 * Une chaîne vide est un résultat normal, pas une anomalie — page non peinte,
 * ou `var()` que jsdom ne substitue pas. L'appelant n'écrit alors rien du tout :
 * ne pas annoncer de couleur est toujours préférable à en annoncer une fausse.
 */
function readPaintedGround(): string {
  const painted = getComputedStyle(document.body).getPropertyValue('background-color').trim();

  // Rien ne peint : ni la couleur du sol ni celle du thème n'est connue.
  if (painted === '' || painted === 'transparent' || painted === UNPAINTED) return '';

  /* Une substitution `var()` qui n'a pas eu lieu. Un navigateur résout toujours
     `var()` dans une valeur calculée ; jsdom rend le littéral
     `var(--doc-ground)`, et l'écrire dans `theme-color` serait exactement
     annoncer une couleur fausse — celle-là ne serait même pas une couleur. */
  if (painted.includes('var(')) return '';

  return painted;
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

    const ground = readPaintedGround();
    if (ground === '') return;

    meta.setAttribute('content', ground);
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
