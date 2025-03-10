// packages/typescript-config/package.json
{
  "name": "@booking-platform/typescript-config",
  "version": "0.0.1",
  "private": true,
  "files": [
    "base.json",
    "nextjs.json",
    "node.json",
    "react.json"
  ]
}

// packages/typescript-config/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "node",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true
  },
  "exclude": ["node_modules"]
}

// packages/typescript-config/node.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Node",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "dist"
  }
}

// packages/typescript-config/nextjs.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "module": "esnext",
    "resolveJsonModule": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

// packages/eslint-config/package.json
{
  "name": "@booking-platform/eslint-config",
  "version": "0.0.1",
  "private": true,
  "files": [
    "base.js",
    "nextjs.js",
    "node.js",
    "react.js"
  ],
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.59.9",
    "@typescript-eslint/parser": "^5.59.9",
    "eslint": "^8.42.0",
    "eslint-config-next": "^13.4.5",
    "eslint-config-prettier": "^8.8.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}

// packages/eslint-config/base.js
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
};

// packages/eslint-config/node.js
module.exports = {
  extends: ["./base.js"],
  env: {
    node: true
  }
};

// packages/eslint-config/react.js
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

// packages/eslint-config/nextjs.js
module.exports = {
  extends: [
    "./react.js",
    "next/core-web-vitals"
  ]
};
