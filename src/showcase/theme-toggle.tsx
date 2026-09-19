import { useTheme } from './use-theme';

/**
 * Contrôle de thème global de la vitrine. Il ne bascule que le fond clair ou
 * sombre ; le matériau Liquid Glass appartient aux pages de composants.
 */
export function ThemeToggle({ label = 'Thème sombre' }: { readonly label?: string }) {
  const { isDarkTheme, toggleTheme } = useTheme();

  return (
    <button
      className="tc-doc-themetoggle"
      type="button"
      aria-pressed={isDarkTheme}
      onClick={toggleTheme}
    >
      <span
        className={`tc-doc-themetoggle__glyph ${isDarkTheme ? 'tc-doc-themetoggle__glyph--sun' : 'tc-doc-themetoggle__glyph--moon'}`}
        aria-hidden="true"
      >
        {isDarkTheme ? '☀' : '☾'}
      </span>
      <span className="tc-visually-hidden">{label}</span>
    </button>
  );
}
