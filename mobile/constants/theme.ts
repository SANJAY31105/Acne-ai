// Theme constants matching the web app's dark mode
export const Colors = {
  background: '#060a14',
  surface: '#0f172a',
  card: '#1e293b',
  cardHover: '#334155',
  border: 'rgba(255, 255, 255, 0.08)',

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Accents
  indigo: '#6366f1',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  sky: '#38bdf8',

  // Severity
  mild: '#10b981',
  moderate: '#f59e0b',
  severe: '#ef4444',
  inconclusive: '#64748b',
};

export const Fonts = {
  regular: { fontSize: 16, color: Colors.textSecondary },
  bold: { fontSize: 16, fontWeight: '700' as const, color: Colors.textPrimary },
  heading: { fontSize: 28, fontWeight: '800' as const, color: Colors.textPrimary },
  subheading: { fontSize: 20, fontWeight: '700' as const, color: Colors.textPrimary },
  caption: { fontSize: 13, color: Colors.textMuted },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
