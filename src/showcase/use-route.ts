import { useSyncExternalStore } from 'react';

import { HOME_SLUG, parseSlug } from './doc-model';

/* =============================================================================
   LE ROUTAGE DE LA VITRINE — le fragment, lu comme un magasin extérieur.

   `useSyncExternalStore` et non `useState` + `useEffect`, pour la même raison
   que `useTheme` : `location.hash` est un magasin que le navigateur possède,
   pas un état dérivé. Ce que le hook y gagne, et qui n'est pas décoratif :

   1. AUCUN ÉCOULEMENT D'ÉCOUTEUR, ni au double montage du mode strict. React
      appelle `subscribe` puis sa fonction de nettoyage, puis `subscribe` à
      nouveau : la paire est symétrique, il n'y a pas de compteur à tenir.
   2. AUCUNE FENÊTRE DE DÉSYNCHRONISATION. Un `useState(readSlug)` lit le
      fragment pendant le rendu et s'abonne dans un effet — si le fragment
      change entre les deux (une ancre cliquée pendant l'hydratation), l'état
      reste sur l'ancienne valeur jusqu'au `hashchange` SUIVANT. React relit
      ici l'instantané après l'abonnement, ce trou n'existe pas.
   3. UN INSTANTANÉ STABLE. `getSnapshot` rend une CHAÎNE : deux lectures
      successives du même fragment sont `===`, donc aucune boucle de rendu.
      C'est ce qu'un objet `{ slug }` construit à chaque appel provoquerait.
   ========================================================================== */

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('hashchange', onStoreChange);
  return () => window.removeEventListener('hashchange', onStoreChange);
}

function getSnapshot(): string {
  return parseSlug(window.location.hash);
}

/**
 * Rendu serveur : il n'y a ni `window` ni fragment, donc l'accueil.
 *
 * La vitrine n'est pas prérendue aujourd'hui — `main.tsx` fait `createRoot` —
 * mais un instantané serveur est exigé par la signature, et l'accueil est la
 * seule réponse honnête : le fragment n'est jamais envoyé au serveur.
 */
function getServerSnapshot(): string {
  return HOME_SLUG;
}

/**
 * Le slug de la page courante, tel que le fragment le dit.
 *
 * Le hook ne connaît PAS le registre des pages : il rend ce qu'il lit, y
 * compris un slug inconnu. C'est la coquille qui décide du repli, parce que
 * c'est elle qui possède la liste des pages.
 */
export function useRoute(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
