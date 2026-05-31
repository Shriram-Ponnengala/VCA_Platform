import { Router } from 'express';
import { SessionsController } from './sessions.controller';

const router = Router();
const controller = new SessionsController();

router.get('/batch/:batchId', controller.getByBatch.bind(controller));
router.post('/batch/:batchId', controller.create.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
