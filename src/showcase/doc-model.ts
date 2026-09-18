import type { ReactNode } from 'react';

/* =============================================================================
   LE MODÈLE DE LA VITRINE — une page par sujet, une entrée de nav par page.

   La vitrine était UNE page de charte qui déroulait sept sections ; elle est
   désormais un site de documentation : une barre de navigation à gauche, une
   page à droite, et une entrée de navigation par composant publié. Le routage
   passe par le FRAGMENT (`#/composants/button`) et non par l'historique
   `pushState` : la vitrine est servie en statique depuis `dist-showcase/`, sans
   serveur capable de réécrire une URL profonde vers `index.html`. Un chemin
   réel se casserait donc au premier rechargement, et au premier lien partagé.

   Ce fichier ne contient que le MODÈLE — les types, les groupes, la lecture du
   fragment. Les pages elles-mêmes vivent dans `pages/`, la coquille dans
   `doc-shell.tsx` : aucun des deux n'a besoin de connaître l'autre.
   ========================================================================== */

/** Les trois familles de la barre de gauche, dans l'ordre où elle les sert. */
export type DocGroupId = 'introduction' | 'fondations' | 'composants';

export interface DocGroup {
  readonly id: DocGroupId;
  readonly label: string;
}

export const GROUPS: readonly DocGroup[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'fondations', label: 'Fondations' },
  { id: 'composants', label: 'Composants' },
];

export interface DocPage {
  /** Le fragment sans son préfixe. `''` est l'accueil. */
  readonly slug: string;
  /** Le libellé dans la barre de gauche — court, c'est une colonne étroite. */
  readonly label: string;
  readonly group: DocGroupId;
  /** Le `<h1>` de la page, et le titre du document. */
  readonly title: string;
  /** Le chapeau, rendu par la coquille juste sous le titre. */
  readonly lede?: ReactNode;
  /**
   * Le corps de la page. Une FONCTION et non un `ReactNode` : le registre est
   * un module de premier niveau, donc évalué à l'import — un nœud construit
   * là rendrait les vingt pages non affichées à chaque chargement.
   */
  readonly render: () => ReactNode;
}

/** Une entrée de la navigation visuelle inspirée de CanopUI. */
export interface DocNavEntry {
  readonly label: string;
  readonly page: DocPage;
}

/** Une famille du sommaire, résolue contre le registre réel des pages. */
export interface DocNavSection {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly DocNavEntry[];
}

interface DocNavEntryDefinition {
  readonly label: string;
  readonly slug: string;
}

interface DocNavSectionDefinition {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly DocNavEntryDefinition[];
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function canopEntry(name: string, label = name.replace(/^Canop/, '')): DocNavEntryDefinition {
  return { label, slug: `composants/${kebabCase(name)}` };
}

/**
 * Le plan du sommaire CanopUI, relevé dans l'application de référence.
 *
 * Les pages restent libres de leur groupe historique (`GROUPS`) : cette liste
 * décrit seulement l'ordre éditorial du rail. C'est ce qui permet de copier
 * le sommaire sans déplacer ni supprimer les pages déjà publiées par Opale.
 */
export const CANOP_NAV_SECTIONS: readonly DocNavSectionDefinition[] = [
  {
    id: 'prise-en-main',
    label: 'PRISE EN MAIN',
    entries: [
      { label: 'Installation', slug: 'installation' },
      { label: 'Utilisation', slug: 'utilisation' },
      { label: 'Theming', slug: 'theming' },
      { label: 'Typographie', slug: 'typographie' },
      { label: 'Icônes', slug: 'icones' },
    ],
  },
  {
    id: 'versions',
    label: 'VERSIONS',
    entries: [{ label: 'Notes de version', slug: 'notes-de-versions' }],
  },
  {
    id: 'inputs',
    label: 'INPUTS',
    entries: [
      canopEntry('CanopButton', 'Button'),
      canopEntry('CanopPressable', 'Pressable'),
      canopEntry('CanopInlineInput', 'InlineInput'),
      canopEntry('CanopInput', 'Input'),
      canopEntry('CanopCheckbox', 'Checkbox'),
      canopEntry('CanopToggle', 'Toggle'),
      canopEntry('CanopSlider', 'Slider'),
      canopEntry('CanopMultiSelect', 'MultiSelect'),
      canopEntry('CanopSelect', 'Select'),
      canopEntry('CanopAutocomplete', 'Autocomplete'),
      canopEntry('CanopForm', 'Form'),
      canopEntry('CanopLanguageSelector', 'LanguageSelector'),
      canopEntry('CanopSegmentedControl', 'SegmentedControl'),
      canopEntry('CanopThemeToggle', 'ThemeToggle'),
    ],
  },
  {
    id: 'boutons-specialises',
    label: 'BOUTONS SPÉCIALISÉS',
    entries: [
      canopEntry('CanopAddButton', 'AddButton'),
      canopEntry('CanopSaveButton', 'SaveButton'),
      canopEntry('CanopApproveButton', 'ApproveButton'),
      canopEntry('CanopEditButton', 'EditButton'),
      canopEntry('CanopDeleteButton', 'DeleteButton'),
      canopEntry('CanopIconActionButton', 'IconActionButton'),
    ],
  },
  {
    id: 'affichage-de-donnees',
    label: 'AFFICHAGE DE DONNÉES',
    entries: [
      canopEntry('CanopCard', 'Card'),
      canopEntry('CanopCardGrid', 'CardGrid'),
      canopEntry('CanopCarousel', 'Carousel'),
      canopEntry('CanopDataTable', 'DataTable'),
      canopEntry('CanopDescriptionList', 'DescriptionList'),
      canopEntry('CanopBulletList', 'BulletList'),
      canopEntry('CanopStatusChip', 'StatusChip'),
      canopEntry('CanopBadge', 'Badge'),
      canopEntry('CanopRating', 'Rating'),
      canopEntry('CanopStatCard', 'StatCard'),
      canopEntry('CanopDonut', 'Donut'),
      canopEntry('CanopLegalLinks', 'LegalLinks'),
      canopEntry('CanopLegend', 'Legend'),
      canopEntry('CanopHeading', 'Heading'),
      canopEntry('CanopText', 'Text'),
      canopEntry('CanopIcon', 'Icon'),
    ],
  },
  {
    id: 'feedback',
    label: 'FEEDBACK',
    entries: [
      canopEntry('CanopFeedback', 'Feedback'),
      canopEntry('CanopToast', 'Toast'),
      canopEntry('CanopSpinner', 'Spinner'),
      canopEntry('CanopProgressBar', 'ProgressBar'),
      canopEntry('CanopConfirmDialog', 'ConfirmDialog'),
      canopEntry('CanopEmptyState', 'EmptyState'),
    ],
  },
  {
    id: 'navigation',
    label: 'NAVIGATION',
    entries: [
      canopEntry('CanopNavbar', 'Navbar'),
      canopEntry('CanopMenu', 'Menu'),
      canopEntry('CanopLink', 'Link'),
      canopEntry('CanopSidePanel', 'SidePanel'),
      canopEntry('CanopSettingsMenu', 'SettingsMenu'),
      canopEntry('CanopCommandPalette', 'CommandPalette'),
      canopEntry('CanopBreadcrumb', 'Breadcrumb'),
      canopEntry('CanopToolbar', 'Toolbar'),
      canopEntry('CanopCookieBanner', 'CookieBanner'),
      canopEntry('CanopScrollbar', 'Scrollbar'),
      canopEntry('CanopSelectionBar', 'SelectionBar'),
    ],
  },
  {
    id: 'mise-en-page',
    label: 'MISE EN PAGE',
    entries: [
      canopEntry('CanopStack', 'Stack'),
      canopEntry('CanopLayout', 'Layout'),
      canopEntry('CanopPageScaffold', 'PageScaffold'),
      canopEntry('CanopPageContent', 'PageContent'),
      canopEntry('CanopDivider', 'Divider'),
      canopEntry('CanopSeparator', 'Separator'),
      canopEntry('CanopCanopyBackground', 'CanopyBackground'),
      canopEntry('CanopShapeBackground', 'ShapeBackground'),
      canopEntry('CanopSlidingIndicator', 'SlidingIndicator'),
    ],
  },
  {
    id: 'modules',
    label: 'MODULES',
    entries: [
      canopEntry('CanopFileUploader', 'Upload'),
      canopEntry('CanopFileCard', 'FileCard'),
      canopEntry('CanopDropzone', 'Dropzone'),
      canopEntry('CanopLightbox', 'Lightbox'),
      canopEntry('CanopMap', 'Map'),
      canopEntry('CanopRouteGuard', 'Auth'),
      canopEntry('CanopI18n', 'i18n'),
      canopEntry('CanopHttp', 'HTTP'),
      canopEntry('CanopValidation', 'Validation'),
      canopEntry('CanopSound', 'Sound'),
      canopEntry('CanopLocalStore', 'Local store'),
      canopEntry('CanopCountdown', 'Countdown'),
      canopEntry('CanopGame', 'Game'),
      canopEntry('CanopClipboard', 'Clipboard'),
      canopEntry('CanopSvgMap', 'SVG map'),
    ],
  },
];

const CANOP_NAV_MARKER_SLUG = 'composants/canop-button';

function legacyNavSectionsForPages(pages: readonly DocPage[]): readonly DocNavSection[] {
  return GROUPS.flatMap((group) => {
    const entries = pages
      .filter((page) => page.group === group.id)
      .map((page) => ({ label: page.label, page }));

    return entries.length > 0 ? [{ id: group.id, label: group.label, entries }] : [];
  });
}

/**
 * Résout le plan CanopUI contre le registre fourni.
 *
 * Les petits registres de test et les intégrations historiques qui ne
 * contiennent pas le catalogue CanopUI gardent l'ancien classement par
 * familles. Le registre de la vitrine V3, lui, contient le marqueur du
 * catalogue et reçoit le plan complet ci-dessus, puis une section OPALE pour
 * les pages historiques qui ne doivent pas disparaître du sommaire.
 */
export function navSectionsForPages(pages: readonly DocPage[]): readonly DocNavSection[] {
  if (!pages.some((page) => page.slug === CANOP_NAV_MARKER_SLUG)) {
    return legacyNavSectionsForPages(pages);
  }

  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const assignedSlugs = new Set<string>();
  const sections = CANOP_NAV_SECTIONS.flatMap((section) => {
    const entries = section.entries.flatMap((definition) => {
      const page = bySlug.get(definition.slug);

      if (!page) return [];

      assignedSlugs.add(page.slug);
      return [{ label: definition.label, page }];
    });

    return entries.length > 0 ? [{ ...section, entries }] : [];
  });

  const opaleEntries = pages
    .filter((page) => !assignedSlugs.has(page.slug))
    .map((page) => ({ label: page.label, page }));

  return opaleEntries.length > 0
    ? [...sections, { id: 'opale', label: 'OPALE', entries: opaleEntries }]
    : sections;
}

/** Les entrées dans l'ordre visuel du rail — utile aux contrôles de registre. */
export function navEntriesForPages(pages: readonly DocPage[]): readonly DocNavEntry[] {
  return navSectionsForPages(pages).flatMap((section) => section.entries);
}

/** L'accueil. Sert aussi de repli pour un fragment qu'on ne connaît pas. */
export const HOME_SLUG = '';

/**
 * Le fragment d'une page, lu sans confiance.
 *
 * Tolérant par nécessité : les spécimens contiennent des liens écrits à la
 * main du temps où la vitrine tenait sur une page — `href="#palette"` — et
 * un visiteur qui tape une adresse ajoute ou oublie la barre oblique. Les
 * quatre formes `#/palette`, `#palette`, `#/palette/` et `palette` désignent
 * donc la même page.
 */
export function parseSlug(hash: string): string {
  let raw = hash.trim();

  if (raw.startsWith('#')) raw = raw.slice(1);

  /* Le fragment arrive percent-encodé quand le navigateur l'a normalisé. Un
     fragment malformé (`%E0%`) fait lever `decodeURIComponent` : la vitrine
     doit alors servir l'accueil, pas une page blanche. */
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return HOME_SLUG;
  }

  return raw.replace(/^\/+/, '').replace(/\/+$/, '');
}

/** L'adresse d'une page. Toujours préfixée `#/` : c'est la forme canonique. */
export function hrefFor(slug: string): string {
  return `#/${slug}`;
}

/** La page d'un fragment, ou `undefined` — la coquille décide du repli. */
export function findPage(pages: readonly DocPage[], slug: string): DocPage | undefined {
  return pages.find((page) => page.slug === slug);
}
