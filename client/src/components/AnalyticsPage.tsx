import { useCallback, useEffect, useState } from "react";
import {
  exportEvaluationsUrl,
  fetchAnalyticsDashboard,
  fetchAnalyticsRecent,
  fetchAnalyticsSummary,
  fetchStudentProfile,
} from "../lib/api";
import { AnalyticsDashboardPanel } from "./AnalyticsDashboard";
import type {
  AnalyticsDashboard,
  AnalyticsRecentResponse,
  AnalyticsSummary,
  BacStream,
  ConfigResponse,
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

type Props = {
  config: ConfigResponse;
  lang: Lang;
  onBack: () => void;
};

type Filters = {
  from: string;
  to: string;
  bacStream: BacStream | "";
  specialtyCode: string;
};

const emptyFilters = (): Filters => ({
  from: "",
  to: "",
  bacStream: "",
  specialtyCode: "",
});

function StudentProfileView({
  profile,
  lang,
  onClose,
}: {
  profile: StudentProfileDetail;
  lang: Lang;
  onClose: () => void;
}) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const subjectLabels = SUBJECT_LABELS_I18N[lang];
  const top = profile.matches[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="mb-2 text-xs font-medium text-teal-700 hover:underline dark:text-teal-300"
          >
            ← {t.backToList}
          </button>
          <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">
            {profile.fullName}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {streamLabels[profile.bacStream as BacStream] ?? profile.bacStream}
            {" · "}{t.overallMarkShort}: {profile.overallBacMark.toFixed(2)}/20
            {profile.topRiasec
              ? ` · RIASEC ${profile.topRiasec.map((e) => e.letter).join("")}`
              : ""}
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            {t.evaluatedAt}:{" "}
            {profile.matches[0]?.evaluatedAt?.slice(0, 19).replace("T", " ") ?? profile.createdAt}
          </p>
        </div>
      </div>

      {top && (
        <div className="relative overflow-hidden rounded-2xl border border-teal-300/70 bg-gradient-to-br from-teal-500/20 via-amber-500/15 to-orange-500/15 p-5 shadow-lg shadow-teal-500/15 dark:border-teal-700/50">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/25 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
            {t.topRecommendation}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-stone-900 dark:text-stone-50">{top.specialtyTitle}</h3>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${LABEL_STYLES[top.matchLabel]}`}>
              {matchLabelText(lang, top.matchLabel)}
            </span>
          </div>
          <p className="mt-2 text-4xl font-black tabular-nums text-teal-700 dark:text-teal-300">
            {top.finalScore.toFixed(1)}
            <span className="text-lg font-semibold text-stone-400">%</span>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="analytics-card p-4">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">{t.gradesHeading}</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {Object.entries(profile.grades).map(([code, value]) => (
              <li key={code} className="flex justify-between gap-2">
                <span className="text-stone-600 dark:text-stone-300">
                  {subjectLabels[code as SubjectCode] ?? code}
                </span>
                <span className="font-bold tabular-nums">{Number(value).toFixed(2)}</span>
              </li>
            ))}
            {Object.keys(profile.grades).length === 0 && <li className="text-stone-500">—</li>}
          </ul>
        </section>

        <section className="analytics-card p-4">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">{t.riasecTitle}</h3>
          {profile.topRiasec && profile.topRiasec.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {profile.topRiasec.map((entry, i) => (
                <li key={`${entry.letter}-${i}`} className="flex justify-between gap-2">
                  <span className="font-semibold text-stone-700 dark:text-stone-200">
                    #{i + 1} {entry.letter}
                  </span>
                  <span className="tabular-nums text-stone-600">{entry.weight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">—</p>
          )}
        </section>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-bold text-stone-800 dark:text-stone-100">{t.allMatches}</h3>
        <div className="space-y-2">
          {profile.matches.map((match) => (
            <article
              key={match.specialtyId}
              className={`rounded-xl border p-3 transition ${
                match.rank === 1
                  ? "border-teal-300/70 bg-teal-50/70 shadow-sm dark:border-teal-800 dark:bg-teal-950/40"
                  : "border-stone-200/80 dark:border-stone-700"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-stone-400">#{match.rank}</span>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {match.specialtyTitle}
                    </h4>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${LABEL_STYLES[match.matchLabel]}`}>
                      {matchLabelText(lang, match.matchLabel)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {match.specialtyCode} · {match.department} · {match.hollandCode.join("-")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black tabular-nums text-teal-700 dark:text-teal-300">
                    {match.finalScore.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-stone-500">
                    A {match.academicScore.toFixed(0)} · R {match.psychometricScore.toFixed(0)}
                  </div>
                </div>
              </div>
            </article>
          ))}
          {profile.matches.length === 0 && (
            <p className="text-sm text-stone-500">{t.noMatches}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function AnalyticsPage({ config, lang, onBack }: Props) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [recent, setRecent] = useState<AnalyticsRecentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfileDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const load = useCallback(
    async (f: Filters) => {
      setLoading(true);
      setError(null);
      const params = {
        from: f.from || undefined,
        to: f.to || undefined,
        bacStream: f.bacStream || undefined,
        specialtyCode: f.specialtyCode || undefined,
        limit: 50,
      };
      try {
        const [s, d, r] = await Promise.all([
          fetchAnalyticsSummary(params),
          fetchAnalyticsDashboard(params),
          fetchAnalyticsRecent(params),
        ]);
        setSummary(s);
        setDashboard(d);
        setRecent(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.analyticsError);
      } finally {
        setLoading(false);
      }
    },
    [t.analyticsError],
  );

  useEffect(() => {
    void load(applied);
  }, [applied, load]);

  useEffect(() => {
    if (!selectedStudentId) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);
    void fetchStudentProfile(selectedStudentId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (!cancelled) {
          setProfileError(e instanceof Error ? e.message : t.profileError);
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId, t.profileError]);

  const applyFilters = () => setApplied({ ...filters });
  const resetFilters = () => {
    const empty = emptyFilters();
    setFilters(empty);
    setApplied(empty);
  };

  const exportUrl = exportEvaluationsUrl({
    from: applied.from || undefined,
    to: applied.to || undefined,
    bacStream: applied.bacStream || undefined,
    specialtyCode: applied.specialtyCode || undefined,
    anonymized: false,
  });

  const specialties = config.specialties ?? [];

  if (selectedStudentId) {
    return (
      <div className="space-y-4">
        {profileLoading && <p className="text-sm text-stone-500">{t.profileLoading}</p>}
        {profileError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {profileError}
            <button type="button" className="ml-3 underline" onClick={() => setSelectedStudentId(null)}>
              {t.backToList}
            </button>
          </div>
        )}
        {profile && !profileLoading && (
          <StudentProfileView profile={profile} lang={lang} onClose={() => setSelectedStudentId(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="bg-gradient-to-r from-teal-600 via-amber-500 to-orange-500 bg-clip-text text-2xl font-black tracking-tight text-transparent dark:from-teal-300 dark:via-amber-300 dark:to-orange-300">
            {t.analyticsTitle}
          </h2>
          <p className="mt-1 text-sm text-stone-500">{t.analyticsSubtitle}</p>
          <p className="mt-1 text-xs text-stone-400">{t.analyticsClickHint}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-stone-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-stone-700 shadow-sm backdrop-blur hover:bg-white dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200"
        >
          {t.backToWizard}
        </button>
      </div>

      <div className="analytics-card analytics-mesh p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-stone-500">
            {t.filterFrom}
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white/90 px-2.5 py-2 text-sm shadow-sm dark:border-stone-700 dark:bg-stone-950/60"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wide text-stone-500">
            {t.filterTo}
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white/90 px-2.5 py-2 text-sm shadow-sm dark:border-stone-700 dark:bg-stone-950/60"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wide text-stone-500">
            {t.filterStream}
            <select
              value={filters.bacStream}
              onChange={(e) =>
                setFilters((p) => ({ ...p, bacStream: e.target.value as BacStream | "" }))
              }
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white/90 px-2.5 py-2 text-sm shadow-sm dark:border-stone-700 dark:bg-stone-950/60"
            >
              <option value="">{t.filterAll}</option>
              {config.bacStreams.map((s) => (
                <option key={s} value={s}>
                  {streamLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wide text-stone-500">
            {t.filterSpecialty}
            <select
              value={filters.specialtyCode}
              onChange={(e) => setFilters((p) => ({ ...p, specialtyCode: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white/90 px-2.5 py-2 text-sm shadow-sm dark:border-stone-700 dark:bg-stone-950/60"
            >
              <option value="">{t.filterAll}</option>
              {specialties.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-xl bg-gradient-to-r from-teal-600 to-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-teal-500/30 hover:brightness-110"
          >
            {t.applyFilters}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200"
          >
            {t.resetFilters}
          </button>
          <a
            href={exportUrl}
            className="rounded-xl border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200"
          >
            {t.exportCsv}
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => void load(applied)}>
            {t.retry}
          </button>
        </div>
      )}

      {loading && !dashboard && <p className="text-sm text-stone-500">{t.analyticsLoading}</p>}

      {dashboard && (
        <AnalyticsDashboardPanel
          dashboard={dashboard}
          lang={lang}
          totalSessions={summary?.totalSessions}
        />
      )}

      {recent && (
        <section className="analytics-card overflow-hidden p-0">
          <div className="border-b border-stone-100 px-5 py-4 dark:border-stone-800">
            <h3 className="text-sm font-black tracking-tight text-stone-900 dark:text-stone-50">
              {t.recentSessions}
            </h3>
            <p className="text-[11px] text-stone-400">{t.analyticsClickHint}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-amber-50/60 text-[10px] uppercase tracking-wider text-stone-400 dark:bg-stone-950/50">
                <tr>
                  <th className="px-4 py-3 font-bold">{t.colName}</th>
                  <th className="px-3 py-3 font-bold">{t.colDate}</th>
                  <th className="px-3 py-3 font-bold">{t.colStream}</th>
                  <th className="px-3 py-3 font-bold">{t.colTopSpecialty}</th>
                  <th className="px-3 py-3 font-bold">{t.colScore}</th>
                  <th className="px-4 py-3 font-bold">{t.colLabel}</th>
                </tr>
              </thead>
              <tbody>
                {recent.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                      {t.noSessions}
                    </td>
                  </tr>
                ) : (
                  recent.rows.map((row) => (
                    <tr
                      key={row.studentId}
                      className="cursor-pointer border-t border-stone-100/80 transition hover:bg-gradient-to-r hover:from-teal-50/90 hover:to-amber-50/50 dark:border-stone-800 dark:hover:from-teal-950/40 dark:hover:to-amber-950/25"
                      onClick={() => setSelectedStudentId(row.studentId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedStudentId(row.studentId);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className="px-4 py-3 font-bold text-teal-700 dark:text-teal-300">
                        {row.fullName}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-stone-500">
                        {row.evaluatedAt?.slice(0, 19).replace("T", " ")}
                      </td>
                      <td className="px-3 py-3 text-stone-700 dark:text-stone-200">
                        {streamLabels[row.bacStream as BacStream] ?? row.bacStream}
                      </td>
                      <td className="px-3 py-3 font-medium text-stone-800 dark:text-stone-100">
                        {row.topSpecialtyTitle}
                      </td>
                      <td className="px-3 py-3 text-sm font-black tabular-nums text-stone-900 dark:text-white">
                        {row.finalScore.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            LABEL_STYLES[row.matchLabel]
                          }`}
                        >
                          {matchLabelText(lang, row.matchLabel)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
