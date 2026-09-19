const LANGUAGES = [
  { lang: 'en', label: 'English' },
  { lang: 'es', label: 'Español' },
] as const;

export type Language = (typeof LANGUAGES)[number]['lang'];

export const LanguageToggle = ({
  value,
  onChange,
}: {
  value: Language;
  onChange: (language: Language) => void;
}) => (
  <div role="group" aria-label="Language" className="relative grid grid-cols-2 border border-line">
    <span
      aria-hidden="true"
      className={`absolute inset-y-0 left-0 w-1/2 bg-accent transition-transform duration-300 ease-reflow motion-reduce:transition-none ${
        value === 'es' ? 'translate-x-full' : ''
      }`}
    />
    {LANGUAGES.map((option) => (
      <button
        key={option.lang}
        type="button"
        lang={option.lang}
        onClick={() => onChange(option.lang)}
        aria-pressed={value === option.lang}
        className={`relative cursor-pointer px-3 py-1.5 text-[12px] tracking-nav transition-colors duration-300 ease-reflow ${
          value === option.lang ? 'text-on-accent' : 'text-muted hover:text-accent'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);
