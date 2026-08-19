import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteStudentProfile,
  exportEvaluationsUrl,
  fetchAnalyticsDashboard,
  fetchAnalyticsRecent,
  fetchAnalyticsSummary,
  fetchStudentProfile,
  getStoredAdminToken,
  setStoredAdminToken,
} from "../lib/api";
import { AnalyticsDashboardPanel } from "./AnalyticsDashboard";
import { StudentProfileView } from "./StudentProfileView";
import type {
  AnalyticsDashboard,
  AnalyticsRecentResponse,
  AnalyticsSummary,
  BacStream,
  ConfigResponse,
  MatchLabel,
  StudentProfileDetail,
} from "../types";
import { LABEL_STYLES } from "../types";
import type { Lang } from "../i18n/strings";
import { STREAM_LABELS_I18N, matchLabelText, strings } from "../i18n/strings";

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

function ensureAdminToken(lang: Lang): boolean {
  const t = strings[lang];
  if (getStoredAdminToken().length >= 4) return true;
  const entered = window.prompt(t.adminTokenPrompt);
  if (entered == null) return false;
  const token = entered.trim();
  if (token.length < 4) {
    window.alert(t.adminTokenInvalid);
    return false;
  }
  setStoredAdminToken(token);
  return true;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(
    async (f: Filters) => {
      setLoading(true);
      setError(null);
      const params = {
        from: f.from || undefined,
        to: f.to || undefined,
        bacStream: f.bacStream || undefined,
        specialtyCode: f.specialtyCode || undefined,
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

  const handleDelete = async (studentId: string, name: string) => {
    const msg = t.deleteConfirm.includes("{name}")
      ? t.deleteConfirm.replace("{name}", name)
      : `${t.deleteConfirm} ${name}?`;
    if (!window.confirm(msg)) return;
    if (!ensureAdminToken(lang)) return;
    setDeletingId(studentId);
    setError(null);
    try {
      await deleteStudentProfile(studentId);
      if (selectedStudentId === studentId) {
        setSelectedStudentId(null);
        setProfile(null);
      }
      await load(applied);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : t.deleteError;
      if (/401|403|token|admin/i.test(errMsg)) {
        setStoredAdminToken("");
        setError(t.adminTokenRejected);
      } else {
        setError(errMsg);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (applied.from) chips.push({ key: "from", label: `${t.filterFrom}: ${applied.from}` });
    if (applied.to) chips.push({ key: "to", label: `${t.filterTo}: ${applied.to}` });
    if (applied.bacStream) {
      chips.push({
        key: "stream",
        label: streamLabels[applied.bacStream] ?? applied.bacStream,
      });
    }
    if (applied.specialtyCode) {
      const sp = config.specialties.find((s) => s.code === applied.specialtyCode);
      chips.push({ key: "spec", label: sp?.title ?? applied.specialtyCode });
    }
    return chips;
  }, [applied, config.specialties, streamLabels, t.filterFrom, t.filterTo]);

  const sessions = recent?.sessions ?? [];

  if (selectedStudentId) {
    return (
      <div className="analytics-rise space-y-4">
        {profileLoading && (
          <div className="analytics-card intended-skeleton h-64" aria-busy="true" aria-label={t.loading} />
        )}
        {profileError && (
          <div className="border border-burgundy/40 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">
            {profileError}
            <button type="button" className="ml-3 underline" onClick={() => setSelectedStudentId(null)}>
              {t.backToList}
            </button>
          </div>
        )}
        {profile && (
          <StudentProfileView
            profile={profile}
            config={config}
            lang={lang}
            onClose={() => setSelectedStudentId(null)}
            onDelete={() => void handleDelete(profile.studentId, profile.fullName)}
            deleting={deletingId === profile.studentId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="analytics-rise min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">HIS · Staff</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {t.analyticsTitle}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">{t.analyticsSubtitle}</p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-muted">{t.analyticsClickHint}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button type="button" onClick={onBack} className="intended-btn-ghost text-xs">
            {t.backToWizard}
          </button>
          <a
            className="text-[11px] text-ink-muted underline-offset-2 hover:text-brass hover:underline"
            href={exportEvaluationsUrl({
              from: applied.from || undefined,
              to: applied.to || undefined,
              bacStream: applied.bacStream || undefined,
              specialtyCode: applied.specialtyCode || undefined,
            })}
          >
            {t.exportCsv}
          </a>
        </div>
      </div>

      <div className="analytics-card min-w-0 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Filters
          </p>
          {activeChips.length > 0 && (
            <div className="flex max-w-full flex-wrap justify-end gap-1.5">
              {activeChips.map((c) => (
                <span
                  key={c.key}
                  className="rounded-sm border border-brass-dim px-2 py-0.5 font-mono text-[10px] text-ink-muted"
                >
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block min-w-0">
            <span className="intended-label">{t.filterFrom}</span>
            <input
              type="date"
              className="intended-field"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
          </label>
          <label className="block min-w-0">
            <span className="intended-label">{t.filterTo}</span>
            <input
              type="date"
              className="intended-field"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            />
          </label>
          <label className="block min-w-0">
            <span className="intended-label">{t.filterStream}</span>
            <select
              className="intended-field"
              value={filters.bacStream}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  bacStream: e.target.value as BacStream | "",
                }))
              }
            >
              <option value="">{t.filterAll}</option>
              {config.bacStreams.map((s) => (
                <option key={s} value={s}>
                  {streamLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="intended-label">{t.filterSpecialty}</span>
            <select
              className="intended-field"
              value={filters.specialtyCode}
              onChange={(e) => setFilters((prev) => ({ ...prev, specialtyCode: e.target.value }))}
            >
              <option value="">{t.filterAll}</option>
              {config.specialties.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="intended-btn-primary" onClick={() => setApplied({ ...filters })}>
            {t.applyFilters}
          </button>
          <button
            type="button"
            className="intended-btn-ghost"
            onClick={() => {
              const empty = emptyFilters();
              setFilters(empty);
              setApplied(empty);
            }}
          >
            {t.resetFilters}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3 border border-burgundy/40 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <button type="button" className="shrink-0 underline" onClick={() => void load(applied)}>
            {t.retry}
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label={t.loading}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="analytics-card intended-skeleton h-24 p-4" />
            ))}
          </div>
          <div className="analytics-card intended-skeleton h-48" />
          <div className="analytics-card intended-skeleton h-56" />
        </div>
      )}

      {summary && !loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="analytics-card dash-kpi p-5">
            <div className="mb-3 h-px w-10 bg-brass" />
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
              {t.totalEvaluations}
            </p>
            <p className="mt-2 font-mono text-3xl tabular-nums text-ink sm:text-4xl">{summary.totalEvaluations}</p>
          </div>
          <div className="analytics-card dash-kpi p-5">
            <div className="mb-3 h-px w-10 bg-brass" />
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
              {t.uniqueStudents}
            </p>
            <p className="mt-2 font-mono text-3xl tabular-nums text-ink sm:text-4xl">{summary.uniqueStudents}</p>
          </div>
          <div className="analytics-card dash-kpi p-5">
            <div className="mb-3 h-px w-10 bg-brass" />
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
              {t.avgScore}
            </p>
            <p className="mt-2 font-mono text-3xl tabular-nums text-ink sm:text-4xl">
              {summary.averageFinalScore != null ? `${summary.averageFinalScore.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      )}

      {dashboard && !loading && (
        <AnalyticsDashboardPanel dashboard={dashboard} lang={lang} totalSessions={summary?.totalEvaluations} />
      )}

      {recent && !loading && (
        <section className="analytics-card min-w-0 overflow-hidden p-0">
          <div className="border-b border-brass-dim px-5 py-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-semibold tracking-tight text-ink">
                  {t.recentSessions}
                </h3>
                <p className="mt-0.5 font-mono text-[11px] text-ink-muted">{t.analyticsClickHint}</p>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-ink-muted">{sessions.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="dash-table min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brass-dim bg-surface font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-3 font-medium">{t.colName}</th>
                  <th className="px-3 py-3 font-medium">{t.colDate}</th>
                  <th className="px-3 py-3 font-medium">{t.colStream}</th>
                  <th className="px-3 py-3 font-medium">{t.colTopSpecialty}</th>
                  <th className="px-3 py-3 font-medium">{t.colScore}</th>
                  <th className="px-4 py-3 font-medium">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                      {t.noSessions}
                    </td>
                  </tr>
                ) : (
                  sessions.map((row) => (
                    <tr
                      key={row.studentId}
                      className="border-t border-brass-dim/50 transition hover:bg-brass/5"
                    >
                      <td className="max-w-[12rem] px-4 py-3">
                        <button
                          type="button"
                          className="analytics-truncate block w-full text-left font-medium text-ink hover:text-brass"
                          onClick={() => setSelectedStudentId(row.studentId)}
                        >
                          {row.fullName}
                        </button>
                      </td>
                      <td
                        className="cursor-pointer whitespace-nowrap px-3 py-3 font-mono text-xs tabular-nums text-ink-muted"
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        {row.evaluatedAt?.slice(0, 16).replace("T", " ")}
                      </td>
                      <td
                        className="cursor-pointer px-3 py-3 text-ink-muted"
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        <span className="analytics-truncate block max-w-[9rem]">
                          {streamLabels[row.bacStream as BacStream] ?? row.bacStream}
                        </span>
                      </td>
                      <td
                        className="max-w-[14rem] cursor-pointer px-3 py-3"
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="analytics-truncate font-medium text-ink">{row.topSpecialtyTitle}</span>
                          {row.matchLabel && (
                            <span
                              className={`inline-flex w-fit rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${LABEL_STYLES[row.matchLabel as MatchLabel]}`}
                            >
                              {matchLabelText(lang, row.matchLabel)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="cursor-pointer px-3 py-3 font-mono text-sm font-medium tabular-nums text-ink"
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        {Number(row.finalScore).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="rounded-sm border border-burgundy/40 bg-burgundy/5 px-2 py-1 text-[10px] font-semibold text-burgundy hover:bg-burgundy/10 disabled:opacity-50"
                          disabled={deletingId === row.studentId}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(row.studentId, row.fullName);
                          }}
                        >
                          {deletingId === row.studentId ? t.deleting : t.deleteProfile}
                        </button>
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
