/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    "dist",
    "dist-strategic",
    "StrategicP791-hostinger-deploy",
    "StrategicP791-hostinger-beta",
    "StrategicP791-hostinger-beta-*",
    "StrategicP791-hostinger-latest-*",
    "*.zip",
  ]),
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^(?:[A-Z_]|motion)$",
        },
      ],
      "react/prop-types": "off",
    },
  },
  {
    files: ["strategic-api-backend/**/*.{js,mjs}", "*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.node,
      parserOptions: {
        sourceType: "module",
      },
    },
  },
]);
