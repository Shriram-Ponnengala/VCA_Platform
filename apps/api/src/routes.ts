import { Router } from 'express';
import authRoutes from './modules/auth/auth.route';
import userRoutes from './modules/users/users.route';
import batchRoutes from './modules/batches/batches.route';
import programRoutes from './modules/programs/programs.route';
import attendanceRoutes from './modules/attendance/attendance.route';
import setupRoutes from './modules/setup/setup.route';
import classroomRoutes from './modules/classroom/classroom.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/batches', batchRoutes);
router.use('/programs', programRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/setup', setupRoutes);
router.use('/classrooms', classroomRoutes);

export default router;
