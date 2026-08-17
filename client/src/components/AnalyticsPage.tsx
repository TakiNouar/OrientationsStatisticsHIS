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

function StudentProfileView({
  profile,
  lang,
  onClose,
  onDelete,
  deleting,
}: {
  profile: StudentProfileDetail;
  lang: Lang;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const subjectLabels = SUBJECT_LABELS_I18N[lang];
  const top = profile.matches[0];

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
            {" · "}{t.overallMarkShort}: {profile.overallBacMark.toFixed(2)}/20
            {profile.topRiasec ? ` · RIASEC ${profile.topRiasec.map((e) => e.letter).join("")}` : ""}
          </p>
          {(profile.preferredSpecialtyTitle || profile.preferredSpecialtyCode) && (
            <p className="mt-2 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-sm border border-brass-dim bg-brass/10 px-2.5 py-1 text-xs font-medium text-ink">
              <span className="font-mono text-[10px] uppercase tracking-wide text-brass">{t.preferredSpecialty}</span>
              <span className="break-words">{profile.preferredSpecialtyTitle ?? profile.preferredSpecialtyCode}</span>
              {profile.preferredSpecialtyCode && (
                <span className="font-mono text-[10px] text-ink-muted">({profile.preferredSpecialtyCode})</span>
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

      {top && (
        <div className="border border-brass-dim bg-surface px-4 py-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">{t.topRecommendation}</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">{top.specialtyTitle}</h3>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LABEL_STYLES[top.matchLabel]}`}
            >
              {matchLabelText(lang, top.matchLabel)}
            </span>
          </div>
          <p className="mt-3 font-mono text-4xl font-medium tabular-nums text-ink">
            {top.finalScore.toFixed(1)}
            <span className="text-lg text-ink-muted">%</span>
          </p>
        </div>
      )}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <section className="analytics-card min-w-0 p-4">
          <h3 className="font-display text-sm font-semibold text-ink">{t.gradesHeading}</h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            {Object.entries(profile.grades).map(([code, value]) => (
              <li key={code} className="flex min-w-0 justify-between gap-2 border-b border-brass-dim/40 py-1 last:border-0">
                <span className="min-w-0 truncate text-ink-muted">{subjectLabels[code as SubjectCode] ?? code}</span>
                <span className="shrink-0 font-mono tabular-nums text-ink">{Number(value).toFixed(2)}</span>
              </li>
            ))}
            {Object.keys(profile.grades).length === 0 && <li className="text-ink-muted">—</li>}
          </ul>
        </section>
        <section className="analytics-card min-w-0 p-4">
          <h3 className="font-display text-sm font-semibold text-ink">{t.riasecTitle}</h3>
          {profile.topRiasec && profile.topRiasec.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-sm">
              {profile.topRiasec.map((entry, i) => (
                <li key={`${entry.letter}-${i}`} className="flex justify-between gap-2 border-b border-brass-dim/40 py-1 last:border-0">
                  <span className="font-mono text-ink">#{i + 1} {entry.letter}</span>
                  <span className="font-mono tabular-nums text-ink-muted">{entry.weight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">—</p>
          )}
        </section>
      </div>

      <section className="min-w-0">
        <h3 className="mb-3 font-display text-sm font-semibold text-ink">{t.allMatches}</h3>
        <div className="space-y-0">
          {profile.matches.map((match) => (
            <article
              key={match.specialtyId}
              className={`min-w-0 border-b border-brass-dim py-3 last:border-0 ${match.rank === 1 ? "" : ""}`}
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink-muted">#{match.rank}</span>
                    <h4 className="break-words font-display text-sm font-semibold text-ink">{match.specialtyTitle}</h4>
                    <span
                      className={`inline-flex shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LABEL_STYLES[match.matchLabel]}`}
                    >
                      {matchLabelText(lang, match.matchLabel)}
                    </span>
                  </div>
                  <p className="mt-0.5 break-words font-mono text-xs text-ink-muted">
                    {match.specialtyCode} · {match.department} · {match.hollandCode.join("-")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-lg font-medium tabular-nums text-ink">{match.finalScore.toFixed(1)}%</div>
                </div>
              </div>
            </article>
          ))}
          {profile.matches.length === 0 && <p className="text-sm text-ink-muted">{t.noMatches}</p>}
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

  const handleDelete = async (studentId: string, name: string) => {
    if (!window.confirm(t.deleteConfirm.replace("{name}", name))) return;
    if (config.adminAuthRequired !== false && !ensureAdminToken(lang)) return;
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
      const message = e instanceof Error ? e.message : t.deleteError;
      if (message === "ADMIN_TOKEN_REQUIRED") {
        setStoredAdminToken("");
        setError(t.adminTokenRejected);
      } else setError(message);
    } finally {
      setDeletingId(null);
    }
  };

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
      <div className="min-w-0 space-y-4">
        {profileLoading && <p className="text-sm text-ink-muted">{t.profileLoading}</p>}
        {profileError && (
          <div className="rounded-sm border border-burgundy/40 bg-burgundy/10 px-3 py-2 text-sm text-burgundy">
            {profileError}
            <button type="button" className="ml-3 underline" onClick={() => setSelectedStudentId(null)}>
              {t.backToList}
            </button>
          </div>
        )}
        {profile && !profileLoading && (
          <StudentProfileView
            profile={profile}
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
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brass">HIS · Staff</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{t.analyticsTitle}</h2>
          <p className="mt-1 break-words text-sm text-ink-muted">{t.analyticsSubtitle}</p>
          <p className="mt-0.5 break-words font-mono text-[11px] text-ink-muted">{t.analyticsClickHint}</p>
        </div>
        <button type="button" onClick={onBack} className="intended-btn-ghost shrink-0">
          {t.backToWizard}
        </button>
      </div>

      <div className="analytics-card min-w-0 p-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block min-w-0">
            <span className="intended-label">{t.filterFrom}</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="intended-field"
            />
          </label>
          <label className="block min-w-0">
            <span className="intended-label">{t.filterTo}</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="intended-field"
            />
          </label>
          <label className="block min-w-0">
            <span className="intended-label">{t.filterStream}</span>
            <select
              value={filters.bacStream}
              onChange={(e) => setFilters((p) => ({ ...p, bacStream: e.target.value as BacStream | "" }))}
              className="intended-field"
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
              value={filters.specialtyCode}
              onChange={(e) => setFilters((p) => ({ ...p, specialtyCode: e.target.value }))}
              className="intended-field"
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
          <button type="button" onClick={applyFilters} className="intended-btn-primary">
            {t.applyFilters}
          </button>
          <button type="button" onClick={resetFilters} className="intended-btn-ghost">
            {t.resetFilters}
          </button>
          <a href={exportUrl} className="intended-btn-ghost inline-flex items-center">
            {t.exportCsv}
          </a>
        </div>
      </div>

      {error && (
        <div className="break-words rounded-sm border border-burgundy/40 bg-burgundy/10 px-3 py-2 text-sm text-burgundy">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => void load(applied)}>
            {t.retry}
          </button>
        </div>
      )}
      {loading && !dashboard && <p className="text-sm text-ink-muted">{t.analyticsLoading}</p>}
      {dashboard && (
        <AnalyticsDashboardPanel dashboard={dashboard} lang={lang} totalSessions={summary?.totalSessions} />
      )}

      {recent && (
        <section className="analytics-card min-w-0 overflow-hidden p-0">
          <div className="border-b border-brass-dim px-4 py-4 sm:px-5">
            <h3 className="font-display text-sm font-semibold tracking-tight text-ink">{t.recentSessions}</h3>
            <p className="break-words font-mono text-[11px] text-ink-muted">{t.analyticsClickHint}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-brass-dim bg-surface font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.colName}</th>
                  <th className="px-3 py-3 font-medium">{t.colDate}</th>
                  <th className="px-3 py-3 font-medium">{t.colTopSpecialty}</th>
                  <th className="px-4 py-3 font-medium">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {recent.rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                      {t.noSessions}
                    </td>
                  </tr>
                ) : (
                  recent.rows.map((row) => (
                    <tr
                      key={row.studentId}
                      className="border-t border-brass-dim/50 transition hover:bg-brass/5"
                    >
                      <td
                        className="max-w-[14rem] cursor-pointer truncate px-4 py-3 font-medium text-ink hover:text-brass"
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        {row.fullName}
                      </td>
                      <td
                        className="cursor-pointer whitespace-nowrap px-3 py-3 font-mono tabular-nums text-ink-muted"
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        {row.evaluatedAt?.slice(0, 19).replace("T", " ")}
                      </td>
                      <td
                        className="max-w-[16rem] cursor-pointer truncate px-3 py-3 text-ink"
                        onClick={() => setSelectedStudentId(row.studentId)}
                      >
                        {row.topSpecialtyTitle}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={deletingId === row.studentId}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(row.studentId, row.fullName);
                          }}
                          className="rounded-sm border border-burgundy/40 bg-burgundy/5 px-2 py-1 text-[10px] font-semibold text-burgundy hover:bg-burgundy/10 disabled:opacity-50"
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
