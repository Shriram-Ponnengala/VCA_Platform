import { Router } from 'express';
import { DatabaseController } from './database.controller';

const router = Router();
const controller = new DatabaseController();

router.get('/tree', controller.getTree.bind(controller));
router.post('/folders', controller.createFolder.bind(controller));
router.put('/folders/:id', controller.renameFolder.bind(controller));
router.delete('/folders/:id', controller.deleteFolder.bind(controller));
router.post('/collections/upload', controller.uploadPgn.bind(controller));
router.post('/collections/save-analysis', controller.saveAnalysisGame.bind(controller));
router.post('/collections/save-classroom', controller.saveClassroomGame.bind(controller));
router.post('/shares', controller.shareCollection.bind(controller));
router.get('/games/:id', controller.getGame.bind(controller));

export default router;