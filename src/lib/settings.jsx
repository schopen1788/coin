import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const SettingsContext = createContext(null);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) — settings just won't persist
  }
}

export function SettingsProvider({ children }) {
  const [currency, setCurrency] = useState(() => load("currency", "krw"));
  const [theme, setTheme] = useState(() => load("theme", null));
  const [favorites, setFavorites] = useState(() => load("favorites", []));

  useEffect(() => save("currency", currency), [currency]);
  useEffect(() => save("favorites", favorites), [favorites]);
  useEffect(() => {
    save("theme", theme);
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const current = t || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ currency, setCurrency, theme, toggleTheme, favorites, toggleFavorite }),
    [currency, theme, toggleTheme, favorites, toggleFavorite]
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
