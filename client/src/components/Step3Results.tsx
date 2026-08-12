import type { CalculationResult, TopRiasecProfile } from "../types";
import { STREAM_LABELS } from "../types";

type Props = {
  result: CalculationResult;
  topRiasec: TopRiasecProfile;
  onReset: () => void;
};

function ScoreBar({ academic, psychometric }: { academic: number; psychometric: number }) {
  const a = Math.max(0, Math.min(100, academic));
  const p = Math.max(0, Math.min(100, psychometric));
  return (
    <div className="space-y-1">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="bg-indigo-600" style={{ width: `${a * 0.7}%` }} title="Academic 70%" />
        <div className="bg-amber-500" style={{ width: `${p * 0.3}%` }} title="RIASEC 30%" />
      </div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>70% Academic ({academic.toFixed(1)}%)</span>
        <span>30% RIASEC ({psychometric.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

export function Step3Results({ result, topRiasec, onReset }: Props) {
  const topCode = topRiasec.map((e) => e.letter).join("");

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Specialty match results
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {result.studentName} · {STREAM_LABELS[result.bacStream]} · RIASEC code{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-300">{topCode}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          New evaluation
        </button>
      </div>

      <div className="grid gap-3">
        {result.matches.map((match) => (
          <article
            key={match.specialtyId}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-indigo-600 px-2 text-xs font-bold text-white">
                    #{match.rank}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {match.specialtyTitle}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {match.specialtyCode} · {match.department}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {match.finalScore.toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-500">final fit</div>
              </div>
            </div>

            {match.description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{match.description}</p>
            )}

            <div className="mt-3">
              <ScoreBar academic={match.academicScore} psychometric={match.psychometricScore} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
              <div>
                <dt>Academic</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.academicScore.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt>RIASEC</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.psychometricScore.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt>Stream μ</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.details.streamModifierApplied.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt>CosSim</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.details.vectorCosineSimilarity.toFixed(3)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        Evaluation ID: {result.evaluationId} · {new Date(result.timestamp).toLocaleString()}
      </p>
    </div>
  );
}
