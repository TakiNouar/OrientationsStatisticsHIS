import { useState } from "react";
import type {
  BacStream,
  CareerPath,
  ConfigResponse,
  RiasecLetter,
  StudentMatchRow,
  StudentProfileDetail,
  SubjectCode,
} from "../types";
import { LABEL_STYLES } from "../types";
import type { Lang } from "../i18n/strings";
import {
  STREAM_LABELS_I18N,
  SUBJECT_LABELS_I18N,
  matchLabelText,
  strings,
} from "../i18n/strings";

function formatHollandCode(
  code: [RiasecLetter, RiasecLetter, RiasecLetter] | undefined,
  labels: Record<RiasecLetter, string>,
): string {
  if (!code?.length) return "";
  return code.map((letter) => `${letter} (${labels[letter] ?? letter})`).join(" · ");
}

function ProfileCareerCard({ path, lang }: { path: CareerPath; lang: Lang }) {
  const t = strings[lang];
  const title = lang === "fr" ? path.titleFr : path.titleEn;
  const sector = lang === "fr" ? path.sectorFr : path.sectorEn;
  const description = lang === "fr" ? path.descriptionFr : path.descriptionEn;
  const examples = lang === "fr" ? path.examplesFr : path.examplesEn;
  const level =
    path.level === "entry"
      ? t.careerLevelEntry
      : path.level === "mid"
        ? t.careerLevelMid
        : path.level === "senior"
          ? t.careerLevelSenior
          : path.level;

  return (
    <div className="border-l-2 border-brass bg-surface py-2 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-sm font-semibold italic text-ink">{title}</h4>
        <span className="font-mono text-[10px] uppercase tracking-wide text-brass">{level}</span>
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

type ProfileTab = "scores" | "withoutRiasec" | "careers";

export function StudentProfileView({
  profile,
  config,
  lang,
  onClose,
  onDelete,
  deleting,
}: {
  profile: StudentProfileDetail;
  config: ConfigResponse;
  lang: Lang;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const subjectLabels = SUBJECT_LABELS_I18N[lang];
  const riasecLabels = config.riasecLabels;
  const top = profile.matches[0];
  const [tab, setTab] = useState<ProfileTab>("scores");

  const matchesWithoutRiasec = (profile.matches ?? [])
    .filter((m) => m.finalScoreNoRiasec != null && m.rankNoRiasec != null)
    .slice()
    .sort((a, b) => (a.rankNoRiasec ?? 99) - (b.rankNoRiasec ?? 99));

  const careerGroups = (profile.matches ?? [])
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((m) => ({
      match: m,
      paths: config.careerPathsBySpecialty?.[m.specialtyCode] ?? [],
    }))
    .filter((g) => g.paths.length > 0);

  const renderMatchList = (
    rows: StudentMatchRow[],
    scoreOf: (m: StudentMatchRow) => number,
    rankOf: (m: StudentMatchRow) => number,
  ) => (
    <div className="space-y-0">
      {rows.map((match) => (
        <article
          key={match.specialtyId ?? match.specialtyCode ?? String(rankOf(match))}
          className="min-w-0 border-b border-brass-dim py-3 last:border-0"
        >
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-ink-muted">#{rankOf(match)}</span>
                <h4 className="break-words font-display text-sm font-semibold text-ink">
                  {match.specialtyTitle}
                </h4>
                <span
                  className={`inline-flex shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LABEL_STYLES[match.matchLabel]}`}
                >
                  {matchLabelText(lang, match.matchLabel)}
                </span>
              </div>
              <p className="mt-0.5 break-words font-mono text-xs text-ink-muted">
                {match.specialtyCode} · {match.department}
                {(match.hollandCode?.length ?? 0) > 0
                  ? ` · ${formatHollandCode(match.hollandCode, riasecLabels)}`
                  : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-lg font-medium tabular-nums text-ink">
                {Number(scoreOf(match)).toFixed(1)}%
              </div>
            </div>
          </div>
        </article>
      ))}
      {rows.length === 0 && <p className="text-sm text-ink-muted">{t.noMatches}</p>}
    </div>
  );

  const riasecHeadline = profile.topRiasec?.length
    ? profile.topRiasec
        .map((e) => `${e.letter} (${riasecLabels[e.letter] ?? e.letter})`)
        .join(" · ")
    : null;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="mb-2 text-xs font-medium text-brass underline-offset-2 hover:underline"
          >
            ← {t.backToList}
          </button>
          <h2 className="break-words font-display text-2xl font-semibold tracking-tight text-ink">
            {profile.fullName}
          </h2>
          <p className="mt-1 break-words text-sm text-ink-muted">
            {streamLabels[profile.bacStream as BacStream] ?? profile.bacStream}
            {" · "}
            {t.overallMarkShort}: {profile.overallBacMark.toFixed(2)}/20
            {riasecHeadline ? ` · RIASEC ${riasecHeadline}` : ""}
          </p>
          {(profile.preferredSpecialtyTitle || profile.preferredSpecialtyCode) && (
            <p className="mt-2 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-sm border border-brass-dim bg-brass/10 px-2.5 py-1 text-xs font-medium text-ink">
              <span className="font-mono text-[10px] uppercase tracking-wide text-brass">
                {t.preferredSpecialty}
              </span>
              <span className="break-words">
                {profile.preferredSpecialtyTitle ?? profile.preferredSpecialtyCode}
              </span>
              {profile.preferredSpecialtyCode && (
                <span className="font-mono text-[10px] text-ink-muted">
                  ({profile.preferredSpecialtyCode})
                </span>
              )}
            </p>
          )}
          <p className="mt-1 font-mono text-[11px] text-ink-muted">
            {t.evaluatedAt}:{" "}
            {profile.matches[0]?.evaluatedAt?.slice(0, 19).replace("T", " ") ?? profile.createdAt}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="shrink-0 rounded-sm border border-burgundy/50 bg-burgundy/10 px-3 py-1.5 text-xs font-semibold text-burgundy hover:bg-burgundy/15 disabled:opacity-50"
        >
          {deleting ? t.deleting : t.deleteProfile}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="analytics-card min-w-0 p-4">
          <h3 className="font-display text-sm font-semibold text-ink">{t.topMatch}</h3>
          {top ? (
            <>
              <p className="mt-2 break-words font-display text-lg font-semibold text-ink">
                {top.specialtyTitle}
              </p>
              <p className="mt-3 font-mono text-4xl font-medium tabular-nums text-ink">
                {Number(top.finalScore).toFixed(1)}%
              </p>
              <span
                className={`mt-2 inline-flex rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LABEL_STYLES[top.matchLabel]}`}
              >
                {matchLabelText(lang, top.matchLabel)}
              </span>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">{t.noMatches}</p>
          )}
        </section>

        <section className="analytics-card min-w-0 p-4">
          <h3 className="font-display text-sm font-semibold text-ink">{t.gradesTitle}</h3>
          <ul className="mt-3 space-y-1.5">
            {Object.entries(profile.grades ?? {}).map(([code, value]) => (
              <li
                key={code}
                className="flex justify-between gap-2 text-sm text-ink-muted"
              >
                <span className="min-w-0 break-words">
                  {subjectLabels[code as SubjectCode] ?? code}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-ink">
                  {Number(value).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="analytics-card min-w-0 p-4">
        <h3 className="font-display text-sm font-semibold text-ink">RIASEC</h3>
        {profile.topRiasec && profile.topRiasec.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {profile.topRiasec.map((entry) => (
              <li
                key={entry.letter}
                className="flex justify-between gap-2 text-sm text-ink-muted"
              >
                <span>
                  <span className="font-mono font-semibold text-ink">{entry.letter}</span>
                  {" · "}
                  {riasecLabels[entry.letter] ?? entry.letter}
                </span>
                <span className="font-mono tabular-nums text-ink">{entry.weight}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">—</p>
        )}
      </section>

      <div className="flex flex-wrap gap-1 border-b border-brass-dim">
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
            className={[
              "px-3 py-2 text-xs font-medium tracking-wide transition-colors",
              tab === id
                ? "border-b-2 border-brass text-brass"
                : "text-ink-muted hover:text-brass",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "scores" && (
        <section className="min-w-0">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">{t.allMatches}</h3>
          {renderMatchList(
            profile.matches ?? [],
            (m) => m.finalScore,
            (m) => m.rank,
          )}
        </section>
      )}

      {tab === "withoutRiasec" && (
        <section className="min-w-0 space-y-3">
          <p className="text-sm text-ink-muted">{t.withoutRiasecIntro}</p>
          {renderMatchList(
            matchesWithoutRiasec,
            (m) => m.finalScoreNoRiasec as number,
            (m) => m.rankNoRiasec as number,
          )}
        </section>
      )}

      {tab === "careers" && (
        <section className="min-w-0 space-y-6">
          <p className="text-sm text-ink-muted">{t.careersIntro}</p>
          {careerGroups.length === 0 && (
            <p className="text-sm text-ink-muted">{t.noCareerPaths}</p>
          )}
          {careerGroups.map(({ match, paths }) => (
            <div key={match.specialtyCode} className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-ink">
                #{match.rank} {match.specialtyTitle}
              </h4>
              <div className="space-y-3">
                {paths.map((path) => (
                  <ProfileCareerCard key={path.id} path={path} lang={lang} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
