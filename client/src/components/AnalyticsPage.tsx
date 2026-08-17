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

const fieldClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-2 text-sm text-slate-900 shadow-sm dark:border-sky-800 dark:bg-slate-900 dark:text-sky-50";

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
    <div className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={onClose} className="mb-2 text-xs font-medium text-sky-700 hover:underline dark:text-sky-300">
            ← {t.backToList}
          </button>
          <h2 className="break-words text-2xl font-black tracking-tight text-slate-900 dark:text-sky-50">{profile.fullName}</h2>
          <p className="mt-1 break-words text-sm text-slate-600 dark:text-sky-200/80">
            {streamLabels[profile.bacStream as BacStream] ?? profile.bacStream}
            {" · "}{t.overallMarkShort}: {profile.overallBacMark.toFixed(2)}/20
            {profile.topRiasec ? ` · RIASEC ${profile.topRiasec.map((e) => e.letter).join("")}` : ""}
          </p>
          {(profile.preferredSpecialtyTitle || profile.preferredSpecialtyCode) && (
            <p className="mt-1.5 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
              <span className="opacity-70">{t.preferredSpecialty}:</span>
              <span className="break-words">{profile.preferredSpecialtyTitle ?? profile.preferredSpecialtyCode}</span>
              {profile.preferredSpecialtyCode && (
                <span className="font-mono text-[10px] opacity-60">({profile.preferredSpecialtyCode})</span>
              )}
            </p>
          )}
          <p className="mt-0.5 text-xs text-slate-500 dark:text-sky-300/60">
            {t.evaluatedAt}: {profile.matches[0]?.evaluatedAt?.slice(0, 19).replace("T", " ") ?? profile.createdAt}
          </p>
        </div>
        <button type="button" onClick={onDelete} disabled={deleting} className="shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {deleting ? t.deleting : t.deleteProfile}
        </button>
      </div>
      {top && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-300/80 bg-gradient-to-br from-sky-400/25 via-cyan-400/15 to-blue-500/20 p-5 shadow-lg shadow-sky-500/20 dark:border-sky-700/50">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-800 dark:text-sky-200">{t.topRecommendation}</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="break-words text-xl font-black text-slate-900 dark:text-sky-50">{top.specialtyTitle}</h3>
            <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${LABEL_STYLES[top.matchLabel]}`}>{matchLabelText(lang, top.matchLabel)}</span>
          </div>
          <p className="mt-2 text-4xl font-black tabular-nums text-sky-800 dark:text-sky-200">{top.finalScore.toFixed(1)}<span className="text-lg font-semibold text-slate-500">%</span></p>
        </div>
      )}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <section className="analytics-card min-w-0 p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-sky-50">{t.gradesHeading}</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {Object.entries(profile.grades).map(([code, value]) => (
              <li key={code} className="flex min-w-0 justify-between gap-2">
                <span className="min-w-0 truncate text-slate-700 dark:text-sky-100">{subjectLabels[code as SubjectCode] ?? code}</span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900 dark:text-white">{Number(value).toFixed(2)}</span>
              </li>
            ))}
            {Object.keys(profile.grades).length === 0 && <li className="text-slate-500">—</li>}
          </ul>
        </section>
        <section className="analytics-card min-w-0 p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-sky-50">{t.riasecTitle}</h3>
          {profile.topRiasec && profile.topRiasec.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {profile.topRiasec.map((entry, i) => (
                <li key={`${entry.letter}-${i}`} className="flex justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-sky-100">#{i + 1} {entry.letter}</span>
                  <span className="tabular-nums text-slate-700 dark:text-sky-200">{entry.weight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">—</p>
          )}
        </section>
      </div>
      <section className="min-w-0">
        <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-sky-50">{t.allMatches}</h3>
        <div className="space-y-2">
          {profile.matches.map((match) => (
            <article key={match.specialtyId} className={`min-w-0 overflow-hidden rounded-xl border p-3 ${match.rank === 1 ? "border-sky-300 bg-sky-100/80 dark:border-sky-700 dark:bg-sky-950/50" : "border-sky-200/80 bg-sky-50/50 dark:border-slate-700 dark:bg-slate-900/40"}`}>
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">#{match.rank}</span>
                    <h4 className="break-words text-sm font-bold text-slate-900 dark:text-sky-50">{match.specialtyTitle}</h4>
                    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${LABEL_STYLES[match.matchLabel]}`}>{matchLabelText(lang, match.matchLabel)}</span>
                  </div>
                  <p className="mt-0.5 break-words text-xs text-slate-600 dark:text-sky-200/70">{match.specialtyCode} · {match.department} · {match.hollandCode.join("-")}</p>
                </div>
                <div className="shrink-0 text-right"><div className="text-lg font-black tabular-nums text-sky-800 dark:text-sky-200">{match.finalScore.toFixed(1)}%</div></div>
              </div>
            </article>
          ))}
          {profile.matches.length === 0 && <p className="text-sm text-slate-500">{t.noMatches}</p>}
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

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    const params = { from: f.from || undefined, to: f.to || undefined, bacStream: f.bacStream || undefined, specialtyCode: f.specialtyCode || undefined, limit: 50 };
    try {
      const [s, d, r] = await Promise.all([fetchAnalyticsSummary(params), fetchAnalyticsDashboard(params), fetchAnalyticsRecent(params)]);
      setSummary(s); setDashboard(d); setRecent(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.analyticsError);
    } finally {
      setLoading(false);
    }
  }, [t.analyticsError]);

  useEffect(() => { void load(applied); }, [applied, load]);

  useEffect(() => {
    if (!selectedStudentId) { setProfile(null); setProfileError(null); return; }
    let cancelled = false;
    setProfileLoading(true); setProfileError(null);
    void fetchStudentProfile(selectedStudentId)
      .then((p) => { if (!cancelled) setProfile(p); })
      .catch((e) => { if (!cancelled) { setProfileError(e instanceof Error ? e.message : t.profileError); setProfile(null); } })
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [selectedStudentId, t.profileError]);

  const handleDelete = async (studentId: string, name: string) => {
    if (!window.confirm(t.deleteConfirm.replace("{name}", name))) return;
    if (config.adminAuthRequired !== false && !ensureAdminToken(lang)) return;
    setDeletingId(studentId); setError(null);
    try {
      await deleteStudentProfile(studentId);
      if (selectedStudentId === studentId) { setSelectedStudentId(null); setProfile(null); }
      await load(applied);
    } catch (e) {
      const message = e instanceof Error ? e.message : t.deleteError;
      if (message === "ADMIN_TOKEN_REQUIRED") { setStoredAdminToken(""); setError(t.adminTokenRejected); }
      else setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const applyFilters = () => setApplied({ ...filters });
  const resetFilters = () => { const empty = emptyFilters(); setFilters(empty); setApplied(empty); };
  const exportUrl = exportEvaluationsUrl({ from: applied.from || undefined, to: applied.to || undefined, bacStream: applied.bacStream || undefined, specialtyCode: applied.specialtyCode || undefined, anonymized: false });
  const specialties = config.specialties ?? [];

  if (selectedStudentId) {
    return (
      <div className="min-w-0 space-y-4">
        {profileLoading && <p className="text-sm text-slate-600 dark:text-slate-300">{t.profileLoading}</p>}
        {profileError && (
          <div className="rounded-lg border border-burgundy/40 bg-burgundy/10 px-3 py-2 text-sm text-burgundy dark:border-burgundy/50 dark:bg-burgundy/15 dark:text-burgundy">
            {profileError}
            <button type="button" className="ml-3 underline" onClick={() => setSelectedStudentId(null)}>{t.backToList}</button>
          </div>
        )}
        {profile && !profileLoading && (
          <StudentProfileView profile={profile} lang={lang} onClose={() => setSelectedStudentId(null)} onDelete={() => void handleDelete(profile.studentId, profile.fullName)} deleting={deletingId === profile.studentId} />
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-600 bg-clip-text text-2xl font-black tracking-tight text-transparent dark:from-sky-300 dark:via-blue-300 dark:to-cyan-300">{t.analyticsTitle}</h2>
          <p className="mt-1 break-words text-sm text-slate-600 dark:text-sky-200/80">{t.analyticsSubtitle}</p>
          <p className="mt-1 break-words text-xs text-slate-500 dark:text-sky-300/60">{t.analyticsClickHint}</p>
        </div>
        <button type="button" onClick={onBack} className="shrink-0 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-sky-100 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-100">{t.backToWizard}</button>
      </div>

      <div className="analytics-card analytics-mesh min-w-0 p-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block min-w-0 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-sky-200">{t.filterFrom}<input type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} className={fieldClass} /></label>
          <label className="block min-w-0 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-sky-200">{t.filterTo}<input type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} className={fieldClass} /></label>
          <label className="block min-w-0 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-sky-200">{t.filterStream}<select value={filters.bacStream} onChange={(e) => setFilters((p) => ({ ...p, bacStream: e.target.value as BacStream | "" }))} className={fieldClass}><option value="">{t.filterAll}</option>{config.bacStreams.map((s) => (<option key={s} value={s}>{streamLabels[s]}</option>))}</select></label>
          <label className="block min-w-0 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-sky-200">{t.filterSpecialty}<select value={filters.specialtyCode} onChange={(e) => setFilters((p) => ({ ...p, specialtyCode: e.target.value }))} className={fieldClass}><option value="">{t.filterAll}</option>{specialties.map((s) => (<option key={s.code} value={s.code}>{s.title}</option>))}</select></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={applyFilters} className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-500/30 hover:brightness-110">{t.applyFilters}</button>
          <button type="button" onClick={resetFilters} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-100">{t.resetFilters}</button>
          <a href={exportUrl} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-100">{t.exportCsv}</a>
        </div>
      </div>

      {error && (<div className="break-words rounded-xl border border-burgundy/40 bg-burgundy/10 px-3 py-2 text-sm text-burgundy dark:border-burgundy/50 dark:bg-burgundy/15 dark:text-burgundy">{error}<button type="button" className="ml-3 underline" onClick={() => void load(applied)}>{t.retry}</button></div>)}
      {loading && !dashboard && <p className="text-sm text-slate-600 dark:text-slate-300">{t.analyticsLoading}</p>}
      {dashboard && <AnalyticsDashboardPanel dashboard={dashboard} lang={lang} totalSessions={summary?.totalSessions} />}

      {recent && (
        <section className="analytics-card min-w-0 overflow-hidden p-0">
          <div className="border-b border-sky-200/80 px-4 py-4 sm:px-5 dark:border-sky-900">
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-sky-50">{t.recentSessions}</h3>
            <p className="break-words text-[11px] text-slate-500 dark:text-sky-300/60">{t.analyticsClickHint}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-sky-100/80 text-[10px] uppercase tracking-wider text-slate-600 dark:bg-slate-950/60 dark:text-sky-300/70">
                <tr><th className="px-4 py-3 font-bold">{t.colName}</th><th className="px-3 py-3 font-bold">{t.colDate}</th><th className="px-3 py-3 font-bold">{t.colTopSpecialty}</th><th className="px-4 py-3 font-bold">{t.colActions}</th></tr>
              </thead>
              <tbody>
                {recent.rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">{t.noSessions}</td></tr>
                ) : (
                  recent.rows.map((row) => (
                    <tr key={row.studentId} className="border-t border-sky-100/90 transition hover:bg-sky-100/70 dark:border-slate-800 dark:hover:bg-sky-950/40">
                      <td className="max-w-[14rem] cursor-pointer truncate px-4 py-3 font-bold text-sky-800 dark:text-sky-200" onClick={() => setSelectedStudentId(row.studentId)}>{row.fullName}</td>
                      <td className="cursor-pointer whitespace-nowrap px-3 py-3 tabular-nums text-slate-600 dark:text-sky-200/70" onClick={() => setSelectedStudentId(row.studentId)}>{row.evaluatedAt?.slice(0, 19).replace("T", " ")}</td>
                      <td className="max-w-[16rem] cursor-pointer truncate px-3 py-3 font-medium text-slate-900 dark:text-sky-50" onClick={() => setSelectedStudentId(row.studentId)}>{row.topSpecialtyTitle}</td>
                      <td className="px-4 py-3">
                        <button type="button" disabled={deletingId === row.studentId} onClick={(e) => { e.stopPropagation(); void handleDelete(row.studentId, row.fullName); }} className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
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
