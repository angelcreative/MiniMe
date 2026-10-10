import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../data/trivia';

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  const options: { id: Lang; label: string }[] = [
    { id: 'es', label: 'ES' },
    { id: 'en', label: 'EN' },
  ];

  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label={t.langLabel}
    >
      <div className="flex bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLang(opt.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
              lang === opt.id
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
