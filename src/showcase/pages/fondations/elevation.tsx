import { Card } from '../../../components/card';
import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

const ELEVATIONS: readonly { level: 0 | 1 | 2 | 3; token: string; usage: string }[] = [
  { level: 0, token: '--elevation-0', usage: 'au sol — la carte ne se détache que par son liseré' },
  { level: 1, token: '--elevation-1', usage: 'posé — liste de cartes, vignette' },
  { level: 2, token: '--elevation-2', usage: 'soulevé — panneau flottant, menu' },
  { level: 3, token: '--elevation-3', usage: 'détaché — modale, calque' },
];

export const elevationPage: DocPage = {
  slug: 'elevation',
  label: 'Élévation',
  group: 'fondations',
  title: 'Élévation',
  lede: (
    <>
      Quatre crans, et une inversion de polarité qu’il faut connaître :{' '}
      <strong>en clair, c’est l’ombre qui sépare</strong> la carte du sol (ΔE 20,6 ; un liseré blanc
      y plafonne à ΔE 4,0), <strong>en sombre, c’est le liseré</strong> — une ombre composée y
      mesure ΔE 2,2, sous le seuil de perceptibilité. Une échelle d’ombres seule ne suffit jamais :
      les deux sont toujours posés ensemble.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen title="Les quatre crans" note="Basculez le thème pour voir la polarité s’inverser.">
        <div className="tc-doc-grid tc-doc-grid--elev">
          {ELEVATIONS.map((elevation) => (
            <Card elevation={elevation.level} key={elevation.token}>
              {/* `<h3>` et non `<h4>` : le titre du spécimen est un `<h2>`
                  depuis que la coquille rend le `<h1>` de la page. */}
              <h3 className="tc-doc-cardtitle">Cran {elevation.level}</h3>
              <p className="tc-doc-cardmeta">
                <code className="tc-doc-scale__token">{elevation.token}</code>
              </p>
              <p className="tc-doc-cardtext">{elevation.usage}</p>
            </Card>
          ))}
        </div>
      </Specimen>
    </PageBody>
  ),
};
