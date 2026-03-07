import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type Theme = {
  bg: string;
  sidebar: string;
  card: string;
  border: string;
  text: string;
  subtext: string;
  muted: string;
  hover: string;
  inputBg: string;
};

export const dark: Theme = {
  bg: "#0a0a0a",
  sidebar: "#111",
  card: "#111",
  border: "#1f1f1f",
  text: "#eeeeee",
  subtext: "#888",
  muted: "#444",
  hover: "#ffffff08",
  inputBg: "#0f0f0f",
};

export const light: Theme = {
  bg: "#f4f6fa",
  sidebar: "#ffffff",
  card: "#ffffff",
  border: "#e8eaf0",
  text: "#111111",
  subtext: "#666",
  muted: "#bbb",
  hover: "#00000005",
  inputBg: "#f9fafc",
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  t: Theme;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
  t: dark,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, t: isDark ? dark : light }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook utilitaire
export const useTheme = () => useContext(ThemeContext);