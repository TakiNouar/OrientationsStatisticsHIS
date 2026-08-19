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
} from "../types";
import type { Lang } from "../i18n/strings";
import {
  STREAM_LABELS_I18N,
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
    if (!window.confirm(`${t.deleteConfirm} ${name}?`)) return;
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
      const msg = e instanceof Error ? e.message : t.deleteFailed;
      if (/401|403|token|admin/i.test(msg)) {
        setStoredAdminToken("");
        setError(t.adminTokenRejected);
      } else {
        setError(msg);
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedStudentId) {
    return (
      <div className="space-y-4">
        {profileLoading && (
          <div className="analytics-card intended-skeleton h-64" aria-busy="true" aria-label={t.loading} />
        )}
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
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{t.analyticsTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.analyticsSubtitle}</p>
        </div>
        <a
          className="text-xs font-medium text-brass underline-offset-2 hover:underline"
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

      <div className="analytics-card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs">
            <span className="intended-label">{t.filterFrom}</span>
            <input
              type="date"
              className="intended-field"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            <span className="intended-label">{t.filterTo}</span>
            <input
              type="date"
              className="intended-field"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
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
              <option value="">{t.allStreams}</option>
              {config.bacStreams.map((s) => (
                <option key={s} value={s}>
                  {streamLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="intended-label">{t.filterSpecialty}</span>
            <select
              className="intended-field"
              value={filters.specialtyCode}
              onChange={(e) => setFilters((prev) => ({ ...prev, specialtyCode: e.target.value }))}
            >
              <option value="">{t.allSpecialties}</option>
              {config.specialties.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <button type="button" className="intended-btn-primary" onClick={() => setApplied(filters)}>
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
        <div className="border border-burgundy/40 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">{error}</div>
      )}

      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label={t.loading}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="analytics-card intended-skeleton h-24 p-4" />
            ))}
          </div>
          <div className="analytics-card intended-skeleton h-40" />
          <div className="analytics-card intended-skeleton h-48" />
        </div>
      )}

      {summary && !loading && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="analytics-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t.totalEvaluations}</p>
            <p className="mt-1 font-mono text-3xl tabular-nums text-ink">{summary.totalEvaluations}</p>
          </div>
          <div className="analytics-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t.uniqueStudents}</p>
            <p className="mt-1 font-mono text-3xl tabular-nums text-ink">{summary.uniqueStudents}</p>
          </div>
          <div className="analytics-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t.avgScore}</p>
            <p className="mt-1 font-mono text-3xl tabular-nums text-ink">
              {summary.averageFinalScore != null ? `${summary.averageFinalScore.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      )}

      {dashboard && !loading && (
        <AnalyticsDashboardPanel dashboard={dashboard} lang={lang} totalSessions={summary?.totalEvaluations} />
      )}

      {recent && !loading && (
        <div className="analytics-card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brass-dim text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2">{t.colName}</th>
                <th className="px-3 py-2">{t.colDate}</th>
                <th className="px-3 py-2">{t.colStream}</th>
                <th className="px-3 py-2">{t.colSpecialty}</th>
                <th className="px-3 py-2">{t.colScore}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {(recent.sessions ?? []).map((row) => (
                <tr key={row.studentId} className="border-b border-brass-dim/60 hover:bg-brass/5">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="font-medium text-ink hover:text-brass"
                      onClick={() => setSelectedStudentId(row.studentId)}
                    >
                      {row.fullName}
                    </button>
                  </td>
                  <td
                    className="cursor-pointer whitespace-nowrap px-3 py-2 font-mono text-xs text-ink-muted"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {row.evaluatedAt.slice(0, 16).replace("T", " ")}
                  </td>
                  <td
                    className="cursor-pointer px-3 py-2 text-ink-muted"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {streamLabels[row.bacStream as BacStream] ?? row.bacStream}
                  </td>
                  <td
                    className="cursor-pointer px-3 py-2"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {row.topSpecialtyTitle}
                  </td>
                  <td
                    className="cursor-pointer px-3 py-2 font-mono tabular-nums"
                    onClick={() => setSelectedStudentId(row.studentId)}
                  >
                    {row.finalScore.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right">
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
            <p className="intended-empty m-4">{t.noSessions}</p>
          )}
        </div>
      )}
    </div>
  );
}
