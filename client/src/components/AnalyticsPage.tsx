import { useCallback, useEffect, useState } from "react";
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
  bacStream: string;
  specialtyCode: string;
};

const emptyFilters = (): Filters => ({
  from: "",
  to: "",
  bacStream: "",
  specialtyCode: "",
});

function buildQuery(filters: Filters): Record<string, string> {
  const q: Record<string, string> = {};
  if (filters.from) q.from = filters.from;
  if (filters.to) q.to = filters.to;
  if (filters.bacStream) q.bacStream = filters.bacStream;
  if (filters.specialtyCode) q.specialtyCode = filters.specialtyCode;
  return q;
}

export function AnalyticsPage({ config, lang, onBack }: Props) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recent, setRecent] = useState<AnalyticsRecentResponse | null>(null);
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfileDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState(() => getStoredAdminToken());

  const loadList = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const q = buildQuery(f);
      const [s, r, d] = await Promise.all([
        fetchAnalyticsSummary(q),
        fetchAnalyticsRecent(q),
        fetchAnalyticsDashboard(q),
      ]);
      setSummary(s);
      setRecent(r);
      setDashboard(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError);
      setSummary(null);
      setRecent(null);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    void loadList(applied);
  }, [applied, loadList]);

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

  const handleDelete = async (studentId: string, fullName: string) => {
    const ok = window.confirm(t.confirmDelete.replace("{name}", fullName));
    if (!ok) return;
    const token = adminToken || getStoredAdminToken();
    if (!token) {
      const entered = window.prompt(t.adminTokenRequired);
      if (!entered) return;
      setStoredAdminToken(entered);
      setAdminToken(entered);
    }
    setDeletingId(studentId);
    try {
      await deleteStudentProfile(studentId);
      if (selectedStudentId === studentId) {
        setSelectedStudentId(null);
        setProfile(null);
      }
      await loadList(applied);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedStudentId) {
    return (
      <div className="space-y-4">
        {profileLoading && <p className="text-sm text-ink-muted">{t.loadingProfile}</p>}
        {profileError && <p className="text-sm text-burgundy">{profileError}</p>}
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-xs font-medium text-brass underline-offset-2 hover:underline"
          >
            ← {t.backToWizard}
          </button>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {t.analyticsTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{t.analyticsSubtitle}</p>
        </div>
        <a
          href={exportEvaluationsUrl(buildQuery(applied))}
          className="text-xs font-medium text-brass underline-offset-2 hover:underline"
        >
          {t.exportCsv}
        </a>
      </div>

      <div className="analytics-card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs">
            <span className="intended-label">{t.filterFrom}</span>
            <input
              type="date"
              className="intended-field"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            <span className="intended-label">{t.filterTo}</span>
            <input
              type="date"
              className="intended-field"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            <span className="intended-label">{t.filterStream}</span>
            <select
              className="intended-field"
              value={filters.bacStream}
              onChange={(e) => setFilters((f) => ({ ...f, bacStream: e.target.value }))}
            >
              <option value="">{t.filterAll}</option>
              {config.bacStreams.map((s) => (
                <option key={s} value={s}>
                  {streamLabels[s as BacStream] ?? s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="intended-label">{t.filterSpecialty}</span>
            <select
              className="intended-field"
              value={filters.specialtyCode}
              onChange={(e) => setFilters((f) => ({ ...f, specialtyCode: e.target.value }))}
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="intended-btn-primary"
            onClick={() => setApplied({ ...filters })}
          >
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

      {loading && <p className="text-sm text-ink-muted">{t.loadingAnalytics}</p>}
      {error && <p className="text-sm text-burgundy">{error}</p>}

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="analytics-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              {t.kpiEvaluations}
            </p>
            <p className="mt-1 font-mono text-3xl tabular-nums text-ink">{summary.totalEvaluations}</p>
          </div>
          <div className="analytics-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              {t.kpiStudents}
            </p>
            <p className="mt-1 font-mono text-3xl tabular-nums text-ink">{summary.uniqueStudents}</p>
          </div>
          <div className="analytics-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              {t.kpiAvgScore}
            </p>
            <p className="mt-1 font-mono text-3xl tabular-nums text-ink">
              {summary.averageFinalScore != null ? summary.averageFinalScore.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      )}

      {dashboard && <AnalyticsDashboardPanel data={dashboard} lang={lang} />}

      {recent && (
        <div className="analytics-card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brass-dim text-[10px] uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2 font-semibold">{t.colStudent}</th>
                <th className="px-3 py-2 font-semibold">{t.colDate}</th>
                <th className="px-3 py-2 font-semibold">{t.colStream}</th>
                <th className="px-3 py-2 font-semibold">{t.colTopSpecialty}</th>
                <th className="px-3 py-2 font-semibold">{t.colScore}</th>
                <th className="px-3 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {(recent.sessions ?? []).map((row) => (
                <tr
                  key={row.studentId}
                  className="border-b border-brass-dim/50 hover:bg-brass/5"
                >
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="text-left font-medium text-ink hover:text-brass"
                      onClick={() => setSelectedStudentId(row.studentId)}
                    >
                      {row.fullName}
                    </button>
                  </td>
                  <td className="cursor-pointer whitespace-nowrap px-3 py-3 font-mono tabular-nums text-ink-muted"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {row.evaluatedAt?.slice(0, 16).replace("T", " ")}
                  </td>
                  <td
                    className="cursor-pointer px-3 py-3 text-ink-muted"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {streamLabels[row.bacStream as BacStream] ?? row.bacStream}
                  </td>
                  <td
                    className="cursor-pointer px-3 py-3 text-ink"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {row.topSpecialtyTitle}
                  </td>
                  <td
                    className="cursor-pointer px-3 py-3 font-mono tabular-nums text-ink"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {Number(row.finalScore).toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-burgundy hover:underline disabled:opacity-50"
                      disabled={deletingId === row.studentId}
                      onClick={() => void handleDelete(row.studentId, row.fullName)}
                    >
                      {deletingId === row.studentId ? t.deleting : t.deleteProfile}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(recent.sessions ?? []).length === 0 && (
            <p className="p-4 text-sm text-ink-muted">{t.noSessions}</p>
          )}
        </div>
      )}
    </div>
  );
}
