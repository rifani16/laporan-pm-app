module.exports = {
  env: {
    node: true,        // Mengenali global Node.js seperti process
    es2020: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Izinkan parameter unused jika diawali _
  },
};