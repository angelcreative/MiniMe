import React, { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const COLUMNS = 13;
const STEP_MS = 2400;

/**
 * Overlay shown on the example child once both parent photos are in:
 * a minimal double helix plus short steps that settle on "samples ready".
 */
export const HereditySamples: React.FC = () => {
  const { t } = useLanguage();
  const steps = [t.samplesReading, t.samplesPairing, t.samplesReady];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length - 1) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [step, steps.length]);

  const done = step === steps.length - 1;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 enter"
      style={{ background: 'color-mix(in srgb, var(--surface) 64%, transparent)' }}
    >
      <div className="helix" aria-hidden>
        {Array.from({ length: COLUMNS }, (_, i) => (
          <span key={i} className="helix-col" style={{ animationDelay: `${i * -120}ms` }}>
            <span className="helix-rung" style={{ animationDelay: `${i * -120}ms` }} />
            <span className="helix-dot helix-a" style={{ animationDelay: `${i * -120}ms` }} />
            <span className="helix-dot helix-b" style={{ animationDelay: `${i * -120}ms` }} />
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 text-center" role="status" aria-live="polite">
        <p key={step} className="text-label font-medium text-text enter">
          {steps[step]}
        </p>
        <div className="flex gap-2" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ctl ${i <= step ? 'bg-primary' : 'bg-subtle'}`}
            />
          ))}
        </div>
        {done && <p className="text-small text-muted enter">{t.samplesHint}</p>}
      </div>

      <style>{`
        .helix { display: flex; gap: 8px; height: 64px; align-items: center; }
        .helix-col { position: relative; width: 8px; height: 64px; }
        .helix-dot {
          position: absolute; left: 0; top: 28px; width: 8px; height: 8px;
          border-radius: 9999px; background: var(--primary);
          animation: helixA 2000ms ease-in-out infinite;
        }
        .helix-b { animation-name: helixB; opacity: 0.45; }
        .helix-rung {
          position: absolute; left: 3px; top: 8px; width: 2px; height: 48px;
          background: var(--control-border); opacity: 0.5;
          animation: helixRung 2000ms ease-in-out infinite;
        }
        @keyframes helixA {
          0%, 100% { transform: translateY(-24px) scale(1); }
          50% { transform: translateY(24px) scale(0.7); }
        }
        @keyframes helixB {
          0%, 100% { transform: translateY(24px) scale(0.7); }
          50% { transform: translateY(-24px) scale(1); }
        }
        @keyframes helixRung {
          0%, 50%, 100% { transform: scaleY(1); }
          25%, 75% { transform: scaleY(0.05); }
        }
      `}</style>
    </div>
  );
};
