/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{vue,ts,tsx,js,jsx}"],
  theme: {
    extend: {
      boxShadow: { soft: "0 6px 24px rgba(0,0,0,0.08)" },
    },
  },
  plugins: [],
}
