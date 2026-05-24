import { Router } from 'express';
import { ClassroomController } from './classroom.controller';

const router = Router();
const controller = new ClassroomController();

router.post('/start', controller.startClassroom.bind(controller));
router.post('/end', controller.endClassroom.bind(controller));
router.get('/:batchId', controller.validateJoin.bind(controller));

export default router;