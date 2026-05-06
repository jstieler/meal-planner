/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 2px 12px 0 rgba(180, 120, 60, 0.10)',
        'warm-lg': '0 8px 30px 0 rgba(180, 120, 60, 0.14)',
      },
    },
  },
  plugins: [],
};
