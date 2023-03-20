---
to: <%= packageDir %>/tsconfig.json
---
{
  "extends": "../../../packages/@config/types/tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "baseUrl": "./",
    "outDir": "./dist"
  },
  "compileOnSave": true,
  "exclude": ["node_modules", "dist"],
  "include": ["src"]
}
