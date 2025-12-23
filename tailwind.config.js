/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Keeping this ensures system preferences don't override. Since we never add 'dark' class, it stays light.
    theme: {
        extend: {
            animation: {
                'fadeInUp': 'fadeInUp 1s ease-out forwards',
                'fadeIn': 'fadeIn 1.5s ease-out forwards',
                'zoomOut': 'zoomOut 1.5s ease-out forwards',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                zoomOut: {
                    '0%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
}
