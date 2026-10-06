import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
export default ts.config({ignores:['dist/**','dist-public/**','node_modules/**','finanzas-source/**']},js.configs.recommended,{files:['server/**/*.mjs','scripts/**/*.mjs'],languageOptions:{globals:globals.node}},...ts.configs.recommended,{files:['server/cpanel/*.js'],languageOptions:{sourceType:'commonjs',globals:globals.node},rules:{'@typescript-eslint/no-require-imports':'off'}},{files:['**/*.{ts,tsx}'],languageOptions:{globals:globals.browser},rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]}});
