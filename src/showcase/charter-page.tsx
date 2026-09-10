import { DocShell } from './doc-shell';
import { PAGES } from './pages';

/**
 * La vitrine de `@thomascaron/opale`.
 *
 * Elle était UNE page de charte qui déroulait sept sections ; elle est
 * désormais un site de documentation — une barre de navigation à gauche, une
 * page à droite, une entrée par composant publié. Ce fichier ne fait plus que
 * marier le registre des pages à la coquille : `main.tsx` importe
 * `CharterPage`, donc le nom reste, et il n'y a qu'un endroit à changer si le
 * registre déménage.
 *
 * Le document reste une instance de lui-même : il n'utilise que ses propres
 * jetons et ses propres composants, et il est rendu dans la palette qu'il
 * documente. Si une règle est fausse, la page se dégrade avec elle.
 */
export function CharterPage() {
  return <DocShell pages={PAGES} />;
}
