// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        unicef: {
          DEFAULT: '#1CABE2',     // UNICEF blue / cyan
          dark: '#009EDB',        // UN-style deeper blue
          soft: '#E8F7FC',        // very light cyan background
          yellow: '#FFD200',      // accent
          pink: '#FF4FA3',        // accent
          violet: '#7B61FF',      // accent
        },
      },
    },
  },
  plugins: [],
}
