import type { DocPage } from '../../doc-model';
import { PLATES, SEMANTIC_ROWS } from '../../palette-data';
import { PageBody } from '../api';
import { PalettePlate } from './palette-plate';

export const palettePage: DocPage = {
  slug: 'palette',
  label: 'La palette',
  group: 'fondations',
  title: 'La palette',
  lede: (
    <>
      Deux thèmes, une seule matière. Les deux plaques ci-dessous sont rendues avec leurs
      hexadécimaux littéraux : elles ne suivent pas le thème que vous avez choisi pour cette page,
      parce qu’elles documentent les deux. Les jetons translucides — lavis d’état, remplissage de
      verre, arrêts de tuile — affichent leur valeur déclarée en <code>rgba()</code> suivie de
      l’aplat qu’ils donnent sur leur support : c’est cet aplat que la pastille peint, parce qu’un
      lavis n’a pas de couleur à lui.
    </>
  ),
  render: () => (
    <PageBody>
      <ul className="tc-doc-laws">
        <li className="tc-doc-laws__item tc-doc-laws__item--teal">
          <strong>Le teal est l’encre des actions.</strong> Boutons, liens, focus, pastilles, états
          : s’il apparaît, quelque chose est actionnable ou vient de changer.
        </li>
        <li className="tc-doc-laws__item tc-doc-laws__item--copper">
          <strong>Le cuivre est le décor et l’éditorial</strong>, et il ne porte jamais un contrôle
          — une couleur chaude sur un bouton rompt le contrat.
        </li>
        <li className="tc-doc-laws__item tc-doc-laws__item--neutral">
          <strong>Les neutres sont le teal vidé de sa chroma</strong> : la même teinte, la
          saturation retirée, pour qu’aucun gris ne jure avec la marque.
        </li>
      </ul>

      <div className="tc-doc-plates">
        {PLATES.map((plate) => (
          <PalettePlate plate={plate} key={plate.id} />
        ))}
      </div>

      <article className="tc-doc-plate tc-doc-plate--themed">
        <header className="tc-doc-plate__head">
          <h2 className="tc-doc-plate__title" id="plate-semantic-title">
            Les trois encres sémantiques
          </h2>
          <p className="tc-doc-plate__ground">
            mesurées deux fois : sur le sol de la page et sur la carte
          </p>
        </header>
        <p className="tc-doc-plate__groupnote">
          Elles ne signifient jamais seules. Chaque emploi porte un mot et un glyphe ; la couleur
          n’est que le troisième signal.
        </p>

        {/* `tabIndex` + `role="group"` : le tableau porte une largeur plancher
            de 704 px, donc il défile horizontalement dès 320 px. Une zone qui
            défile et que rien ne rend focusable est inatteignable au clavier
            sur Safari — quatre colonnes sur sept y étaient perdues. La liste
            blanche par défaut de la règle `jsx-a11y/no-noninteractive-tabindex`
            ne connaît que `tabpanel` ; `eslint.config.js` y a depuis ajouté
            `group`, qui est le rôle correct pour une telle zone. */}
        <div
          className="tc-doc-tablewrap"
          tabIndex={0}
          role="group"
          aria-label="Tableau des encres sémantiques, défilement horizontal"
        >
          <table className="tc-doc-table" aria-labelledby="plate-semantic-title">
            <thead>
              <tr>
                <th scope="col">Aperçu</th>
                <th scope="col">Thème</th>
                <th scope="col">Jeton</th>
                <th scope="col">Hex</th>
                <th scope="col">Sur le sol</th>
                <th scope="col">Sur la carte</th>
                <th scope="col">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {SEMANTIC_ROWS.map((row) => (
                <tr key={`${row.theme}${row.token}`}>
                  <td>
                    <span
                      className="tc-doc-inkchip"
                      style={{
                        background: row.plateGround,
                        color: row.hex,
                        borderColor: row.plateInk,
                      }}
                    >
                      <span aria-hidden="true">{row.glyph}</span>
                      <span aria-hidden="true">Aa</span>
                    </span>
                  </td>
                  <td>{row.theme}</td>
                  <th scope="row">
                    <code>{row.token}</code>
                  </th>
                  <td>
                    <span className="tc-doc-mono">{row.hex}</span>
                  </td>
                  <td>
                    <span className="tc-doc-mono">{row.onGround}</span>
                  </td>
                  <td>
                    <span className="tc-doc-mono">{row.onCard}</span>
                  </td>
                  <td>{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </PageBody>
  ),
};
