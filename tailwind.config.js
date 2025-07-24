/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			keyframes: {
				slideInDown: {
					'0%': { opacity: 0, transform: 'translateY(-20px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' },
				},
			},
			animation: {
				slideInDown: 'slideInDown 0.4s ease-out both',
			},
		},
	},
	plugins: [],
};
