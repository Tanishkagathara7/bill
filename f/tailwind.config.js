/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // ── QuickBill Professional Design System Palette ──────────────────────
      colors: {
        // Primary — Indigo
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // Primary CTA
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Secondary — Violet
        violet: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',  // Secondary accent
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Tertiary — Emerald (Revenue / Positive)
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',  // Positive/Revenue
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Stitch surface tokens
        surface: {
          DEFAULT: '#f8f9ff',
          dim:     '#cbdbf5',
          bright:  '#f8f9ff',
          low:     '#eff4ff',
          DEFAULT2: '#e5eeff',
          high:    '#dce9ff',
          highest: '#d3e4fe',
        },
      },
      // ── Spacing (4px baseline grid) ───────────────────────────────────────
      spacing: {
        '4.5': '18px',
        '18': '72px',
      },
      // ── Border Radius ─────────────────────────────────────────────────────
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      // ── Typography ────────────────────────────────────────────────────────
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.05em' }],
      },
      letterSpacing: {
        'tightest': '-0.02em',
        'tighter':  '-0.01em',
        'widest':   '0.1em',
      },
      // ── Shadows (Stitch tonal layering) ───────────────────────────────────
      boxShadow: {
        'glow':         '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-violet':  '0 0 20px rgba(139, 92, 246, 0.3)',
        'card':         '0px 4px 20px rgba(100, 116, 139, 0.08)',
        'card-hover':   '0px 8px 30px rgba(100, 116, 139, 0.14), 0 2px 8px rgba(99,102,241,0.06)',
        'kpi':          '0px 2px 12px rgba(100, 116, 139, 0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'kpi-hover':    '0px 6px 24px rgba(100, 116, 139, 0.12), 0 2px 6px rgba(99,102,241,0.08)',
        'indigo-sm':    '0 2px 8px rgba(99,102,241,0.2)',
        'indigo-md':    '0 4px 16px rgba(99,102,241,0.25)',
      },
      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        'fadeIn':        'fadeIn 0.3s ease-in-out',
        'slideUp':       'slideUp 0.4s ease-out',
        'slideDown':     'slideDown 0.3s ease-out',
        'slideInLeft':   'slideInLeft 0.3s ease-out',
        'scaleIn':       'scaleIn 0.2s ease-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':       'shimmer 2s infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'float':         'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' },                                     to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(16px)' },      to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:    { from: { opacity: '0', transform: 'translateY(-16px)' },     to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft:  { from: { opacity: '0', transform: 'translateX(-16px)' },     to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { from: { opacity: '0', transform: 'scale(0.95)' },           to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' },                    '100%': { backgroundPosition: '200% 0' } },
        bounceGentle: { '0%, 100%': { transform: 'translateY(0)' },                 '50%': { transform: 'translateY(-4px)' } },
        float:        { '0%, 100%': { transform: 'translateY(0px)' },               '50%': { transform: 'translateY(-6px)' } },
      },
      backgroundImage: {
        'gradient-radial':     'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand':      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-brand-hover':'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'shimmer-gradient':    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
