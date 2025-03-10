module.exports = {
    extends: [
      "./base.js",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended"
    ],
    plugins: ["react", "react-hooks"],
    settings: {
      react: {
        version: "detect"
      }
    },
    env: {
      browser: true
    },
    rules: {
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off"
    }
  };