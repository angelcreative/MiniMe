import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Lang } from '../data/trivia';
import { detectLang, MESSAGES, type Messages } from './messages';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Messages;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() =>
    typeof window !== 'undefined' ? detectLang() : 'en'
  );

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem('minime_lang', next);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: MESSAGES[lang],
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
