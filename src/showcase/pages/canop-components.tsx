import type { ReactNode } from 'react';

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

function Preview({ name }: { name: string }): ReactNode {
  switch (name) {
    case 'CanopButton':
      return <div className="tc-doc-canop-preview__row"><CanopButton>Primaire</CanopButton><CanopButton variant="secondary">Secondaire</CanopButton><CanopButton variant="accent">Accent</CanopButton><CanopButton variant="ghost">Ghost</CanopButton><CanopButton liquidGlass variant="tonal">Liquid Glass</CanopButton></div>;
    case 'CanopInput':
      return <CanopInput label="Email" placeholder="martin@qvl-studio.com" helperText="Une adresse valide est requise." />;
    case 'CanopCheckbox':
      return <CanopCheckbox label="Recevoir les notifications" description="Les nouveautés du design system." defaultChecked />;
    case 'CanopToggle':
      return <CanopToggle label="Activées" defaultChecked />;
    case 'CanopSlider':
      return <CanopSlider label="Volume" defaultValue={64} min={0} max={100} />;
    case 'CanopSegmentedControl':
      return <CanopSegmentedControl options={[{ value: 'all', label: 'Tout' }, { value: 'active', label: 'Actifs' }, { value: 'archived', label: 'Archivés' }]} value="all" />;
    case 'CanopCard':
      return <CanopCard liquidGlass title="Une surface CanopUI" subtitle="Carte, actions et élévation." actions={<CanopBadge>Stable</CanopBadge>}><p className="tc-doc-prose">Une surface claire, lisible et responsive.</p></CanopCard>;
    case 'CanopCardGrid':
      return <CanopCardGrid><CanopStatCard label="Composants" value="77" delta="+12 cette version" /><CanopStatCard label="Thèmes" value="3" /></CanopCardGrid>;
    case 'CanopDataTable':
      return <CanopDataTable columns={[{ key: 'name', label: 'Nom' }, { key: 'status', label: 'Statut' }]} rows={[{ name: 'Button', status: 'Stable' }, { name: 'DataTable', status: 'Nouveau' }]} />;
    case 'CanopFeedback':
      return <CanopFeedback severity="success" title="En production">La dernière version est disponible.</CanopFeedback>;
    case 'CanopProgressBar':
      return <CanopProgressBar label="Progression" value={72} />;
    default:
      return <CanopCard title={name} subtitle="Démo interactive CanopUI"><CanopButton variant="tonal">Explorer</CanopButton></CanopCard>;
  }
}

function CanopComponentPage({ entry }: { entry: CanopCatalogEntry }) {
  const displayName = entry.name.replace(/^Canop/, '');

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
        <div className="tc-doc-canop-preview">
          <Preview name={entry.name} />
        </div>
      </section>
      <section className="tc-doc-canop-api">
        <CanopHeading level={2}>API</CanopHeading>
        <p className="tc-doc-prose">Cette brique reprend les tokens, états et règles de composition de CanopUI. Le prop <code>liquidGlass</code> active le matériau composant par composant lorsque le thème Liquid Glass est sélectionné.</p>
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
