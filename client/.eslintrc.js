module.exports = {
    parser: "@typescript-eslint/parser",
    extends: [],
    plugins: ["prettier", "react", "react-hooks", "@typescript-eslint"],
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        browser: true,
        es6: true
    },
    rules: {
        "prettier/prettier": "error",
        "@typescript-eslint/explicit-function-return-type": 1,
        "@typescript-eslint/interface-name-prefix": 0,
        "@typescript-eslint/no-array-constructor": "warn",
        "@typescript-eslint/no-unused-vars": ["warn"],
        "no-var": "warn",
        "prefer-arrow-callback": "warn",
        "prefer-const": "warn",
        radix: "warn",
        "react/jsx-uses-react": "warn",
        "react/jsx-uses-vars": "warn",
        "react-hooks/exhaustive-deps": "warn",
        "react-hooks/rules-of-hooks": "warn",
        "react/sort-comp": "warn"
    }
};
