import typescript from 'rollup-plugin-typescript2';

export default {
  input: './dist/compiled/index.js', // Entry point of your TypeScript file
  output: {
    file: './dist/index.js', // Output file name
    format: 'umd', // Output format (can be 'cjs', 'es', 'umd', 'amd')
    name: 'blockus-eth-payment', // Name of the global object if format is 'umd'
  },
  plugins: [
    typescript(), // Use rollup-plugin-typescript2 to handle TypeScript files
  ],
};
