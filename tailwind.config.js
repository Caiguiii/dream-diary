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
        dream: {
          bg: '#050810',
          bg2: '#0e1020',
          text: '#e8e4f2',
          muted: '#8a86a8',
          subtle: '#5a5672',
          accent: '#c4a875',
          'accent-glow': 'rgba(196,168,117,0.4)',
          gold: '#d4b87a',
          purple: 'rgba(130,60,220,0.18)',
          blue: 'rgba(50,90,220,0.14)',
          teal: 'rgba(40,160,180,0.10)',
        },
      },
      boxShadow: {
        morandi: '0 2px 10px rgba(44,40,37,0.07)',
        'morandi-md': '0 4px 20px rgba(44,40,37,0.09)',
        dream: '0 8px 40px rgba(0,0,0,0.5)',
        'dream-sm': '0 4px 20px rgba(0,0,0,0.4)',
        glow: '0 0 24px rgba(196,168,117,0.35), 0 0 60px rgba(196,168,117,0.12)',
        'glow-lg': '0 0 50px rgba(196,168,117,0.5), 0 0 100px rgba(196,168,117,0.2)',
        'glow-sm': '0 0 12px rgba(196,168,117,0.25)',
        glass: '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'float-slow': 'float 14s ease-in-out infinite',
        'float-med': 'float 10s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        'twinkle-slow': 'twinkle 5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out both',
        'fade-in-slow': 'fadeIn 1.2s ease-out both',
        'slide-up': 'slideUp 0.6s ease-out both',
        'slide-up-delay': 'slideUp 0.6s 0.2s ease-out both',
        'slide-up-delay2': 'slideUp 0.6s 0.4s ease-out both',
        'slide-up-delay3': 'slideUp 0.6s 0.6s ease-out both',
        'spin-slow': 'spin 20s linear infinite',
        'morph': 'morph 12s ease-in-out infinite',
        'data-load': 'dataLoad 0.8s ease-out both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(0.7)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(196,168,117,0.3), 0 0 50px rgba(196,168,117,0.08)' },
          '50%': { boxShadow: '0 0 45px rgba(196,168,117,0.6), 0 0 90px rgba(196,168,117,0.25)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        dataLoad: {
          from: { opacity: '0', transform: 'scaleX(0)', transformOrigin: 'left' },
          to: { opacity: '1', transform: 'scaleX(1)', transformOrigin: 'left' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
    },
  },
  plugins: [],
};
