import { Router } from 'express';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

router.get('/branding/css', controller.getBrandingCss.bind(controller));
router.get('/branding/background-image', controller.getBrandingBackgroundImage.bind(controller));
router.get('/:key', controller.get.bind(controller));
router.post('/:key', controller.upsert.bind(controller));


export default router;
