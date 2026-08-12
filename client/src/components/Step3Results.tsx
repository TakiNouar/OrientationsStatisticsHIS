import type { CalculationResult, MatchLabel, TopRiasecProfile } from "../types";
import { LABEL_STYLES, STREAM_LABELS } from "../types";

type Props = {
  result: CalculationResult;
  topRiasec: TopRiasecProfile;
  onReset: () => void;
};

function ScoreBar({
  academic,
  psychometric,
  technical,
}: {
  academic: number;
  psychometric: number;
  technical: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-20 shrink-0 text-slate-500">Academic</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(academic, 100)}%` }} />
        </div>
        <span className="w-12 text-right font-medium text-slate-700 dark:text-slate-300">
          {academic.toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-20 shrink-0 text-slate-500">RIASEC</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-violet-500"
            style={{ width: `${Math.min(psychometric, 100)}%` }}
          />
        </div>
        <span className="w-12 text-right font-medium text-slate-700 dark:text-slate-300">
          {psychometric.toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-20 shrink-0 text-slate-500">Technical</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-500"
            style={{ width: `${Math.min(technical, 100)}%` }}
          />
        </div>
        <span className="w-12 text-right font-medium text-slate-700 dark:text-slate-300">
          {technical.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function LabelBadge({ label, text }: { label: MatchLabel; text: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${LABEL_STYLES[label]}`}>
      {text}
    </span>
  );
}

export function Step3Results({ result, topRiasec, onReset }: Props) {
  const topCode = topRiasec.map((e) => e.letter).join("");
  const top = result.matches[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Your results</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Ranked recommendations for <strong>{result.studentName}</strong> (
            {STREAM_LABELS[result.bacStream]}
            {result.isTechnicalStream ? " · technical stream" : ""} · code{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-300">{topCode}</span>).
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Weights: academic {(result.weights.academic * 100).toFixed(0)}% · RIASEC{" "}
            {(result.weights.riasec * 100).toFixed(0)}% · technical alignment{" "}
            {(result.weights.technical * 100).toFixed(0)}%
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

      {top && (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Best match
            </div>
            <LabelBadge label={top.matchLabel} text={top.matchLabelText} />
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {top.specialtyTitle}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {top.specialtyCode} · {top.department} · Holland {top.hollandCode.join("-")}
            {top.isTechnical ? " · technical" : ""}
          </div>
          <div className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-300">
            {top.finalScore.toFixed(1)}%
          </div>
        </div>
      )}

      <div className="space-y-3">
        {result.matches.map((match) => (
          <article
            key={match.specialtyId}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-indigo-600 px-2 text-xs font-bold text-white">
                    #{match.rank}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {match.specialtyTitle}
                  </h3>
                  <LabelBadge label={match.matchLabel} text={match.matchLabelText} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {match.specialtyCode} · {match.department} · {match.hollandCode.join("-")}
                  {match.isTechnical ? " · technical specialty" : ""}
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
              <ScoreBar
                academic={match.academicScore}
                psychometric={match.psychometricScore}
                technical={match.technicalScore}
              />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
              <div>
                <dt>Code match</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.details.codeMatchScore.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt>CosSim</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.details.vectorCosineSimilarity.toFixed(3)}
                </dd>
              </div>
              <div>
                <dt>Stream μ</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.details.streamModifierApplied.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt>Tech align</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {match.technicalScore.toFixed(0)}%
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
