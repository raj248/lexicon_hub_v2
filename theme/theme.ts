// theme.ts
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    // Brand primary: Rose (vibrant, attention-grabbing)
    primary: '#f72585',
    onPrimary: '#ffffff',
    primaryContainer: '#fdd4e6', // rose-900
    onPrimaryContainer: '#37021a', // rose-100

    // Secondary: Neon Blue (bright, strong accent)
    secondary: '#4361ee',
    onSecondary: '#ffffff',
    secondaryContainer: '#dae0fc', // neon_blue-900
    onSecondaryContainer: '#0a1d70', // neon_blue-200

    // Tertiary: Vivid Sky Blue (fresh contrast)
    tertiary: '#4cc9f0',
    onTertiary: '#052e3a', // vivid_sky_blue-100
    tertiaryContainer: '#dbf4fc',
    onTertiaryContainer: '#095c75', // vivid_sky_blue-200

    // Error (keep a bold red for clarity)
    error: '#dc2626',
    onError: '#ffffff',
    errorContainer: '#fcdada',
    onErrorContainer: '#450a0a',

    // Background / Surface
    background: '#ffffff',
    onBackground: '#1d1b1e',
    surface: '#ffffff',
    onSurface: '#1d1b1e',
    surfaceVariant: '#f3f0f8', // light lavender-neutral from grape family
    onSurfaceVariant: '#4a4458',

    // Outline & Shadows
    outline: '#a29bb0',
    outlineVariant: '#d6d1e1',
    shadow: '#000000',
    scrim: '#000000',

    // Inverse colors
    inverseSurface: '#2f2a35',
    inverseOnSurface: '#f3eef5',
    inversePrimary: '#b5179e', // Fandango as a dark inverse accent

    // Elevation
    elevation: {
      level0: 'transparent',
      level1: '#f7f5fa',
      level2: '#f3f0f8',
      level3: '#efecf6',
      level4: '#ece8f4',
      level5: '#e8e4f2',
    },

    // Disabled & Backdrop
    surfaceDisabled: 'rgba(29, 27, 30, 0.12)',
    onSurfaceDisabled: 'rgba(29, 27, 30, 0.38)',
    backdrop: 'rgba(50, 47, 55, 0.4)',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    // Brand primary: Rose (bright pop against dark bg)
    primary: '#f72585',
    onPrimary: '#ffffff',
    primaryContainer: '#6e0434', // rose-200
    onPrimaryContainer: '#fca8ce', // rose-800

    // Secondary: Neon Blue (glows well in dark UI)
    secondary: '#4361ee',
    onSecondary: '#ffffff',
    secondaryContainer: '#0a1d70', // neon_blue-200
    onSecondaryContainer: '#b4c1f8', // neon_blue-800

    // Tertiary: Vivid Sky Blue (cool contrast)
    tertiary: '#4cc9f0',
    onTertiary: '#052e3a', // vivid_sky_blue-100
    tertiaryContainer: '#095c75', // vivid_sky_blue-200
    onTertiaryContainer: '#b7eaf9', // vivid_sky_blue-800

    // Error
    error: '#ef4444',
    onError: '#ffffff',
    errorContainer: '#7f1d1d',
    onErrorContainer: '#fecaca',

    // Background & Surface
    background: '#0b0220', // zaffre-100 (deep midnight indigo)
    onBackground: '#e5c3fc', // grape-900 (soft lavender text)
    surface: '#110223', // chrysler_blue-100
    onSurface: '#e8e4f2',
    surfaceVariant: '#1c0543', // dark_blue-200
    onSurfaceVariant: '#b2afe9', // palatinate_blue-800

    // Outline & Shadows
    outline: '#655fd3',
    outlineVariant: '#2e034a',
    shadow: '#000000',
    scrim: '#000000',

    // Inverse
    inverseSurface: '#f3eef5',
    inverseOnSurface: '#2f2a35',
    inversePrimary: '#b5179e', // Fandango for inverse pop

    // Elevation
    elevation: {
      level0: 'transparent',
      level1: '#170225',
      level2: '#1c0543',
      level3: '#220761',
      level4: '#2b0764',
      level5: '#340768',
    },

    // Disabled & Backdrop
    surfaceDisabled: 'rgba(243, 244, 246, 0.12)',
    onSurfaceDisabled: 'rgba(243, 244, 246, 0.38)',
    backdrop: 'rgba(11, 2, 32, 0.6)',
  },
};
