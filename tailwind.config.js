/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        morandi: {
          bg: '#F2F0EC',
          surface: '#FAFAF8',
          surface2: '#F5F3EF',
          border: '#E0DCD7',
          text: '#3A3835',
          muted: '#706D69',
          subtle: '#A4A09B',
          blue: '#7A9FB0',
          green: '#7EA894',
          tea: '#BFA07A',
          purple: '#9B8FAA',
          error: '#B86B6B',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'morandi': '0 2px 12px rgba(58, 56, 53, 0.06)',
        'morandi-md': '0 4px 20px rgba(58, 56, 53, 0.08)',
      },
    },
  },
  plugins: [],
};
