import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { queryClient } from "@/lib/queryClient";
import i18n from "@/i18n";

export interface Preferences {
  currency: string;
  language: string;
  setCurrency: (c: string) => void;
  setLanguage: (l: string) => void;
}

const PreferencesContext = createContext<Preferences>({
  currency: "USD",
  language: "EN",
  setCurrency: () => {},
  setLanguage: () => {},
});

export const LANG_TO_NATIONALITY: Record<string, string> = {
  EN: "US", FR: "FR", TR: "TR", NL: "NL", ES: "ES", DE: "DE",
  IT: "IT", AR: "SA", PT: "PT", EL: "GR", RO: "RO", RU: "RU",
  JA: "JP", ZH: "CN", KO: "KR",
};

function load(key: string, fallback: string): string {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [currency, _setCurrency] = useState(() => load("lv_currency", "USD"));
  const [language, _setLanguage] = useState(() => load("lv_language", "EN"));

  const setCurrency = (c: string) => {
    _setCurrency(c);
    try { localStorage.setItem("lv_currency", c); } catch {}
    queryClient.invalidateQueries();
  };

  const setLanguage = (l: string) => {
    _setLanguage(l);
    try { localStorage.setItem("lv_language", l); } catch {}
    i18n.changeLanguage(l);
    queryClient.invalidateQueries();
  };

  return (
    <PreferencesContext.Provider value={{ currency, language, setCurrency, setLanguage }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
