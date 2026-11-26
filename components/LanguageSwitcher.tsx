import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../data/trivia';
import { Segmented } from './Segmented';

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  return (
    <Segmented<Lang>
      size="sm"
      label={t.langLabel}
      value={lang}
      onChange={setLang}
      options={[
        { id: 'en', label: 'EN' },
        { id: 'es', label: 'ES' },
      ]}
    />
  );
};
