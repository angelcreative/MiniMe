import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LAB_STAGES, TRIVIA_CARDS, shuffleTrivia } from '../data/trivia';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowRight } from '@phosphor-icons/react';
import { Button } from './Button';

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
      ? `Estamos creando el retrato de tu futur${gender === 'boy' ? 'o' : 'a'} ${childWord}. Suele tardar entre 20 y 45 segundos.`
      : `We're creating your future ${childWord}'s portrait. It usually takes 20 to 45 seconds.`;

  const elapsedLabel =
    elapsedSec < 60
      ? `0:${elapsedSec.toString().padStart(2, '0')}`
      : `${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full flex flex-col gap-4 enter" role="status" aria-live="polite">
      <div className="flex flex-col gap-2">
        <span
          className={`self-start inline-flex items-center rounded-full px-2 text-label font-medium ${
            mode === 'creator' ? 'bg-warning-bg text-warning-text' : 'bg-success-bg text-success-text'
          }`}
        >
          {mode === 'creator' ? t.creatorAccessBadge : t.paymentVerifiedBadge}
        </span>
        <h2 className="font-serif text-heading text-text">{stage.label[lang]}</h2>
        <p className="text-small text-muted max-w-prose">
          {waitUsually} {t.waitKeepOpen}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-1 w-full rounded-full bg-subtle overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-primary progress-indeterminate" />
        </div>
        <div className="flex justify-between text-small text-muted tabular-nums">
          <span>{t.waitCombining}</span>
          <span>
            {elapsedLabel} {t.waitElapsed}
          </span>
        </div>
      </div>

      <div className="rounded-inner bg-bg p-4 flex flex-col gap-4 min-h-[184px] justify-between">
        {card.kind === 'fact' ? (
          <div key={triviaIndex} className="flex flex-col gap-2 enter">
            <span className="text-label font-medium text-muted">{t.waitTrivia}</span>
            <h3 className="text-body font-semibold text-text">{card.title[lang]}</h3>
            <p className="text-small text-muted line-clamp-3">{card.body[lang]}</p>
          </div>
        ) : (
          <div key={triviaIndex} className="flex flex-col gap-2 enter">
            <span className="text-label font-medium text-muted">{t.waitQuiz}</span>
            <p className="text-body font-semibold text-text">{card.question[lang]}</p>
            {quizGuess === null ? (
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setQuizGuess(true)}>
                  {t.waitTrue}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setQuizGuess(false)}>
                  {t.waitFalse}
                </Button>
              </div>
            ) : (
              <p
                className={`rounded-inner px-4 py-2 text-small ${
                  quizGuess === card.answer
                    ? 'bg-success-bg text-success-text'
                    : 'bg-warning-bg text-warning-text'
                }`}
              >
                <span className="font-semibold">
                  {quizGuess === card.answer ? t.waitNice : t.waitAlmost}{' '}
                </span>
                {card.reveal[lang]}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-small text-muted tabular-nums">
            {(triviaIndex % deck.length) + 1} / {deck.length}
          </span>
          <Button variant="ghost" size="sm" onClick={goNext}>
            {quizGuess !== null || card.kind === 'fact' ? t.waitNext : t.waitSkip}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
