/**
 * Theme configuration for eSports MOBA Manager
 * Centralized styling and design system
 */

// Color palette inspired by mobile gaming and eSports
export const colors = {
  // Primary brand colors
  primary: {
    main: '#6366F1',     // Indigo - Main brand color
    light: '#818CF8',    // Light indigo
    dark: '#4338CA',     // Dark indigo
    contrast: '#FFFFFF', // White for contrast
  },
  
  // Secondary colors
  secondary: {
    main: '#10B981',     // Emerald - Success/positive actions
    light: '#34D399',    // Light emerald
    dark: '#059669',     // Dark emerald
    contrast: '#FFFFFF',
  },
  
  // Accent colors
  accent: {
    gold: '#F59E0B',     // Gold for premium features
    orange: '#F97316',   // Orange for highlights
    red: '#EF4444',      // Red for bans/danger
    blue: '#3B82F6',     // Blue for picks/matches
    purple: '#8B5CF6',   // Purple for drafts
  },
  
  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  
  // Semantic colors
  background: {
    primary: '#FFFFFF',     // Main background
    secondary: '#F9FAFB',   // Secondary surfaces
    tertiary: '#F3F4F6',    // Cards/panels
    dark: '#1F2937',        // Dark mode background
    overlay: 'rgba(0,0,0,0.5)', // Modal overlays
  },
  
  text: {
    primary: '#111827',     // Main text
    secondary: '#6B7280',   // Secondary text
    tertiary: '#9CA3AF',    // Tertiary text
    inverse: '#FFFFFF',     // Text on dark backgrounds
    placeholder: '#D1D5DB', // Placeholder text
  },
  
  border: {
    light: '#E5E7EB',       // Light borders
    medium: '#D1D5DB',      // Medium borders
    dark: '#9CA3AF',        // Dark borders
    focus: '#6366F1',       // Focus state borders
  },
  
  // Status colors
  status: {
    success: '#10B981',     // Success states
    warning: '#F59E0B',     // Warning states
    error: '#EF4444',       // Error states
    info: '#3B82F6',        // Info states
  },
};

// Typography system
export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',     // System font stack
    bold: 'System',        // Bold weight
    mono: 'System',        // Monospace for numbers/codes
  },
  
  // Font sizes (spaced scale)
  fontSize: {
    xs: 12,      // Extra small
    sm: 14,      // Small
    base: 16,    // Base
    lg: 18,      // Large
    xl: 20,      // Extra large
    '2xl': 24,   // 2X large
    '3xl': 30,   // 3X large
    '4xl': 36,   // 4X large
    '5xl': 48,   // 5X large
  },
  
  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: 0,
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing system (based on 4px grid)
export const spacing = {
  px: 1,
  0: 0,
  1: 4,      // 1 * 4px = 4px
  2: 8,      // 2 * 4px = 8px
  3: 12,     // 3 * 4px = 12px
  4: 16,     // 4 * 4px = 16px
  5: 20,     // 5 * 4px = 20px
  6: 24,     // 6 * 4px = 24px
  7: 28,     // 7 * 4px = 28px
  8: 32,     // 8 * 4px = 32px
  9: 36,     // 9 * 4px = 36px
  10: 40,    // 10 * 4px = 40px
  11: 44,    // 11 * 4px = 44px
  12: 48,    // 12 * 4px = 48px
  14: 56,    // 14 * 4px = 56px
  16: 64,    // 16 * 4px = 64px
  20: 80,    // 20 * 4px = 80px
  24: 96,    // 24 * 4px = 96px
  28: 112,   // 28 * 4px = 112px
  32: 128,   // 32 * 4px = 128px
};

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,         // Small radius
  base: 6,       // Base radius
  md: 8,         // Medium radius
  lg: 12,        // Large radius
  xl: 16,        // Extra large radius
  '2xl': 24,     // 2X large radius
  '3xl': 32,     // 3X large radius
  full: 9999,    // Full circle radius
};

// Shadow system
export const shadows = {
  sm: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  lg: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  xl: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 32,
  },
};

// Animation durations
export const durations = {
  fast: 150,        // Fast transitions
  base: 250,        // Base transition
  slow: 350,        // Slow transitions
  slower: 500,      // Very slow transitions
};

// Easing functions
export const easing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  back: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Z-index layers
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Screen breakpoints (for responsive design)
export const breakpoints = {
  sm: 640,    // Small screens
  md: 768,    // Medium screens
  lg: 1024,   // Large screens
  xl: 1280,   // Extra large screens
};

// Role-specific colors (for MOBA draft visualization)
export const roleColors = {
  goldlane: {
    main: '#F59E0B',     // Gold for gold lane
    light: '#FBBF24',
    dark: '#D97706',
  },
  'exp_su': {
    main: '#EF4444',     // Red for exp lane
    light: '#F87171',
    dark: '#DC2626',
  },
  midlane: {
    main: '#3B82F6',     // Blue for mid lane
    light: '#60A5FA',
    dark: '#2563EB',
  },
  jungle: {
    main: '#10B981',     // Green for jungle
    light: '#34D399',
    dark: '#059669',
  },
  roam: {
    main: '#8B5CF6',     // Purple for roam
    light: '#A78BFA',
    dark: '#7C3AED',
  },
};

// Hero rarity colors
export const heroRarity = {
  common: colors.neutral.gray[400],
  rare: colors.accent.blue,
  epic: colors.accent.purple,
  legendary: colors.accent.gold,
};

// Status colors for game states
export const gameStatus = {
  scheduled: colors.accent.blue,
  drafting: colors.accent.purple,
  'in_progress': colors.secondary.main,
  completed: colors.status.success,
  cancelled: colors.status.error,
};

// Draft phase colors
export const draftPhase = {
  waiting: colors.neutral.gray[400],
  ban: colors.status.error,
  pick: colors.accent.blue,
  completed: colors.status.success,
};

// Export complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  durations,
  easing,
  zIndex,
  breakpoints,
  roleColors,
  heroRarity,
  gameStatus,
  draftPhase,
};

// Helper functions for theme usage
export const createShadow = (size = 'base', color = colors.neutral.black) => {
  const shadowConfig = shadows[size];
  return {
    ...shadowConfig,
    shadowColor: color,
  };
};

export const getRoleColor = (role, variant = 'main') => {
  return roleColors[role]?.[variant] || colors.neutral.gray[400];
};

export const getStatusColor = (status, variant = 'main') => {
  const statusMap = {
    success: colors.status.success,
    warning: colors.status.warning,
    error: colors.status.error,
    info: colors.status.info,
  };
  return statusMap[status] || colors.neutral.gray[400];
};

export default theme;