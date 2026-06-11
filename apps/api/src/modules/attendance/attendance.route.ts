import { Router } from 'express';
import { AttendanceController } from './attendance.controller';

const router = Router();
const controller = new AttendanceController();

router.get('/', controller.getAll.bind(controller));
router.post('/', controller.create.bind(controller));

// Batch Sessions
router.get('/batch-sessions/:batchId', controller.getBatchSessions.bind(controller));
router.post('/batch-sessions', controller.createBatchSession.bind(controller));

// Attendance Records
router.get('/records/:sessionId', controller.getAttendanceRecords.bind(controller));
router.post('/records/:sessionId', controller.upsertAttendanceRecords.bind(controller));

// Makeover routes
router.get('/makeovers', controller.getMakeovers.bind(controller));
router.post('/makeovers/:id/assign', controller.assignMakeover.bind(controller));
router.post('/makeovers/:id/complete', controller.completeMakeover.bind(controller));

export default router;
