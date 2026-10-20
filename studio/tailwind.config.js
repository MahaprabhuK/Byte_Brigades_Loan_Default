/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#04060c', 900: '#070b14', 850: '#0a101c', 800: '#0e1626', 700: '#16213a', 600: '#22304f' },
        safe: '#2ee6c8',
        risk: '#ff4d6d',
        warn: '#ffb547',
        volt: '#8b7dff',
        sky2: '#4cc3ff',
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
