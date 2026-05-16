import { Router } from 'express';
import { BatchesController } from './batches.controller';

const router = Router();
const controller = new BatchesController();

router.get('/', controller.getAll.bind(controller));
router.post('/', controller.create.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));
router.post('/:id/enroll', controller.enrollStudent.bind(controller));
router.delete('/:id/enroll', controller.unenrollStudent.bind(controller));

export default router;
