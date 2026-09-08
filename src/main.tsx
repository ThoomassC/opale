import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Les jetons d'abord — la feuille de composants ne fait que les consommer.
import './tokens/tokens.css';
import './styles/ui.css';

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
