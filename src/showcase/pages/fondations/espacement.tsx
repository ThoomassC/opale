import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

const SPACE_STEPS: readonly { token: string; px: string }[] = [
  { token: '--space-1', px: '4 px' },
  { token: '--space-2', px: '8 px' },
  { token: '--space-3', px: '12 px' },
  { token: '--space-4', px: '16 px' },
  { token: '--space-5', px: '24 px' },
  { token: '--space-6', px: '32 px' },
  { token: '--space-7', px: '48 px' },
  { token: '--space-8', px: '64 px' },
];

const RADII: readonly { token: string; px: string; usage: string }[] = [
  { token: '--radius-sm', px: '10 px', usage: 'champ, étiquette, message' },
  { token: '--radius-md', px: '16 px', usage: 'carte, panneau' },
  { token: '--radius-lg', px: '24 px', usage: 'plaque, grande surface' },
  { token: '--radius-pill', px: '999 px', usage: 'bouton, pastille' },
];

export const espacementPage: DocPage = {
  slug: 'espacement',
  label: 'Espacement et rayons',
  group: 'fondations',
  title: 'Espacement et rayons',
  lede: (
    <>
      Une grille de 4 px, huit pas, et aucune valeur hors liste. Deux exceptions assumées, hors
      échelle parce qu’elles répondent au doigt et non à l’œil :
      <code className="tc-doc-inlinecode">--target-min</code> (44 px) et
      <code className="tc-doc-inlinecode">--target-button</code> (48 px).
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen title="Les huit pas d’espacement">
        <ul className="tc-doc-scale">
          {SPACE_STEPS.map((step) => (
            <li className="tc-doc-scale__row tc-doc-scale__row--bar" key={step.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{step.token}</code>
                <span className="tc-doc-scale__value">{step.px}</span>
              </div>
              <span
                className="tc-doc-bar"
                style={{ inlineSize: `var(${step.token})` }}
                aria-hidden="true"
              />
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Les quatre rayons" inline>
        {RADII.map((radius) => (
          <figure className="tc-doc-radius" key={radius.token}>
            <div
              className="tc-doc-radius__box"
              style={{ borderRadius: `var(${radius.token})` }}
              aria-hidden="true"
            />
            <figcaption className="tc-doc-radius__caption">
              <code className="tc-doc-scale__token">{radius.token}</code>
              <span className="tc-doc-scale__value">{radius.px}</span>
              <span className="tc-doc-scale__usage">{radius.usage}</span>
            </figcaption>
          </figure>
        ))}
      </Specimen>
    </PageBody>
  ),
};
