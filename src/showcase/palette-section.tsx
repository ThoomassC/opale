import type { Plate } from './palette-data';
import { PLATES, SEMANTIC_ROWS } from './palette-data';
import { Section } from './section';

/**
 * Une plaque de palette. Fond, encre et filet sont posés en **style en
 * ligne** avec des hexadécimaux littéraux : la plaque documente un thème, elle
 * ne doit pas suivre celui du lecteur. C'est la seule dérogation à la règle
 * « aucune couleur littérale » de la charte, et elle est délibérée — ce sont
 * des mesures, pas de la mise en forme.
 */
function PalettePlate({ plate }: { plate: Plate }) {
  return (
    <article
      className="tc-doc-plate"
      style={{ background: plate.ground, color: plate.ink, borderColor: plate.rule }}
      aria-labelledby={`${plate.id}-title`}
    >
      <header className="tc-doc-plate__head" style={{ borderColor: plate.rule }}>
        <h3 className="tc-doc-plate__title" id={`${plate.id}-title`}>
          {plate.title}
        </h3>
        <p className="tc-doc-plate__ground" style={{ color: plate.inkMuted }}>
          {plate.groundLabel}
        </p>
      </header>

      {plate.groups.map((group) => (
        <section className="tc-doc-plate__group" key={group.title}>
          <h4 className="tc-doc-plate__grouptitle" style={{ borderColor: plate.rule }}>
            {group.title}
          </h4>
          <p className="tc-doc-plate__groupnote" style={{ color: plate.inkMuted }}>
            {group.note}
          </p>
          <ul className="tc-doc-swatches">
            {group.swatches.map((swatch) => (
              <li className="tc-doc-swatch" key={swatch.token + swatch.hex}>
                {/* Un lavis est peint par sa COMPOSITION et non par sa valeur
                    déclarée : posé tel quel, il se composerait sur le sol de
                    la plaque alors que son support réel est ailleurs — la
                    carte, le plus souvent. La valeur déclarée reste affichée en
                    texte, elle, parce que c'est elle que la feuille porte. */}
                <span
                  className="tc-doc-swatch__chip"
                  style={{
                    background: swatch.wash?.composite ?? swatch.hex,
                    borderColor: plate.rule,
                  }}
                  aria-hidden="true"
                />
                <span className="tc-doc-swatch__meta">
                  <code className="tc-doc-swatch__token">{swatch.token}</code>
                  <span className="tc-doc-swatch__hex">
                    {swatch.hex}
                    {swatch.wash ? (
                      <span className="tc-doc-swatch__against">
                        {' '}
                        → {swatch.wash.composite} sur {swatch.wash.over.join(' + ')}
                      </span>
                    ) : null}
                  </span>
                  <span className="tc-doc-swatch__ratio" style={{ color: plate.inkMuted }}>
                    {swatch.ratio ? `${swatch.ratio} ` : null}
                    <span className="tc-doc-swatch__against">{swatch.against}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

export function PaletteSection() {
  return (
    <Section
      id="palette"
      index="02"
      title="La palette"
      lede={
        <>
          Deux thèmes, une seule matière. Les deux plaques ci-dessous sont rendues avec leurs
          hexadécimaux littéraux : elles ne suivent pas le thème que vous avez choisi pour cette
          page, parce qu’elles documentent les deux. Les jetons translucides — lavis d’état,
          remplissage de verre, arrêts de tuile — affichent leur valeur déclarée en{' '}
          <code>rgba()</code> suivie de l’aplat qu’ils donnent sur leur support : c’est cet aplat
          que la pastille peint, parce qu’un lavis n’a pas de couleur à lui.
        </>
      }
    >
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
          <h3 className="tc-doc-plate__title" id="plate-semantic-title">
            Les trois encres sémantiques
          </h3>
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
            sur Safari — quatre colonnes sur sept y étaient perdues.

            La règle jsx-a11y ci-dessous est un faux positif documenté : sa
            liste blanche `roles` ne connaît que `tabpanel`, alors que WCAG
            2.1.1 impose bien de rendre focusable une zone défilante. Ajouter
            `group` à l'option `roles` dans eslint.config.js — que je ne
            possède pas — serait la correction propre. */}
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
    </Section>
  );
}
