import React, { useEffect, useMemo, useState } from 'react';

type WaitMode = 'paid' | 'creator';

type TriviaCard =
  | { kind: 'fact'; emoji: string; title: string; body: string }
  | {
      kind: 'quiz';
      emoji: string;
      question: string;
      answer: boolean;
      reveal: string;
    };

const LAB_STAGES = [
  { label: 'Unzipping DNA helixes', emoji: '🧬' },
  { label: 'Mixing allele pairs', emoji: '🔀' },
  { label: 'Reading eye-color genes', emoji: '👀' },
  { label: 'Blending cheekbone geometry', emoji: '✨' },
  { label: 'Sampling smile curves', emoji: '😊' },
  { label: 'Tuning hair & freckle odds', emoji: '💫' },
  { label: 'Rendering your MiniMe', emoji: '🖼️' },
];

const TRIVIA: TriviaCard[] = [
  {
    kind: 'fact',
    emoji: '👀',
    title: 'Eye color is a team sport',
    body: 'More than a dozen genes influence iris color — it’s rarely a single “blue vs brown” switch.',
  },
  {
    kind: 'quiz',
    emoji: '🧬',
    question: 'True or false: babies always get 50% DNA from each parent.',
    answer: true,
    reveal: 'True — half from mom, half from dad… but which half is a random shuffle every time.',
  },
  {
    kind: 'fact',
    emoji: '👃',
    title: 'Noses take after both sides',
    body: 'Bridge height, tip shape, and width can each pull traits from different grandparents.',
  },
  {
    kind: 'quiz',
    emoji: '👧',
    question: 'True or false: the “baby look” fades because skull proportions change fast.',
    answer: true,
    reveal: 'True — big eyes and round cheeks shift as the face grows into adult proportions.',
  },
  {
    kind: 'fact',
    emoji: '🦷',
    title: 'Dimples are mostly genetic',
    body: 'Cheek dimples often run in families, though they can appear or soften with age.',
  },
  {
    kind: 'quiz',
    emoji: '👨‍👩‍👧',
    question: 'True or false: siblings can look totally different and still share ~50% DNA.',
    answer: true,
    reveal: 'True — each child gets a different random half, so resemblance varies a lot.',
  },
  {
    kind: 'fact',
    emoji: '🌈',
    title: 'Hair color can surprise you',
    body: 'Recessive blond or red alleles can hide for a generation, then show up in a grandchild.',
  },
  {
    kind: 'quiz',
    emoji: '👂',
    question: 'True or false: ear shape is partly heritable.',
    answer: true,
    reveal: 'True — lobe attachment and helix curves often echo a parent or grandparent.',
  },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface GenerationWaitExperienceProps {
  mode: WaitMode;
  gender: 'boy' | 'girl';
}

export const GenerationWaitExperience: React.FC<GenerationWaitExperienceProps> = ({
  mode,
  gender,
}) => {
  const deck = useMemo(() => shuffle(TRIVIA), []);
  const [stageIndex, setStageIndex] = useState(0);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [quizGuess, setQuizGuess] = useState<boolean | null>(null);

  const card = deck[triviaIndex % deck.length];
  const stage = LAB_STAGES[Math.min(stageIndex, LAB_STAGES.length - 1)];

  useEffect(() => {
    const stageTimer = window.setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, LAB_STAGES.length - 1));
    }, 4500);
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
      card.kind === 'quiz' && !answered ? 14000 : answered ? 4500 : 7000;
    const t = window.setTimeout(() => {
      setTriviaIndex((i) => i + 1);
    }, advanceMs);
    return () => window.clearTimeout(t);
  }, [triviaIndex, quizGuess, card.kind]);

  const childWord = gender === 'boy' ? 'son' : 'daughter';

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
          {mode === 'creator' ? 'Creator Access' : 'Payment Verified'}
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
          <h3 className="text-lg font-extrabold text-slate-800 leading-snug">{stage.label}</h3>
          <p className="text-slate-400 text-xs">
            Painting your future {childWord}&apos;s face — usually 20–45 seconds. Keep this tab open.
          </p>
          <p className="text-[11px] font-semibold text-slate-300 tabular-nums">
            {elapsedSec < 10 ? `0:${elapsedSec.toString().padStart(2, '0')}` : `${elapsedSec}s`} elapsed
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 min-h-[148px] flex flex-col justify-between">
        {card.kind === 'fact' ? (
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {card.emoji}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Genetics trivia
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-800">{card.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{card.body}</p>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {card.emoji}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                Quick quiz
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 leading-snug">{card.question}</p>
            {quizGuess === null ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuizGuess(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  True
                </button>
                <button
                  type="button"
                  onClick={() => setQuizGuess(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                >
                  False
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
                  {quizGuess === card.answer ? 'Nice!' : 'Almost!'}{' '}
                </span>
                {card.reveal}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center gap-1.5 pt-3">
          {deck.slice(0, 5).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === triviaIndex % Math.min(5, deck.length) ? 'bg-indigo-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-100">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-pink-400 indeterminate-bar" />
        </div>
        <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Combining DNA traits…
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
