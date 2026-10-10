import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

type DemoTab = 'boy' | 'girl';

/**
 * Static marketing demo — example couple + predicted offspring (boy/girl tabs).
 * Images live in /public/demo/ (replace with your own assets anytime).
 */
export const DemoExample: React.FC = () => {
  const [tab, setTab] = useState<DemoTab>('girl');
  const { t } = useLanguage();

  return (
    <section className="mt-16 md:mt-24 w-full max-w-7xl mx-auto px-1">
      <div className="text-center space-y-3 mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          {t.demoTitle}
        </h2>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t.demoSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
        <figure className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
            <img
              src="/demo/father.jpg"
              alt={t.demoFatherCaption}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {t.demoFather}
            </span>
          </div>
          <figcaption className="px-1">
            <p className="text-sm font-bold text-slate-700">{t.demoFatherCaption}</p>
          </figcaption>
        </figure>

        <figure className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
            <img
              src="/demo/mother.jpg"
              alt={t.demoMotherCaption}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {t.demoMother}
            </span>
          </div>
          <figcaption className="px-1">
            <p className="text-sm font-bold text-slate-700">{t.demoMotherCaption}</p>
          </figcaption>
        </figure>

        <div className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-md border border-indigo-100">
            <img
              src={tab === 'girl' ? '/demo/child-girl.jpg' : '/demo/child-boy.jpg'}
              alt={t.demoPredicted}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {t.demoPredicted}
            </span>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-full w-fit mx-auto md:mx-0">
            <button
              type="button"
              onClick={() => setTab('boy')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                tab === 'boy'
                  ? 'bg-white text-sky-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>👦</span> {t.boy}
            </button>
            <button
              type="button"
              onClick={() => setTab('girl')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                tab === 'girl'
                  ? 'bg-white text-pink-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>👧</span> {t.girl}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-8 max-w-lg mx-auto">
        {t.demoDisclaimer}
      </p>
    </section>
  );
};
