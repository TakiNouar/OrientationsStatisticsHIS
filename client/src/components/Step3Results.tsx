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
  labels,
}: {
  academic: number;
  psychometric: number;
  technical: number;
  preference?: number;
  labels: { academic: string; riasec: string; technical: string; preference: string };
}) {
  const rows = [
    [labels.academic, academic, "bg-brass"],
    [labels.riasec, psychometric, "bg-brass/70"],
    [labels.technical, technical, "bg-brass/50"],
    [labels.preference, preference ?? 0, "bg-brass/35"],
  ] as const;
  return (
    <div className="space-y-1.5">
      {rows.map(([label, value, color]) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 text-ink-muted">{label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-brass-dim/40">
            <div className={`h-full rounded-sm ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
          </div>
          <span className="w-12 text-right font-mono text-ink">{value.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

function LabelBadge({ label, text }: { label: MatchLabel; text: string }) {
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LABEL_STYLES[label]}`}
    >
      {text}
    </span>
  );
}

/** Circular brass seal — top recommendation signature. */
function MatchSeal({ code, score }: { code: string; score: number }) {
  const rim = (code || "HIS").slice(0, 12).toUpperCase();
  return (
    <div className="seal-in relative mx-auto flex h-36 w-36 items-center justify-center" aria-hidden>
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full text-brass">
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      </svg>
      <div className="relative z-10 flex flex-col items-center px-2 text-center">
        <span className="font-mono text-[10px] tracking-[0.2em] text-brass">{rim}</span>
        <span className="mt-1 font-mono text-3xl font-medium tabular-nums text-ink">
          {score.toFixed(1)}
        </span>
        <span className="font-mono text-[10px] text-ink-muted">%</span>
      </div>
    </div>
  );
}

function fmt(value: number | undefined | null, digits = 1, fallback = "—"): string {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return value.toFixed(digits);
}

function levelLabel(lang: Lang, level: string): string {
  const t = strings[lang];
  if (level === "entry") return t.careerLevelEntry;
  if (level === "mid") return t.careerLevelMid;
  if (level === "senior") return t.careerLevelSenior;
  return level;
}

function CareerCard({ path, lang }: { path: CareerPath; lang: Lang }) {
  const t = strings[lang];
  const title = lang === "fr" ? path.titleFr : path.titleEn;
  const sector = lang === "fr" ? path.sectorFr : path.sectorEn;
  const description = lang === "fr" ? path.descriptionFr : path.descriptionEn;
  const examples = lang === "fr" ? path.examplesFr : path.examplesEn;

  return (
    <div className="border-l-2 border-brass bg-surface py-2 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-sm font-semibold italic text-ink">{title}</h4>
        <span className="font-mono text-[10px] uppercase tracking-wide text-brass">
          {levelLabel(lang, path.level)}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {t.careerSector}: {sector}
      </p>
      <p className="mt-2 text-sm text-ink-muted">{description}</p>
      {examples.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {t.careerExamples}
          </p>
          <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
            {examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Step3Results({ result, topRiasec, onReset, lang, genieLabels }: Props) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const topCode = topRiasec.map((e) => e.letter).join("");
  const top = result.matches[0];
  const [showDetails, setShowDetails] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<ResultTab>("scores");

  const visible = useMemo(() => {
    if (showAll || result.matches.length <= 3) return result.matches;
    return result.matches.slice(0, 3);
  }, [result.matches, showAll]);

  const withoutVisible = useMemo(() => {
    const rows = result.matchesWithoutRiasec ?? [];
    if (showAll || rows.length <= 3) return rows;
    return rows.slice(0, 3);
  }, [result.matchesWithoutRiasec, showAll]);

  const genieLabel =
    result.technicalOption && genieLabels?.[result.technicalOption]
      ? genieLabels[result.technicalOption]
      : result.technicalOption;

  const exportUrl = exportEvaluationsUrl();

  const scoreLabels = {
    academic: t.academic,
    riasec: t.riasec,
    technical: t.technical,
    preference: t.preference,
  };

  const showAllLabel = lang === "fr" ? "Voir tout" : "Show all";
  const showLessLabel = lang === "fr" ? "Réduire" : "Show less";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{t.results}</h2>
          <p className="mt-1 font-display text-lg text-ink">{result.studentName}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {streamLabels[result.bacStream]}
            {genieLabel ? ` · ${genieLabel}` : ""}
            {" · "}RIASEC <span className="font-mono">{topCode}</span>
          </p>
          <p className="mt-2 font-mono text-[11px] text-ink-muted">
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

      <div className="flex flex-wrap gap-6 border-b border-brass-dim">
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs text-ink-muted underline-offset-2 hover:underline"
            >
              {showDetails ? t.hideDetails : t.showDetails}
            </button>
          </div>

          <div className="space-y-0">
            {visible.map((match) => (
              <article
                key={match.specialtyId}
                className="border-b border-brass-dim py-4 last:border-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted">#{match.rank}</span>
                      <h3 className="font-display text-base font-semibold text-ink">
                        {match.specialtyTitle}
                      </h3>
                      <LabelBadge
                        label={match.matchLabel}
                        text={matchLabelText(lang, match.matchLabel)}
                      />
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      {match.specialtyCode} · {match.department} · {match.hollandCode.join("-")}
                      {match.isTechnical ? ` · ${t.technicalSpecialty}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl font-medium tabular-nums text-ink">
                      {fmt(match.finalScore, 1)}%
                    </div>
                    <div className="text-[11px] text-ink-muted">{t.finalFit}</div>
                  </div>
                </div>

                {match.description && (
                  <p className="mt-2 text-sm text-ink-muted">{match.description}</p>
                )}

                <div className="mt-3">
                  <ScoreBar
                    academic={match.academicScore ?? 0}
                    psychometric={match.psychometricScore ?? 0}
                    technical={match.technicalScore ?? 0}
                    preference={match.preferenceScore ?? 0}
                    labels={scoreLabels}
                  />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs text-ink-muted sm:grid-cols-4">
                  <div>
                    <dt>{t.codeMatch}</dt>
                    <dd className="font-medium text-ink">{fmt(match.details?.codeMatchScore, 1)}%</dd>
                  </div>
                  <div>
                    <dt>{t.cosSim}</dt>
                    <dd className="font-medium text-ink">
                      {fmt(match.details?.vectorCosineSimilarity, 3)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.marksTech}</dt>
                    <dd className="font-medium text-ink">
                      {fmt(match.details?.technicalMarksComponent, 0)}%
                    </dd>
                  </div>
                  <div>
                    <dt>{t.techAlign}</dt>
                    <dd className="font-medium text-ink">{fmt(match.technicalScore, 0)}%</dd>
                  </div>
                </dl>

                {match.details?.genieBiasPoints != null && match.details.genieBiasPoints > 0 && (
                  <p className="mt-2 text-xs text-brass">
                    {t.genieBias}: +{fmt(match.details.genieBiasPoints, 0)}
                  </p>
                )}

                {showDetails && match.details && (
                  <div className="mt-3 border border-dashed border-brass-dim p-3 font-mono text-xs">
                    <p className="font-semibold text-ink">{t.slotBreakdown}</p>
                    <ul className="mt-1 grid grid-cols-2 gap-1 text-ink-muted sm:grid-cols-4">
                      <li>main1: {fmt(match.details.slotBreakdown?.main1)}</li>
                      <li>main2: {fmt(match.details.slotBreakdown?.main2)}</li>
                      <li>opposite: {fmt(match.details.slotBreakdown?.opposite)}</li>
                      <li>english: {fmt(match.details.slotBreakdown?.english)}</li>
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>

          {result.matches.length > 3 && (
            <div className="text-center">
              <button type="button" onClick={() => setShowAll((v) => !v)} className="intended-btn-ghost">
                {showAll ? showLessLabel : showAllLabel}
              </button>
            </div>
          )}
        </>
      )}

      {tab === "withoutRiasec" && (
        <>
          <p className="text-sm text-ink-muted">{t.withoutRiasecIntro}</p>
          {result.weightsWithoutRiasec && (
            <p className="font-mono text-[11px] text-ink-muted">
              {t.weightsLine}: {t.academic}{" "}
              {(result.weightsWithoutRiasec.academic * 100).toFixed(0)}% · {t.technical}{" "}
              {(result.weightsWithoutRiasec.technical * 100).toFixed(1)}% · {t.preference}{" "}
              {(result.weightsWithoutRiasec.preference * 100).toFixed(1)}%
            </p>
          )}
          <div className="space-y-0">
            {withoutVisible.map((match) => (
              <article
                key={`nr-${match.specialtyId}`}
                className="border-b border-brass-dim py-4 last:border-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted">#{match.rank}</span>
                      <h3 className="font-display text-base font-semibold text-ink">
                        {match.specialtyTitle}
                      </h3>
                      <LabelBadge
                        label={match.matchLabel}
                        text={matchLabelText(lang, match.matchLabel)}
                      />
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      {match.specialtyCode} · {match.department}
                      {match.hollandCode ? ` · ${match.hollandCode.join("-")}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl font-medium tabular-nums text-ink">
                      {fmt(match.finalScore, 1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <ScoreBar
                    academic={match.academicScore ?? 0}
                    psychometric={0}
                    technical={match.technicalScore ?? 0}
                    preference={match.preferenceScore ?? 0}
                    labels={scoreLabels}
                  />
                </div>
              </article>
            ))}
          </div>
          {(result.matchesWithoutRiasec?.length ?? 0) > 3 && (
            <div className="text-center">
              <button type="button" onClick={() => setShowAll((v) => !v)} className="intended-btn-ghost">
                {showAll ? showLessLabel : showAllLabel}
              </button>
            </div>
          )}
          {(result.matchesWithoutRiasec ?? []).length === 0 && (
            <p className="text-sm text-ink-muted">—</p>
          )}
        </>
      )}

      {tab === "careers" && (
        <div className="space-y-6">
          <p className="text-sm text-ink-muted">{t.careersIntro}</p>
          {result.matches.map((match) => {
            const paths = match.careerPaths ?? [];
            return (
              <section key={match.specialtyId} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 border-b border-brass-dim pb-2">
                  <span className="font-mono text-xs text-ink-muted">#{match.rank}</span>
                  <h3 className="font-display text-base font-semibold text-ink">
                    {match.specialtyTitle}
                  </h3>
                  <span className="font-mono text-xs text-ink-muted">{fmt(match.finalScore, 1)}%</span>
                </div>
                {paths.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t.noCareers}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paths.map((path) => (
                      <CareerCard key={path.id} path={path} lang={lang} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-ink-muted">{t.disclaimer}</p>
    </div>
  );
}
