/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.js",
    "./assets/**/*.js",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
 
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        // Brand primary palette
        primary: {
          DEFAULT: "#27AE60", // Green primary
          light: "#2ECC71",
          dark: "#1E8E4E",
        },
        brandblue: {
          DEFAULT: "#2C3E50", // Deep blue for headers/nav
          light: "#34495E",
          dark: "#22303D",
        },
        // Secondary/supportive
        secondary: {
          light: "#A9DFBF",
          DEFAULT: "#58D68D",
        },
        warning: {
          light: "#F9E79F",
          DEFAULT: "#F7DC6F",
        },
        neutral: {
          lightest: "#FFFFFF",
          light: "#F8F9F9",
          medium: "#D5DBDB",
          dark: "#7F8C8D",
        },
        // Accents
        accent: {
          orange: "#E67E22",
          orangedark: "#D35400",
          teal: "#1ABC9C",
        },
      },
      spacing: {
        'screen-2': '2vh',
        'screen-4': '4vh',
        'screen-6': '6vh',
        'screen-8': '8vh',
      },
      padding: {
        'xs': '0.5rem',
        'sm': '0.75rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
      }
    },
  },
  plugins: [],
}
