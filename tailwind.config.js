/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          950: '#4a0d2e',
          900: '#5c1238',
          850: '#6b1640',
          800: '#7a1d48',
          750: '#8a2350',
          700: '#9c2a5a',
          600: '#b8336a',
          500: '#d4457f',
          400: '#e8679b',
          300: '#f489b4',
          200: '#f9b3cf',
          100: '#fcd6e3',
          50: '#feeef4',
        },
        blush: {
          50: '#fef7f4',
          100: '#fdeee9',
          200: '#fadcd4',
          300: '#f5c4b8',
          400: '#eea89a',
          500: '#e08a7a',
          600: '#c96d5d',
        },
        plum: {
          50: '#faf5f8',
          100: '#f3e8f0',
          200: '#e6d0de',
          300: '#d4b3c8',
          400: '#b88aab',
          500: '#9c6b8e',
          600: '#7d5070',
        },
        cream: {
          50: '#fefcfa',
          100: '#fdf8f3',
          200: '#f9f0e8',
          300: '#f2e4d6',
          400: '#e8d3c0',
        },
      },
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bloom': 'bloom 4s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'sway': 'sway 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'rise-fade': 'riseFade 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'fade-scale': 'fadeScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bloom: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.1)', opacity: '0.9' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.1)' },
          '60%': { transform: 'scale(1)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px -5px rgba(212, 69, 127, 0.3)' },
          '50%': { boxShadow: '0 0 40px -5px rgba(212, 69, 127, 0.5)' },
        },
        riseFade: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeScale: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(212, 69, 127, 0.35)',
        'glow-soft': '0 0 30px -8px rgba(232, 103, 155, 0.25)',
        'glow-coral': '0 0 40px -10px rgba(201, 109, 93, 0.3)',
        'soft': '0 2px 15px -3px rgba(210, 100, 140, 0.08), 0 6px 30px -5px rgba(210, 100, 140, 0.06)',
        'card': '0 1px 3px rgba(180, 80, 120, 0.04), 0 8px 24px -6px rgba(180, 80, 120, 0.08)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.05)',
        'petal': '0 4px 20px -2px rgba(212, 69, 127, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
