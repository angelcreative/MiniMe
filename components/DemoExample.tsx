import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Segmented } from './Segmented';

type DemoTab = 'boy' | 'girl';

const Tile: React.FC<{
  src: string;
  caption: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ src, caption, className = '', children }) => (
  <figure className={`m-0 flex flex-col gap-2 p-4 rounded-container bg-surface shadow-sm ${className}`}>
    <div className="aspect-square rounded-inner overflow-hidden bg-subtle">
      <img src={src} alt={caption} className="w-full h-full object-cover" loading="lazy" />
    </div>
    <figcaption className="flex flex-wrap items-center justify-between gap-2 pt-2 min-h-control">
      <span className="text-label font-medium text-text truncate">{caption}</span>
      {children}
    </figcaption>
  </figure>
);

/**
 * Static marketing demo — example couple + predicted offspring (boy/girl tabs).
 * Images live in /public/demo/ (replace with your own assets anytime).
 */
export const DemoExample: React.FC = () => {
  const [tab, setTab] = useState<DemoTab>('girl');
  const { t } = useLanguage();

  return (
    <section className="flex flex-col gap-8" aria-labelledby="demo-title">
      <div className="flex flex-col gap-2">
        <h2 id="demo-title" className="font-serif text-heading text-text max-w-headline">
          {t.demoTitle}
        </h2>
        <p className="text-body text-muted max-w-prose">{t.demoSubtitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <Tile src="/demo/father.jpg" caption={t.demoFather} />
        <Tile src="/demo/mother.jpg" caption={t.demoMother} />
        <Tile
          src={tab === 'girl' ? '/demo/child-girl.jpg' : '/demo/child-boy.jpg'}
          caption={t.demoPredicted}
          className="col-span-2 sm:col-span-1"
        >
          <Segmented<DemoTab>
            size="sm"
            label={t.selectGender}
            value={tab}
            onChange={setTab}
            options={[
              { id: 'girl', label: t.girl },
              { id: 'boy', label: t.boy },
            ]}
          />
        </Tile>
      </div>

      <p className="text-small text-muted max-w-prose">{t.demoDisclaimer}</p>
    </section>
  );
};
