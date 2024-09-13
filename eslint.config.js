// eslint.config.js

import { Linter } from "eslint";

const config = new Linter.Config({
  files: ["**/*.ts", "**/*.tsx"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    // Custom rules here
  },
});

export default config;
