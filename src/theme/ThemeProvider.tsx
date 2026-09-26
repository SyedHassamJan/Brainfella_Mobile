import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router';
import { VariableContextProvider } from 'nativewind';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { cssVars, palette, type ColorScheme, type Palette } from './tokens';

interface ThemeValue {
  scheme: ColorScheme;
  /** Raw hex values, for things className can't reach (icon colors, gradients, shadows). */
  colors: Palette;
}

const ThemeContext = createContext<ThemeValue>({ scheme: 'light', colors: palette.light });

/**
 * Supplies the light/dark design tokens to NativeWind classes AND to React
 * Navigation (so screen backgrounds never flash white between transitions).
 * Follows the phone's appearance setting.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const scheme: ColorScheme = system === 'dark' ? 'dark' : 'light';

  const value = useMemo(() => ({ scheme, colors: palette[scheme] }), [scheme]);
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    const c = palette[scheme];
    return {
      ...base,
      colors: { ...base.colors, background: c.canvas, card: c.surface, text: c.ink, border: c.line, primary: c.primary },
    };
  }, [scheme]);

  return (
    <ThemeContext.Provider value={value}>
      <VariableContextProvider value={cssVars[scheme]}>
        <NavThemeProvider value={navTheme}>{children}</NavThemeProvider>
      </VariableContextProvider>
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
