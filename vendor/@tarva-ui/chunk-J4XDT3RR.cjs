'use strict';

var nextThemes = require('next-themes');
var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

var ThemeContext = react.createContext(null);
function ThemeProvider({
  children,
  colorScheme: initialScheme = "tarva-core",
  defaultTheme = "dark",
  forcedTheme,
  enableSystem = true,
  storageKey = "tarva-ui-theme",
  disableTransitionOnChange = true
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    nextThemes.ThemeProvider,
    {
      attribute: "class",
      defaultTheme,
      forcedTheme,
      enableSystem,
      storageKey,
      disableTransitionOnChange,
      children: /* @__PURE__ */ jsxRuntime.jsx(ColorSchemeProvider, { colorScheme: initialScheme, children })
    }
  );
}
function ColorSchemeProvider({
  children,
  colorScheme: initialScheme
}) {
  const [colorScheme, setColorScheme] = react.useState(initialScheme);
  react.useEffect(() => {
    document.documentElement.setAttribute("data-color-scheme", colorScheme);
  }, [colorScheme]);
  return /* @__PURE__ */ jsxRuntime.jsx(ThemeContext.Provider, { value: { colorScheme, setColorScheme }, children });
}
function useTarvaTheme() {
  const context = react.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTarvaTheme must be used within a ThemeProvider");
  }
  return context;
}

Object.defineProperty(exports, "useNextTheme", {
  enumerable: true,
  get: function () { return nextThemes.useTheme; }
});
exports.ThemeProvider = ThemeProvider;
exports.useTarvaTheme = useTarvaTheme;
//# sourceMappingURL=chunk-J4XDT3RR.cjs.map
//# sourceMappingURL=chunk-J4XDT3RR.cjs.map