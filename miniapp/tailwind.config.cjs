/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#170F34',
        accent: '#FDD15F',
        text: {
          primary: '#ECF3F7',
          secondary: 'rgba(236, 243, 247, 0.7)',
          muted: 'rgba(236, 243, 247, 0.5)',
        },
        success: '#4ADE80',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
