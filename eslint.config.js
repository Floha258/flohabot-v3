import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommened from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    pluginJs.configs.recommended,
    eslintPluginPrettierRecommened,
    ...tseslint.configs.recommendedTypeChecked,
    {
        rules: {
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off'
        }
    },
    // Do not lint ts built files and the eslint config
    {
        ignores: ['release', 'eslint.config.js']
    },
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        ignores: ['node_modules']
    }
];
