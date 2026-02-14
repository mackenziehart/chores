import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  primaryHue: number;
  accentHue: number;
  setPrimaryHue: (hue: number) => void;
  setAccentHue: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function generateThemeColors(primaryHue: number, accentHue: number, isDark: boolean) {
  if (!isDark) {
    return {
      "--primary": `${primaryHue} 72% 52%`,
      "--primary-foreground": `${primaryHue} 20% 98%`,
      "--sidebar-primary": `${primaryHue} 72% 48%`,
      "--sidebar-primary-foreground": `${primaryHue} 20% 98%`,
      "--ring": `${primaryHue} 50% 55%`,
      "--sidebar-ring": `${primaryHue} 50% 55%`,
      "--chart-1": `${primaryHue} 70% 45%`,
      "--background": `${accentHue} 5% 97%`,
      "--foreground": `${accentHue} 8% 15%`,
      "--border": `${accentHue} 6% 88%`,
      "--card": `${accentHue} 5% 95%`,
      "--card-foreground": `${accentHue} 8% 15%`,
      "--card-border": `${accentHue} 6% 90%`,
      "--sidebar": `${accentHue} 5% 93%`,
      "--sidebar-foreground": `${accentHue} 8% 15%`,
      "--sidebar-border": `${accentHue} 6% 86%`,
      "--sidebar-accent": `${accentHue} 12% 87%`,
      "--sidebar-accent-foreground": `${accentHue} 10% 20%`,
      "--popover": `${accentHue} 6% 91%`,
      "--popover-foreground": `${accentHue} 8% 18%`,
      "--popover-border": `${accentHue} 6% 85%`,
      "--secondary": `${accentHue} 12% 87%`,
      "--secondary-foreground": `${accentHue} 10% 20%`,
      "--muted": `${accentHue} 8% 89%`,
      "--muted-foreground": `${accentHue} 6% 35%`,
      "--accent": `${accentHue} 15% 90%`,
      "--accent-foreground": `${accentHue} 10% 22%`,
      "--input": `${accentHue} 10% 65%`,
    };
  } else {
    return {
      "--primary": `${primaryHue} 68% 58%`,
      "--primary-foreground": `${primaryHue} 10% 98%`,
      "--sidebar-primary": `${primaryHue} 68% 55%`,
      "--sidebar-primary-foreground": `${primaryHue} 10% 98%`,
      "--ring": `${primaryHue} 60% 60%`,
      "--sidebar-ring": `${primaryHue} 60% 60%`,
      "--chart-1": `${primaryHue} 75% 65%`,
      "--background": `${accentHue} 4% 8%`,
      "--foreground": `${accentHue} 5% 92%`,
      "--border": `${accentHue} 4% 18%`,
      "--card": `${accentHue} 4% 10%`,
      "--card-foreground": `${accentHue} 5% 92%`,
      "--card-border": `${accentHue} 4% 14%`,
      "--sidebar": `${accentHue} 4% 12%`,
      "--sidebar-foreground": `${accentHue} 5% 90%`,
      "--sidebar-border": `${accentHue} 4% 16%`,
      "--sidebar-accent": `${accentHue} 10% 17%`,
      "--sidebar-accent-foreground": `${accentHue} 8% 88%`,
      "--popover": `${accentHue} 5% 14%`,
      "--popover-foreground": `${accentHue} 5% 90%`,
      "--popover-border": `${accentHue} 4% 19%`,
      "--secondary": `${accentHue} 10% 20%`,
      "--secondary-foreground": `${accentHue} 8% 88%`,
      "--muted": `${accentHue} 8% 18%`,
      "--muted-foreground": `${accentHue} 6% 70%`,
      "--accent": `${accentHue} 12% 16%`,
      "--accent-foreground": `${accentHue} 8% 86%`,
      "--input": `${accentHue} 8% 45%`,
    };
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("chore-theme") as Theme) || "light";
    }
    return "light";
  });

  const [primaryHue, setPrimaryHueState] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("chore-primary-hue") || "345");
    }
    return 345;
  });

  const [accentHue, setAccentHueState] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("chore-accent-hue") || "24");
    }
    return 24;
  });

  const applyColors = useCallback((pHue: number, aHue: number, isDark: boolean) => {
    const colors = generateThemeColors(pHue, aHue, isDark);
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("chore-theme", theme);
    applyColors(primaryHue, accentHue, theme === "dark");
  }, [theme, primaryHue, accentHue, applyColors]);

  const toggleTheme = () => setThemeState((t) => (t === "light" ? "dark" : "light"));
  const setTheme = (t: Theme) => setThemeState(t);

  const setPrimaryHue = (hue: number) => {
    setPrimaryHueState(hue);
    localStorage.setItem("chore-primary-hue", String(hue));
  };

  const setAccentHue = (hue: number) => {
    setAccentHueState(hue);
    localStorage.setItem("chore-accent-hue", String(hue));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme, primaryHue, accentHue, setPrimaryHue, setAccentHue }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
