export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        ink: '#030712',
        panel: '#08111f',
        glass: 'rgba(15, 23, 42, 0.72)',
        cyanx: '#22d3ee',
        violetx: '#a78bfa',
      },
      boxShadow: {
        glow: '0 0 45px rgba(34, 211, 238, 0.18)',
      },
    },
  },
  plugins: [],
}
