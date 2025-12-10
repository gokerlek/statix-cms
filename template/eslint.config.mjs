import tanstackQuery from "@tanstack/eslint-plugin-query";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    plugins: {
      "@tanstack/query": tanstackQuery,
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
      prettier: prettier,
    },
    rules: {
      // Prettier integration
      "prettier/prettier": "error",

      // Import organization
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // React and Next.js imports first
            ["^react", "^next"],
            // External packages
            ["^@?\\w"],
            // Internal imports
            ["^@/"],
            // Relative imports
            ["^\\."],
            // Type imports
            ["^.*\\u0000$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",

      // React Query rules
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/no-rest-destructuring": "warn",
      "@tanstack/query/stable-query-client": "error",

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "prefer-const": "error",

      // Naming conventions
      "@typescript-eslint/naming-convention": [
        "error",
        // Allow Node-style magic globals like __dirname and __filename
        {
          selector: "variableLike",
          leadingUnderscore: "allowDouble",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
        },
        // Constants can be UPPER_CASE, camelCase or PascalCase
        {
          selector: "variable",
          modifiers: ["const"],
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
        },
        // Regular variables should be camelCase
        {
          selector: "variable",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // Functions should be camelCase or PascalCase (for React components)
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        // Parameters should be camelCase
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // Types, interfaces, classes should be PascalCase
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        // Enum members can be PascalCase or UPPER_CASE
        {
          selector: "enumMember",
          format: ["PascalCase", "UPPER_CASE"],
        },
        // Object properties can be any case (for external APIs)
        {
          selector: "objectLiteralProperty",
          format: null,
        },
      ],

      // JSX newline between elements (disabled - too strict for current codebase)
      "react/jsx-newline": "off",

      // React Compiler warnings (disable for hook form compatibility)
      "react-hooks/incompatible-library": "off",

      // Padding lines between statements
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        { blankLine: "always", prev: "directive", next: "*" },
        { blankLine: "any", prev: "directive", next: "directive" },
        { blankLine: "always", prev: ["case", "default"], next: "*" },
        {
          blankLine: "always",
          prev: "*",
          next: ["if", "for", "while", "switch", "try"],
        },
        {
          blankLine: "always",
          prev: ["if", "for", "while", "switch", "try"],
          next: "*",
        },
        { blankLine: "always", prev: "*", next: "function" },
        { blankLine: "always", prev: "function", next: "*" },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/app/(payload)/admin/**",
      "**/importMap.js",
    ],
  },
];

export default eslintConfig;
