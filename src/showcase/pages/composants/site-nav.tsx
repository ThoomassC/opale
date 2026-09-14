import { SiteNav } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicStage } from './stage';

const ITEMS = [
  { id: 'map', href: '/', label: 'Carte' },
  { id: 'countries', href: '/countries', label: 'Pays' },
  { id: 'cities', href: '/cities', label: 'Villes' },
  { id: 'about', href: '/about', label: 'À propos' },
] as const;

const USAGE = `import { SiteNav } from '@thomascaron/opale';
import '@thomascaron/opale/opale.css';

<SiteNav
  brand={<Brand />}
  items={[
    { id: 'map', href: '/', label: 'Carte' },
    { id: 'countries', href: '/countries', label: 'Pays' },
    { id: 'cities', href: '/cities', label: 'Villes' },
    { id: 'about', href: '/about', label: 'À propos' },
  ]}
  activeItem="map"
  navLabel="Navigation principale"
  search={<Search />}
  language={{ current: <Flag />, label: 'Changer de langue', items: languages }}
/>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'brand',
    type: 'ReactNode',
    required: true,
    description: 'Emplacement de la marque, généralement un lien vers l’accueil.',
  },
  {
    name: 'items',
    type: 'readonly SiteNavItem[]',
    required: true,
    description:
      'Destinations principales. La recette visuelle de la barre reprend quatre entrées égales.',
  },
  {
    name: 'activeItem',
    type: 'string',
    description: 'Identifiant de l’entrée qui porte l’unique bulle active.',
  },
  {
    name: 'navLabel',
    type: 'string',
    required: true,
    description: 'Nom accessible du repère de navigation.',
  },
  {
    name: 'search',
    type: 'ReactNode',
    description: 'Emplacement libre pour un champ de recherche ou un autre contrôle.',
  },
  {
    name: 'language',
    type: 'SiteNavLanguage',
    description: 'Disclosure native de langue, avec drapeaux, liens et note facultative.',
  },
  {
    name: 'onNavigate',
    type: '(item, event) => void',
    description:
      'Intercepte une navigation client. Le clic déplace la bulle et le callback prend le relais pour le routage.',
  },
];

const DEMO_LANGUAGE = {
  current: <span aria-hidden="true">🇫🇷</span>,
  label: 'Changer de langue',
  title: 'Langue',
  items: [
    {
      id: 'fr',
      href: '/fr',
      label: 'Français',
      flag: <span aria-hidden="true">🇫🇷</span>,
      current: true,
    },
    { id: 'en', href: '/en', label: 'English', flag: <span aria-hidden="true">🇬🇧</span> },
    { id: 'es', href: '/es', label: 'Español', flag: <span aria-hidden="true">🇪🇸</span> },
  ],
  note: 'Les récits restent en français.',
} as const;

export const siteNavPage: DocPage = {
  slug: 'composants/site-nav',
  label: 'SiteNav',
  group: 'composants',
  title: 'SiteNav',
  lede: (
    <>
      Une barre de navigation liquid glass complète : marque à gauche, destinations centrées,
      recherche et langues à droite. L’état actif est porté par <strong>une seule bulle</strong> qui
      glisse au clic, tandis que chaque dépendance applicative arrive par props.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appel représentatif de SiteNav" code={USAGE} />

      <Specimen
        title="La barre liquid glass — quatre destinations et les contrôles de droite"
        note="Survolez les libellés : seule leur encre réagit. Cliquez une destination : la bulle unique se déplace et se déforme pendant le trajet."
      >
        <MagicStage stack>
          <SiteNav
            brand={
              <a href="/" style={{ color: 'white', fontWeight: 700, textDecoration: 'none' }}>
                Travels in World
              </a>
            }
            items={ITEMS}
            activeItem="map"
            navLabel="Navigation principale"
            search={
              <input
                aria-label="Rechercher"
                placeholder="Un voyage, un lieu, un pays…"
                style={{
                  width: '15rem',
                  minHeight: '2.75rem',
                  padding: '0 1rem',
                  border: '1px solid rgba(255, 255, 255, 0.72)',
                  borderRadius: '999px',
                  background: 'transparent',
                  color: 'white',
                }}
              />
            }
            language={DEMO_LANGUAGE}
          />
        </MagicStage>
      </Specimen>

      <PropsTable
        id="site-nav"
        note={
          <>
            <code>SiteNav</code> porte la structure et l’animation. La marque et la recherche
            restent des slots afin que chaque application conserve ses propres composants et sa
            propre navigation.
          </>
        }
        rows={PROPS}
      />
    </PageBody>
  ),
};
