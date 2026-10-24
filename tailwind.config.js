/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				obsidian: {
					950: '#050811',
					900: '#0B0F19',
					850: '#101626',
					800: '#162035',
					750: '#1C2842',
				},
				trust: {
					50: '#EFF6FF',
					100: '#DBEAFE',
					400: '#60A5FA',
					500: '#3B82F6',
					600: '#2563EB',
					700: '#1D4ED8',
				},
				conversion: {
					400: '#34D399',
					500: '#10B981',
					600: '#059669',
					700: '#047857',
				},
			},
			boxShadow: {
				'glow-trust': '0 0 25px -5px rgba(37, 99, 235, 0.4)',
				'glow-conversion': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
			},
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
