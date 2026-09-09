import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Les jetons d'abord — la feuille de composants ne fait que les consommer.
import './tokens/tokens.css';
import './styles/ui.css';

// Le thème « verre liquide », et sa place dans cette liste EST un invariant, pas
// une habitude de rangement. `:root[data-material='glass']` pèse (0,2,0),
// exactement comme `:root:not([data-theme='light'])` et `:root[data-theme='dark']`
// dans `roles.css` et `materials.css` : à spécificité égale c'est l'ordre du
// document qui tranche. Chargée AVANT `tokens.css`, cette feuille perdrait ses
// deux jetons EN THÈME SOMBRE SEULEMENT — panne silencieuse, invisible en clair.
// Elle vient donc après `ui.css`, et avant `doc.css` qui habille la vitrine.
import './styles/glass.css';

// L'habillage de la vitrine, et lui seul : `doc.css` n'est pas dans `ui.css` et
// n'est pas publié dans le paquet, donc aucun consommateur ne le télécharge.
import './styles/doc.css';

import { CharterPage } from './showcase/charter-page';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root introuvable : index.html a-t-il changé ?');
}

createRoot(container).render(
  <StrictMode>
    <CharterPage />
  </StrictMode>,
);
