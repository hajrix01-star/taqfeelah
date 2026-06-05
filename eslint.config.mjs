import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "TaqfeelahPrototypeReference.tsx",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "src/features/auth/client/prototype-auth-config.js",
      "src/features/auth/client/prototype-auth-boot.js",
    ],
    rules: {
      "no-undef": "error",
    },
  },
];

export default eslintConfig;
