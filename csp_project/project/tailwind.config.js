/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': '#003087',
        'primary-light': '#1E90FF',
        'accent-cyan': '#00CED1',
        'accent-gold': '#FFD700',
        'neutral': '#F0F8FF',
        'neutral-text': '#333333'
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter var', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '.8',
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
  plugins: [],
};