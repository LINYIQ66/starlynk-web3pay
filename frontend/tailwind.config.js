/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eef2ff', 100:'#e0e7ff', 400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca' },
        dark: { 50:'#f8fafc', 100:'#f1f5f9', 700:'#1e293b', 800:'#1e1b4b', 900:'#0f0a1e', 950:'#0a0a0f' },
      },
    },
  },
  plugins: [],
}
