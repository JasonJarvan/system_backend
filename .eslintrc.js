module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest"
  },
  globals: {
    ISPROD: "writable"
  },
  rules: {
    "no-unused-vars": "warn",
    quotes: [
      "warn",
      "double",
      {
        avoidEscape: true,
        allowTemplateLiterals: true
      }
    ]
  }
};
