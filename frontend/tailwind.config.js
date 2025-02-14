/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        clashDisplay: ['ClashDisplay-Variable', 'sans-serif']
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          from: { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          to: { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        loadingDots: {
          '0%, 80%, 100%': { 
            opacity: '0',
            transform: 'scale(0.6)'
          },
          '40%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
        },
      },
    },
  },
  plugins: [],
}