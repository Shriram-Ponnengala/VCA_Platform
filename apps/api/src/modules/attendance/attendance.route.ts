import { Router } from 'express';
import { AttendanceController } from './attendance.controller';

const router = Router();
const controller = new AttendanceController();

router.get('/', controller.getAll.bind(controller));
router.post('/', controller.create.bind(controller));

export default router;
