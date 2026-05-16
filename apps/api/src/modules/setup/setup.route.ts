import { Router } from 'express';
import { SetupController } from './setup.controller';

const router = Router();
const controller = new SetupController();

router.post('/', controller.create.bind(controller));

export default router;
