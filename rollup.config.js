import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { ethers } from 'ethers';
export default {
  input: './dist/compiled/index.js', // Entry point of your TypeScript file
  output: {
    file: './dist/index.js', // Output file name
    format: 'umd', // Output format (can be 'cjs', 'es', 'umd', 'amd')
    name: 'blockus-eth-payment', // Name of the global object if format is 'umd'
  },
  plugins: [
    typescript(), // Use rollup-plugin-typescript2 to handle TypeScript files
    resolve({
      browser: true
    }),
  ],
  external: [
    'bn.js',
    'js-sha3',
    'hash.js',
    'aes-js',
    'scrypt-js',
    'bech32'
  ]
};
