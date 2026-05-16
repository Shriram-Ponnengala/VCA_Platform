const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

const rootPackageJson = {
  "name": "vca-turborepo",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
};

const turboJson = {
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "clean": {
      "cache": false
    }
  }
};

fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2));
fs.writeFileSync(path.join(rootDir, 'turbo.json'), JSON.stringify(turboJson, null, 2));

// Create apps and packages dummy package.jsons
const packages = [
  { dir: 'apps/web', name: 'web', deps: { "@vca/types": "*", "@vca/ui": "*", "@vca/chess": "*" } },
  { dir: 'apps/api', name: 'api', deps: { "@vca/types": "*", "@vca/database": "*" } },
  { dir: 'apps/realtime', name: 'realtime', deps: { "@vca/types": "*", "@vca/chess": "*" } },
  { dir: 'packages/types', name: '@vca/types', deps: {} },
  { dir: 'packages/chess', name: '@vca/chess', deps: { "@vca/types": "*" } },
  { dir: 'packages/database', name: '@vca/database', deps: { "@vca/types": "*" } },
  { dir: 'packages/ui', name: '@vca/ui', deps: { "@vca/types": "*" } },
];

for (const pkg of packages) {
  const pkgDir = path.join(rootDir, pkg.dir);
  fs.mkdirSync(pkgDir, { recursive: true });
  const pkgJson = {
    name: pkg.name,
    version: "0.1.0",
    private: true,
    main: "index.ts",
    scripts: {
      dev: "echo 'Not implemented'",
      build: "echo 'Not implemented'",
      lint: "echo 'Not implemented'"
    },
    dependencies: pkg.deps || {}
  };
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
  
  // create tsconfig.json
  const tsconfig = {
    "compilerOptions": {
      "target": "ES2022",
      "module": "CommonJS",
      "lib": ["ES2022", "DOM"],
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "moduleResolution": "node",
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["**/*.ts", "**/*.tsx"],
    "exclude": ["node_modules", "dist", ".next"]
  };
  fs.writeFileSync(path.join(pkgDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
}

console.log('Setup complete');
