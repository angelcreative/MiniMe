import React, { useState } from 'react';

type DemoTab = 'boy' | 'girl';

const TRAITS: Record<DemoTab, string> = {
  girl:
    "Inherits the mother's signature voluminous curls, along with the father's nose shape, full lips, and deep focused gaze.",
  boy:
    "Inherits the father's warm gaze and nose shape, with the mother's expressive eyes and soft facial structure.",
};

/**
 * Static marketing demo — example couple + predicted offspring (boy/girl tabs).
 * Images live in /public/demo/ (replace with your own assets anytime).
 */
export const DemoExample: React.FC = () => {
  const [tab, setTab] = useState<DemoTab>('girl');

  return (
    <section className="mt-16 md:mt-24 w-full max-w-7xl mx-auto px-1">
      <div className="text-center space-y-3 mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          Expected Result Example
        </h2>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          See how our AI analyzes and combines key facial traits from both parents to predict an
          adorable look of their child at 5 years of age.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
        {/* Father */}
        <figure className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
            <img
              src="/demo/father.jpg"
              alt="Example father portrait"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Father
            </span>
          </div>
          <figcaption className="px-1">
            <p className="text-sm font-bold text-slate-700">Father&apos;s Photo</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Mediterranean features, defined beard, and warm gaze
            </p>
          </figcaption>
        </figure>

        {/* Mother */}
        <figure className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
            <img
              src="/demo/mother.jpg"
              alt="Example mother portrait"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Mother
            </span>
          </div>
          <figcaption className="px-1">
            <p className="text-sm font-bold text-slate-700">Mother&apos;s Photo</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Voluminous curly hair, joyful smile, and expressive eyes
            </p>
          </figcaption>
        </figure>

        {/* Predicted child */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-md border border-indigo-100">
            <img
              src={tab === 'girl' ? '/demo/child-girl.jpg' : '/demo/child-boy.jpg'}
              alt={`Example predicted ${tab} child`}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
              Predicted · Age 5
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
              <span>👦</span> Boy
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
              <span>👧</span> Girl
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed px-1">
            <span className="font-bold text-slate-600">Inherited traits: </span>
            {TRAITS[tab]}
          </p>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-8 max-w-lg mx-auto">
        Example only — an artistic illustration of what the tool can produce, not a scientific
        prediction.
      </p>
    </section>
  );
};
