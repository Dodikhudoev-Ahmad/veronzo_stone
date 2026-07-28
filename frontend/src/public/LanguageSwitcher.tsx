import { SUPPORTED_LANGUAGES, type LanguageCode } from './useLanguage';

const LABELS: Record<LanguageCode, string> = { ru: 'RU', tg: 'TG', en: 'EN', zh: 'ZH' };

interface LanguageSwitcherProps {
  language: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}

export function LanguageSwitcher({ language, onChange }: LanguageSwitcherProps) {
  return (
    <div className="lang-switcher" role="group" aria-label="Выбор языка">
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className={code === language ? 'lang-switcher-btn is-active' : 'lang-switcher-btn'}
          aria-pressed={code === language}
          onClick={() => onChange(code)}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
