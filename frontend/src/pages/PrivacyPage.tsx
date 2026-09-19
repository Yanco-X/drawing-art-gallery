import { useState } from 'react';
import { LanguageToggle } from '../components/LanguageToggle';
import type { Language } from '../components/LanguageToggle';
import { PageShell } from '../components/PageShell';
import { PrivacyPolicyEnglish, PrivacyPolicySpanish } from '../components/PrivacyPolicy';

const PrivacyPage = () => {
  const [language, setLanguage] = useState<Language>('en');

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-section-lg">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[12px] uppercase tracking-eyebrow text-faint">Legal</p>
          <LanguageToggle value={language} onChange={setLanguage} />
        </div>

        <div key={language} className="arrives">
          {language === 'en' ? <PrivacyPolicyEnglish /> : <PrivacyPolicySpanish />}
        </div>
      </section>
    </PageShell>
  );
};

export default PrivacyPage;
