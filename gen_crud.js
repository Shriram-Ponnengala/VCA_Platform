const fs = require('fs');
const path = require('path');

const modules = [
  {
    name: 'users',
    model: 'user',
    methods: ['get', 'getAll', 'create', 'update', 'delete']
  },
  {
    name: 'batches',
    model: 'batch',
    methods: ['get', 'getAll', 'create', 'update', 'delete']
  },
  {
    name: 'programs',
    model: 'program',
    methods: ['get', 'getAll', 'create', 'update', 'delete']
  },
  {
    name: 'attendance',
    model: 'attendanceRecord',
    methods: ['getAll', 'create']
  },
  {
    name: 'setup',
    model: 'user',
    methods: ['create'] // Dummy method
  }
];

const apiSrc = path.join(__dirname, 'apps/api/src/modules');

modules.forEach(m => {
  const modDir = path.join(apiSrc, m.name);
  fs.mkdirSync(modDir, { recursive: true });
  
  const ClassName = m.name[0].toUpperCase() + m.name.slice(1);
  const Model = m.model;
  
  // Repo
  let repoCode = `import { PrismaClient } from '@vca/database';\nconst prisma = new PrismaClient();\n\nexport class ${ClassName}Repository {\n`;
  if (m.methods.includes('getAll')) repoCode += `  async findAll() { return prisma.${Model}.findMany(); }\n`;
  if (m.methods.includes('get')) repoCode += `  async findById(id: string) { return prisma.${Model}.findUnique({ where: { id } }); }\n`;
  if (m.methods.includes('create')) repoCode += `  async create(data: any) { return prisma.${Model}.create({ data }); }\n`;
  if (m.methods.includes('update')) repoCode += `  async update(id: string, data: any) { return prisma.${Model}.update({ where: { id }, data }); }\n`;
  if (m.methods.includes('delete')) repoCode += `  async delete(id: string) { return prisma.${Model}.delete({ where: { id } }); }\n`;
  repoCode += `}\n`;
  fs.writeFileSync(path.join(modDir, `${m.name}.repository.ts`), repoCode);

  // Service
  let serviceCode = `import { ${ClassName}Repository } from './${m.name}.repository';\nconst repo = new ${ClassName}Repository();\n\nexport class ${ClassName}Service {\n`;
  if (m.methods.includes('getAll')) serviceCode += `  async getAll() { return repo.findAll(); }\n`;
  if (m.methods.includes('get')) serviceCode += `  async getById(id: string) { return repo.findById(id); }\n`;
  if (m.methods.includes('create')) serviceCode += `  async create(data: any) { return repo.create(data); }\n`;
  if (m.methods.includes('update')) serviceCode += `  async update(id: string, data: any) { return repo.update(id, data); }\n`;
  if (m.methods.includes('delete')) serviceCode += `  async delete(id: string) { return repo.delete(id); }\n`;
  serviceCode += `}\n`;
  fs.writeFileSync(path.join(modDir, `${m.name}.service.ts`), serviceCode);

  // Controller
  let controllerCode = `import { Request, Response } from 'express';\nimport { ${ClassName}Service } from './${m.name}.service';\nconst service = new ${ClassName}Service();\n\nexport class ${ClassName}Controller {\n`;
  if (m.methods.includes('getAll')) controllerCode += `  async getAll(req: Request, res: Response) { try { res.json(await service.getAll()); } catch (e:any) { res.status(500).json({ error: e.message }); } }\n`;
  if (m.methods.includes('get')) controllerCode += `  async getById(req: Request, res: Response) { try { res.json(await service.getById(req.params.id)); } catch (e:any) { res.status(500).json({ error: e.message }); } }\n`;
  if (m.methods.includes('create')) controllerCode += `  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }\n`;
  if (m.methods.includes('update')) controllerCode += `  async update(req: Request, res: Response) { try { res.json(await service.update(req.params.id, req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }\n`;
  if (m.methods.includes('delete')) controllerCode += `  async delete(req: Request, res: Response) { try { res.json(await service.delete(req.params.id)); } catch (e:any) { res.status(500).json({ error: e.message }); } }\n`;
  controllerCode += `}\n`;
  fs.writeFileSync(path.join(modDir, `${m.name}.controller.ts`), controllerCode);

  // Route
  let routeCode = `import { Router } from 'express';\nimport { ${ClassName}Controller } from './${m.name}.controller';\n\nconst router = Router();\nconst controller = new ${ClassName}Controller();\n\n`;
  if (m.methods.includes('getAll')) routeCode += `router.get('/', controller.getAll.bind(controller));\n`;
  if (m.methods.includes('create')) routeCode += `router.post('/', controller.create.bind(controller));\n`;
  if (m.methods.includes('get')) routeCode += `router.get('/:id', controller.getById.bind(controller));\n`;
  if (m.methods.includes('update')) routeCode += `router.put('/:id', controller.update.bind(controller));\n`;
  if (m.methods.includes('delete')) routeCode += `router.delete('/:id', controller.delete.bind(controller));\n`;
  routeCode += `\nexport default router;\n`;
  fs.writeFileSync(path.join(modDir, `${m.name}.route.ts`), routeCode);
});
