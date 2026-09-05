/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bnet: {
          abyss: '#0B0E13',
          steel: '#151D27',
          panel: '#1E2836',
          line: '#2A3546',
          blue: '#0074E0',
          bluedark: '#0A48A0',
          gold: '#F8B700',
          goldark: '#B47A00',
          ice: '#9EB3C8',
          mist: '#D6E0EC',
          fel: '#00AE33',
          blood: '#C22F2F'
        },
        wou: {
          bg: '#0B0E13',
          card: '#151D27',
          border: '#2A3546',
          cyan: '#00AEFF',
          purple: '#5A5AFF',
          dim: '#9EB3C8'
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
