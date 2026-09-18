import { useTheme, type Theme } from './use-theme';

/**
 * Contrôle de thème de la vitrine. Le bouton conserve la bascule rapide
 * clair/sombre et le sélecteur expose le troisième état `liquid-glass`.
 * L'état vit dans la vitrine : la librairie publiée reste sans hook global.
 */
export function ThemeToggle() {
  const { theme, isDarkTheme, toggleTheme, setTheme } = useTheme();

  return (
    <div className="tc-doc-theme-control">
      <button
        className="tc-doc-themetoggle"
        type="button"
        aria-pressed={isDarkTheme}
        onClick={toggleTheme}
      >
        <span className="tc-doc-themetoggle__glyph" aria-hidden="true">
          {theme === 'liquid-glass' ? '◌' : isDarkTheme ? '☀' : '☾'}
        </span>
        <span className="tc-visually-hidden">Thème sombre</span>
      </button>
      <label className="tc-doc-theme-select">
        <span className="tc-visually-hidden">Choisir un thème</span>
        <select
          aria-label="Choisir un thème"
          value={theme}
          onChange={(event) => setTheme(event.currentTarget.value as Theme)}
        >
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
          <option value="liquid-glass">Liquid Glass</option>
        </select>
      </label>
    </div>
  );
}
