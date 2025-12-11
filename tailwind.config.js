/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your brand's green color definition remains
        grima: {
          'primary': '#166534',
          'dark': '#04421A',
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '900': '#052e16',
        }
      },
      fontFamily: {
        // We are removing the 'serif' font to make everything consistent
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

