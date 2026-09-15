/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        paper: '#ffffff',
        'brand-blue': '#003f7d',
        'brand-blue-dark': '#002957',
        'focus-yellow': '#facc15',
        success: '#166534',
        danger: '#b91c1c',
      },
      fontSize: {
        base: ['1.125rem', { lineHeight: '1.65' }],
      },
      minHeight: {
        touch: '3rem',
      },
    },
  },
  plugins: [],
}
