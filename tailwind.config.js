/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#080A0F',
        surface:  '#0E1118',
        elevated: '#161B26',
        hover:    '#1E2535',
        border:   '#252D40',
        cyan:     '#00E5FF',
        orange:   '#FF6B35',
        human:    '#00FF88',
        bot:      '#FF6B35',
        kill:     '#FF3B3B',
        death:    '#B44FFF',
        loot:     '#FFD600',
        storm:    '#0088FF',
        combat:   '#FF6B35',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        display: ['"Barlow Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
