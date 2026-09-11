import { Button, Glass } from '../../magic';
import type { DocPage } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { MagicCell, MagicStage } from './composants/stage';

const LANDSCAPE_GROUND =
  "linear-gradient(180deg, rgba(7, 28, 43, 0.08), rgba(7, 28, 43, 0.22)), url('/glass-landscape.jpg') center / cover no-repeat";

const USAGE = `npm i "@thomascaron/opale@github:ThoomassC/opale#v2.0.0"

import { Button, Glass } from '@thomascaron/opale';
import '@thomascaron/opale/opale.css';

<Glass enableLiquidAnimation>Modale</Glass>
<Button text="Continuer" />`;

export const verreLiquidePage: DocPage = {
  slug: 'verre-liquide',
  label: 'Le verre liquide',
  group: 'introduction',
  title: 'Le verre liquide',
  render: () => (
    <PageBody>
      <Specimen title="Verre liquide">
        <MagicStage background={LANDSCAPE_GROUND}>
          <MagicCell label="Modale + déformation">
            <Glass enableLiquidAnimation={false}>
              <div
                style={{
                  display: 'grid',
                  gap: '10px',
                  minInlineSize: '260px',
                  padding: '22px 26px',
                }}
              >
                <strong style={{ fontSize: '18px' }}>Liquid Glass</strong>
                <span>Une surface nette, légèrement déformée.</span>
              </div>
            </Glass>
          </MagicCell>

          <MagicCell label="Bouton + déformation">
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                minBlockSize: '108px',
              }}
            >
              <Button text="Continuer" />
            </div>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <UsageBlock label="Installation et import de Glass" code={USAGE} />
    </PageBody>
  ),
};
