export default [
  {
    files: ["*/.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        requestAnimationFrame: "readonly",
        localStorage: "readonly",
        AudioContext: "readonly",
      },
    },

    rules: {
      // 🔥 WICHTIG für eure Bugs
      "no-undef": "error",
      "no-redeclare": "error",

      // hilfreich, aber nicht nervig
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-empty": "warn",
      "no-constant-condition": "off",

      // Stil locker halten
      "quotes": ["warn", "double"],
      "semi": ["warn", "always"],
    },
  },
];