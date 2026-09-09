import { useCallback, useEffect, useState } from 'react';

/**
 * Le second axe du document, à côté du thème : le MATÉRIAU des surfaces.
 *
 * ET IL N'Y A PAS D'ENTRÉE `./client`, pour le mot à mot du raisonnement de
 * `use-theme.ts` : il n'y a pas UNE bascule à publier mais trois mécaniques
 * incompatibles entre les consommateurs — la vitrine, le portfolio, et un
 * `travels_in_world` prérendu qui voudrait un script en `<head>` ou un cookie,
 * pas un `localStorage` lu dans un initialiseur de `useState`. Publier
 * celui-ci reviendrait à publier le mauvais DEUX FOIS. Le sélecteur reste dans
 * la vitrine ; ce que la librairie publie, c'est la feuille.
 */
export type Material = 'flat' | 'glass';

const STORAGE_KEY = 'tc-material';

/**
 * UNE SEULE DES DEUX VALEURS S'ÉCRIT SUR LE DOCUMENT.
 *
 * `glass` pose `data-material="glass"` ; `flat` RETIRE l'attribut au lieu
 * d'écrire `data-material="flat"`. La feuille n'a aucun sélecteur
 * `[data-material='flat']`, et ce n'est pas un oubli : aucune préférence
 * système ne peut imposer le verre — il n'existe pas de `prefers-material` —
 * donc rien n'a jamais à être CONTREDIT. `data-theme="light"`, lui, doit
 * pouvoir contredire l'OS, ce qui est exactement pourquoi les deux valeurs du
 * thème s'écrivent, elles. Écrire `flat` inviterait quelqu'un à écrire la règle
 * qui va avec, et cette règle n'aurait rien à annuler.
 */
function isMaterial(value: string | null): value is Material {
  return value === 'flat' || value === 'glass';
}

/**
 * Le choix mémorisé, ou `flat` s'il n'y en a aucun.
 *
 * Pas de `null` ici, contrairement à `readStoredTheme` : le `null` du thème est
 * une information — « l'OS est la référence » — et il n'y a pas d'OS à
 * consulter pour un matériau. « N'a jamais choisi » et « a choisi flat »
 * rendent donc la même page, et il n'y a aucun troisième état à distinguer.
 *
 * La lecture est dans un `try` : en navigation privée, la simple lecture du
 * stockage lève. C'est écrit dans `use-theme.ts` et dans `index.html`.
 */
function readStoredMaterial(): Material {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isMaterial(stored) ? stored : 'flat';
  } catch {
    // Stockage refusé (navigation privée, cookies bloqués) : on n'insiste pas.
    return 'flat';
  }
}

export interface MaterialControl {
  /** Le matériau appliqué : le choix mémorisé, sinon `flat`. */
  readonly material: Material;
  readonly isGlass: boolean;
  readonly toggleMaterial: () => void;
}

/**
 * Bascule aplat / verre liquide, à DEUX états.
 *
 * DEUX DIFFÉRENCES ASSUMÉES AVEC `useTheme`, et ce sont des décisions, pas des
 * oublis :
 *
 * — PAS DE `useSyncExternalStore`. Ce hook n'a aucun magasin extérieur à
 *   écouter : il n'existe pas de `prefers-material`, aucun média ne dit si
 *   l'utilisateur veut du verre, et rien ne peut donc changer sous les pieds du
 *   composant. `useTheme` a besoin de l'autre parce qu'il s'abonne à
 *   `matchMedia('(prefers-color-scheme: dark)')` — un état qui bouge sans lui.
 *   Ici `useState` + `useEffect` suffisent, et un abonnement serait un
 *   abonnement à rien ;
 *
 * — PAS DE RELECTURE DE `--site-background` NI DE `theme-color`. Le thème verre
 *   ne touche pas au SOL de la page : il pose un `backdrop-filter`, un ménisque
 *   et un liseré spéculaire sur les surfaces qui flottent au-dessus. La barre
 *   d'adresse n'a donc rien à apprendre d'un changement de matériau, et la
 *   réécrire à l'identique serait une écriture de plus à tenir juste.
 *
 * `localStorage` N'EST ÉCRIT QU'AU CLIC, jamais au montage, et la garantie est
 * STRUCTURELLE comme dans `useTheme` : l'écriture ne vit que dans
 * `toggleMaterial`. Le double montage du mode strict n'écrit donc rien sans
 * qu'aucune référence n'ait à s'en souvenir.
 *
 * L'attribut n'est posé QUE dans l'effet et jamais pendant le rendu : avant
 * hydratation le document reste nu, donc sans verre — ce qui est le bon défaut,
 * puisque le verre est le choix et l'aplat l'état de base. Le flash, lui, est
 * fermé en amont par le script bloquant d'`index.html`, seul endroit d'où
 * l'attribut peut être posé avant la première peinture.
 */
export function useMaterial(): MaterialControl {
  const [material, setMaterial] = useState<Material>(readStoredMaterial);

  useEffect(() => {
    const root = document.documentElement;

    if (material === 'glass') {
      root.dataset.material = 'glass';
      return;
    }

    // `flat` RETIRE l'attribut au lieu de l'écrire — la raison est au-dessus.
    delete root.dataset.material;
  }, [material]);

  const toggleMaterial = useCallback(() => {
    const nextMaterial: Material = material === 'glass' ? 'flat' : 'glass';

    try {
      window.localStorage.setItem(STORAGE_KEY, nextMaterial);
    } catch {
      // Le matériau vivra le temps de la session, et c'est acceptable.
    }

    setMaterial(nextMaterial);
  }, [material]);

  return { material, isGlass: material === 'glass', toggleMaterial };
}
