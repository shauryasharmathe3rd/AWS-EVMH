/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#F5ECDC',
        latte: '#D9C3A0',
        mocha: '#8B5E3C',
        espresso: '#2E1F14',
      },
      fontFamily: {
        serif: ['"Times New Roman"', 'Times', 'serif'],
      }
    },
  },
  plugins: [],
}
