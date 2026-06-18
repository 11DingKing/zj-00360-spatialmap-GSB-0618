/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        secondary: '#2c5282',
        usage: {
          residential: '#4CAF50',
          commercial: '#FF9800',
          industrial: '#2196F3',
          public: '#9C27B0',
          other: '#757575',
        },
      },
    },
  },
  plugins: [],
}
