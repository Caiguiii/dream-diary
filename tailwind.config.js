/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        morandi: {
          bg: '#EDE8DE',
          surface: '#FFFFFF',
          surface2: '#F7F2EC',
          border: '#E5DDD3',
          text: '#2C2825',
          muted: '#786E66',
          subtle: '#ADA39A',
          accent: '#C4815A',
          warm: '#F2E6DB',
          error: '#C07070',
        },
      },
      boxShadow: {
        morandi: '0 2px 10px rgba(44,40,37,0.07)',
        'morandi-md': '0 4px 20px rgba(44,40,37,0.09)',
      },
    },
  },
  plugins: [],
};
