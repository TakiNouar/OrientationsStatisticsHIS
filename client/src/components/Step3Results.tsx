import { useMemo, useState } from "react";
import type { CalculationResult, MatchLabel, TopRiasecProfile } from "../types";
import { LABEL_STYLES } from "../types";
import type { Lang } from "../i18n/strings";
import { STREAM_LABELS_I18N, matchLabelText, strings } from "../i18n/strings";
import { exportEvaluationsUrl } from "../lib/api";

type Props = {
  result: CalculationResult;
  topRiasec: TopRiasecProfile;
  onReset: () => void;
  lang: Lang;
  genieLabels?: Record<string, string>;
};

function ScoreBar({
  academic,
  psychometric,
  technical,
  labels,
}: {
  academic: number;
  psychometric: number;
  technical: number;
  labels: { academic: string; riasec: string; technical: string };
}) {
  return (
    <div className="space-y-1.5">
      {(
        [
          [labels.academic, academic, "bg-blue-500"],
          [labels.riasec, psychometric, "bg-violet-500"],
          [labels.technical, technical, "bg-cyan-500"],
        ] as const
      ).map(([label, value, color]) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 text-slate-500">{label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
          </div>
          <span className="w-12 text-right font-medium text-slate-700 dark:text-slate-300">
            {value.toFixed(0)}%
          </span>
        </div>
      ))}
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

function fmt(value: number | undefined | null, digits = 1, fallback = "—"): string {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return value.toFixed(digits);
}

export function Step3Results({ result, topRiasec, onReset, lang, genieLabels }: Props) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const topCode = topRiasec.map((e) => e.letter).join("");
  const top = result.matches[0];
  const [showDetails, setShowDetails] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    if (showAll || result.matches.length <= 3) return result.matches;
    return result.matches.slice(0, 3);
  }, [result.matches, showAll]);

  const genieLabel =
    result.technicalOption && genieLabels?.[result.technicalOption]
      ? genieLabels[result.technicalOption]
      : result.technicalOption;

  const exportUrl = exportEvaluationsUrl();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t.results}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {result.studentName} · {streamLabels[result.bacStream]}
            {genieLabel ? ` · ${genieLabel}` : ""}
            {" · "}RIASEC {topCode}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t.weightsLine}: {t.academic} {(result.weights.academic * 100).toFixed(0)}% · {t.riasec}{" "}
            {(result.weights.riasec * 100).toFixed(0)}% · {t.technical}{" "}
            {(result.weights.technical * 100).toFixed(0)}%
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t.newEvaluation}
          </button>
          <a href={exportUrl} className="text-xs text-slate-500 underline-offset-2 hover:underline">
            {t.exportCsv}
          </a>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-slate-400 underline-offset-2 hover:underline"
          >
            {showDetails ? t.hideDetails : t.showDetails}
          </button>
        </div>
      </div>

      {top && (
        <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50/90 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            {t.topRecommendation}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{top.specialtyTitle}</h3>
            <LabelBadge label={top.matchLabel} text={matchLabelText(lang, top.matchLabel)} />
          </div>
          <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-300">
            {fmt(top.finalScore, 1)}%
            <span className="ml-2 text-sm font-medium text-slate-500">{t.finalFit}</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {visible.map((match) => (
          <article
            key={match.specialtyId}
            className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${
              match.rank === 1
                ? "border-indigo-200 dark:border-indigo-900"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">#{match.rank}</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {match.specialtyTitle}
                  </h3>
                  <LabelBadge
                    label={match.matchLabel}
                    text={matchLabelText(lang, match.matchLabel)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {match.specialtyCode} · {match.department} · {match.hollandCode.join("-")}
                  {match.isTechnical ? ` · ${t.technicalSpecialty}` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {fmt(match.finalScore, 1)}%
                </div>
                <div className="text-[11px] text-slate-500">{t.finalFit}</div>
              </div>
            </div>

            {match.description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{match.description}</p>
            )}

            <div className="mt-3">
              <ScoreBar
                academic={match.academicScore ?? 0}
                psychometric={match.psychometricScore ?? 0}
                technical={match.technicalScore ?? 0}
                labels={{ academic: t.academic, riasec: t.riasec, technical: t.technical }}
              />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
              <div>
                <dt>{t.codeMatch}</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmt(match.details?.codeMatchScore, 1)}%
                </dd>
              </div>
              <div>
                <dt>{t.cosSim}</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmt(match.details?.vectorCosineSimilarity, 3)}
                </dd>
              </div>
              <div>
                <dt>{t.marksTech}</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmt(match.details?.technicalMarksComponent, 0)}%
                </dd>
              </div>
              <div>
                <dt>{t.techAlign}</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmt(match.technicalScore, 0)}%
                </dd>
              </div>
            </dl>

            {match.details?.genieBiasPoints != null && match.details.genieBiasPoints > 0 && (
              <p className="mt-2 text-xs text-cyan-700 dark:text-cyan-300">
                {t.genieBias}: +{fmt(match.details.genieBiasPoints, 0)}
              </p>
            )}

            {showDetails && match.details && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-950/50">
                <p className="font-semibold text-slate-700 dark:text-slate-200">{t.slotBreakdown}</p>
                <ul className="mt-1 grid grid-cols-2 gap-1 text-slate-600 dark:text-slate-400 sm:grid-cols-4">
                  <li>main1: {fmt(match.details.slotBreakdown?.main1)}</li>
                  <li>main2: {fmt(match.details.slotBreakdown?.main2)}</li>
                  <li>opposite: {fmt(match.details.slotBreakdown?.opposite)}</li>
                  <li>english: {fmt(match.details.slotBreakdown?.english)}</li>
                </ul>
                <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">{t.affinityBreakdown}</p>
                <ul className="mt-1 grid grid-cols-2 gap-1 text-slate-600 dark:text-slate-400 sm:grid-cols-4">
                  <li>main1 ×{fmt(match.details.affinityBreakdown?.main1, 2)}</li>
                  <li>main2 ×{fmt(match.details.affinityBreakdown?.main2, 2)}</li>
                  <li>opposite ×{fmt(match.details.affinityBreakdown?.opposite, 2)}</li>
                  <li>english ×{fmt(match.details.affinityBreakdown?.english, 2)}</li>
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      {result.matches.length > 3 && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {showAll ? t.showLess : t.showMore}
          </button>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">{t.disclaimer}</p>
    </div>
  );
}
