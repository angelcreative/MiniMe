import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LAB_STAGES, TRIVIA_CARDS, shuffleTrivia } from '../data/trivia';
import { useLanguage } from '../i18n/LanguageContext';

type WaitMode = 'paid' | 'creator';

interface GenerationWaitExperienceProps {
  mode: WaitMode;
  gender: 'boy' | 'girl';
}

/** Auto-advance is slow on purpose — users can Skip/Next anytime. */
const AUTO_FACT_MS = 22000;
const AUTO_QUIZ_IDLE_MS = 28000;
const AUTO_QUIZ_ANSWERED_MS = 9000;
const STAGE_MS = 7000;

export const GenerationWaitExperience: React.FC<GenerationWaitExperienceProps> = ({
  mode,
  gender,
}) => {
  const { lang, t } = useLanguage();
  const deck = useMemo(() => shuffleTrivia(TRIVIA_CARDS), []);
  const [stageIndex, setStageIndex] = useState(0);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [quizGuess, setQuizGuess] = useState<boolean | null>(null);

  const card = deck[triviaIndex % deck.length];
  const stage = LAB_STAGES[Math.min(stageIndex, LAB_STAGES.length - 1)];

  const goNext = useCallback(() => {
    setQuizGuess(null);
    setTriviaIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    const stageTimer = window.setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, LAB_STAGES.length - 1));
    }, STAGE_MS);
    const clock = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    setQuizGuess(null);
  }, [triviaIndex]);

  useEffect(() => {
    const answered = quizGuess !== null;
    const advanceMs =
      card.kind === 'quiz' && !answered
        ? AUTO_QUIZ_IDLE_MS
        : answered
          ? AUTO_QUIZ_ANSWERED_MS
          : AUTO_FACT_MS;
    const timer = window.setTimeout(goNext, advanceMs);
    return () => window.clearTimeout(timer);
  }, [triviaIndex, quizGuess, card.kind, goNext]);

  const childWord =
    lang === 'es'
      ? gender === 'boy'
        ? 'hijo'
        : 'hija'
      : gender === 'boy'
        ? 'son'
        : 'daughter';

  const waitUsually =
    lang === 'es'
      ? `Pintando la cara de tu futur${gender === 'boy' ? 'o' : 'a'} ${childWord} — suele tardar 20–45 segundos.`
      : `Painting your future ${childWord}'s face — usually 20–45 seconds.`;

  const elapsedLabel =
    elapsedSec < 60
      ? `0:${elapsedSec.toString().padStart(2, '0')}`
      : `${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full max-w-[380px] mx-auto space-y-5 animate-fade-in px-1">
      <div className="text-center space-y-3">
        <div
          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            mode === 'creator'
              ? 'bg-amber-50 text-amber-700 border-amber-100'
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}
        >
          {mode === 'creator'
            ? lang === 'es'
              ? 'Acceso creador'
              : 'Creator Access'
            : lang === 'es'
              ? 'Pago verificado'
              : 'Payment Verified'}
        </div>

        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-indigo-100/80 dna-pulse" />
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-sm border border-indigo-50">
            <span className="text-4xl select-none" aria-hidden>
              {stage.emoji}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-slate-800 leading-snug">
            {stage.label[lang]}
          </h3>
          <p className="text-slate-400 text-xs">
            {waitUsually} {t.waitKeepOpen}
          </p>
          <p className="text-[11px] font-semibold text-slate-300 tabular-nums">
            {elapsedLabel} {t.waitElapsed}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 min-h-[168px] flex flex-col justify-between gap-3">
        {card.kind === 'fact' ? (
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {card.emoji}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                {t.waitTrivia}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-800">{card.title[lang]}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{card.body[lang]}</p>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {card.emoji}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                {t.waitQuiz}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 leading-snug">{card.question[lang]}</p>
            {quizGuess === null ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuizGuess(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  {t.waitTrue}
                </button>
                <button
                  type="button"
                  onClick={() => setQuizGuess(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                >
                  {t.waitFalse}
                </button>
              </div>
            ) : (
              <div
                className={`rounded-xl px-3 py-2 text-xs leading-relaxed border ${
                  quizGuess === card.answer
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}
              >
                <span className="font-bold">
                  {quizGuess === card.answer ? t.waitNice : t.waitAlmost}{' '}
                </span>
                {card.reveal[lang]}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[10px] font-semibold text-slate-300 tabular-nums">
            {(triviaIndex % deck.length) + 1}/{deck.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {quizGuess !== null || card.kind === 'fact' ? t.waitNext : t.waitSkip} →
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-100">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-pink-400 indeterminate-bar" />
        </div>
        <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          {t.waitCombining}
        </p>
      </div>

      <style>{`
        @keyframes dnaPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .dna-pulse {
          animation: dnaPulse 2.2s ease-in-out infinite;
        }
        @keyframes indeterminateSlide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        .indeterminate-bar {
          animation: indeterminateSlide 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
