const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    'postcss-nested-ancestors': {},
    'postcss-functions': {
      functions: {
        rem: (value) => {
          const number = parseFloat(value);
          return `calc(${number} / 16 * 1rem)`;
        },
      },
    },
    'postcss-calc': {}, // This should come after postcss-functions
  },
};

export default config;
