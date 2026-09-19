import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { PrivacyPolicyEnglish, PrivacyPolicySpanish } from '../components/PrivacyPolicy';

const LANGUAGES = [
  { lang: 'en', label: 'English' },
  { lang: 'es', label: 'Español' },
] as const;

type Language = (typeof LANGUAGES)[number]['lang'];

const PrivacyPage = () => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-section-lg">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[12px] uppercase tracking-eyebrow text-faint">Legal</p>
          <div role="group" aria-label="Language" className="flex border border-line">
            {LANGUAGES.map((option, index) => (
              <button
                key={option.lang}
                type="button"
                lang={option.lang}
                onClick={() => setLanguage(option.lang)}
                aria-pressed={language === option.lang}
                className={`cursor-pointer px-3 py-1.5 text-[12px] tracking-nav transition-colors duration-200 ${
                  index > 0 ? 'border-l border-line' : ''
                } ${
                  language === option.lang
                    ? 'bg-accent text-on-accent'
                    : 'text-muted hover:text-accent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {language === 'en' ? <PrivacyPolicyEnglish /> : <PrivacyPolicySpanish />}
      </section>
    </PageShell>
  );
};

export default PrivacyPage;
