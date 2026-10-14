/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],        // Default app & UI body font
        display: ['Sora', 'sans-serif'],       // Tech & hero headline font
        handwriting: ['Caveat', 'cursive'],    // Sticky notes & casual accents
      },
    },
  },
  plugins: [],
};
