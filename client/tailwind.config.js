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
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // Sky Blue
          light: "#93C5FD", // Light Sky Blue
          dark: "#2563EB", // Deep Sky Blue
        },
        secondary: {
          DEFAULT: "#38BDF8", // Lighter Blue
          light: "#BAE6FD", // Very Light Blue
          dark: "#0284C7", // Darker Blue
        },
        accent: {
          DEFAULT: "#60A5FA", // Medium Sky Blue
          light: "#DBEAFE", // Pale Sky Blue
          dark: "#2563EB", // Royal Blue
        },
        neutral: {
          lightest: "#FFFFFF",
          light: "#F0F9FF",
          medium: "#E0F2FE",
          dark: "#075985",
          darkest: "#0C4A6E",
        },
        travel: {
          sunset: "#F6AD55",
          ocean: "#38BDF8",
          mountain: "#7DD3FC",
          beach: "#F6E05E",
          forest: "#48BB78",
        }
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
