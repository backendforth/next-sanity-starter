/** @type {import('postcss-load-config').Config} */
const config = {
	plugins: {
		"postcss-import": {},
		"@tailwindcss/postcss": {},
		"postcss-functions": {
			functions: {
				rem: (value) => {
					const number = parseFloat(value);
					return `calc(${number} / 16 * 1rem)`;
				},
			},
		},
		"postcss-calc": {},
	},
};

export default config;
