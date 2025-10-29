/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-yellow': '#FFD700',
        'primary-teal': '#20B2AA',
        'text-dark': '#2D3748',
        'text-light': '#718096',
        'bg-light': '#F7FAFC',
        'bg-dark': '#1A202C',
      },
    },
  },
  plugins: [],
}
