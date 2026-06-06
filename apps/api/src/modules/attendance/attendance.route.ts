import { Router } from 'express';
import { AttendanceController } from './attendance.controller';

const router = Router();
const controller = new AttendanceController();

router.get('/', controller.getAll.bind(controller));
router.post('/', controller.create.bind(controller));

// Makeover routes
router.get('/makeovers', controller.getMakeovers.bind(controller));
router.post('/makeovers/:id/assign', controller.assignMakeover.bind(controller));
router.post('/makeovers/:id/complete', controller.completeMakeover.bind(controller));

export default router;
