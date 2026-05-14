/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#030318',
          800: '#080828',
          700: '#0d0d38',
          600: '#121248',
        },
      },
    },
  },
  plugins: [],
};
