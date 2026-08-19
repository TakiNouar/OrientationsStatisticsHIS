import { useCallback, useEffect, useState } from "react";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { Step1AcademicForm } from "./components/Step1AcademicForm";
import { Step2RiasecForm } from "./components/Step2RiasecForm";
import { Step3Results } from "./components/Step3Results";
import { StepIndicator } from "./components/StepIndicator";
import { useRecommendationWizard } from "./hooks/useRecommendationWizard";
import { fetchConfig } from "./lib/api";
import { cycleThemeMode, loadThemeMode, type ThemeMode } from "./lib/theme";
import type { ConfigResponse } from "./types";
import type { Lang } from "./i18n/strings";
import { strings } from "./i18n/strings";

type Route = "wizard" | "analytics";

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem("his-sre-lang");
      if (v === "en" || v === "fr") return v;
    } catch {
      /* ignore */
    }
    return "fr";
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode());
  const [route, setRoute] = useState<Route>("wizard");
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const t = strings[lang];
  const wizard = useRecommendationWizard(config, lang);

  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    void fetchConfig()
      .then((c) => {
        if (!cancelled) {
          setConfig(c);
          setConfigError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setConfigError(e instanceof Error ? e.message : t.configError);
          setConfig(null);
        }
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t.configError]);

  useEffect(() => {
    try {
      localStorage.setItem("his-sre-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const onCycleTheme = useCallback(() => {
    setThemeMode((m) => cycleThemeMode(m));
  }, []);

  if (configLoading) {
    return (
      <div className="analytics-mesh flex min-h-screen flex-col items-center justify-center gap-3 p-6 font-body text-ink">
        <div className="intended-skeleton h-8 w-48" />
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">{t.loading}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="analytics-mesh flex min-h-screen flex-col items-center justify-center gap-3 p-6 font-body text-ink">
        <p className="text-burgundy">{configError ?? t.configError}</p>
        <button type="button" className="intended-btn-primary" onClick={() => window.location.reload()}>
          {t.retry}
        </button>
      </div>
    );
  }

  const navBtn = (active: boolean) =>
    [
      "rounded-sm px-3 py-1.5 text-xs font-medium tracking-wide transition-colors",
      active
        ? "bg-brass/10 text-brass"
        : "text-ink-muted hover:bg-brass/5 hover:text-brass",
    ].join(" ");

  return (
    <div className="analytics-mesh min-h-screen font-body text-ink">
      <header className="intended-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3.5 sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brass">
              HIS · Higher Institute of Science
            </p>
            <h1 className="truncate font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {t.appTitle}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <nav
              className="flex items-center gap-0.5 border-r border-brass-dim/60 pr-2.5 sm:pr-3.5"
              aria-label="Primary"
            >
              <button type="button" className={navBtn(route === "wizard")} onClick={() => setRoute("wizard")}>
                {t.navWizard}
              </button>
              <button
                type="button"
                className={navBtn(route === "analytics")}
                onClick={() => setRoute("analytics")}
              >
                {t.navAnalytics}
              </button>
            </nav>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="rounded-sm px-2 py-1.5 text-[11px] font-medium tracking-wide text-ink-muted transition-colors hover:text-brass"
                onClick={() => setLang((l) => (l === "fr" ? "en" : "fr"))}
              >
                {lang === "fr" ? "EN" : "FR"}
              </button>
              <button
                type="button"
                className="rounded-sm px-2 py-1.5 text-sm text-ink-muted transition-colors hover:text-brass"
                onClick={onCycleTheme}
                aria-label={`Theme: ${themeMode}. Click to change.`}
                title={themeMode === "system" ? "System" : themeMode === "dark" ? "Dark" : "Light"}
              >
                {themeMode === "system" ? "◐" : themeMode === "dark" ? "☾" : "☀"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-8 sm:py-10 ${route === "analytics" ? "max-w-4xl" : "max-w-2xl"}`}>
        {route === "analytics" ? (
          <AnalyticsPage config={config} lang={lang} onBack={() => setRoute("wizard")} />
        ) : (
          <div className="analytics-rise space-y-6">
            <p className="text-center text-[11px] leading-relaxed tracking-wide text-ink-muted/80">{t.disclaimer}</p>
            <div className="analytics-card p-6 sm:p-8">
              <StepIndicator step={wizard.step} lang={lang} onGoToStep={wizard.goToStep} />

              {wizard.error && (
                <div className="mb-4 border border-burgundy/40 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">
                  <p className="font-medium">{wizard.error}</p>
                  {Object.keys(wizard.fieldErrors).length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {Object.values(wizard.fieldErrors)
                        .filter(Boolean)
                        .map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                    </ul>
                  )}
                </div>
              )}

              {wizard.step === 1 && (
                <Step1AcademicForm
                  config={config}
                  form={wizard.form}
                  lang={lang}
                  fieldErrors={wizard.fieldErrors}
                  disabled={wizard.submitting}
                  onFullName={wizard.setFullName}
                  onBacStream={wizard.setBacStream}
                  onTechnicalOption={wizard.setTechnicalOption}
                  onPreferredSpecialty={wizard.setPreferredSpecialty}
                  onOverallBacMark={wizard.setOverallBacMark}
                  onGrade={wizard.setGrade}
                />
              )}

              {wizard.step === 2 && (
                <Step2RiasecForm
                  config={config}
                  form={wizard.form}
                  availableLetters={wizard.availableLetters}
                  lang={lang}
                  fieldErrors={wizard.fieldErrors}
                  disabled={wizard.submitting}
                  onSlotChange={wizard.setRiasecSlot}
                />
              )}

              {wizard.step === 3 && wizard.result && (
                <Step3Results
                  result={wizard.result}
                  topRiasec={wizard.form.topRiasec.filter(Boolean) as never}
                  onReset={wizard.reset}
                  lang={lang}
                  genieLabels={config.technicalMathOptionLabels}
                />
              )}

              {wizard.step !== 3 && (
                <div className="mt-8 flex justify-between gap-3 border-t border-brass-dim pt-6">
                  <button
                    type="button"
                    className="intended-btn-ghost"
                    disabled={wizard.step === 1 || wizard.submitting}
                    onClick={() => wizard.goToStep((wizard.step - 1) as 1 | 2)}
                  >
                    {t.back}
                  </button>
                  <button
                    type="button"
                    className="intended-btn-primary"
                    disabled={wizard.submitting}
                    onClick={() => void wizard.next()}
                  >
                    {wizard.submitting ? t.calculating : wizard.step === 2 ? t.calculate : t.continue}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
