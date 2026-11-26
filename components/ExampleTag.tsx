import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/** Marks placeholder imagery so it never reads as the viewer's own photo. */
export const ExampleTag: React.FC = () => {
  const { t } = useLanguage();
  return (
    <span className="absolute top-2 left-2 rounded-full bg-surface text-muted text-label font-medium px-2 shadow-sm">
      {t.exampleTag}
    </span>
  );
};
