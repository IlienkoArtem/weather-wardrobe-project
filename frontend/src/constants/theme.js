// frontend/src/constants/theme.js

export const COLORS = {
  // Sky gradient palette
  skyDeep: '#0B3D91',
  skyMid: '#1565C0',
  skyLight: '#42A5F5',
  skyFog: '#90CAF9',
  cloud: '#E3F2FD',
  white: '#FFFFFF',

  // Accent
  sunYellow: '#FFD54F',
  warmOrange: '#FF8A65',

  // Text
  textPrimary: '#0D1B2A',
  textSecondary: '#455A64',
  textMuted: '#90A4AE',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.75)',

  // Surface
  surface: '#FFFFFF',
  surfaceCard: 'rgba(255,255,255,0.92)',
  surfaceGlass: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.3)',
  borderLight: '#E3F2FD',

  // Status
  success: '#66BB6A',
  danger: '#EF5350',
  warning: '#FFA726',

  // Overlay
  overlay: 'rgba(11, 61, 145, 0.55)',
};

export const FONTS = {
  // Font families (ensure these are loaded via expo-font or system fonts)
  display: 'System',   // Replace with custom font if loaded
  body: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#0B3D91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const CATEGORY_LABELS = {
  head: 'Голова',
  torso: 'Верх',
  legs: 'Низ',
  feet: 'Взуття',
};