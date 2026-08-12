export const Colors = {
  // Dark base
  background: '#0A0A0F',
  surface: '#13131C',
  surfaceElevated: '#1C1C2A',
  surfaceBorder: '#2A2A3D',

  // Brand — deep violet-purple
  primary: '#7C5CFC',
  primaryDim: '#4A3499',
  primaryGlow: 'rgba(124, 92, 252, 0.25)',

  // Safe Show accent — teal
  safeGreen: '#00D4AA',
  safeGreenDim: '#00876C',
  safeGreenGlow: 'rgba(0, 212, 170, 0.2)',

  // Danger
  danger: '#FF4D6A',
  dangerDim: '#99172B',

  // Text
  textPrimary: '#F0F0F8',
  textSecondary: '#9090B0',
  textMuted: '#505070',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.85)',
  overlayLight: 'rgba(0,0,0,0.5)',
  transparent: 'transparent',
};

export const Typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 17,
  fontSizeXL: 22,
  fontSizeXXL: 28,
  fontSizeDisplay: 36,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightExtraBold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
