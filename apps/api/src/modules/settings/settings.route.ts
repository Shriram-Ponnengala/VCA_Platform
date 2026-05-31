import { Router } from 'express';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

router.get('/:key', controller.get.bind(controller));
router.post('/:key', controller.upsert.bind(controller));

export default router;
