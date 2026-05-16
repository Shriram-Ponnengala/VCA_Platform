import { Router } from 'express';
import { UsersController } from './users.controller';

const router = Router();
const controller = new UsersController();

router.get('/', controller.getAll.bind(controller));
router.post('/', controller.create.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
