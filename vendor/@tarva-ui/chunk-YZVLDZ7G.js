import { ThemeProvider as ThemeProvider$1 } from 'next-themes';
export { useTheme as useNextTheme } from 'next-themes';
import { createContext, useState, useEffect, useContext } from 'react';
import { jsx } from 'react/jsx-runtime';

var ThemeContext = createContext(null);
function ThemeProvider({
  children,
  colorScheme: initialScheme = "tarva-core",
  defaultTheme = "dark",
  forcedTheme,
  enableSystem = true,
  storageKey = "tarva-ui-theme",
  disableTransitionOnChange = true
}) {
  return /* @__PURE__ */ jsx(
    ThemeProvider$1,
    {
      attribute: "class",
      defaultTheme,
      forcedTheme,
      enableSystem,
      storageKey,
      disableTransitionOnChange,
      children: /* @__PURE__ */ jsx(ColorSchemeProvider, { colorScheme: initialScheme, children })
    }
  );
}
function ColorSchemeProvider({
  children,
  colorScheme: initialScheme
}) {
  const [colorScheme, setColorScheme] = useState(initialScheme);
  useEffect(() => {
    document.documentElement.setAttribute("data-color-scheme", colorScheme);
  }, [colorScheme]);
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { colorScheme, setColorScheme }, children });
}
function useTarvaTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTarvaTheme must be used within a ThemeProvider");
  }
  return context;
}

export { ThemeProvider, useTarvaTheme };
//# sourceMappingURL=chunk-YZVLDZ7G.js.map
//# sourceMappingURL=chunk-YZVLDZ7G.js.map