/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080b14',
          secondary: '#0f1420',
          tertiary: '#171d2e',
          glass: 'rgba(17, 24, 45, 0.65)',
          'glass-hover': 'rgba(23, 32, 58, 0.75)',
          input: 'rgba(15, 20, 35, 0.8)',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          dim: 'rgba(99, 102, 241, 0.15)',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
        success: {
          DEFAULT: '#10b981',
          dim: 'rgba(16, 185, 129, 0.12)',
        },
        danger: {
          DEFAULT: '#f43f5e',
          dim: 'rgba(244, 63, 94, 0.12)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dim: 'rgba(245, 158, 11, 0.12)',
        },
        info: {
          DEFAULT: '#0ea5e9',
          dim: 'rgba(14, 165, 233, 0.12)',
        },
        text: {
          primary: 'rgba(255, 255, 255, 0.93)',
          secondary: 'rgba(255, 255, 255, 0.60)',
          tertiary: 'rgba(255, 255, 255, 0.35)',
          accent: '#a5b4fc',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.07)',
          hover: 'rgba(255, 255, 255, 0.14)',
          accent: 'rgba(99, 102, 241, 0.35)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1, #a855f7)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.08))',
      },
      boxShadow: {
        'sm-app': '0 1px 3px rgba(0,0,0,0.4)',
        'md-app': '0 4px 16px rgba(0,0,0,0.45)',
        'lg-app': '0 8px 40px rgba(0,0,0,0.55)',
        glow: '0 0 24px rgba(99,102,241,0.12)',
        'glow-strong': '0 0 20px rgba(99,102,241,0.3)',
      },
      borderRadius: {
        'sm-app': '8px',
        'md-app': '12px',
        'lg-app': '16px',
        'xl-app': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease',
        'slide-in': 'slideIn 0.35s ease',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
};
