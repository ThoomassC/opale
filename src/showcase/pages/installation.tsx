import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { UI_VERSION } from '../version';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

const INSTALL = `npm i "@thomascaron/opale@github:ThoomassC/opale#v${UI_VERSION}"`;

const IMPORTS = `import '@thomascaron/opale/tokens.css';
import '@thomascaron/opale/opale.css';

import { Button, CanopUI } from '@thomascaron/opale';`;

export const installationPage: DocPage = {
  slug: 'installation',
  label: 'Installation',
  group: 'introduction',
  title: 'Installation',
  lede: (
    <>
      Installez Opale UI, chargez ses feuilles de style, puis utilisez les composants historiques
      ou le catalogue CanopUI de la V3.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen title="Installer Opale UI" note="La V3 est disponible depuis le dépôt GitHub, avec son numéro de version explicite.">
        <UsageBlock label="Commande d'installation" code={INSTALL} />
      </Specimen>

      <Specimen title="Charger les styles">
        <UsageBlock label="Imports CSS et composants" code={IMPORTS} />
      </Specimen>

      <Specimen title="Choisir une brique">
        <p className="tc-doc-prose">
          Les composants publiés gardent leurs exports habituels. Les nouveaux composants CanopUI
          sont disponibles directement ou via le namespace <code>CanopUI</code>.
        </p>
        <ul className="tc-doc-checklist">
          <li>
            <a className="tc-doc-link" href={hrefFor('composants/canop-button')}>
              Voir Button
            </a>{' '}
            pour les variantes principales.
          </li>
          <li>
            Activez Liquid Glass uniquement sur le spécimen du composant que vous souhaitez
            comparer.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
