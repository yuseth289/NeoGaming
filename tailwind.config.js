/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'neo-red-text': '#FF2D43',
        'neo-muted-text': '#9CA3AF',
        neo: {
          base: '#0D0D0F',
          surface: '#141418',
          elevated: '#1C1C22',
          border: '#2A2A35',
          'border-bright': '#3D3D4D',
          red: '#E5152D',
          'red-dim': '#B01020',
          cyan: '#00D4FF',
          'cyan-dim': '#0099BB',
          green: '#22C55E',
          amber: '#F59E0B',
          muted: '#6B7280',
          subtle: '#9CA3AF',
          white: '#F5F5F7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        h1: ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        h4: ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        body: ['1rem', { lineHeight: '1.7', fontWeight: '400' }],
        small: ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        xs: ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        'neo-sm': '6px',
        'neo-md': '10px',
        'neo-lg': '14px',
        'neo-xl': '20px',
      },
      boxShadow: {
        'neo-glow-red': '0 0 20px rgba(229,21,45,0.25)',
        'neo-glow-cyan': '0 0 20px rgba(0,212,255,0.20)',
        'neo-card': '0 4px 24px rgba(0,0,0,0.40)',
      },
      transitionProperty: {
        neo: 'color, background-color, border-color, opacity, box-shadow, transform',
      },
      transitionTimingFunction: {
        neo: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        neo: '200ms',
      },
    },
  },
};
