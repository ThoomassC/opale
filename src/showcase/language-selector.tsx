import { CanopLanguageSelector } from '../magic';
import { isLanguage, type Language } from './localization';

export interface LanguageSelectorProps {
  readonly language: Language;
  readonly label: string;
  readonly onChange: (language: Language) => void;
}

export function LanguageSelector({ language, label, onChange }: LanguageSelectorProps) {
  return (
    <CanopLanguageSelector
      className="tc-doc-language"
      value={language}
      ariaLabel={label}
      onChange={(event) => {
        if (isLanguage(event.currentTarget.value)) onChange(event.currentTarget.value);
      }}
    />
  );
}
