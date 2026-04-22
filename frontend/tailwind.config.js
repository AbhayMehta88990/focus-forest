export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'neo-yellow': '#FBFF48',
        'neo-green': '#33FF57',
        'neo-red': '#FF2A2A',
        'neo-white': '#FFFDF5',
        'neo-black': '#121212',
        forest: '#118A48',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
