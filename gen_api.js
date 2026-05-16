const fs = require('fs');
const path = require('path');
const apiSrc = path.join(__dirname, 'apps/api/src');
const modules = ['auth', 'users', 'classroom', 'courses', 'batches', 'database', 'games', 'programs', 'setup', 'attendance'];

modules.forEach(m => {
  const modDir = path.join(apiSrc, 'modules', m);
  fs.mkdirSync(modDir, { recursive: true });
  const ClassName = m[0].toUpperCase() + m.slice(1);
  fs.writeFileSync(path.join(modDir, `${m}.controller.ts`), `export class ${ClassName}Controller {}`);
  fs.writeFileSync(path.join(modDir, `${m}.service.ts`), `export class ${ClassName}Service {}`);
  fs.writeFileSync(path.join(modDir, `${m}.repository.ts`), `export class ${ClassName}Repository {}`);
  fs.writeFileSync(path.join(modDir, `${m}.route.ts`), `import { Router } from 'express';\n\nconst router = Router();\n\nexport default router;`);
});
