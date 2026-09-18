import { useState, type ReactNode } from 'react';

import {
  CANOP_CATALOG,
  type CanopCatalogEntry,
  CanopBadge,
  CanopButton,
  CanopCard,
  CanopCardGrid,
  CanopCheckbox,
  CanopDataTable,
  CanopFeedback,
  CanopHeading,
  CanopInput,
  CanopProgressBar,
  CanopSegmentedControl,
  CanopSlider,
  CanopStatCard,
  CanopToggle,
} from '../../magic';
import type { DocPage } from '../doc-model';

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function Preview({ name, liquidGlass }: { name: string; liquidGlass: boolean }): ReactNode {
  let preview: ReactNode;

  switch (name) {
    case 'CanopButton':
      preview = <div className="tc-doc-canop-preview__row"><CanopButton liquidGlass={liquidGlass}>Primaire</CanopButton><CanopButton liquidGlass={liquidGlass} variant="secondary">Secondaire</CanopButton><CanopButton liquidGlass={liquidGlass} variant="accent">Accent</CanopButton><CanopButton liquidGlass={liquidGlass} variant="ghost">Ghost</CanopButton></div>;
      break;
    case 'CanopInput':
      preview = <CanopInput liquidGlass={liquidGlass} label="Email" placeholder="martin@qvl-studio.com" helperText="Une adresse valide est requise." />;
      break;
    case 'CanopCheckbox':
      preview = <CanopCheckbox label="Recevoir les notifications" description="Les nouveautés du design system." defaultChecked />;
      break;
    case 'CanopToggle':
      preview = <CanopToggle liquidGlass={liquidGlass} label="Activées" defaultChecked />;
      break;
    case 'CanopSlider':
      preview = <CanopSlider label="Volume" defaultValue={64} min={0} max={100} />;
      break;
    case 'CanopSegmentedControl':
      preview = <CanopSegmentedControl options={[{ value: 'all', label: 'Tout' }, { value: 'active', label: 'Actifs' }, { value: 'archived', label: 'Archivés' }]} value="all" />;
      break;
    case 'CanopCard':
      preview = <CanopCard liquidGlass={liquidGlass} title="Une surface CanopUI" subtitle="Carte, actions et élévation." actions={<CanopBadge>Stable</CanopBadge>}><p className="tc-doc-prose">Une surface claire, lisible et responsive.</p></CanopCard>;
      break;
    case 'CanopCardGrid':
      preview = <CanopCardGrid><CanopStatCard liquidGlass={liquidGlass} label="Composants" value="77" delta="+12 cette version" /><CanopStatCard liquidGlass={liquidGlass} label="Thèmes" value="2 globaux + 1 matériau" /></CanopCardGrid>;
      break;
    case 'CanopDataTable':
      preview = <CanopDataTable columns={[{ key: 'name', label: 'Nom' }, { key: 'status', label: 'Statut' }]} rows={[{ name: 'Button', status: 'Stable' }, { name: 'DataTable', status: 'Nouveau' }]} />;
      break;
    case 'CanopFeedback':
      preview = <CanopFeedback severity="success" title="En production">La dernière version est disponible.</CanopFeedback>;
      break;
    case 'CanopProgressBar':
      preview = <CanopProgressBar label="Progression" value={72} />;
      break;
    default:
      preview = <CanopCard liquidGlass={liquidGlass} title={name} subtitle="Démo interactive CanopUI"><CanopButton liquidGlass={liquidGlass} variant="tonal">Explorer</CanopButton></CanopCard>;
  }

  return (
    <div className={`tc-doc-canop-preview__material${liquidGlass ? ' canop-liquid' : ''}`} data-liquid-glass={liquidGlass ? 'true' : undefined}>
      {preview}
    </div>
  );
}

function CanopComponentPage({ entry }: { entry: CanopCatalogEntry }) {
  const displayName = entry.name.replace(/^Canop/, '');
  const [liquidGlass, setLiquidGlass] = useState(false);

  return (
    <div className="tc-doc-canop-page">
      <p className="tc-doc-lede">{entry.description}</p>
      <div className="tc-doc-canop-meta">
        <CanopBadge>{entry.category}</CanopBadge>
        <span>CanopUI compatible · TypeScript strict</span>
      </div>
      <div className="tc-doc-code tc-doc-code--canop">
        <code>{`import { ${entry.name} } from '@thomascaron/opale';`}</code>
      </div>
      <section className="tc-doc-specimen tc-doc-specimen--canop" aria-label={`Démonstration ${displayName}`}>
        <div className="tc-doc-specimen__header">
          <div>
            <span className="tc-doc-specimen__eyebrow">DÉMO INTERACTIVE</span>
            <h2>{displayName}</h2>
          </div>
          <CanopBadge tone="accent">V3</CanopBadge>
        </div>
        <div className="tc-doc-canop-material-toggle">
          <div className="tc-doc-canop-material-toggle__text">
            <strong>Rendu Liquid Glass</strong>
            <span>Appliquer le matériau uniquement à ce composant.</span>
          </div>
          <CanopToggle
            label={`Liquid Glass pour ${displayName}`}
            checked={liquidGlass}
            onChange={(event) => setLiquidGlass(event.currentTarget.checked)}
          />
        </div>
        <div className="tc-doc-canop-preview">
          <Preview name={entry.name} liquidGlass={liquidGlass} />
        </div>
      </section>
      <section className="tc-doc-canop-api">
        <CanopHeading level={2}>API</CanopHeading>
        <p className="tc-doc-prose">Cette brique reprend les tokens, états et règles de composition de CanopUI. Le contrôle local active le prop <code>liquidGlass</code> uniquement sur ce spécimen, sans modifier les autres composants de la page.</p>
      </section>
    </div>
  );
}

export const canopComponentPages: readonly DocPage[] = CANOP_CATALOG.map((entry) => ({
  slug: `composants/${kebabCase(entry.name)}`,
  label: entry.name,
  group: 'composants',
  title: entry.name.replace(/^Canop/, ''),
  render: () => <CanopComponentPage entry={entry} />,
}));
