import type { DocPage } from '../doc-model';

import { introductionPage } from './introduction';

import { accessibilitePage } from './fondations/accessibilite';
import { elevationPage } from './fondations/elevation';
import { espacementPage } from './fondations/espacement';
import { palettePage } from './fondations/palette';
import { typographiePage } from './fondations/typographie';

import { backdropPage } from './composants/backdrop';
import { buttonPage } from './composants/button';
import { cardPage } from './composants/card';
import { checkboxPage } from './composants/checkbox';
import { chipListPage } from './composants/chip-list';
import { dateRangePage } from './composants/date-range';
import { fieldPage } from './composants/field';
import { iconTilePage } from './composants/icon-tile';
import { inputPage } from './composants/input';
import { messagePage } from './composants/message';
import { pillPage } from './composants/pill';
import { sectionHeadingPage } from './composants/section-heading';
import { selectPage } from './composants/select';
import { tagPage } from './composants/tag';
import { textareaPage } from './composants/textarea';
import { timelinePage } from './composants/timeline';

import { verreEtFrisePage } from './compositions/verre-et-frise';

/* =============================================================================
   LE REGISTRE — l'unique liste des pages du site, et donc de sa navigation.

   La barre de gauche est RENDUE D'ICI : `doc-nav.tsx` ne connaît aucun nom de
   page, il groupe ce tableau par `group` dans l'ordre de `GROUPS`. Ajouter une
   page, c'est donc ajouter une ligne ici — et rien d'autre.

   L'ORDRE DE CE TABLEAU EST L'ORDRE DE LA NAVIGATION à l'intérieur de chaque
   groupe. Les fondations suivent l'ordre de lecture — la couleur avant les
   échelles, l'accessibilité en fin de chapitre. Les composants sont ALPHABÉTIQUES
   et pas thématiques : c'est une colonne de vingt entrées où l'on vient chercher
   un nom qu'on connaît déjà, jamais une progression pédagogique.

   `registry.test.tsx` garde deux promesses sur ce tableau : chaque composant
   exporté par `src/index.ts` y a sa page, et chaque page se rend sans jeter ni
   écrire dans `console.error`. Un composant publié sans page fait rougir la
   suite — c'est le seul moyen que « une entrée de nav par composant » reste
   vrai au dixième composant.
   ========================================================================== */
export const PAGES: readonly DocPage[] = [
  introductionPage,

  palettePage,
  typographiePage,
  espacementPage,
  elevationPage,
  accessibilitePage,

  backdropPage,
  buttonPage,
  cardPage,
  checkboxPage,
  chipListPage,
  dateRangePage,
  fieldPage,
  iconTilePage,
  inputPage,
  messagePage,
  pillPage,
  sectionHeadingPage,
  selectPage,
  tagPage,
  textareaPage,
  timelinePage,

  verreEtFrisePage,
];
