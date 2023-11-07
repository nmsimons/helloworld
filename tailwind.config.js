/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}", // paths to all of your components
    ],
    theme: {
      extend: {
        width: {
          '300': '300px', // custom width
        },
        height: {
          '300': '300px', // custom height
        },
        // You can add more customizations here
      },
    },
    plugins: [],
  }