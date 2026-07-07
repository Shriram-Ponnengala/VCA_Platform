import { Router } from 'express';
import { DatabaseController } from './database.controller';
import { AccessGamesController } from './access-games.controller';

const router = Router();
const controller = new DatabaseController();
const accessGamesCtrl = new AccessGamesController();

router.get('/tree', controller.getTree.bind(controller));
router.post('/folders', controller.createFolder.bind(controller));
router.put('/folders/:id', controller.renameFolder.bind(controller));
router.delete('/folders/:id', controller.deleteFolder.bind(controller));

router.put('/collections/:id', controller.renameCollection.bind(controller));
router.delete('/collections/:id', controller.deleteCollection.bind(controller));

router.put('/games/:id', controller.renameGame.bind(controller));
router.put('/games/:id/pgn', controller.updateGamePgn.bind(controller));
router.delete('/games/:id', controller.deleteGame.bind(controller));

router.put('/folders/:id/move', controller.moveFolder.bind(controller));
router.put('/collections/:id/move', controller.moveCollection.bind(controller));
router.put('/games/:id/move', controller.moveGame.bind(controller));
router.put('/reorder', controller.reorderItems.bind(controller));

router.post('/collections/upload', controller.uploadPgn.bind(controller));
router.post('/collections/save-analysis', controller.saveAnalysisGame.bind(controller));
router.post('/collections/save-classroom', controller.saveClassroomGame.bind(controller));
router.post('/shares', controller.shareCollection.bind(controller));
router.get('/collections/:id/games', controller.getCollectionGames.bind(controller));
router.get('/games/:id', controller.getGame.bind(controller));
router.get('/fetch-lichess', controller.fetchLichessStudy.bind(controller));
router.get('/access-games', accessGamesCtrl.fetchGames.bind(accessGamesCtrl));

export default router;