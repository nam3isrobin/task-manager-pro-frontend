/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── Color Palette ────────────────────────────────────────────────────
      colors: {
        // Navy / deep background scale
        navy: {
          50:  '#e8edf8',
          100: '#c6d0ec',
          200: '#9aabd9',
          300: '#6d85c4',
          400: '#4a67b5',
          500: '#2d4ea3',
          600: '#1e3a8a',
          700: '#162d6e',
          800: '#0d1f52',
          900: '#0d1528',  // card bg
          950: '#0a0f1e',  // darkest bg / body
        },

        // Amber / gold accent — CTAs, badges, active state
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',  // highlight
          500: '#f59e0b',  // primary accent
          600: '#d97706',  // pressed/hover
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },

        // Indigo / electric-blue secondary — links, selection, focus rings
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',  // soft highlight
          500: '#6366f1',  // secondary accent
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },

        // Semantic status palette
        status: {
          done:            '#10b981',  // emerald-500
          'done-bg':       '#064e3b',
          inprogress:      '#f59e0b',  // amber-500
          'inprogress-bg': '#451a03',
          onhold:          '#8b5cf6',  // violet-500
          'onhold-bg':     '#2e1065',
          todo:            '#94a3b8',  // slate-400
          'todo-bg':       '#1e293b',
          overdue:         '#f87171',  // red-400
          'overdue-bg':    '#450a0a',
        },

        // Semantic surface aliases (map to navy scale)
        bg: {
          base:    '#0a0f1e',
          card:    '#0d1528',
          alt:     '#111827',
          overlay: 'rgba(10,15,30,0.85)',
        },

        // Semantic text aliases
        content: {
          primary: '#f1f5f9',
          muted:   '#94a3b8',
          faint:   '#64748b',
          inverse: '#0a0f1e',
        },

        // Semantic border aliases
        edge: {
          subtle:  'rgba(255,255,255,0.07)',
          default: 'rgba(255,255,255,0.10)',
          strong:  'rgba(255,255,255,0.16)',
          accent:  'rgba(245,158,11,0.35)',
          focus:   'rgba(99,102,241,0.60)',
        },
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans: [
          'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
          'Segoe UI', 'Roboto', 'sans-serif',
        ],
        mono: [
          'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace',
        ],
      },

      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',   { lineHeight: '1rem' }],
        sm:    ['0.8125rem', { lineHeight: '1.25rem' }],
        base:  ['0.875rem',  { lineHeight: '1.375rem' }],
        lg:    ['1rem',      { lineHeight: '1.5rem' }],
        xl:    ['1.125rem',  { lineHeight: '1.625rem' }],
        '2xl': ['1.25rem',   { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem',    { lineHeight: '2rem' }],
        '4xl': ['1.875rem',  { lineHeight: '2.25rem' }],
      },

      lineHeight: {
        tighter: '1.1',
        tight:   '1.25',
        snug:    '1.375',
        normal:  '1.5',
        relaxed: '1.625',
      },

      letterSpacing: {
        tighter: '-0.04em',
        tight:   '-0.02em',
        normal:  '0em',
        wide:    '0.025em',
        wider:   '0.05em',
        widest:  '0.1em',
      },

      // ─── Spacing ─────────────────────────────────────────────────────────
      spacing: {
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
        '88':  '22rem',
        '112': '28rem',
        '128': '32rem',
      },

      // ─── Border Radius ────────────────────────────────────────────────────
      borderRadius: {
        sm:    '0.25rem',
        DEFAULT:'0.375rem',
        md:    '0.5rem',
        lg:    '0.75rem',
        xl:    '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      // ─── Box Shadows ──────────────────────────────────────────────────────
      boxShadow: {
        'glass-sm':   '0 2px 8px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass':      '0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-lg':   '0 8px 40px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-xl':   '0 16px 64px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.12)',
        'amber-glow': '0 0 20px rgba(245,158,11,0.25), 0 0 40px rgba(245,158,11,0.12)',
        'amber-sm':   '0 0 8px rgba(245,158,11,0.20)',
        'indigo-glow':'0 0 20px rgba(99,102,241,0.25), 0 0 40px rgba(99,102,241,0.12)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)',
      },

      // ─── Backdrop Blur (Glass Token) ──────────────────────────────────────
      backdropBlur: {
        xs:    '2px',
        sm:    '4px',
        DEFAULT:'8px',
        md:    '12px',
        lg:    '16px',
        xl:    '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // ─── Animations ───────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to:   { opacity: '0', transform: 'translateY(6px)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(245,158,11,0.15)' },
        },
        'gradient-drift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%, 45%, 75%': { transform: 'translateX(-6px)' },
          '30%, 60%, 90%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.18s ease-out both',
        'fade-out':       'fade-out 0.15s ease-in both',
        'slide-in-right': 'slide-in-right 0.2s ease-out both',
        'scale-in':       'scale-in 0.15s ease-out both',
        'shimmer':        'shimmer 2s linear infinite',
        'pulse-amber':    'pulse-amber 2s ease-in-out infinite',
        'gradient-drift': 'gradient-drift 12s ease infinite',
        'spin-slow':      'spin-slow 3s linear infinite',
        'shake':          'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
      },

      // ─── Transitions ─────────────────────────────────────────────────────
      transitionTimingFunction: {
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'ease-in-quart':  'cubic-bezier(0.5, 0, 0.75, 0)',
        'spring':         'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ─── Z-Index Scale ───────────────────────────────────────────────────
      zIndex: {
        'below':    '-1',
        'base':      '0',
        'raised':    '10',
        'dropdown':  '20',
        'sticky':    '30',
        'overlay':   '40',
        'modal':     '50',
        'popover':   '60',
        'toast':     '70',
        'tooltip':   '80',
        'top':       '9999',
      },

      // ─── Opacity ─────────────────────────────────────────────────────────
      opacity: {
        '3':  '0.03',
        '5':  '0.05',
        '7':  '0.07',
        '8':  '0.08',
        '12': '0.12',
        '15': '0.15',
        '35': '0.35',
        '45': '0.45',
        '55': '0.55',
        '65': '0.65',
        '75': '0.75',
        '85': '0.85',
        '95': '0.95',
      },
    },
  },
  plugins: [],
}
