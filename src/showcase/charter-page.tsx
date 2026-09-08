import { AccessibilitySection } from './a11y-section';
import { ComponentsSection } from './components-section';
import { PaletteSection } from './palette-section';
import { PortfolioSection } from './portfolio-section';
import { ElevationSection, SpacingSection, TypographySection } from './scales-section';
import { ThemeToggle } from './theme-toggle';

const TOC: readonly { href: string; index: string; label: string }[] = [
  { href: '#palette', index: '02', label: 'La palette' },
  { href: '#typographie', index: '03', label: 'Typographie' },
  { href: '#espacement', index: '04', label: 'Espacement et rayons' },
  { href: '#elevation', index: '05', label: 'Élévation' },
  { href: '#composants', index: '06', label: 'Les composants' },
  { href: '#accessibilite', index: '07', label: 'Accessibilité' },
  { href: '#portfolio', index: '08', label: 'Portés du portfolio' },
];

/**
 * La charte graphique de `@thomascaron/ui`.
 *
 * Le document est une instance de lui-même : il n'utilise que ses propres
 * jetons et ses propres composants, et il est rendu dans la palette qu'il
 * documente. Si une règle est fausse, la page se dégrade avec elle.
 */
export function CharterPage() {
  return (
    <div className="tc-doc">
      <a className="tc-doc-skip" href="#contenu">
        Aller au contenu
      </a>

      <header className="tc-doc-masthead">
        <div className="tc-doc-shell">
          <p className="tc-doc-eyebrow">
            <span aria-hidden="true">◆</span> @thomascaron/ui —{' '}
            <span className="tc-doc-mono">v0</span>
          </p>
          <h1 className="tc-doc-title">Charte graphique</h1>
          <p className="tc-doc-prose tc-doc-lede">
            Le socle commun de <strong>portfolio</strong> et de <strong>travels_in_world</strong> :
            une palette teal et cuivre, huit pas d’espacement, huit pas typographiques et un jeu de
            composants sans état — dont sept viennent d’arriver avec le verre liquide du portfolio.
            Les deux sites en partageaient déjà l’intention — et six jetons avaient discrètement
            divergé. Cette librairie est ce qui les tient désormais ensemble, et cette page en est
            le contrat lisible.
          </p>
          <p className="tc-doc-prose tc-doc-lede tc-doc-lede--quiet">
            Rien ici n’est illustratif : chaque couleur, chaque taille et chaque état provient de la
            feuille de jetons réelle. La page est rendue dans la palette qu’elle documente.
          </p>

          <ThemeToggle />

          <nav className="tc-doc-toc" aria-label="Sommaire">
            <ol className="tc-doc-toc__list">
              {TOC.map((entry) => (
                <li key={entry.href}>
                  <a className="tc-doc-toc__link" href={entry.href}>
                    <span className="tc-doc-toc__index" aria-hidden="true">
                      {entry.index}
                    </span>
                    {entry.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      {/* `tabIndex={-1}` : sans lui, le lien d'évitement déplace le défilement
          mais pas le focus. Sur Safari la tabulation suivante repart du
          sommaire, soit exactement les dix arrêts qu'on voulait sauter. */}
      <main className="tc-doc-shell tc-doc-main" id="contenu" tabIndex={-1}>
        <PaletteSection />
        <TypographySection />
        <SpacingSection />
        <ElevationSection />
        <ComponentsSection />
        <AccessibilitySection />
        {/* En dernier, et numérotée 08, parce que les sept sections
            précédentes portent leur propre numéro en dur : intercaler celle-ci
            entre « composants » et « accessibilité » aurait demandé de
            renuméroter une section que je ne possède pas. */}
        <PortfolioSection />
      </main>

      <footer className="tc-doc-footer">
        <div className="tc-doc-shell">
          <p className="tc-doc-prose">
            Les ratios affichés sont recalculés en intégration continue à partir de la feuille de
            jetons par <code>src/contract/</code>. Un chiffre faux fait échouer la suite : ce ne
            sont pas des annotations.
          </p>
        </div>
      </footer>
    </div>
  );
}
