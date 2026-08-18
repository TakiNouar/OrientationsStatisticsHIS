import { useMemo, useState } from "react";
import type { CalculationResult, CareerPath, MatchLabel, TopRiasecProfile } from "../types";
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

type ResultTab = "scores" | "withoutRiasec" | "careers";

function ScoreBar({
  academic,
  psychometric,
  technical,
  preference,
}: {
  academic: number;
  psychometric: number;
  technical: number;
  preference?: number;
}) {
  const parts = [
    { key: "a", value: academic, className: "bg-brass" },
    { key: "r", value: psychometric, className: "bg-brass-dim" },
    { key: "t", value: technical, className: "bg-ink/40" },
  ];
  if (preference != null) {
    parts.push({ key: "p", value: preference, className: "bg-burgundy/50" });
  }
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-sm bg-surface">
      {parts.map((p) => (
        <div
          key={p.key}
          className={p.className}
          style={{ width: `${(p.value / total) * 100}%` }}
          title={`${p.key}: ${p.value.toFixed(1)}`}
        />
      ))}
    </div>
  );
}

function LabelBadge({ label, text }: { label: MatchLabel; text: string }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LABEL_STYLES[label]}`}
    >
      {text}
    </span>
  );
}

function MatchSeal({ code, score }: { code: string; score: number }) {
  return (
    <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-brass bg-parchment shadow-sm">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brass">{code}</span>
      <span className="mt-1 font-mono text-3xl font-medium tabular-nums text-ink">
        {score.toFixed(0)}
      </span>
    </div>
  );
}

function fmt(value: number | undefined | null, digits = 1, fallback = "—"): string {
  if (value == null || Number.isNaN(Number(value))) return fallback;
  return Number(value).toFixed(digits);
}

function careerLevelLabel(level: string, t: (typeof strings)["fr"]): string {
  if (level === "entry") return t.careerLevelEntry;
  if (level === "mid") return t.careerLevelMid;
  if (level === "senior") return t.careerLevelSenior;
  return level;
}

function CareerCard({ path, lang, t }: { path: CareerPath; lang: Lang; t: (typeof strings)["fr"] }) {
  const title = lang === "fr" ? path.titleFr : path.titleEn;
  const sector = lang === "fr" ? path.sectorFr : path.sectorEn;
  const description = lang === "fr" ? path.descriptionFr : path.descriptionEn;
  const examples = lang === "fr" ? path.examplesFr : path.examplesEn;
  return (
    <article className="border border-brass-dim bg-surface p-4">
      <h4 className="font-display text-sm font-semibold text-ink">{title}</h4>
      <p className="mt-1 text-xs text-ink-muted">
        {t.careerSector}: {sector} · {careerLevelLabel(path.level, t)}
      </p>
      <p className="mt-2 text-sm text-ink">{description}</p>
      {examples?.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brass">{t.careerExamples}</p>
          <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
            {examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function Step3Results({ result, topRiasec, onReset, lang, genieLabels }: Props) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const [tab, setTab] = useState<ResultTab>("scores");
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const top = result.matches[0];
  const exportUrl = useMemo(
    () => exportEvaluationsUrl({ anonymized: false }),
    [],
  );

  const riasecCode = topRiasec.map((e) => e.letter).join("");

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{t.resultsTitle}</h2>
          <p className="mt-1 break-words text-sm text-ink-muted">
            {result.studentName}
            {" · "}
            {streamLabels[result.bacStream] ?? result.bacStream}
            {result.technicalOption
              ? ` · ${genieLabels?.[result.technicalOption] ?? result.technicalOption}`
              : ""}
            {" · RIASEC "}
            {riasecCode}
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-muted">
            {t.weightsLine}: {t.academic} {(result.weights.academic * 100).toFixed(0)}% · {t.riasec}{" "}
            {(result.weights.riasec * 100).toFixed(0)}% · {t.technical}{" "}
            {(result.weights.technical * 100).toFixed(0)}%
            {result.weights.preference != null
              ? ` · ${t.preference} ${(result.weights.preference * 100).toFixed(0)}%`
              : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button type="button" onClick={onReset} className="intended-btn-ghost">
            {t.newEvaluation}
          </button>
          <a href={exportUrl} className="text-xs text-brass underline-offset-2 hover:underline">
            {t.exportCsv}
          </a>
        </div>
      </div>

      <div className="flex gap-6 border-b border-brass-dim">
        {(
          [
            ["scores", t.tabScores],
            ["withoutRiasec", t.tabWithoutRiasec],
            ["careers", t.tabCareers],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`border-b-2 px-1 pb-2 text-sm font-medium transition ${
              tab === id
                ? "border-brass text-ink"
                : "border-transparent text-ink-muted hover:text-brass"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "scores" && (
        <>
          {top && (
            <div className="border border-brass-dim bg-surface px-4 py-6 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                {t.topRecommendation}
              </p>
              <div className="mt-4">
                <MatchSeal code={top.specialtyCode} score={top.finalScore} />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">{top.specialtyTitle}</h3>
              <div className="mt-2 flex justify-center">
                <LabelBadge label={top.matchLabel} text={matchLabelText(lang, top.matchLabel)} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{t.finalFit}</p>
            </div>
          )}
          {result.matches.slice(0, 3).map((match) => (
            <article key={match.specialtyId} className="border border-brass-dim bg-surface px-4 py-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink-muted">#{match.rank}</span>
                    <h4 className="break-words font-display text-base font-semibold text-ink">
                      {match.specialtyTitle}
                    </h4>
                    <LabelBadge
                      label={match.matchLabel}
                      text={matchLabelText(lang, match.matchLabel)}
                    />
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    {match.specialtyCode} · {match.department}
                  </p>
                  <div className="mt-3 max-w-md">
                    <ScoreBar
                      academic={match.academicScore}
                      psychometric={match.psychometricScore}
                      technical={match.technicalScore}
                      preference={match.preferenceScore}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-2xl font-medium tabular-nums text-ink">
                    {fmt(match.finalScore, 1)}%
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 text-xs font-medium text-brass underline-offset-2 hover:underline"
                onClick={() =>
                  setOpenDetails((p) => ({
                    ...p,
                    [match.specialtyId]: !p[match.specialtyId],
                  }))
                }
              >
                {openDetails[match.specialtyId] ? t.hideDetails : t.showDetails}
              </button>
              {openDetails[match.specialtyId] && match.details && (
                <dl className="mt-3 grid gap-2 border-t border-brass-dim pt-3 text-xs sm:grid-cols-2">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">{t.academic}</dt>
                    <dd className="font-medium text-ink">{fmt(match.academicScore, 1)}%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">{t.riasec}</dt>
                    <dd className="font-medium text-ink">{fmt(match.psychometricScore, 1)}%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">{t.codeMatch}</dt>
                    <dd className="font-medium text-ink">{fmt(match.details?.codeMatchScore, 1)}%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">{t.cosSim}</dt>
                    <dd className="font-medium text-ink">{fmt(match.details?.vectorCosineSimilarity, 3)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">{t.marksTech}</dt>
                    <dd className="font-medium text-ink">{fmt(match.details?.technicalMarksComponent, 0)}%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">{t.techAlign}</dt>
                    <dd className="font-medium text-ink">{fmt(match.technicalScore, 0)}%</dd>
                  </div>
                  {match.details.genieBiasPoints > 0 && (
                    <div className="flex justify-between gap-2 sm:col-span-2">
                      <dt className="text-ink-muted">{t.genieBias}</dt>
                      <dd className="font-medium text-ink">+{fmt(match.details.genieBiasPoints, 0)}</dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-ink-muted">{t.slotBreakdown}</p>
                    <ul className="mt-1 font-mono text-[11px] text-ink">
                      <li>main1: {fmt(match.details.slotBreakdown?.main1)}</li>
                      <li>main2: {fmt(match.details.slotBreakdown?.main2)}</li>
                      <li>opposite: {fmt(match.details.slotBreakdown?.opposite)}</li>
                      <li>english: {fmt(match.details.slotBreakdown?.english)}</li>
                    </ul>
                  </div>
                </dl>
              )}
            </article>
          ))}
        </>
      )}

      {tab === "withoutRiasec" && (
        <>
          <p className="text-sm text-ink-muted">{t.withoutRiasecIntro}</p>
          {result.weightsWithoutRiasec && (
            <p className="font-mono text-[11px] text-ink-muted">
              {t.weightsLine}: {t.academic} {(result.weightsWithoutRiasec.academic * 100).toFixed(0)}% ·{" "}
              {t.technical} {(result.weightsWithoutRiasec.technical * 100).toFixed(1)}% ·{" "}
              {t.preference} {(result.weightsWithoutRiasec.preference * 100).toFixed(1)}%
            </p>
          )}
          {(result.matchesWithoutRiasec ?? []).slice(0, 3).map((match) => (
            <article
              key={`nr-${match.specialtyId}`}
              className="border border-brass-dim bg-surface px-4 py-4"
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink-muted">#{match.rank}</span>
                    <h4 className="break-words font-display text-base font-semibold text-ink">
                      {match.specialtyTitle}
                    </h4>
                    <LabelBadge label={match.matchLabel} text={matchLabelText(lang, match.matchLabel)} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    {match.specialtyCode} · {match.department}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-ink-muted">
                    {t.academic} {fmt(match.academicScore, 1)}% · {t.technical}{" "}
                    {fmt(match.technicalScore, 1)}% · {t.preference} {fmt(match.preferenceScore, 1)}%
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-2xl font-medium tabular-nums text-ink">
                    {fmt(match.finalScore, 1)}%
                  </div>
                </div>
              </div>
            </article>
          ))}
          {(result.matchesWithoutRiasec ?? []).length === 0 && (
            <p className="text-sm text-ink-muted">—</p>
          )}
        </>
      )}

      {tab === "careers" && (
        <>
          <p className="text-sm text-ink-muted">{t.careersIntro}</p>
          {result.matches.slice(0, 3).map((match) => {
            const paths = match.careerPaths ?? [];
            return (
              <div key={`c-${match.specialtyId}`} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-sm font-semibold text-ink">{match.specialtyTitle}</h3>
                  <span className="font-mono text-xs text-ink-muted">{fmt(match.finalScore, 1)}%</span>
                </div>
                {paths.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t.noCareerPaths}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paths.map((path) => (
                      <CareerCard key={path.id} path={path} lang={lang} t={t} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
