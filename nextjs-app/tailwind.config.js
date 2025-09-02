/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        sm: '2rem',
      },
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        // Couleurs approximatives héritées du legacy
        primary: {
          DEFAULT: '#FFC300', // jaune Beamô
          foreground: '#111827'
        },
        neutral: {
          DEFAULT: '#333333'
        }
      }
    },
  },
  plugins: [],
}
