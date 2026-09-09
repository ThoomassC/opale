import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

interface TypeStep {
  readonly token: string;
  readonly size: string;
  readonly usage: string;
}

const TYPE_STEPS: readonly TypeStep[] = [
  { token: '--text-xs', size: '12 px', usage: 'mention légale, unité, note de bas de tableau' },
  { token: '--text-sm', size: '14 px', usage: 'étiquette, aide de champ, méta' },
  { token: '--text-base', size: '16 px', usage: 'texte courant — le pas de référence' },
  { token: '--text-md', size: '19 px', usage: 'chapeau de page, chapeau de spécimen' },
  { token: '--text-lg', size: '23 px', usage: 'titre de carte, titre de spécimen' },
  /* Aucun emploi dans la vitrine depuis que les sections numérotées ont
     disparu, et `section-heading.css` le refuse explicitement pour son niveau 2.
     Le pas reste dans l'échelle, mais l'annoncer « titre de section » serait
     faux : ce site n'en a plus. */
  { token: '--text-xl', size: '28 px', usage: 'inemployé — le pas laissé libre entre 23 et 30' },
  { token: '--text-display-sm', size: '24 → 34 px (fluide)', usage: 'titre de page secondaire' },
  {
    token: '--text-display-md',
    size: '30 → 52 px (fluide)',
    usage: 'titre d’ouverture — le `<h1>` de chaque page',
  },
];

interface FontFamily {
  readonly token: string;
  readonly name: string;
  readonly note: string;
}

const FAMILIES: readonly FontFamily[] = [
  {
    token: '--font-display',
    name: 'Iowan Old Style, Palatino, Georgia',
    note: 'Les titres. Une serif de système, donc zéro requête et zéro décalage au chargement.',
  },
  {
    token: '--font-sans',
    name: 'ui-sans-serif, system-ui, Segoe UI, Roboto',
    note: 'Tout le reste : texte courant, contrôles, étiquettes.',
  },
  {
    token: '--font-mono',
    name: 'ui-monospace, SF Mono, Menlo, Consolas',
    note: 'Les mesures : hexadécimaux, ratios, noms de jetons.',
  },
];

export const typographiePage: DocPage = {
  slug: 'typographie',
  label: 'Typographie',
  group: 'fondations',
  title: 'Typographie',
  lede: (
    <>
      Huit pas, rapports 1,15 en bas d’échelle et 1,20 en haut : l’échelle n’est pas géométrique, et
      c’est voulu — les petits pas doivent rester distinguables sans que les grands deviennent
      grotesques. Trois familles, toutes systèmes : la librairie ne fait aucune requête hors
      origine.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen
        title="Les huit pas"
        note="Le texte courant est borné à --measure (66 caractères), quelle que soit la largeur de la fenêtre."
      >
        <ul className="tc-doc-scale">
          {TYPE_STEPS.map((step) => (
            <li className="tc-doc-scale__row" key={step.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{step.token}</code>
                <span className="tc-doc-scale__value">{step.size}</span>
                <span className="tc-doc-scale__usage">{step.usage}</span>
              </div>
              <p className="tc-doc-scale__sample" style={{ fontSize: `var(${step.token})` }}>
                Teal &amp; cuivre
              </p>
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Les trois familles">
        <ul className="tc-doc-scale">
          {FAMILIES.map((family) => (
            <li className="tc-doc-scale__row" key={family.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{family.token}</code>
                <span className="tc-doc-scale__usage">{family.note}</span>
              </div>
              <p
                className="tc-doc-scale__sample tc-doc-scale__sample--family"
                style={{ fontFamily: `var(${family.token})` }}
              >
                Portfolio &amp; travels — 0123456789
                <span className="tc-doc-scale__stack">{family.name}</span>
              </p>
            </li>
          ))}
        </ul>
      </Specimen>
    </PageBody>
  ),
};
