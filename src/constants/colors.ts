// Color constants for the Commerce Gate App
export const Colors = {
  // Primary Colors
  primary: '#007AFF',
  primaryDark: '#0056B3',
  primaryLight: '#3395FF',
  
  // Secondary Colors
  secondary: '#5856D6',
  secondaryDark: '#3E3DB8',
  secondaryLight: '#7B7AE8',
  
  // Accent Colors
  accent: '#FF9500',
  accentDark: '#CC7700',
  accentLight: '#FFB84D',
  
  // Status Colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  
  // Text Colors
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  textInverse: '#FFFFFF',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F8FA',
  
  // Border Colors
  border: '#E5E5EA',
  borderSecondary: '#D1D1D6',
  separator: '#C6C6C8',
  
  // Common Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Question Types
  mcq: '#007AFF',
  multipleSelect: '#5856D6',
  trueFalse: '#34C759',
  fillBlank: '#FF9500',
  essay: '#AF52DE',
  matching: '#FF2D92',
  ordering: '#5AC8FA',
  
  // Performance Colors
  excellent: '#34C759',
  good: '#32D74B',
  average: '#FF9500',
  poor: '#FF453A',
  
  // Special Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Dark Theme Colors (for future implementation)
  darkBackground: '#1C1C1E',
  darkSurface: '#2C2C2E',
  darkText: '#FFFFFF',
  darkTextSecondary: '#8E8E93',
  darkBorder: '#48484A',
};

// Theme specific color sets
export const LightTheme = {
  ...Colors,
  background: Colors.background,
  surface: Colors.surface,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  border: Colors.border,
};

export const DarkTheme = {
  ...Colors,
  background: Colors.darkBackground,
  surface: Colors.darkSurface,
  text: Colors.darkText,
  textSecondary: Colors.darkTextSecondary,
  border: Colors.darkBorder,
};

// Export default as Colors for backward compatibility
export default Colors;