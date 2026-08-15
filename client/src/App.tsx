import { useCallback, useEffect, useRef, useState } from "react";
import { StepIndicator } from "./components/StepIndicator";
import { Step1AcademicForm } from "./components/Step1AcademicForm";
import { Step2RiasecForm } from "./components/Step2RiasecForm";
import { Step3Results } from "./components/Step3Results";
import { useRecommendationWizard } from "./hooks/useRecommendationWizard";
import { fetchConfig } from "./lib/api";
import type { ConfigResponse, TopRiasecProfile } from "./types";
import type { Lang } from "./i18n/strings";
import { strings } from "./i18n/strings";

function App() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("fr");
  const t = strings[lang];
  const loadedOnce = useRef(false);

  const wizard = useRecommendationWizard(config, lang);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const data = await fetchConfig();
      setConfig(data);
      loadedOnce.current = true;
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : strings.fr.configError);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadedOnce.current) return;
    void loadConfig();
  }, [loadConfig]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">{t.appTitle}</h1>
            <p className="text-xs text-slate-500">{t.appSubtitle}</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{t.language}</span>
            <select
              className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-4 text-center text-xs text-slate-500">{t.disclaimer}</p>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {configLoading && (
            <div className="animate-pulse space-y-3" aria-busy="true">
              <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
              <p className="text-sm text-slate-500">{t.loadingConfig}</p>
            </div>
          )}

          {configError && (
            <div className="space-y-3">
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {configError}
              </p>
              <button
                type="button"
                onClick={() => void loadConfig()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {t.retry}
              </button>
            </div>
          )}

          {config && !configError && (
            <>
              <StepIndicator step={wizard.step} lang={lang} onGoToStep={wizard.goToStep} />

              {wizard.error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  <p className="font-medium">{wizard.error}</p>
                  {Object.keys(wizard.fieldErrors).length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {Object.values(wizard.fieldErrors)
                        .filter(Boolean)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .map((msg) => (
                          <li key={msg}>{msg}</li>
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
                  disabled={wizard.loading}
                  onFullName={wizard.setFullName}
                  onBacStream={wizard.setBacStream}
                  onTechnicalOption={wizard.setTechnicalOption}
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
                  disabled={wizard.loading}
                  onSlotChange={wizard.setTopRiasecSlot}
                />
              )}

              {wizard.step === 3 && wizard.result && (
                <Step3Results
                  result={wizard.result}
                  topRiasec={wizard.form.topRiasec as TopRiasecProfile}
                  onReset={wizard.reset}
                  lang={lang}
                  genieLabels={config.technicalMathOptionLabels}
                />
              )}

              {wizard.step !== 3 && (
                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={wizard.goBack}
                    disabled={wizard.step === 1 || wizard.loading}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t.back}
                  </button>
                  <button
                    type="button"
                    onClick={wizard.goNext}
                    disabled={wizard.loading}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {wizard.loading
                      ? t.calculating
                      : wizard.step === 2
                        ? t.calculate
                        : t.continue}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
